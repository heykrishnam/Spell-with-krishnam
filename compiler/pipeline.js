/**
 * SpellForge - Compiler Pipeline
 * 
 * Orchestrates the full compilation pipeline:
 *   Input Text → Lexer → Spell Checker → Grammar Parser → Error Report
 * 
 * This mirrors a real compiler's multi-phase architecture:
 *   Source Code → Lexical Analysis → Semantic Analysis → Syntax Analysis → Output
 */

const path = require('path');
const { Lexer } = require('./lexer');
const { SpellChecker } = require('./spellChecker');
const { GrammarParser } = require('./parser');

class CompilerPipeline {
  constructor() {
    this.lexer = null;
    this.spellChecker = new SpellChecker();
    this.grammarParser = new GrammarParser();
    
    // Load dictionary
    const dictPath = path.join(__dirname, '..', 'dictionary', 'words.txt');
    this.spellChecker.loadDictionary(dictPath);
  }

  /**
   * Run the full compiler pipeline on input text
   */
  analyze(inputText) {
    const startTime = Date.now();

    // ═══════════════════════════════════════════
    // Phase 1: LEXICAL ANALYSIS (Tokenization)
    // ═══════════════════════════════════════════
    this.lexer = new Lexer(inputText);
    const tokens = this.lexer.tokenize();
    const tokenStats = this.lexer.getStats();

    // ═══════════════════════════════════════════
    // Phase 2: SPELLING VALIDATION (Semantic Analysis)
    // ═══════════════════════════════════════════
    const spellingErrors = this.spellChecker.checkTokens(tokens);

    // ═══════════════════════════════════════════
    // Phase 3: GRAMMAR CHECKING (Syntax/Parsing)
    // ═══════════════════════════════════════════
    const grammarErrors = this.grammarParser.parse(tokens);

    // ═══════════════════════════════════════════
    // Phase 4: ERROR REPORT GENERATION
    // ═══════════════════════════════════════════
    const allErrors = [...spellingErrors, ...grammarErrors];
    allErrors.sort((a, b) => a.position - b.position);

    // Generate corrected text
    const correctedText = this.generateCorrectedText(inputText, allErrors);

    // Calculate statistics
    const wordCount = tokenStats.words + tokenStats.contractions;
    const errorCount = allErrors.length;
    const accuracy = wordCount > 0 ? Math.max(0, ((wordCount - spellingErrors.length) / wordCount * 100)).toFixed(1) : 100;

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      input: inputText,
      correctedText: correctedText,
      tokens: tokens.filter(t => t.type !== 'WHITESPACE' && t.type !== 'NEWLINE').map(t => ({
        type: t.type,
        value: t.value,
        line: t.line,
        column: t.column
      })),
      tokenStats: tokenStats,
      errors: allErrors,
      summary: {
        totalWords: wordCount,
        totalCharacters: inputText.length,
        totalLines: (inputText.match(/\n/g) || []).length + 1,
        spellingErrors: spellingErrors.length,
        grammarErrors: grammarErrors.length,
        totalErrors: errorCount,
        accuracy: parseFloat(accuracy),
        processingTimeMs: processingTime
      },
      project: 'Spell with Krishnam',
      phases: [
        {
          name: 'Lexical Analysis',
          description: 'Tokenized input into typed tokens',
          tokensProduced: tokens.length,
          status: 'completed'
        },
        {
          name: 'Spelling Validation',
          description: 'Checked words against dictionary',
          errorsFound: spellingErrors.length,
          status: 'completed'
        },
        {
          name: 'Grammar Parsing',
          description: 'Applied grammar rules to token stream',
          errorsFound: grammarErrors.length,
          status: 'completed'
        },
        {
          name: 'Report Generation',
          description: 'Compiled error report and corrections',
          status: 'completed'
        }
      ]
    };
  }

  /**
   * Generate corrected text by applying all fixes
   */
  generateCorrectedText(originalText, errors) {
    if (errors.length === 0) return originalText;

    // Sort errors by position (descending) to apply from end to start
    // This prevents position shifting issues
    const fixableErrors = errors
      .filter(e => e.fix !== null && e.fix !== undefined)
      .sort((a, b) => b.position - a.position);

    let corrected = originalText;

    for (const error of fixableErrors) {
      if (error.fix === '') {
        // Remove the word (for repeated words) — also remove leading/trailing space
        const before = corrected.substring(0, error.position);
        const after = corrected.substring(error.position + error.length);
        // Remove extra space
        if (before.endsWith(' ')) {
          corrected = before.slice(0, -1) + after;
        } else {
          corrected = before + after;
        }
      } else {
        // Replace word with fix
        const before = corrected.substring(0, error.position);
        const after = corrected.substring(error.position + error.length);
        corrected = before + error.fix + after;
      }
    }

    return corrected;
  }
}

module.exports = { CompilerPipeline };
