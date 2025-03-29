import React from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'checkbox' | 'select' | 'date';
  value: string | boolean | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  required?: boolean;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  options?: { value: string; label: string }[];
  rows?: number;
  min?: number | string;
  max?: number | string;
}

const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  required = false,
  placeholder = '',
  error,
  disabled = false,
  className = '',
  options = [],
  rows = 3,
  min,
  max,
}) => {
  const fieldClassName = `form-field ${className} ${error ? 'has-error' : ''}`;
  
  const renderField = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            id={id}
            name={id}
            value={value as string}
            onChange={onChange as (e: React.ChangeEvent<HTMLTextAreaElement>) => void}
            required={required}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className="form-textarea"
          />
        );
        
      case 'checkbox':
        return (
          <div className="checkbox-wrapper">
            <input
              type="checkbox"
              id={id}
              name={id}
              checked={Boolean(value)}
              onChange={onChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
              disabled={disabled}
              className="form-checkbox"
            />
            <label htmlFor={id} className="checkbox-label">{label}</label>
          </div>
        );
        
      case 'select':
        return (
          <select
            id={id}
            name={id}
            value={value as string}
            onChange={onChange as (e: React.ChangeEvent<HTMLSelectElement>) => void}
            required={required}
            disabled={disabled}
            className="form-select"
          >
            <option value="">Välj...</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
        
      default:
        return (
          <input
            type={type}
            id={id}
            name={id}
            value={value as string | number}
            onChange={onChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
            required={required}
            placeholder={placeholder}
            disabled={disabled}
            min={min}
            max={max}
            className="form-input"
          />
        );
    }
  };
  
  return (
    <div className={fieldClassName}>
      {type !== 'checkbox' && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && <span className="required-mark">*</span>}
        </label>
      )}
      
      {renderField()}
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default FormField; 