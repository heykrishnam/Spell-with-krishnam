/**
 * Spell with Krishnam - Lexical Analyzer (Lexer)
 * 
 * Performs lexical analysis on input text, breaking it into a stream of typed tokens.
 * This mirrors the first phase of a compiler pipeline.
 * 
 * Token Types:
 *   WORD        - Alphabetic words (e.g., "hello", "world")
 *   NUMBER      - Numeric literals (e.g., "42", "3.14")
 *   PUNCTUATION - Punctuation marks (e.g., ".", ",", "!")
 *   WHITESPACE  - Spaces and tabs
 *   NEWLINE     - Line breaks
 *   CONTRACTION - Contractions like "don't", "I'm"
 *   UNKNOWN     - Unrecognized characters
 */

class Token {
  constructor(type, value, line, column, position) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.column = column;
    this.position = position; // absolute position in source text
  }
}

class Lexer {
  constructor(input) {
    this.input = input;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
  }

  /**
   * Peek at current character without consuming it
   */
  peek() {
    return this.pos < this.input.length ? this.input[this.pos] : null;
  }

  /**
   * Advance position by one character
   */
  advance() {
    const ch = this.input[this.pos];
    this.pos++;
    if (ch === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return ch;
  }

  /**
   * Check if a character is alphabetic
   */
  isAlpha(ch) {
    return ch && /[a-zA-Z]/.test(ch);
  }

  /**
   * Check if a character is a digit
   */
  isDigit(ch) {
    return ch && /[0-9]/.test(ch);
  }

  /**
   * Check if a character is punctuation
   */
  isPunctuation(ch) {
    return ch && /[.,;:!?'"()\[\]{}\-—–…\/\\@#$%^&*~`]/.test(ch);
  }

  /**
   * Check if a character is whitespace (not newline)
   */
  isWhitespace(ch) {
    return ch && (ch === ' ' || ch === '\t');
  }

  /**
   * Read a word token (sequence of alphabetic characters)
   * Also handles contractions like "don't", "I'm", "they're"
   */
  readWord() {
    const startLine = this.line;
    const startCol = this.column;
    const startPos = this.pos;
    let value = '';

    while (this.peek() && this.isAlpha(this.peek())) {
      value += this.advance();
    }

    // Check for contractions (e.g., don't, I'm, they're)
    if (this.peek() === "'" && this.pos + 1 < this.input.length && this.isAlpha(this.input[this.pos + 1])) {
      value += this.advance(); // consume apostrophe
      while (this.peek() && this.isAlpha(this.peek())) {
        value += this.advance();
      }
      return new Token('CONTRACTION', value, startLine, startCol, startPos);
    }

    return new Token('WORD', value, startLine, startCol, startPos);
  }

  /**
   * Read a number token (integer or decimal)
   */
  readNumber() {
    const startLine = this.line;
    const startCol = this.column;
    const startPos = this.pos;
    let value = '';

    while (this.peek() && this.isDigit(this.peek())) {
      value += this.advance();
    }

    // Handle decimals
    if (this.peek() === '.' && this.pos + 1 < this.input.length && this.isDigit(this.input[this.pos + 1])) {
      value += this.advance(); // consume '.'
      while (this.peek() && this.isDigit(this.peek())) {
        value += this.advance();
      }
    }

    return new Token('NUMBER', value, startLine, startCol, startPos);
  }

  /**
   * Read whitespace token
   */
  readWhitespace() {
    const startLine = this.line;
    const startCol = this.column;
    const startPos = this.pos;
    let value = '';

    while (this.peek() && this.isWhitespace(this.peek())) {
      value += this.advance();
    }

    return new Token('WHITESPACE', value, startLine, startCol, startPos);
  }

  /**
   * Main tokenization method - scans the entire input and produces a token stream
   */
  tokenize() {
    this.tokens = [];
    this.pos = 0;
    this.line = 1;
    this.column = 1;

    while (this.pos < this.input.length) {
      const ch = this.peek();

      if (ch === '\n' || ch === '\r') {
        const startLine = this.line;
        const startCol = this.column;
        const startPos = this.pos;
        let value = this.advance();
        // Handle \r\n
        if (value === '\r' && this.peek() === '\n') {
          value += this.advance();
        }
        this.tokens.push(new Token('NEWLINE', value, startLine, startCol, startPos));
      } else if (this.isWhitespace(ch)) {
        this.tokens.push(this.readWhitespace());
      } else if (this.isAlpha(ch)) {
        this.tokens.push(this.readWord());
      } else if (this.isDigit(ch)) {
        this.tokens.push(this.readNumber());
      } else if (this.isPunctuation(ch)) {
        const startLine = this.line;
        const startCol = this.column;
        const startPos = this.pos;
        this.tokens.push(new Token('PUNCTUATION', this.advance(), startLine, startCol, startPos));
      } else {
        const startLine = this.line;
        const startCol = this.column;
        const startPos = this.pos;
        this.tokens.push(new Token('UNKNOWN', this.advance(), startLine, startCol, startPos));
      }
    }

    return this.tokens;
  }

  /**
   * Get token statistics
   */
  getStats() {
    const stats = {
      totalTokens: this.tokens.length,
      words: 0,
      numbers: 0,
      punctuation: 0,
      contractions: 0,
      whitespace: 0,
      newlines: 0,
      unknown: 0
    };

    for (const token of this.tokens) {
      switch (token.type) {
        case 'WORD': stats.words++; break;
        case 'NUMBER': stats.numbers++; break;
        case 'PUNCTUATION': stats.punctuation++; break;
        case 'CONTRACTION': stats.contractions++; break;
        case 'WHITESPACE': stats.whitespace++; break;
        case 'NEWLINE': stats.newlines++; break;
        case 'UNKNOWN': stats.unknown++; break;
      }
    }

    return stats;
  }
}

module.exports = { Lexer, Token };
