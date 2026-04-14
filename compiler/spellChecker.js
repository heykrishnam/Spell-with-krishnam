/**
 * SpellForge - Spelling Validator
 * 
 * Validates word tokens against a dictionary using efficient Set lookup.
 * Generates correction suggestions using Levenshtein edit distance.
 * This mirrors the semantic analysis phase of a compiler.
 */

const fs = require('fs');
const path = require('path');

class SpellChecker {
  constructor() {
    this.dictionary = new Set();
    this.commonWords = new Set();
    this.loaded = false;
  }

  /**
   * Load dictionary from file into a Set for O(1) lookup
   */
  loadDictionary(filePath) {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      const words = data.split(/\r?\n/).map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
      words.forEach(w => this.dictionary.add(w));
      
      // Mark very common words for priority in suggestions
      const common = ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
        'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
        'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
        'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
        'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
        'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
        'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see',
        'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
        'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work',
        'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
        'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were', 'been', 'being',
        'has', 'had', 'does', 'did', 'doing', 'am', 'very', 'much', 'many'];
      common.forEach(w => this.commonWords.add(w));
      
      this.loaded = true;
      console.log(`[SpellChecker] Dictionary loaded: ${this.dictionary.size} words`);
    } catch (err) {
      console.error(`[SpellChecker] Failed to load dictionary: ${err.message}`);
    }
  }

  /**
   * Check if a word is correctly spelled
   */
  isCorrect(word) {
    if (!word || word.length === 0) return true;
    const lower = word.toLowerCase();
    
    // Single letters are valid
    if (lower.length === 1 && /[a-z]/.test(lower)) return true;
    
    // Check dictionary
    if (this.dictionary.has(lower)) return true;
    
    // Common proper nouns / abbreviations pass
    if (/^[A-Z]{2,}$/.test(word)) return true; // acronyms like "NASA", "FBI"
    
    return false;
  }

  /**
   * Calculate Levenshtein edit distance between two strings
   * This is the same algorithm used in compiler error recovery
   */
  levenshteinDistance(a, b) {
    const m = a.length;
    const n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(
            dp[i - 1][j],     // deletion
            dp[i][j - 1],     // insertion
            dp[i - 1][j - 1]  // substitution
          );
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Generate spelling suggestions for a misspelled word
   * Uses edit distance to find closest dictionary matches
   */
  getSuggestions(word, maxSuggestions = 5) {
    const lower = word.toLowerCase();
    const candidates = [];
    const maxDistance = Math.min(3, Math.ceil(lower.length / 2));

    for (const dictWord of this.dictionary) {
      // Quick length filter to avoid unnecessary computation
      if (Math.abs(dictWord.length - lower.length) > maxDistance) continue;

      const dist = this.levenshteinDistance(lower, dictWord);
      if (dist <= maxDistance && dist > 0) {
        const priority = this.commonWords.has(dictWord) ? dist - 0.5 : dist;
        candidates.push({ word: dictWord, distance: dist, priority });
      }
    }

    // Sort by priority (common words preferred), then distance, then alphabetically
    candidates.sort((a, b) => a.priority - b.priority || a.distance - b.distance || a.word.localeCompare(b.word));

    return candidates.slice(0, maxSuggestions).map(c => c.word);
  }

  /**
   * Check all WORD tokens for spelling errors
   * Returns an array of error objects
   */
  checkTokens(tokens) {
    const errors = [];

    for (const token of tokens) {
      if (token.type !== 'WORD') continue;

      if (!this.isCorrect(token.value)) {
        const suggestions = this.getSuggestions(token.value);
        errors.push({
          type: 'SPELLING',
          severity: 'error',
          message: `Misspelled word: "${token.value}"`,
          word: token.value,
          line: token.line,
          column: token.column,
          position: token.position,
          length: token.value.length,
          suggestions: suggestions,
          fix: suggestions.length > 0 ? suggestions[0] : null
        });
      }
    }

    return errors;
  }
}

module.exports = { SpellChecker };
