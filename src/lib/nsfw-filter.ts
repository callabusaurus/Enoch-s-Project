/**
 * NSFW content detection and filtering
 */

const NSFW_KEYWORDS = [
  'porn', 'xxx', 'nsfw', 'adult', 'sex', 'sexual', 'nude', 'naked', 'nudity',
  'pornography', 'erotic', 'explicit', 'lewd', 'obscene', 'gore', 'violence',
  'brutal', 'murder', 'kill', 'torture', 'fetish', 'bdsm', 'rape', 'assault',
  // Anime/manga adult content
  'hentai', 'ecchi', 'yuri', 'yaoi', 'doujin', 'doujinshi',
  // Rule 34 variations
  'rule 34', 'r34', 'rule34'
];

/**
 * Known NSFW/adult domain patterns
 */
const NSFW_DOMAINS = [
  'pornhub.com', 'xvideos.com', 'xnxx.com', 'redtube.com', 'youporn.com',
  'porn.com', 'tube8.com', 'spankwire.com', 'extremetube.com', 'keezmovies.com',
  'xhamster.com', 'tnaflix.com', '4tube.com', 'pornhd.com', 'sunporno.com',
  // Hentai/adult anime sites
  'luscious.net', 'gelbooru.com', 'rule34.xxx', 'rule34.paheal.net',
  'danbooru.donmai.us', 'sankakucomplex.com', 'e-hentai.org', 'exhentai.org',
  'nhentai.net', 'hentaihaven.org'
];

/**
 * Detect if a query contains NSFW keywords
 */
export function isNSFWQuery(query: string): boolean {
  const queryLower = query.toLowerCase();
  // Check for all keywords, including multi-word phrases
  return NSFW_KEYWORDS.some(keyword => {
    // For multi-word keywords (like "rule 34"), check if all words appear in sequence
    if (keyword.includes(' ')) {
      // Split phrase into words and check if they appear in order
      const words = keyword.split(' ');
      let lastIndex = -1;
      for (const word of words) {
        const index = queryLower.indexOf(word, lastIndex + 1);
        if (index === -1) return false;
        lastIndex = index;
      }
      return true;
    }
    // For single words, simple substring check
    return queryLower.includes(keyword);
  });
}

/**
 * Get Exa API exclude_text array for NSFW filtering
 */
export function getNSFWExcludeText(): string[] {
  return [
    'nsfw', 'adult', 'xxx', 'porn', 'explicit', 'sexual', 'nude', 'nudity',
    'pornography', 'erotic', 'lewd', 'obscene', 'gore', 'violence', 'brutal',
    // Add hentai and anime adult terms
    'hentai', 'ecchi', 'doujin', 'doujinshi', 'rule 34', 'r34', 'rule34'
  ];
}

/**
 * Get Exa API exclude_domains array for NSFW filtering
 */
export function getNSFWExcludeDomains(): string[] {
  return NSFW_DOMAINS;
}

