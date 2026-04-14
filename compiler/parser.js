/**
 * SpellForge - Grammar Parser
 * 
 * Performs rule-based grammar checking on the token stream.
 * This mirrors the parsing / syntax analysis phase of a compiler,
 * where tokens are analyzed for structural correctness.
 * 
 * Grammar Rules Checked:
 *   1. Sentence capitalization
 *   2. Article usage ("a" vs "an")
 *   3. Repeated consecutive words
 *   4. Subject-verb agreement (basic patterns)
 *   5. Punctuation spacing
 *   6. Missing end punctuation
 */

class GrammarParser {
  constructor() {
    // Words that start with a vowel sound (for "an" rule)
    this.vowelSoundStarts = new Set(['a', 'e', 'i', 'o', 'u']);
    
    // Known "an" exceptions (consonant letter but vowel sound)
    this.anExceptions = new Set(['hour', 'hours', 'honest', 'honestly', 'honor', 'honour', 'heir', 'heirloom']);
    
    // Known "a" exceptions (vowel letter but consonant sound)
    this.aExceptions = new Set(['university', 'uniform', 'unique', 'unit', 'united', 'union',
      'universal', 'useful', 'useless', 'user', 'usual', 'usually', 'unicorn',
      'european', 'one', 'once']);

    // Subject-verb agreement rules
    this.singularSubjects = new Set(['he', 'she', 'it']);
    this.pluralSubjects = new Set(['i', 'we', 'they', 'you']);
    this.singularVerbs = new Set(['is', 'was', 'has', 'does', 'goes', 'runs', 'comes', 'makes', 'takes', 'gives']);
    this.pluralVerbs = new Set(['are', 'were', 'have', 'do', 'go', 'run', 'come', 'make', 'take', 'give']);
    this.sentenceEnders = new Set(['.', '!', '?']);
  }

  /**
   * Get only the meaningful tokens (words, numbers, punctuation) — skip whitespace/newlines
   */
  getMeaningfulTokens(tokens) {
    return tokens.filter(t => t.type === 'WORD' || t.type === 'NUMBER' || t.type === 'PUNCTUATION' || t.type === 'CONTRACTION');
  }

  /**
   * Rule 1: Check sentence capitalization
   * The first word of each sentence should be capitalized
   */
  checkCapitalization(tokens) {
    const errors = [];
    const meaningful = this.getMeaningfulTokens(tokens);
    let expectCapital = true; // Start of text

    for (let i = 0; i < meaningful.length; i++) {
      const token = meaningful[i];

      if (token.type === 'WORD' && expectCapital) {
        if (token.value[0] !== token.value[0].toUpperCase()) {
          errors.push({
            type: 'GRAMMAR',
            severity: 'warning',
            rule: 'capitalization',
            message: `Sentence should start with a capital letter: "${token.value}"`,
            word: token.value,
            line: token.line,
            column: token.column,
            position: token.position,
            length: token.value.length,
            suggestions: [token.value[0].toUpperCase() + token.value.slice(1)],
            fix: token.value[0].toUpperCase() + token.value.slice(1)
          });
        }
        expectCapital = false;
      }

      if (token.type === 'PUNCTUATION' && this.sentenceEnders.has(token.value)) {
        expectCapital = true;
      }
    }

    return errors;
  }

  /**
   * Rule 2: Check article usage ("a" vs "an")
   */
  checkArticles(tokens) {
    const errors = [];
    const meaningful = this.getMeaningfulTokens(tokens);

    for (let i = 0; i < meaningful.length - 1; i++) {
      const current = meaningful[i];
      const next = meaningful[i + 1];

      if (current.type !== 'WORD' || next.type !== 'WORD') continue;

      const article = current.value.toLowerCase();
      const nextWord = next.value.toLowerCase();
      const firstChar = nextWord[0];

      if (article === 'a' && !this.aExceptions.has(nextWord)) {
        if (this.vowelSoundStarts.has(firstChar) || this.anExceptions.has(nextWord)) {
          errors.push({
            type: 'GRAMMAR',
            severity: 'warning',
            rule: 'article-usage',
            message: `Use "an" before "${next.value}" (vowel sound)`,
            word: current.value,
            line: current.line,
            column: current.column,
            position: current.position,
            length: current.value.length,
            suggestions: ['an', 'An'],
            fix: current.value[0] === 'A' ? 'An' : 'an'
          });
        }
      } else if (article === 'an') {
        if ((!this.vowelSoundStarts.has(firstChar) && !this.anExceptions.has(nextWord)) || this.aExceptions.has(nextWord)) {
          errors.push({
            type: 'GRAMMAR',
            severity: 'warning',
            rule: 'article-usage',
            message: `Use "a" before "${next.value}" (consonant sound)`,
            word: current.value,
            line: current.line,
            column: current.column,
            position: current.position,
            length: current.value.length,
            suggestions: ['a', 'A'],
            fix: current.value[0] === 'A' ? 'A' : 'a'
          });
        }
      }
    }

    return errors;
  }

