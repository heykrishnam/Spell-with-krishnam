/**
 * SpellForge - Express Server
 * 
 * REST API server that serves the frontend and handles text analysis requests.
 * Supports both direct text input and file upload (.txt files).
 */

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { CompilerPipeline } = require('./compiler/pipeline');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize compiler pipeline
const compiler = new CompilerPipeline();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.txt' || ext === '.text' || ext === '.md') {
      cb(null, true);
    } else {
      cb(new Error('Only .txt, .text, and .md files are allowed'));
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ═══════════════════════════════════════════
// API Routes
// ═══════════════════════════════════════════

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Spell with Krishnam Engine',
    version: '1.0.0',
    dictionaryLoaded: compiler.spellChecker.loaded,
    dictionarySize: compiler.spellChecker.dictionary.size,
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/analyze
 * Analyze text input for spelling and grammar errors
 */
app.post('/api/analyze', (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Please provide text to analyze'
      });
    }

    if (text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text cannot be empty'
      });
    }

    if (text.length > 100000) {
      return res.status(400).json({
        success: false,
        error: 'Text exceeds maximum length of 100,000 characters'
      });
    }

    const result = compiler.analyze(text);
    res.json(result);
  } catch (err) {
    console.error('[Server] Analysis error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error during analysis'
    });
  }
});

/**
 * POST /api/upload
 * Upload a text file and analyze its contents
 */
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const filePath = req.file.path;
    const text = fs.readFileSync(filePath, 'utf-8');

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    if (text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Uploaded file is empty'
      });
    }

    const result = compiler.analyze(text);
    result.fileName = req.file.originalname;
    result.fileSize = req.file.size;
    res.json(result);
  } catch (err) {
    console.error('[Server] Upload error:', err);
    res.status(500).json({
      success: false,
      error: 'Error processing uploaded file'
    });
  }
});

// Error handling for multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'File size exceeds 5MB limit' });
    }
    return res.status(400).json({ success: false, error: err.message });
  }
  if (err.message) {
    return res.status(400).json({ success: false, error: err.message });
  }
  next(err);
});

// Start server
app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════════╗`);
  console.log(`║   🔮 Spell with Krishnam Engine v1.0.0      ║`);
  console.log(`║   Server running at http://localhost:${PORT}     ║`);
  console.log(`╚══════════════════════════════════════════════╝\n`);
});
