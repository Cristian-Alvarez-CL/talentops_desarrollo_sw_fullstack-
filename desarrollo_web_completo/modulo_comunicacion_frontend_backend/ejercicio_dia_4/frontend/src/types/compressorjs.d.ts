declare module 'compressorjs' {
  interface CompressorOptions {
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
    width?: number;
    height?: number;
    resize?: 'contain' | 'cover' | 'none';
    mimeType?: string;
    convertSize?: number;
    success: (result: File | Blob) => void;
    error: (error: Error) => void;
  }

  class Compressor {
    constructor(file: File | Blob, options: CompressorOptions);
  }

  export default Compressor;
}