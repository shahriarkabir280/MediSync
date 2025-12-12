import express from 'express';
import { chatController } from '../controllers/chatController.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload directory path
const uploadDir = path.join(__dirname, '../uploads/chat-files/');

// Function to ensure upload directory exists
const ensureUploadDir = async () => {
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
    console.log('Created chat-files upload directory:', uploadDir);
  }
};

// Configure multer for optimized file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${file.fieldname}-${uniqueSuffix}-${sanitizedName}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Expanded file type support with faster MIME type checking
  const allowedTypes = new Set([
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    // Documents
    'application/pdf', 
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Text files
    'text/plain', 'text/csv', 'text/markdown', 'text/html',
    // Archives
    'application/zip', 'application/x-rar-compressed',
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/ogg',
    // Video (small files only)
    'video/mp4', 'video/webm'
  ]);

  if (allowedTypes.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

// Optimized multer configuration for faster uploads
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // Increased to 50MB
    files: 5, // Allow multiple files
    fields: 10
  }
});

// Chat Routes

// GET /api/chat/conversations - Get all conversations for a user
router.get('/conversations', chatController.getConversations);

// GET /api/chat/conversations/:conversationId/messages - Get messages for a conversation
router.get('/conversations/:conversationId/messages', chatController.getMessages);

// GET /api/chat/users/search - Search all users (doctors and patients) for starting conversations
router.get('/users/search', chatController.searchUsers);

// POST /api/chat/conversations - Create a new conversation
router.post('/conversations', chatController.createConversation);

// POST /api/chat/conversations/start - Start or get existing conversation with a user
router.post('/conversations/start', chatController.startConversation);

// POST /api/chat/conversations/:conversationId/messages - Send a message
router.post('/conversations/:conversationId/messages', chatController.sendMessage);

