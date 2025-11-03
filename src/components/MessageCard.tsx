import { Avatar, AvatarFallback } from "./ui/avatar";
import { Sparkles } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { ReactNode } from 'react';
import 'katex/dist/katex.min.css';

interface MessageCardProps {
  type: "user" | "ai";
  content: string;
  images?: string[];
}

/**
 * Normalize math syntax - clean up escaped backslashes and convert LaTeX delimiters
 * This should run BEFORE preprocessMath to clean the raw AI output
 */
function normalizeMathSyntax(text: string): string {
  if (!text) return text;
  
  return text
    // Replace escaped backslashes like \\sin -> \sin
    .replace(/\\\\/g, "\\")
    // Convert \(...\) to $...$ (inline math)
    .replace(/\\\((.*?)\\\)/gs, '$$$1$')
    // Convert \[...\] to $$...$$ (block math)
    .replace(/\\\[(.*?)\\\]/gs, '$$$1$$')
    // Remove trailing " \ " artifacts that break KaTeX
    .replace(/\\\s/g, '');
}

/**
 * Preprocess content to detect and wrap LaTeX expressions in math delimiters
 * ULTRA-AGGRESSIVE VERSION - Catches ALL LaTeX including in parentheses/brackets
 */
function preprocessMath(content: string): string {
  if (!content) return content;

  const mathCommands = [
    '\\int', '\\sum', '\\prod', '\\lim', '\\sin', '\\cos', '\\tan', '\\sec', '\\csc', '\\cot',
    '\\log', '\\ln', '\\exp', '\\sqrt', '\\frac', '\\partial', '\\nabla', '\\infty',
    '\\alpha', '\\beta', '\\gamma', '\\delta', '\\epsilon', '\\zeta', '\\eta', '\\theta',
    '\\iota', '\\kappa', '\\lambda', '\\mu', '\\nu', '\\xi', '\\pi', '\\rho', '\\sigma',
    '\\tau', '\\upsilon', '\\phi', '\\chi', '\\psi', '\\omega',
    '\\Gamma', '\\Delta', '\\Theta', '\\Lambda', '\\Xi', '\\Pi', '\\Sigma', '\\Phi', '\\Psi', '\\Omega',
    '\\cdot', '\\times', '\\div', '\\pm', '\\mp', '\\leq', '\\geq', '\\neq', '\\approx', '\\equiv',
    '\\d', '\\,', '\\:', '\\;', '\\!', '\\quad', '\\qquad', '\\left', '\\right'
  ];

  // Check if content contains any LaTeX commands
  const hasLatex = mathCommands.some(cmd => content.includes(cmd));
  if (!hasLatex) return content;

  let processed = content;

  // STEP 1: Protect already-wrapped math
  const protectedMath: Array<{ placeholder: string; original: string }> = [];
  processed = processed.replace(/\$([^$\n]+)\$/g, (match) => {
    const placeholder = `__MATH_PROTECT_${protectedMath.length}__`;
    protectedMath.push({ placeholder, original: match });
    return placeholder;
  });
  processed = processed.replace(/\$\$([^$]+)\$\$/g, (match) => {
    const placeholder = `__MATH_BLOCK_${protectedMath.length}__`;
    protectedMath.push({ placeholder, original: match });
    return placeholder;
  });

  // STEP 2: Process entire content (not just line by line) to catch multi-line and wrapped expressions
  const allMatches: Array<{ start: number; end: number; text: string }> = [];
  
  // Find ALL LaTeX commands - ultra aggressive pattern
  const latexPattern = /\\([a-zA-Z]+)/g;
  let match;
  latexPattern.lastIndex = 0;
  
  while ((match = latexPattern.exec(processed)) !== null) {
    const cmdName = `\\${match[1]}`;
    const start = match.index;
    
    // Skip if already inside $ delimiters or placeholder
    const before = processed.substring(0, start);
    const dollarCount = (before.match(/\$/g) || []).length;
    if (dollarCount % 2 === 1 || before.includes('__MATH_PROTECT_') || before.includes('__MATH_BLOCK_')) {
      continue;
    }
    
    // Include command even if not in our list (might be valid LaTeX)
    let isMathCommand = mathCommands.includes(cmdName);
    if (!isMathCommand) {
      // Check if it looks like math (followed by number, paren, bracket, etc.)
      const afterCmd = processed.substring(start + match[0].length, start + match[0].length + 2);
      if (!/[\(\[\d\s]/.test(afterCmd)) {
        continue; // Probably not math
      }
      // Looks like math, include it
    }
    
    // Find the end of the expression - be VERY aggressive
    let end = start + match[0].length;
    
    // Capture all arguments and expand as much as possible
    while (end < processed.length) {
      const char = processed[end];
      
      // Capture {arg}
      if (char === '{') {
        let depth = 1;
        end++;
        while (end < processed.length && depth > 0) {
          if (processed[end] === '{') depth++;
          else if (processed[end] === '}') depth--;
          end++;
        }
        continue;
      }
      
      // Capture (arg) - CRITICAL for expressions like \cos(6x)
      if (char === '(') {
        let depth = 1;
        end++;
        while (end < processed.length && depth > 0) {
          if (processed[end] === '(') depth++;
          else if (processed[end] === ')') depth--;
          end++;
        }
        continue;
      }
      
      // Capture ^{sup} or _{sub}
      if (char === '^' || char === '_') {
        end++;
        if (end < processed.length && processed[end] === '{') {
          let depth = 1;
          end++;
          while (end < processed.length && depth > 0) {
            if (processed[end] === '{') depth++;
            else if (processed[end] === '}') depth--;
            end++;
          }
        } else if (end < processed.length && /[\w\d]/.test(processed[end])) {
          end++;
        }
        continue;
      }
      
      // Include any character that could be part of math
      if (/[\s+\-*/=<>≤≥≠±×÷,;:.\d]/.test(char)) {
        end++;
        // Continue if more math likely follows
        if (end < processed.length) {
          const remaining = processed.substring(end);
          // Continue if followed by LaTeX, number, operator, or paren
          if (/\\[a-zA-Z]/.test(remaining.substring(0, 10)) || 
              /\d/.test(char) || 
              /[+\-*/=<>≤≥≠±×÷,;:().]/.test(remaining[0])) {
            continue;
          }
          // Stop if followed by regular word character + space
          if (/^[a-zA-Z]\s/.test(remaining.substring(0, 2))) {
          break;
          }
        }
          continue;
        }
        
      // Include letters/numbers that might be variables (like in \cos(6x), the x)
      if (/[a-zA-Z0-9]/.test(char)) {
        end++;
          continue;
        }
        
        break;
      }
      
    const expression = processed.substring(start, end).trim();
    if (expression) {
      // Only add if it contains a known math command OR looks like math
      const looksLikeMath = mathCommands.some(cmd => expression.includes(cmd)) ||
                           /\\[a-zA-Z]+[\s\d\(\)\[\]]/.test(expression);
      
      if (looksLikeMath) {
        // Check for overlaps
        const overlaps = allMatches.some(m => (m.start < end && m.end > start));
        if (!overlaps) {
          allMatches.push({ start, end, text: expression });
        }
      }
    }
  }
  
  // STEP 3: Also handle expressions wrapped in parentheses or brackets
  // Pattern: (expression with LaTeX) or [expression with LaTeX]
  // This catches things like (\cot(6x)) or [\frac{1}{6} ...]
  const parenPattern = /([\(\[][^)\]\[\n]*(?:\\[a-zA-Z]+[^)\]\[\n]*)+[\)\]])/g;
  let parenMatch;
  parenPattern.lastIndex = 0;
  
  while ((parenMatch = parenPattern.exec(processed)) !== null) {
    const matchText = parenMatch[0];
    if (matchText && mathCommands.some(cmd => matchText.includes(cmd))) {
      const start = parenMatch.index;
      const end = start + matchText.length;
      
      // Check if already wrapped or in existing match
      const before = processed.substring(0, start);
      if ((before.match(/\$/g) || []).length % 2 === 1 || 
          before.includes('__MATH_PROTECT_') ||
          before.includes('__MATH_BLOCK_') ||
          allMatches.some(m => m.start <= start && m.end >= end)) {
        continue;
      }
      
      // Extract content without outer parens/brackets
      const innerContent = matchText.slice(1, -1); // Remove outer ( or [
      allMatches.push({ start, end, text: innerContent });
    }
  }

  // STEP 4: Apply all matches from end to start (to preserve indices)
  allMatches.sort((a, b) => b.start - a.start);
  
  for (const { start, end, text } of allMatches) {
    const before = processed.substring(0, start);
    const after = processed.substring(end);
    
    // Skip if already wrapped
    if (before.endsWith('$') || after.startsWith('$')) {
      continue;
    }
    
    // Wrap with $ delimiters
    processed = processed.substring(0, start) + `$${text}$` + processed.substring(end);
  }

  // STEP 5: Restore protected math
  protectedMath.forEach(({ placeholder, original }) => {
    processed = processed.replace(placeholder, original);
  });

  return processed;
}

export function MessageCard({ type, content, images = [] }: MessageCardProps) {
  if (!content) {
    return null;
  }

  // Step 1: Normalize math syntax (clean escaped backslashes, convert LaTeX delimiters)
  // Step 2: Preprocess to wrap unwrapped LaTeX expressions
  const normalizedContent = normalizeMathSyntax(content);
  const processedContent = preprocessMath(normalizedContent);

  // User messages align to right
  if (type === "user") {
    return (
      <div className="w-full px-6 py-6 bg-transparent" style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
        <div className="flex items-end gap-2" style={{ maxWidth: '80%' }}>
          <div className="bg-gray-100 dark:bg-transparent px-4 py-2 rounded-2xl rounded-tr-sm">
            <div className="markdown-content text-gray-900 dark:text-[#EAEAEA] prose prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  // CRITICAL: Explicit handlers for math nodes
                  math: ({ children }: any) => <>{children}</>,
                  math_inline: ({ children }: any) => <span className="math-inline">{children}</span>,
                  math_display: ({ children }: any) => <div className="math-display">{children}</div>,
                  // Paragraphs with proper styling
                  p: ({children, ...props}: {children?: ReactNode}) => (
                    <p className="leading-7 mb-0 text-gray-900 dark:text-[#EAEAEA] whitespace-pre-wrap break-words" {...props}>{children}</p>
                  ),
                  // Preserve other markdown elements if users type them
                  strong: ({children, ...props}: {children?: ReactNode}) => (
                    <strong className="font-semibold" {...props}>{children}</strong>
                  ),
                  em: ({children, ...props}: {children?: ReactNode}) => (
                    <em className="italic" {...props}>{children}</em>
                  ),
                  code: ({children, className, ...props}: any) => {
                    const isInline = !className || !className.includes('language-');
                    if (isInline) {
                      return (
                        <code className="bg-gray-200 dark:bg-[#2A2A2A] px-1.5 py-0.5 rounded text-sm font-mono text-gray-900 dark:text-[#EAEAEA]" {...props}>{children}</code>
                      );
                    }
                    return (
                      <code className="block bg-gray-200 dark:bg-[#2A2A2A] p-3 rounded-lg text-sm font-mono text-gray-900 dark:text-[#EAEAEA] overflow-x-auto mb-4" {...props}>{children}</code>
                    );
                  },
                }}
              >
                {processedContent}
              </ReactMarkdown>
            </div>
          </div>
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback className="bg-[#5A5BEF] text-white">JD</AvatarFallback>
          </Avatar>
        </div>
      </div>
    );
  }

  // AI messages stay on the left
  return (
    <div className="flex gap-4 px-6 py-6 bg-white dark:bg-[#1E1E1E]">
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback className="bg-gray-100 border border-gray-200 dark:bg-[#181818] dark:border-[#2A2A2A]">
          <Sparkles className="w-4 h-4 text-[#5A5BEF]" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="bg-gray-100 dark:bg-transparent px-4 py-3 rounded-2xl rounded-tl-sm">
          <div className="markdown-content !text-black dark:text-[#EAEAEA]">
            <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
            // CRITICAL: Explicit handlers for math nodes from remark-math/rehype-katex
            math: ({ children }: any) => <>{children}</>,
            math_inline: ({ children }: any) => <span className="math-inline">{children}</span>,
            math_display: ({ children }: any) => <div className="math-display">{children}</div>,
            // Headings with proper spacing and bold styling
            h1: ({children, ...props}: {children?: ReactNode}) => (
              <h1 className="text-2xl font-bold mb-4 mt-6 text-black dark:text-[#EAEAEA] first:mt-0 leading-tight" {...props}>{children}</h1>
            ),
            h2: ({children, ...props}: {children?: ReactNode}) => (
              <h2 className="text-xl font-bold mb-3 mt-5 text-black dark:text-[#EAEAEA] first:mt-0 leading-tight" {...props}>{children}</h2>
            ),
            h3: ({children, ...props}: {children?: ReactNode}) => (
              <h3 className="text-lg font-bold mb-2 mt-4 text-black dark:text-[#EAEAEA] first:mt-0 leading-tight" {...props}>{children}</h3>
            ),
            h4: ({children, ...props}: {children?: ReactNode}) => (
              <h4 className="text-base font-semibold mb-2 mt-3 text-black dark:text-[#EAEAEA] first:mt-0 leading-tight" {...props}>{children}</h4>
            ),
            // Paragraphs with good line spacing
            p: ({children, ...props}: {children?: ReactNode}) => (
              <p className="mb-4 leading-7 text-black dark:text-[#EAEAEA] first:mt-0 last:mb-0" {...props}>{children}</p>
            ),
            // Unordered lists with proper indentation and spacing
            ul: ({children, ...props}: {children?: ReactNode}) => (
              <ul className="list-disc mb-4 ml-6 space-y-1.5 marker:text-gray-500 dark:marker:text-[#A0A0A0] list-outside" {...props}>{children}</ul>
            ),
            // Ordered lists with proper indentation and spacing
            ol: ({children, ...props}: {children?: ReactNode}) => (
              <ol className="list-decimal mb-4 ml-6 space-y-1.5 marker:text-gray-500 dark:marker:text-[#A0A0A0] list-outside" {...props}>{children}</ol>
            ),
            // List items with proper spacing
            li: ({children, ...props}: {children?: ReactNode}) => (
              <li className="leading-7 text-black dark:text-[#EAEAEA] pl-2" {...props}>{children}</li>
            ),
            // Bold text - make it stand out
            strong: ({children, ...props}: {children?: ReactNode}) => (
              <strong className="font-semibold text-black dark:text-[#EAEAEA]" {...props}>{children}</strong>
            ),
            // Italic text
            em: ({children, ...props}: {children?: ReactNode}) => (
              <em className="italic text-black dark:text-[#EAEAEA]" {...props}>{children}</em>
            ),
            // Inline code with background
            code: ({children, className, ...props}: any) => {
              const isInline = !className || !className.includes('language-');
              if (isInline) {
                return (
                  <code className="bg-gray-100 dark:bg-[#2A2A2A] px-1.5 py-0.5 rounded text-sm font-mono text-black dark:text-[#EAEAEA] border border-gray-200 dark:border-[#3A3A3A] font-normal" {...props}>{children}</code>
                );
              }
              return (
                <code className="block bg-gray-100 dark:bg-[#2A2A2A] p-3 rounded-lg text-sm font-mono text-black dark:text-[#EAEAEA] overflow-x-auto mb-4 border border-gray-200 dark:border-[#3A3A3A] whitespace-pre" {...props}>{children}</code>
              );
            },
            // Code blocks
            pre: ({children, ...props}: {children?: ReactNode}) => (
              <pre className="bg-gray-100 dark:bg-[#2A2A2A] p-0 rounded-lg overflow-x-auto mb-4 border border-gray-200 dark:border-[#3A3A3A]" {...props}>{children}</pre>
            ),
            // Blockquotes with left border
            blockquote: ({children, ...props}: {children?: ReactNode}) => (
              <blockquote className="border-l-4 border-[#5A5BEF] pl-4 italic my-4 text-gray-700 dark:text-[#D0D0D0] bg-gray-50 dark:bg-[#181818] py-2 rounded-r" {...props}>{children}</blockquote>
            ),
            // Horizontal rules
            hr: (props: {}) => (
              <hr className="border-t border-gray-200 dark:border-[#3A3A3A] my-6" {...props} />
            ),
            // Links with hover effect
            a: ({children, href, ...props}: {children?: ReactNode; href?: string}) => (
              <a href={href} className="text-[#5A5BEF] hover:text-[#6A6BFF] underline decoration-[#5A5BEF] hover:decoration-[#6A6BFF] transition-colors" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
            ),
            // Tables
            table: ({children, ...props}: {children?: ReactNode}) => (
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full border-collapse border border-gray-200 dark:border-[#3A3A3A]" {...props}>{children}</table>
              </div>
            ),
            th: ({children, ...props}: {children?: ReactNode}) => (
              <th className="border border-gray-200 dark:border-[#3A3A3A] px-4 py-2 bg-gray-100 dark:bg-[#2A2A2A] font-semibold text-left text-black dark:text-[#EAEAEA]" {...props}>{children}</th>
            ),
            td: ({children, ...props}: {children?: ReactNode}) => (
              <td className="border border-gray-200 dark:border-[#3A3A3A] px-4 py-2 text-black dark:text-[#EAEAEA]" {...props}>{children}</td>
            ),
            }}
          >
            {processedContent}
          </ReactMarkdown>
          </div>
          {/* Display images if available - compact thumbnails, max 3, proportional sizing (w-32 h-32 default) */}
          {images && Array.isArray(images) && images.length > 0 && (
            <div className="mt-3 flex gap-2 flex-wrap">
              {images.slice(0, 3).map((imageUrl, idx) => (
                <div key={idx} className="relative flex-shrink-0">
                  <a 
                    href={imageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block rounded overflow-hidden border border-gray-200 dark:border-[#3A3A3A] hover:border-[#5A5BEF] transition-colors flex items-center justify-center"
                    style={{ width: '128px', height: '128px' }}
                  >
                    <img 
                      src={imageUrl} 
                      alt={`Image ${idx + 1}`}
                      className="w-32 h-32 object-contain"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="flex items-center justify-center w-32 h-32 text-gray-400 dark:text-[#A0A0A0] text-[10px]">Unavailable</div>';
                        }
                      }}
                      onLoad={(e) => {
                        // Adjust container size proportionally if image aspect ratio differs
                        const img = e.target as HTMLImageElement;
                        const container = img.parentElement;
                        if (container && img.naturalWidth && img.naturalHeight) {
                          const aspectRatio = img.naturalWidth / img.naturalHeight;
                          const defaultSize = 128; // w-32 = 128px
                          
                          let width = defaultSize;
                          let height = defaultSize;
                          
                          if (aspectRatio > 1) {
                            // Landscape: width is larger
                            width = defaultSize * aspectRatio;
                            height = defaultSize;
                          } else if (aspectRatio < 1) {
                            // Portrait: height is larger
                            width = defaultSize;
                            height = defaultSize / aspectRatio;
                          }
                          
                          container.style.width = `${width}px`;
                          container.style.height = `${height}px`;
                          img.style.width = `${width}px`;
                          img.style.height = `${height}px`;
                        }
                      }}
                    />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
