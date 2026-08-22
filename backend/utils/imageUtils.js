import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads', 'profile-images');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const saveBase64Image = (base64Data, doctorId) => {
  try {
    // Extract the image format from the base64 string
    const matches = base64Data.match(/^data:image\/([a-zA-Z]*);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid base64 image format');
    }

    const imageType = matches[1]; // jpeg, png, etc.
    const base64Image = matches[2];
    
    // Generate a unique filename
    const timestamp = Date.now();
    const hash = crypto.createHash('md5').update(base64Image).digest('hex').substring(0, 8);
    const filename = `doctor_${doctorId}_${timestamp}_${hash}.${imageType}`;
    const filePath = path.join(uploadsDir, filename);
    
    // Convert base64 to buffer and save
    const imageBuffer = Buffer.from(base64Image, 'base64');
    fs.writeFileSync(filePath, imageBuffer);
    
    // Return the relative URL that can be served by the server
    return `/uploads/profile-images/${filename}`;
    
  } catch (error) {
    console.error('Error saving base64 image:', error);
    throw new Error('Failed to save image');
  }
};

export const deleteOldImage = (imageUrl) => {
  try {
    if (imageUrl && imageUrl.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('Deleted old image:', imageUrl);
      }
    }
  } catch (error) {
    console.error('Error deleting old image:', error);
    // Don't throw - this is cleanup, not critical
  }
};

export const isBase64Image = (str) => {
  return typeof str === 'string' && str.startsWith('data:image/');
};