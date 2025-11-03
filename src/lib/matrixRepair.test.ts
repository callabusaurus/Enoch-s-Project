/**
 * Unit tests for repairMatrixRows function
 * 
 * Run this file with: npx tsx src/lib/matrixRepair.test.ts
 * Or import into your test runner of choice
 */

/**
 * Repair matrix row separators that were lost in transit
 * Conservative fallback - only repairs when matrix environment exists and \\ are missing
 */
function repairMatrixRows(text: string): string {
  if (!text) return text;
  
  // Only repair if content contains a LaTeX matrix environment
  const matrixPattern = /\\begin\{(bmatrix|matrix|pmatrix|array)\}([\s\S]*?)\\end\{\1\}/g;
  
  return text.replace(matrixPattern, (match, env, body) => {
    // If body already contains row separators, leave it unchanged
    if (/\\\\/.test(body)) {
      return match;
    }
    
    // Normalize whitespace/newlines
    let inner = body.trim().replace(/\r\n/g, '\n').replace(/\n+/g, ' ').trim();
    
    // Count ampersands to infer structure
    const totalAmp = (inner.match(/&/g) || []).length;
    if (totalAmp === 0) {
      // No ampersands - can't infer structure, return as-is
      return `\\begin{${env}}${inner}\\end{${env}}`;
    }
    
    // Infer columns from first segment (fallback to 2 columns)
    const firstSegment = inner.slice(0, 120);
    const colsGuess = Math.max(2, (firstSegment.match(/&/g) || []).length + 1);
    
    // Split tokens by & and re-chunk into rows
    const tokens = inner.split(/\s*&\s*/).map((s: string) => s.trim()).filter(Boolean);
    
    if (tokens.length === 0) {
      return match;
    }
    
    // Group tokens into rows based on inferred column count
    const rows: string[] = [];
    for (let i = 0; i < tokens.length; i += colsGuess) {
      rows.push(tokens.slice(i, i + colsGuess).join(' & '));
    }
    
    // Return repaired matrix with \\ row separators
    return `\\begin{${env}} ${rows.join(' \\\\ ')} \\end{${env}}`;
  });
}

// Test cases
const tests = [
  {
    name: 'Test 1: Repair 3x3 matrix missing row separators',
    input: '$$\\begin{bmatrix} 1 & 2 & 3 4 & 5 & 6 7 & 8 & 9 \\end{bmatrix}$$',
    expected: /\\\\/,
    shouldRepair: true,
    description: 'Should add \\\\ between rows'
  },
  {
    name: 'Test 2: Already correct matrix should remain unchanged',
    input: '$$\\begin{bmatrix} 1 & 2 & 3 \\\\ 4 & 5 & 6 \\\\ 7 & 8 & 9 \\end{bmatrix}$$',
    expected: /1 & 2 & 3 \\\\ 4 & 5 & 6 \\\\ 7 & 8 & 9/,
    shouldRepair: false,
    description: 'Should leave unchanged when \\\\ already present'
  },
  {
    name: 'Test 3: Repair 2x2 matrix',
    input: '\\begin{matrix} 1 & 2 3 & 4 \\end{matrix}',
    expected: /\\\\/,
    shouldRepair: true,
    description: 'Should repair 2x2 matrix'
  },
  {
    name: 'Test 4: Non-matrix content should remain unchanged',
    input: 'This is just regular text with no matrices',
    expected: /This is just regular text/,
    shouldRepair: false,
    description: 'Should not modify non-matrix content'
  },
  {
    name: 'Test 5: Matrix with no ampersands should remain unchanged',
    input: '\\begin{matrix} 1 2 3 \\end{matrix}',
    expected: /\\begin\{matrix\} 1 2 3 \\end\{matrix\}/,
    shouldRepair: false,
    description: 'Cannot infer structure without ampersands'
  }
];

// Run tests
let passed = 0;
let failed = 0;

console.log('Running repairMatrixRows tests...\n');

tests.forEach((test, index) => {
  const result = repairMatrixRows(test.input);
  const hasExpected = test.expected.test(result);
  const hasRepair = /\\\\/.test(result) && !/\\\\/.test(test.input);
  
  const success = hasExpected && (
    test.shouldRepair ? hasRepair : !hasRepair || test.expected.test(test.input)
  );
  
  if (success) {
    console.log(`✓ Test ${index + 1}: ${test.name}`);
    passed++;
  } else {
    console.error(`✗ Test ${index + 1}: ${test.name}`);
    console.error(`  Input:    ${test.input}`);
    console.error(`  Output:   ${result}`);
    console.error(`  Expected: ${test.description}`);
    failed++;
  }
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('All tests passed! ✓');
  process.exit(0);
} else {
  console.error('Some tests failed! ✗');
  process.exit(1);
}

