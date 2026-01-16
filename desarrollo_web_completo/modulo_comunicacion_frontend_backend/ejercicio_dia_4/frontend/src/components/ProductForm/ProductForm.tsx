import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, ProductFormData } from '../../lib/validation/productSchema';
import { createProduct } from '../../services/productService';
import ImageUploader from './ImageUploader';
import FormField from './FormField';
import Button from '../UI/Button';
import { AlertCircle, CheckCircle, Upload, RefreshCw } from 'lucide-react';
import './styles.css';


const defaultValues: ProductFormData = {
  name: '',
  description: '',
  price: 0,
  category: '',
  stock: 0,
  sku: '',
  tags: [],
  specifications: {},
  image: undefined
};

const ProductForm: React.FC = () => {
  const [formState, setFormState] = useState({
    isSubmitting: false,
    isSuccess: false,
    serverErrors: [] as Array<{ field?: string; message: string }>,
    progress: 0
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    setValue,
    watch,
    trigger,
    reset,
    setFocus,
    getValues
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    mode: 'onChange',
    defaultValues
  });

  // Efecto para poner foco en el nombre después de éxito
  useEffect(() => {
    if (formState.isSuccess && nameInputRef.current) {
      const timer = setTimeout(() => {
        setFocus('name');
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [formState.isSuccess, setFocus]);

  const resetForm = () => {
    // Resetear el formulario a valores por defecto
    reset(defaultValues);
    
    // Resetear la imagen
    setImageFile(null);
    
    // Resetear el estado del formulario
    setFormState({
      isSubmitting: false,
      isSuccess: false,
      serverErrors: [],
      progress: 0
    });
    
    // Poner foco en el campo de nombre
    setTimeout(() => {
      setFocus('name');
    }, 50);
  };

  const onSubmit = async (data: ProductFormData) => {
    setFormState(prev => ({ ...prev, isSubmitting: true, progress: 0 }));
    
    try {
      // Simular progreso de carga
      const progressInterval = setInterval(() => {
        setFormState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      // Si hay imagen, agregarla a los datos
      const productData = imageFile ? { ...data, image: imageFile } : data;
      
      await createProduct(productData, (progress) => {
        setFormState(prev => ({ ...prev, progress }));
      });

      clearInterval(progressInterval);
      
      setFormState({
        isSubmitting: false,
        isSuccess: true,
        serverErrors: [],
        progress: 100
      });

      // Resetear formulario después de éxito
      setTimeout(() => {
        resetForm();
      }, 2000);
      
    } catch (error: any) {
      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
        serverErrors: error.response?.data?.errors || [{ message: 'Error al crear el producto' }]
      }));
    }
  };

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    setValue('image', file, { shouldValidate: true });
  };

  const handleClearImage = () => {
    setImageFile(null);
    setValue('image', undefined, { shouldValidate: true });
  };

  const handleAddTag = (tag: string) => {
    const currentTags = getValues('tags');
    if (tag && !currentTags.includes(tag)) {
      setValue('tags', [...currentTags, tag], { shouldValidate: true });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = getValues('tags');
    setValue('tags', currentTags.filter(tag => tag !== tagToRemove), { shouldValidate: true });
  };

  const handleClearForm = () => {
    resetForm();
  };

  const categories = [
    'Electrónica',
    'Ropa',
    'Hogar',
    'Deportes',
    'Juguetes',
    'Alimentos',
    'Libros',
    'Belleza'
  ];

  // Obtener valores actuales para renderizado
  const currentTags = watch('tags');

  return (
    <div className="form-container">
      <div className="form-header">
        <h1>Crear Nuevo Producto</h1>
        <p>Complete todos los campos para agregar un nuevo producto al catálogo</p>
      </div>

      {formState.isSuccess && (
        <div className="success-message">
          <CheckCircle size={24} />
          <span>¡Producto creado exitosamente! Limpiando formulario...</span>
        </div>
      )}

      {formState.serverErrors.length > 0 && (
        <div className="server-errors">
          <AlertCircle size={20} />
          <div>
            {formState.serverErrors.map((error, index) => (
              <p key={index}>{error.message}</p>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="product-form">
        <div className="form-grid">
          <FormField
            label="Nombre del Producto"
            error={errors.name?.message}
            required
          >
            <input
              {...register('name', {
                onChange: () => {},
              })}
              ref={(e) => {
                register('name').ref(e);
                (nameInputRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
              }}
              type="text"
              placeholder="Ej: iPhone 15 Pro Max"
              className={`form-input ${errors.name ? 'error' : ''}`}
              autoComplete="off"
            />
          </FormField>

          <FormField
            label="SKU"
            error={errors.sku?.message}
            required
          >
            <input
              {...register('sku')}
              type="text"
              placeholder="Ej: IPH-15-PRO-256"
              className={`form-input ${errors.sku ? 'error' : ''}`}
              autoComplete="off"
            />
          </FormField>

          <FormField
            label="Precio ($)"
            error={errors.price?.message}
            required
          >
            <input
              {...register('price', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className={`form-input ${errors.price ? 'error' : ''}`}
            />
          </FormField>

          <FormField
            label="Stock Disponible"
            error={errors.stock?.message}
            required
          >
            <input
              {...register('stock', { valueAsNumber: true })}
              type="number"
              min="0"
              placeholder="0"
              className={`form-input ${errors.stock ? 'error' : ''}`}
            />
          </FormField>

          <FormField
            label="Categoría"
            error={errors.category?.message}
            required
          >
            <select
              {...register('category')}
              className={`form-input ${errors.category ? 'error' : ''}`}
            >
              <option value="">Seleccionar categoría</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Etiquetas"
            error={errors.tags?.message}
          >
            <div className="tags-container">
              <div className="tags-input">
                <input
                  type="text"
                  placeholder="Agregar etiqueta..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.target as HTMLInputElement;
                      const tagValue = input.value.trim();
                      if (tagValue) {
                        handleAddTag(tagValue);
                        input.value = '';
                      }
                    }
                  }}
                  className="form-input"
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="tag-add-btn"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    const tagValue = input.value.trim();
                    if (tagValue) {
                      handleAddTag(tagValue);
                      input.value = '';
                    }
                  }}
                >
                  +
                </button>
              </div>
              <div className="tags-list">
                {currentTags.map(tag => (
                  <span key={tag} className="tag">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="tag-remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </FormField>

          <FormField
            label="Descripción"
            error={errors.description?.message}
            required
          >
            <textarea
              {...register('description')}
              placeholder="Describa las características principales del producto..."
              className={`form-input ${errors.description ? 'error' : ''}`}
              rows={4}
            />
          </FormField>

          <FormField
            label="Imagen del Producto"
            error={errors.image?.message}
          >
            <div className="image-field">
              <ImageUploader
                onImageSelect={handleImageUpload}
                maxSize={5}
                allowedTypes={['image/jpeg', 'image/png', 'image/webp']}
                currentFile={imageFile}
                onClear={handleClearImage}
              />
              {imageFile && (
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="clear-image-btn"
                >
                  <RefreshCw size={16} />
                  Cambiar imagen
                </button>
              )}
            </div>
          </FormField>
        </div>

        <div className="form-actions">
          <div className="action-buttons">
            <Button
              type="submit"
              disabled={formState.isSubmitting}
              isLoading={formState.isSubmitting}
              icon={<Upload size={20} />}
              variant="primary"
            >
              {formState.isSubmitting ? 'Creando Producto...' : 'Crear Producto'}
            </Button>

            <Button
              type="button"
              onClick={handleClearForm}
              disabled={formState.isSubmitting}
              icon={<RefreshCw size={20} />}
              variant="secondary"
            >
              Limpiar Todo
            </Button>
          </div>

          {formState.isSubmitting && formState.progress > 0 && (
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${formState.progress}%` }}
                />
              </div>
              <span className="progress-text">{formState.progress}%</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProductForm;