// File download and utility functions for chat
import { authFetch } from '../lib/authToken';

export const downloadFile = async (fileUrl, fileName) => {
  try {
    const response = await authFetch(fileUrl);
    if (!response.ok) throw new Error('Download failed');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
};

export const getFileIcon = (fileType, fileName) => {
  const extension = fileName?.split('.').pop()?.toLowerCase() || '';
  
  if (fileType?.startsWith('image/')) return '🖼️';
  if (fileType?.startsWith('video/')) return '🎥';
  if (fileType?.startsWith('audio/')) return '🎵';
  if (fileType === 'application/pdf') return '📄';
  
  // By extension
  switch (extension) {
    case 'doc':
    case 'docx':
      return '📝';
    case 'xls':
    case 'xlsx':
      return '📊';
    case 'ppt':
    case 'pptx':
      return '📈';
    case 'zip':
    case 'rar':
      return '🗜️';
    case 'txt':
      return '📄';
    default:
      return '📎';
  }
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const isImageFile = (fileType) => {
  return fileType?.startsWith('image/');
};

export const isVideoFile = (fileType) => {
  return fileType?.startsWith('video/');
};

export const isAudioFile = (fileType) => {
  return fileType?.startsWith('audio/');
};

export const getFileTypeDisplay = (fileType, fileName) => {
  if (isImageFile(fileType)) return 'Image';
  if (isVideoFile(fileType)) return 'Video';
  if (isAudioFile(fileType)) return 'Audio';
  
  const extension = fileName?.split('.').pop()?.toUpperCase();
  return extension ? `${extension} File` : 'File';
};