import { useEffect } from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={clsx(
            'relative w-full bg-white rounded-xl shadow-xl animate-scale-in',
            sizes[size],
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-secondary-200">
            <div>
              <h2 className="text-xl font-semibold text-secondary-900">
                {title}
              </h2>
              {description && (
                <p className="mt-1 text-sm text-secondary-500">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

export const ModalActions = ({ children, className }) => (
  <div className={clsx('flex justify-end gap-3 pt-4 border-t border-secondary-200 mt-4', className)}>
    {children}
  </div>
);

export default Modal;
