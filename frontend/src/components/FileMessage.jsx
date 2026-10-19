import React, { useState } from 'react';
import { Download, File, Image, Video, Music, Eye, X } from 'lucide-react';
import { downloadFile, getFileIcon, formatFileSize, isImageFile, isVideoFile, isAudioFile } from '../utils/fileUtils';
import { getImageUrl } from '../config/api';

const FileMessage = ({ message, isOwn }) => {
  const [showImageModal, setShowImageModal] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(false);
  // Private chat uploads need the auth token in the URL for <img>/<video>/<audio>
  const fileUrl = getImageUrl(message.fileUrl);

  const handleDownload = async () => {
    try {
      setDownloadProgress(true);
      await downloadFile(fileUrl, message.fileName || message.content);
    } catch {
      alert('Failed to download file');
    } finally {
      setDownloadProgress(false);
    }
  };

  const renderFilePreview = () => {
    // Image files
    if (message.type === 'image' || isImageFile(message.fileType)) {
      return (
        <div className="space-y-2">
          <div 
            className="relative cursor-pointer group"
            onClick={() => setShowImageModal(true)}
          >
            <img 
              src={fileUrl} 
              alt={message.content}
              className="max-w-full h-auto rounded-lg max-h-60 object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            {/* Image overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
              <Eye size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {/* Error fallback */}
            <div className="hidden bg-gray-100 p-4 rounded-lg text-center">
              <Image size={24} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Image unavailable</p>
            </div>
          </div>
          
          {/* Image Modal */}
          {showImageModal && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="relative max-w-4xl max-h-4xl">
                <button
                  onClick={() => setShowImageModal(false)}
                  className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70"
                >
                  <X size={20} />
                </button>
                <img 
                  src={fileUrl} 
                  alt={message.content}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 rounded-lg p-2 text-white">
                  <p className="text-sm font-medium">{message.fileName || message.content}</p>
                  <p className="text-xs opacity-75">{formatFileSize(message.fileSize)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Video files
    if (message.type === 'video' || isVideoFile(message.fileType)) {
      return (
        <div className="space-y-2">
          <video 
            controls 
            className="max-w-full h-auto rounded-lg max-h-60"
            preload="metadata"
          >
            <source src={fileUrl} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // Audio files
    if (message.type === 'audio' || isAudioFile(message.fileType)) {
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Music size={20} className="text-blue-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{message.fileName || message.content}</p>
              <audio controls className="w-full mt-2" preload="metadata">
                <source src={fileUrl} />
                Your browser does not support the audio tag.
              </audio>
            </div>
          </div>
        </div>
      );
    }

    // Other file types
    return (
      <div className="space-y-2">
        <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl flex-shrink-0">
            {getFileIcon(message.fileType, message.fileName || message.content)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {message.fileName || message.content}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatFileSize(message.fileSize)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`
      max-w-xs lg:max-w-md px-4 py-2 rounded-lg
      ${isOwn ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-900'}
    `}>
      {renderFilePreview()}
      
      {/* File info and actions */}
      <div className={`
        flex items-center justify-between mt-2 pt-2 border-t
        ${isOwn ? 'border-blue-400' : 'border-gray-200'}
      `}>
        <div className="flex-1 min-w-0">
          {message.content && message.content !== (message.fileName || '') && (
            <p className={`text-sm ${isOwn ? 'text-blue-100' : 'text-gray-600'}`}>
              {message.content}
            </p>
          )}
        </div>
        
        <button
          onClick={handleDownload}
          disabled={downloadProgress}
          className={`
            p-1 rounded-full transition-colors ml-2
            ${isOwn 
              ? 'hover:bg-blue-400 text-blue-100' 
              : 'hover:bg-gray-100 text-gray-600'
            }
            ${downloadProgress ? 'opacity-50 cursor-not-allowed' : 'hover:text-gray-900'}
          `}
          title="Download file"
        >
          {downloadProgress ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Download size={16} />
          )}
        </button>
      </div>
      
      {/* Timestamp */}
      <div className={`
        flex items-center justify-end mt-1 space-x-1
        ${isOwn ? 'text-blue-100' : 'text-gray-400'}
      `}>
        <span className="text-xs">{message.timestamp}</span>
        {isOwn && message.status && (
          <span className="text-xs">
            {message.status === 'sending' ? '○' : message.status === 'sent' ? '✓' : '✓✓'}
          </span>
        )}
      </div>
    </div>
  );
};

export default FileMessage;