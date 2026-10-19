// Optimized file upload utilities for chat functionality
import { chatApi } from '../lib/chatApi.js';
import { API_CONFIG } from '../config/api';

export class FileUploader {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || '/api/chat';
    this.chunkSize = options.chunkSize || 1024 * 1024 * 2; // 2MB chunks
    this.maxFileSize = options.maxFileSize || 50 * 1024 * 1024; // 50MB max
    this.maxConcurrentUploads = options.maxConcurrentUploads || 3;
    this.retryAttempts = options.retryAttempts || 3;
    this.compressionQuality = options.compressionQuality || 0.8;

    this.activeUploads = new Map();
    this.uploadQueue = [];
    this.runningUploads = 0;
  }

  // Generate unique file ID for tracking
  generateFileId() {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Validate file before upload
  validateFile(file) {
    const allowedTypes = new Set([
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Documents
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Text files
      'text/plain', 'text/csv', 'text/markdown',
      // Archives
      'application/zip', 'application/x-rar-compressed',
      // Audio
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      // Video (small files only)
      'video/mp4', 'video/webm'
    ]);

    if (!allowedTypes.has(file.type)) {
      throw new Error(`File type ${file.type} is not supported`);
    }

    if (file.size > this.maxFileSize) {
      throw new Error(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${this.maxFileSize / 1024 / 1024}MB`);
    }

    return true;
  }

  // Compress image files before upload
  async compressImage(file, quality = this.compressionQuality) {
    if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
      return file; // Skip compression for non-images, GIFs, and SVGs
    }

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 1920px width/height)
        const maxDimension = 1920;
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Upload small files using standard multipart/form-data
  async uploadSmallFile(file, conversationId, senderId, senderType, options = {}) {
    try {
      this.validateFile(file);

      // Compress if it's an image
      const processedFile = await this.compressImage(file);

      // Use chatApi for file upload
      const response = await chatApi.uploadFiles(
        [processedFile],
        conversationId,
        senderId,
        senderType,
        options
      );

      return response;
    } catch (error) {
      console.error('Small file upload error:', error);
      throw error;
    }
  }

  // Upload large files using chunked upload
  async uploadLargeFile(file, conversationId, senderId, senderType, options = {}) {
    try {
      this.validateFile(file);

      const fileId = this.generateFileId();
      const totalChunks = Math.ceil(file.size / this.chunkSize);
      let uploadedChunks = 0;

      // Create upload tracker
      const uploadTracker = {
        file,
        fileId,
        totalChunks,
        uploadedChunks: 0,
        progress: 0,
        status: 'uploading'
      };

      this.activeUploads.set(fileId, uploadTracker);

      // Upload chunks in sequence for reliability
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * this.chunkSize;
        const end = Math.min(start + this.chunkSize, file.size);
        const chunk = file.slice(start, end);

        let retries = 0;
        while (retries < this.retryAttempts) {
          try {
            const response = await chatApi.uploadFileChunk(
              chunk,
              file.name,
              chunkIndex,
              totalChunks,
              fileId,
              { conversationId, senderId, senderType }
            );

            uploadedChunks++;
            uploadTracker.uploadedChunks = uploadedChunks;
            uploadTracker.progress = uploadedChunks / totalChunks;

            // Notify progress if callback provided
            if (options.onProgress) {
              options.onProgress(uploadTracker.progress, uploadedChunks, totalChunks);
            }

            // If this is the last chunk, return the assembled file info
            if (chunkIndex === totalChunks - 1) {
              uploadTracker.status = 'completed';
              this.activeUploads.delete(fileId);
              return response;
            }

            break; // Chunk uploaded successfully, move to next
          } catch (error) {
            retries++;
            if (retries >= this.retryAttempts) {
              uploadTracker.status = 'failed';
              this.activeUploads.delete(fileId);
              throw new Error(`Failed to upload chunk ${chunkIndex} after ${this.retryAttempts} retries: ${error.message}`);
            }

            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          }
        }
      }
    } catch (error) {
      console.error('Large file upload error:', error);
      throw error;
    }
  }

  // Upload multiple files with queue management
  async uploadFiles(files, conversationId, senderId, senderType, options = {}) {
    const results = [];
    const errors = [];

    // Create upload promises
    const uploadPromises = Array.from(files).map(async (file, index) => {
      try {
        // Wait for slot if too many concurrent uploads
        while (this.runningUploads >= this.maxConcurrentUploads) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        this.runningUploads++;

        const fileOptions = {
          ...options,
          onProgress: options.onProgress ?
            (progress, uploaded, total) => options.onProgress(index, progress, uploaded, total) :
            undefined
        };

        // Choose upload method based on file size
        const result = file.size <= this.chunkSize * 3 ?
          await this.uploadSmallFile(file, conversationId, senderId, senderType, fileOptions) :
          await this.uploadLargeFile(file, conversationId, senderId, senderType, fileOptions);

        results.push({ index, file: file.name, result });
        return result;
      } catch (error) {
        errors.push({ index, file: file.name, error: error.message });
        throw error;
      } finally {
        this.runningUploads--;
      }
    });

    // Wait for all uploads to complete
    await Promise.allSettled(uploadPromises);

    return {
      success: results,
      errors: errors,
      total: files.length,
      completed: results.length
    };
  }

  // Cancel upload
  cancelUpload(fileId) {
    const upload = this.activeUploads.get(fileId);
    if (upload) {
      upload.status = 'cancelled';
      this.activeUploads.delete(fileId);
    }
  }

  // Get upload progress
  getUploadProgress(fileId) {
    return this.activeUploads.get(fileId);
  }

  // Get all active uploads
  getActiveUploads() {
    return Array.from(this.activeUploads.values());
  }

  // Create file preview for UI
  createFilePreview(file) {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            type: 'image',
            src: e.target.result,
            name: file.name,
            size: file.size
          });
        };
        reader.readAsDataURL(file);
      } else {
        resolve({
          type: 'file',
          name: file.name,
          size: file.size,
          extension: file.name.split('.').pop() || 'file'
        });
      }
    });
  }

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export singleton instance
export const fileUploader = new FileUploader({
  baseUrl: `${API_CONFIG.BASE_URL}/api/chat`,
  chunkSize: 2 * 1024 * 1024, // 2MB chunks
  maxFileSize: 50 * 1024 * 1024, // 50MB max
  maxConcurrentUploads: 3
});

// Utility functions for drag and drop
export const createDropZone = (element, onFileDrop) => {
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    element.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    element.classList.remove('drag-over');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    element.classList.remove('drag-over');

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && onFileDrop) {
      onFileDrop(files);
    }
  };

  element.addEventListener('dragover', handleDragOver);
  element.addEventListener('dragleave', handleDragLeave);
  element.addEventListener('drop', handleDrop);

  // Return cleanup function
  return () => {
    element.removeEventListener('dragover', handleDragOver);
    element.removeEventListener('dragleave', handleDragLeave);
    element.removeEventListener('drop', handleDrop);
  };
};

export default { FileUploader, fileUploader, createDropZone };