import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker?: boolean;
}

/**
 * Compress an image file if it exceeds the specified size threshold
 * @param imageFile - The image file to compress
 * @param compressionThresholdMB - Files larger than this will be compressed (default: 5MB)
 * @param options - Compression options
 * @returns The compressed file if compression was needed, otherwise the original file
 */
export async function compressImageIfNeeded(
  imageFile: File,
  compressionThresholdMB: number = 5,
  options?: Partial<CompressionOptions>
): Promise<File> {
  const fileSizeMB = imageFile.size / 1024 / 1024;
  
  // If file is smaller than threshold, return as is
  if (fileSizeMB <= compressionThresholdMB) {
    console.log(`Image size (${fileSizeMB.toFixed(2)}MB) is within threshold, no compression needed`);
    return imageFile;
  }
  
  console.log(`Image size (${fileSizeMB.toFixed(2)}MB) exceeds threshold, compressing...`);
  
  const defaultOptions: CompressionOptions = {
    maxSizeMB: compressionThresholdMB,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };
  
  const compressionOptions = { ...defaultOptions, ...options };
  
  try {
    const compressedFile = await imageCompression(imageFile, compressionOptions);
    const compressedSizeMB = compressedFile.size / 1024 / 1024;
    console.log(`Image compressed from ${fileSizeMB.toFixed(2)}MB to ${compressedSizeMB.toFixed(2)}MB`);
    
    // Create a new File object with the original name
    return new File([compressedFile], imageFile.name, {
      type: compressedFile.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('Failed to compress image');
  }
}

/**
 * Convert HEIF/HEIC images to JPEG format
 * @param heifFile - The HEIF/HEIC file to convert
 * @returns A promise that resolves to a JPEG file
 */
export async function convertHeifToJpeg(heifFile: File): Promise<File> {
  // For HEIF conversion, we'll use the browser's native image decoding
  // This works in Safari and other browsers that support HEIF
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to convert image'));
              return;
            }
            
            // Create a new file with .jpg extension
            const fileName = heifFile.name.replace(/\.(heif|heic)$/i, '.jpg');
            const convertedFile = new File([blob], fileName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            
            resolve(convertedFile);
          },
          'image/jpeg',
          0.9 // 90% quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load HEIF image. Browser may not support HEIF format.'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(heifFile);
  });
}

/**
 * Process an image file: convert HEIF to JPEG if needed, then compress if too large
 * @param imageFile - The image file to process
 * @param maxSizeMB - Maximum file size in MB (default: 10MB)
 * @param compressionThresholdMB - Files larger than this will be compressed (default: 5MB)
 * @returns The processed file
 */
export async function processImageFile(
  imageFile: File,
  maxSizeMB: number = 10,
  compressionThresholdMB: number = 5
): Promise<File> {
  let processedFile = imageFile;
  
  // Check if it's a HEIF/HEIC file
  if (imageFile.type === 'image/heif' || 
      imageFile.type === 'image/heic' || 
      imageFile.name.toLowerCase().endsWith('.heif') || 
      imageFile.name.toLowerCase().endsWith('.heic')) {
    try {
      console.log('Converting HEIF/HEIC to JPEG...');
      processedFile = await convertHeifToJpeg(imageFile);
    } catch (error) {
      console.error('HEIF conversion failed:', error);
      throw new Error('Failed to convert HEIF image. Please use JPG, PNG, or WebP format.');
    }
  }
  
  // Compress if needed
  processedFile = await compressImageIfNeeded(processedFile, compressionThresholdMB);
  
  return processedFile;
}