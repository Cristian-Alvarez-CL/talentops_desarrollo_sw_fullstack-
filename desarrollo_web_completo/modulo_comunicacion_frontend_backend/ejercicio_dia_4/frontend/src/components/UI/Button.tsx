import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
}

const Button: React.FC<ButtonProps> = ({
  children,
  isLoading = false,
  icon,
  variant = 'primary',
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'btn flex items-center justify-center gap-2 transition-all duration-200';
  
  const variantClasses = {
    primary: 'btn-primary bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'btn-secondary bg-gray-200 hover:bg-gray-300 text-gray-800',
    outline: 'bg-transparent border border-gray-300 hover:bg-gray-50 text-gray-700'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className} ${
        disabled || isLoading ? 'opacity-60 cursor-not-allowed' : ''
      }`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" size={20} />
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  );
};

export default Button;