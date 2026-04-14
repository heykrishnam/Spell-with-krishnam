# 🔮 Spell with Krishnam

**Spell with Krishnam** is a premium, web-based English spelling and grammar engine built using fundamental **Compiler Design** principles. Unlike traditional text-checkers that rely purely on regular expressions, Spell with Krishnam processes natural language through a multi-phase compilation pipeline.

![Status](https://img.shields.io/badge/Status-Complete-success)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![Architecture](https://img.shields.io/badge/Architecture-Compiler--Based-purple)

## 🚀 Features

- **Lexical Analysis (Tokenization)**: Breaks down input into structured tokens with precise positional metadata.
- **Semantic Validation**: Dictionary-based spelling check using the **Levenshtein Distance** algorithm for intelligent suggestions.
- **Syntax Parsing**: Rule-based grammar checking for articles, capitalization, subject-verb agreement, and more.
- **Premium UI**: Dark-themed management dashboard with a modern **Glassmorphism** aesthetic.
- **Pipeline Visualization**: Real-time visualization of compiler phases (Lexing -> Checking -> Parsing).
- **File Upload**: Support for processing `.txt` and `.md` files in bulk.
- **Internal Reports**: Deep-dive view of the internal Token Stream and compilation statistics.

## 🛠️ Technical Architecture

SpellForge treats English sentences like source code. The pipeline is structured as follows:

1.  **Scanner/Lexer**: Converts a stream of characters into defined tokens (`WORD`, `NUMBER`, `PUNCTUATION`, etc.).
2.  **Semantic Analyzer**: Validates word tokens against a pre-compiled English symbol table (Dictionary).
3.  **Syntax Parser**: Evaluates the sequence of tokens against grammatical rules to identify structural errors.
4.  **Codegen/Correction**: Applies the calculated fixes to reconstruct the final, corrected text.

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/spell-with-krishnam.git

# Navigate to the project directory
cd spell-with-krishnam

# Install dependencies
npm install

# Start the server
npm start
```

Now open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎓 Academic Statement

This project serves as a practical demonstration of how **Automata Theory** and **Compiler Construction** techniques can be applied to Natural Language Processing (NLP) challenges. It provides a modular framework for language diagnostic tools, where grammar rules and lexing patterns can be extended independently of the user interface.

---

Built with ❤️ for Computer Science & Linguistics.