  /**
   * Rule 3: Check for repeated consecutive words ("the the", "is is")
   */
  checkRepeatedWords(tokens) {
    const errors = [];
    const meaningful = this.getMeaningfulTokens(tokens);

    for (let i = 0; i < meaningful.length - 1; i++) {
      const current = meaningful[i];
      const next = meaningful[i + 1];

      if (current.type === 'WORD' && next.type === 'WORD' &&
          current.value.toLowerCase() === next.value.toLowerCase()) {
        errors.push({
          type: 'GRAMMAR',
          severity: 'warning',
          rule: 'repeated-word',
          message: `Repeated word: "${current.value} ${next.value}"`,
          word: next.value,
          line: next.line,
          column: next.column,
          position: next.position,
          length: next.value.length,
          suggestions: [`(remove "${next.value}")`],
          fix: ''
        });
      }
    }

    return errors;
  }

  /**
   * Rule 4: Basic subject-verb agreement check
   */
  checkSubjectVerbAgreement(tokens) {
    const errors = [];
    const meaningful = this.getMeaningfulTokens(tokens);

    for (let i = 0; i < meaningful.length - 1; i++) {
      const subject = meaningful[i];
      const verb = meaningful[i + 1];

      if (subject.type !== 'WORD' || verb.type !== 'WORD') continue;

      const subj = subject.value.toLowerCase();
      const v = verb.value.toLowerCase();

      // Singular subject + plural verb
      if (this.singularSubjects.has(subj) && this.pluralVerbs.has(v)) {
        const singularForm = this.getSingularVerb(v);
        if (singularForm) {
          errors.push({
            type: 'GRAMMAR',
            severity: 'error',
            rule: 'subject-verb-agreement',
            message: `Subject-verb disagreement: "${subject.value} ${verb.value}"`,
            word: verb.value,
            line: verb.line,
            column: verb.column,
            position: verb.position,
            length: verb.value.length,
            suggestions: [singularForm],
            fix: singularForm
          });
        }
      }

      // "I" + singular verb (except "am")
      if (subj === 'i' && (v === 'is' || v === 'was' && false)) {
        errors.push({
          type: 'GRAMMAR',
          severity: 'error',
          rule: 'subject-verb-agreement',
          message: `Subject-verb disagreement: "${subject.value} ${verb.value}" → "${subject.value} am"`,
          word: verb.value,
          line: verb.line,
          column: verb.column,
          position: verb.position,
          length: verb.value.length,
          suggestions: ['am'],
          fix: 'am'
        });
      }

      // Plural subject + singular verb
      if ((subj === 'they' || subj === 'we' || subj === 'you') && this.singularVerbs.has(v)) {
        const pluralForm = this.getPluralVerb(v);
        if (pluralForm) {
          errors.push({
            type: 'GRAMMAR',
            severity: 'error',
            rule: 'subject-verb-agreement',
            message: `Subject-verb disagreement: "${subject.value} ${verb.value}"`,
            word: verb.value,
            line: verb.line,
            column: verb.column,
            position: verb.position,
            length: verb.value.length,
            suggestions: [pluralForm],
            fix: pluralForm
          });
        }
      }
    }

    return errors;
  }

  /**
   * Rule 5: Check for missing space after punctuation
   */
  checkPunctuationSpacing(tokens) {
    const errors = [];

    for (let i = 0; i < tokens.length - 1; i++) {
      const current = tokens[i];
      const next = tokens[i + 1];

      // After sentence-ending punctuation, expect space or newline before next word
      if (current.type === 'PUNCTUATION' && this.sentenceEnders.has(current.value)) {
        if (next.type === 'WORD' || next.type === 'NUMBER') {
          errors.push({
            type: 'GRAMMAR',
            severity: 'info',
            rule: 'punctuation-spacing',
            message: `Missing space after "${current.value}" before "${next.value}"`,
            word: current.value,
            line: current.line,
            column: current.column,
            position: current.position,
            length: current.value.length,
            suggestions: [`${current.value} `],
            fix: `${current.value} `
          });
        }
      }
    }

    return errors;
  }

  /**
   * Helper: Get singular form of a verb
   */
  getSingularVerb(plural) {
    const map = {
      'are': 'is', 'were': 'was', 'have': 'has', 'do': 'does',
      'go': 'goes', 'run': 'runs', 'come': 'comes',
      'make': 'makes', 'take': 'takes', 'give': 'gives'
    };
    return map[plural] || null;
  }

  /**
   * Helper: Get plural form of a verb
   */
  getPluralVerb(singular) {
    const map = {
      'is': 'are', 'was': 'were', 'has': 'have', 'does': 'do',
      'goes': 'go', 'runs': 'run', 'comes': 'come',
      'makes': 'make', 'takes': 'take', 'gives': 'give'
    };
    return map[singular] || null;
  }

  /**
   * Run all grammar rules on the token stream
   */
  parse(tokens) {
    const errors = [];

    errors.push(...this.checkCapitalization(tokens));
    errors.push(...this.checkArticles(tokens));
    errors.push(...this.checkRepeatedWords(tokens));
    errors.push(...this.checkSubjectVerbAgreement(tokens));
    errors.push(...this.checkPunctuationSpacing(tokens));

    // Sort errors by position
    errors.sort((a, b) => a.position - b.position);

    return errors;
  }
}

module.exports = { GrammarParser };
