const express = require('express');
const router = express.Router();
const multer = require('multer');
const contractController = require('../controllers/contractController');
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } 
});
router.post('/upload', upload.single('contract'), contractController.analyzeContract);
router.post('/chat', contractController.chatWithContract);
module.exports = router;