// POST /api/chat/conversations/:conversationId/messages/file - Send a file message (legacy)
router.post('/conversations/:conversationId/messages/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { conversationId } = req.params;
    const { senderId, senderName, senderType, replyTo } = req.body;

    if (!senderId || !senderType) {
      return res.status(400).json({ error: 'senderId and senderType are required' });
    }

    // Determine message type based on file mimetype
    let messageType = 'file';
    if (req.file.mimetype.startsWith('image/')) {
      messageType = 'image';
    }

    // Create file URL (relative path from uploads)
    const fileUrl = `/uploads/chat-files/${req.file.filename}`;

    // Use the existing sendMessage controller with file data
    req.body = {
      content: req.file.originalname,
      messageType: messageType,
      replyTo: replyTo || null,
      senderId,
      senderName: senderName || 'Unknown',
      senderType,
      fileName: req.file.originalname,
      fileUrl: fileUrl,
      fileSize: req.file.size
    };

    await chatController.sendMessage(req, res);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Optimized file upload endpoint with multiple file support
router.post('/upload-optimized', upload.array('files', 5), async (req, res) => {
  try {
    console.log('Upload optimized endpoint hit');
    console.log('Files received:', req.files?.length || 0);
    console.log('Body:', req.body);
    
    // Ensure upload directory exists
    await ensureUploadDir();
    
    if (!req.files || req.files.length === 0) {
      console.log('No files uploaded');
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { conversationId, senderId, senderName, senderType, messageText } = req.body;
    console.log('Upload params:', { conversationId, senderId, senderType, messageText });

    if (!conversationId || !senderId || !senderType) {
      console.log('Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const uploadResults = [];

    // Process files in parallel for speed
    const fileProcessingPromises = req.files.map(async (file) => {
      try {
        // Get file stats
        const stats = await fs.stat(file.path);
        
        // Determine message type based on file mimetype
        let messageType = 'file';
        if (file.mimetype.startsWith('image/')) {
          messageType = 'image';
        } else if (file.mimetype.startsWith('audio/')) {
          messageType = 'audio';
        } else if (file.mimetype.startsWith('video/')) {
          messageType = 'video';
        }
        
        return {
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: stats.size,
          path: `/uploads/chat-files/${file.filename}`,
          messageType,
          uploadedAt: new Date().toISOString()
        };
      } catch (error) {
        console.error(`Error processing file ${file.filename}:`, error);
        throw error;
      }
    });

    const processedFiles = await Promise.all(fileProcessingPromises);
    uploadResults.push(...processedFiles);

    // Send individual message for each file (WhatsApp-like behavior)
    const messagePromises = processedFiles.map(async (fileData) => {
      return await new Promise((resolve, reject) => {
        const messageRequest = {
          body: {
            content: messageText || fileData.originalname,
            messageType: fileData.messageType,
            senderId,
            senderName: senderName || 'Unknown',
            senderType,
            fileName: fileData.originalname,
            fileUrl: fileData.path,
            fileSize: fileData.size
          },
          params: { conversationId }
        };

        const mockRes = {
          status: (code) => ({
            json: (data) => {
              if (code !== 200 && code !== 201) {
                reject(new Error(data.error || `HTTP ${code}`));
              } else {
                resolve(data);
              }
            }
          }),
          json: (data) => resolve(data)
        };
        
        try {
          chatController.sendMessage(messageRequest, mockRes);
        } catch (error) {
          reject(error);
        }
      });
    });

    const sentMessages = await Promise.all(messagePromises);

    res.json({
      success: true,
      message: 'Files uploaded successfully',
      files: uploadResults,
      messages: sentMessages,
      count: processedFiles.length
    });

  } catch (error) {
    console.error('File upload error:', error);
    console.error('Error stack:', error.stack);
    
    // Clean up files on error
    if (req.files) {
      const cleanupPromises = req.files.map(file => 
        fs.unlink(file.path).catch(err => console.error('Cleanup error:', err))
      );
      await Promise.allSettled(cleanupPromises);
    }

    res.status(500).json({ 
      error: 'File upload failed',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Chunked upload endpoint for large files
router.post('/upload-chunk', express.raw({ type: 'application/octet-stream', limit: '5mb' }), async (req, res) => {
  try {
    const { fileName, chunkIndex, totalChunks, fileId, conversationId, senderId, senderType } = req.query;
    
    if (!fileName || !chunkIndex || !totalChunks || !fileId) {
      return res.status(400).json({ error: 'Missing chunk parameters' });
    }

    const tempDir = path.join(uploadDir, 'temp');
    try {
      await fs.access(tempDir);
    } catch {
      await fs.mkdir(tempDir, { recursive: true });
    }

    const chunkPath = path.join(tempDir, `${fileId}_chunk_${chunkIndex}`);
    await fs.writeFile(chunkPath, req.body);

    // Check if all chunks are uploaded
    const allChunksUploaded = await Promise.all(
      Array.from({ length: parseInt(totalChunks) }, async (_, i) => {
        const chunkFile = path.join(tempDir, `${fileId}_chunk_${i}`);
        try {
          await fs.access(chunkFile);
          return true;
        } catch {
          return false;
        }
      })
    );

    if (allChunksUploaded.every(Boolean)) {
      // Assemble file from chunks
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const finalPath = path.join(uploadDir, `chunked_${Date.now()}_${sanitizedFileName}`);
      const writeStream = await fs.open(finalPath, 'w');

      for (let i = 0; i < parseInt(totalChunks); i++) {
        const chunkPath = path.join(tempDir, `${fileId}_chunk_${i}`);
        const chunkData = await fs.readFile(chunkPath);
        await writeStream.write(chunkData);
        await fs.unlink(chunkPath); // Clean up chunk
      }

      await writeStream.close();

      // Send message with assembled file if conversation details provided
      if (conversationId && senderId && senderType) {
        const stats = await fs.stat(finalPath);
        const finalFileName = path.basename(finalPath);
        
        const messageRequest = {
          body: {
            content: fileName,
            messageType: 'file',
            senderId,
            senderName: 'Doctor', // Default name
            senderType,
            fileName: fileName,
            fileUrl: `/uploads/chat-files/${finalFileName}`,
            fileSize: stats.size
          },
          params: { conversationId }
        };

        await new Promise((resolve, reject) => {
          const mockRes = {
            status: () => mockRes,
            json: (data) => {
              if (data.error) reject(new Error(data.error));
              else resolve(data);
            }
          };
          
          chatController.sendMessage(messageRequest, mockRes);
        });
      }

      return res.json({
        success: true,
        message: 'File assembled and uploaded successfully',
        fileName: fileName,
        path: `/uploads/chat-files/${path.basename(finalPath)}`,
        size: (await fs.stat(finalPath)).size
      });
    }

    res.json({
      success: true,
      message: `Chunk ${chunkIndex} uploaded`,
      progress: (parseInt(chunkIndex) + 1) / parseInt(totalChunks)
    });

  } catch (error) {
    console.error('Chunk upload error:', error);
    res.status(500).json({ error: 'Chunk upload failed', details: error.message });
  }
});

// File compression endpoint
router.post('/compress-and-upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // For images, we could add compression logic here
    // For now, we'll process normally but with optimization flags
    
    const { conversationId, senderId, senderName, senderType } = req.body;

    if (!conversationId || !senderId || !senderType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Quick file processing
    const stats = await fs.stat(req.file.path);
    let messageType = 'file';
    if (req.file.mimetype.startsWith('image/')) {
      messageType = 'image';
    }

    const fileData = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: stats.size,
      path: `/uploads/chat-files/${req.file.filename}`,
      compressed: true // Flag to indicate processing
    };

    // Send message
    const messageRequest = {
      body: {
        content: req.file.originalname,
        messageType,
        senderId,
        senderName: senderName || 'Unknown',
        senderType,
        fileName: req.file.originalname,
        fileUrl: fileData.path,
        fileSize: fileData.size
      },
      params: { conversationId }
    };

    await new Promise((resolve, reject) => {
      const mockRes = {
        status: () => mockRes,
        json: (data) => {
          if (data.error) reject(new Error(data.error));
          else resolve(data);
        }
      };
      
      chatController.sendMessage(messageRequest, mockRes);
    });

    res.json({
      success: true,
      message: 'File processed and uploaded successfully',
      file: fileData
    });

  } catch (error) {
    console.error('Compress upload error:', error);
    res.status(500).json({ error: 'File processing failed', details: error.message });
  }
});

// GET /api/chat/search - Search conversations and messages
router.get('/search', chatController.searchChat);

// PUT /api/chat/conversations/:conversationId/typing - Update typing indicator
router.put('/conversations/:conversationId/typing', chatController.updateTypingStatus);

// GET /api/chat/conversations/:conversationId/typing - Get typing indicators
router.get('/conversations/:conversationId/typing', chatController.getTypingIndicators);

// PUT /api/chat/messages/:messageId/status - Update message status
router.put('/messages/:messageId/status', chatController.updateMessageStatus);

// PUT /api/chat/conversations/:conversationId/pin - Toggle pin status
router.put('/conversations/:conversationId/pin', chatController.togglePin);

// DELETE /api/chat/messages/:messageId - Delete message
router.delete('/messages/:messageId', chatController.deleteMessage);

// Error handling middleware for file uploads
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected file field.' });
    }
  }
  if (error.message === 'File type not allowed') {
    return res.status(400).json({ error: 'File type not allowed. Please upload images or documents.' });
  }
  next(error);
});

export default router;