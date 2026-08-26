const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body } = require('express-validator');
const knowledgeBaseController = require('../controllers/knowledgeBaseController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// List all knowledge documents
router.get('/', authenticate, knowledgeBaseController.getDocuments);

// Upload / Create new document
router.post(
  '/',
  authenticate,
  upload.single('file'),
  [
    body('title').trim().notEmpty().withMessage('Document title is required')
  ],
  knowledgeBaseController.createDocument
);

// Semantic similarity test search against vector database
router.post('/search', authenticate, knowledgeBaseController.searchKnowledgeBase);

// Knowledge gap queries list
router.get('/gaps', authenticate, knowledgeBaseController.getKnowledgeGaps);

// Get single document status and chunk inspector
router.get('/:id/status', authenticate, knowledgeBaseController.getDocumentStatus);

// Delete knowledge document and all its chunks
router.delete('/:id', authenticate, requireRole('admin', 'agent'), knowledgeBaseController.deleteDocument);

module.exports = router;
