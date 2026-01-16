import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { compressImage } from '../../lib/utils/imageCompression';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  onClear?: () => void;
  maxSize: number; // MB
  allowedTypes: string[];
  currentFile?: File | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelect,
  onClear,
  maxSize,
  allowedTypes,
  currentFile
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resetear preview cuando currentFile cambia a null
  useEffect(() => {
    if (!currentFile) {
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [currentFile]);

  const handleFileSelect = async (file: File) => {
    setError(null);

    // Validar tipo de archivo
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de archivo no permitido. Use JPEG, PNG o WebP.');
      return;
    }

    // Validar tamaño
    if (file.size > maxSize * 1024 * 1024) {
      setError(`La imagen no puede exceder ${maxSize}MB`);
      return;
    }

    try {
      setIsCompressing(true);
      
      // Comprimir imagen
      const compressedFile = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8
      });

      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);

      // Pasar archivo comprimido al formulario
      onImageSelect(compressedFile);
    } catch (err) {
      setError('Error al procesar la imagen');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onClear) {
      onClear();
    }
  };

  return (
    <div className="image-uploader">
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(',')}
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        className="hidden"
      />

      {preview ? (
        <div className="image-preview">
          <div className="preview-container">
            <img src={preview} alt="Preview" className="preview-image" />
            <button
              type="button"
              onClick={handleRemove}
              className="remove-btn"
              aria-label="Remove image"
            >
              <X size={20} />
            </button>
          </div>
          <div className="preview-info">
            {isCompressing && (
              <div className="compressing-indicator">
                <div className="spinner" />
                <span>Comprimiendo imagen...</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          className={`upload-area ${isDragging ? 'dragging' : ''} ${error ? 'error' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <div className="upload-content">
            <Upload size={48} className="upload-icon" />
            <div className="upload-text">
              <p className="upload-title">
                {isDragging ? 'Suelta la imagen aquí' : 'Arrastra y suelta una imagen'}
              </p>
              <p className="upload-subtitle">
                o haz clic para seleccionar
              </p>
              <p className="upload-requirements">
                JPG, PNG o WebP • Máximo {maxSize}MB
              </p>
            </div>
          </div>
        </div>
      )}

      {error && <div className="upload-error">{error}</div>}
    </div>
  );
};

export default ImageUploader;