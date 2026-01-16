import Compressor from 'compressorjs';

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export const compressImage = (
  file: File, 
  options: CompressionOptions = {}
): Promise<File> => {
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      quality: options.quality || 0.8,
      maxWidth: options.maxWidth || 1920,
      maxHeight: options.maxHeight || 1080,
      convertSize: 1000000, // Comprimir si es mayor a 1MB
      success(result) {
        resolve(new File([result], file.name, {
          type: result.type,
          lastModified: Date.now(),
        }));
      },
      error(err) {
        reject(err);
      },
    });
  });
};