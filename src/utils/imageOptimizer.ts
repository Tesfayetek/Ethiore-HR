/**
 * Ethiopian Reinsurance S.C. HRMS
 * Client-Side Employee Profile Photo Optimizer
 *
 * Implements strict format validation, magic byte checking,
 * automatic square center-cropping, 300x300 resizing, and WebP compression.
 */

export interface OptimizedImageResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  size: number; // in bytes
  mimeType: string;
  format: 'webp' | 'jpeg';
  originalSize: number;
  compressionRatio: number;
}

export const PHOTO_LIMITS = {
  MAX_ORIGINAL_SIZE_BYTES: 2 * 1024 * 1024, // 2 MB
  MAX_PROCESSED_SIZE_BYTES: 200 * 1024, // 200 KB
  OUTPUT_DIMENSION: 300, // 300 x 300 px
  TARGET_QUALITY: 0.85,
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
};

/**
 * Validates magic bytes to ensure file is genuinely a supported image
 */
async function validateImageMagicBytes(file: File): Promise<{ valid: boolean; detectedType?: string }> {
  try {
    const buffer = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // JPEG: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return { valid: true, detectedType: 'image/jpeg' };
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return { valid: true, detectedType: 'image/png' };
    }

    // WebP: RIFF (52 49 46 46) .... WEBP (57 45 42 50)
    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return { valid: true, detectedType: 'image/webp' };
    }

    return { valid: false };
  } catch (e) {
    return { valid: false };
  }
}

/**
 * Optimizes an uploaded employee photo:
 * 1. Validates file format and size (< 2 MB)
 * 2. Checks magic bytes for security
 * 3. Crops to square from center
 * 4. Resizes to 300x300 px
 * 5. Compresses to WebP (< 200 KB)
 */
export async function optimizeEmployeePhoto(file: File): Promise<OptimizedImageResult> {
  // Step 1: Validate file existence
  if (!file) {
    throw new Error('No photo file selected.');
  }

  // Step 2: Validate original file size (Max 2 MB)
  if (file.size > PHOTO_LIMITS.MAX_ORIGINAL_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(
      `Photo file size (${sizeMb} MB) exceeds the 2 MB maximum limit. Please select a photo under 2 MB.`
    );
  }

  // Step 3: Validate declared MIME type and file extension
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  const hasValidExt = PHOTO_LIMITS.ALLOWED_EXTENSIONS.includes(ext);
  const hasValidMime = PHOTO_LIMITS.ALLOWED_MIME_TYPES.includes(file.type.toLowerCase());

  if (!hasValidExt && !hasValidMime) {
    throw new Error(
      'Invalid file format. Only JPG, JPEG, PNG, and WebP image files are accepted.'
    );
  }

  // Step 4: Validate magic bytes to verify true image contents
  const magicCheck = await validateImageMagicBytes(file);
  if (!magicCheck.valid) {
    throw new Error(
      'The uploaded file does not contain valid image data. Only verified JPG, PNG, and WebP images are allowed.'
    );
  }

  // Step 5: Load image into memory
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to decode image data. The file may be corrupted.'));
    };
    image.src = objectUrl;
  });

  if (img.width < 10 || img.height < 10) {
    throw new Error('Image dimensions are too small for an employee profile photo.');
  }

  // Step 6: Create square center crop canvas (300 x 300 px)
  const targetDimension = PHOTO_LIMITS.OUTPUT_DIMENSION;
  const canvas = document.createElement('canvas');
  canvas.width = targetDimension;
  canvas.height = targetDimension;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D rendering context is not supported in this browser.');
  }

  // High quality resampling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Calculate center square crop
  const cropSize = Math.min(img.width, img.height);
  const sx = (img.width - cropSize) / 2;
  const sy = (img.height - cropSize) / 2;

  // Clear canvas and draw cropped square
  ctx.clearRect(0, 0, targetDimension, targetDimension);
  ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, targetDimension, targetDimension);

  // Step 7: Export as WebP with fallback to JPEG if WebP export is unsupported
  let targetFormat: 'webp' | 'jpeg' = 'webp';
  let mimeType = 'image/webp';

  // Test webp export support
  const testData = canvas.toDataURL('image/webp');
  if (!testData.startsWith('data:image/webp')) {
    targetFormat = 'jpeg';
    mimeType = 'image/jpeg';
  }

  // Helper to convert canvas to blob with adjustable quality
  const toBlobPromise = (quality: number): Promise<Blob> =>
    new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to compress image canvas.'));
        },
        mimeType,
        quality
      );
    });

  let quality = PHOTO_LIMITS.TARGET_QUALITY;
  let compressedBlob = await toBlobPromise(quality);

  // If compressed blob exceeds 200 KB, iteratively reduce quality
  while (compressedBlob.size > PHOTO_LIMITS.MAX_PROCESSED_SIZE_BYTES && quality > 0.4) {
    quality -= 0.1;
    compressedBlob = await toBlobPromise(quality);
  }

  if (compressedBlob.size > PHOTO_LIMITS.MAX_PROCESSED_SIZE_BYTES) {
    throw new Error(
      `Unable to compress image below 200 KB (current: ${(compressedBlob.size / 1024).toFixed(1)} KB). Please choose a smaller photo.`
    );
  }

  const dataUrl = canvas.toDataURL(mimeType, quality);
  const compressionRatio = Number(((1 - compressedBlob.size / file.size) * 100).toFixed(1));

  return {
    blob: compressedBlob,
    dataUrl,
    width: targetDimension,
    height: targetDimension,
    size: compressedBlob.size,
    mimeType,
    format: targetFormat,
    originalSize: file.size,
    compressionRatio,
  };
}
