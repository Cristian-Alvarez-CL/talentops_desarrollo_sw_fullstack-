import React, { useState } from 'react';
import { AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
  helperText?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  children,
  required,
  helperText
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="form-field">
      <label className="form-label">
        {label}
        {required && <span className="required">*</span>}
        {helperText && (
          <div className="helper-tooltip">
            <HelpCircle size={14} />
            <div className="tooltip-content">{helperText}</div>
          </div>
        )}
      </label>
      
      <div
        className={`field-wrapper ${error ? 'error' : ''} ${isFocused ? 'focused' : ''}`}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        {children}
      </div>
      
      {error && (
        <div className="field-error">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FormField;