import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

/**
 * PasswordInput - Professional password toggle component
 * Uses react-icons for consistent, scalable icons
 * 
 * @param {string} id - Input field ID
 * @param {string} placeholder - Placeholder text
 * @param {string} value - Current password value
 * @param {function} onChange - Change handler
 * @param {string} className - Additional classes
 * @param {boolean} disabled - Disable input
 * @param {string} autoComplete - Autocomplete attribute
 */
const PasswordInput = ({
  id = 'password',
  placeholder = 'Min. 8 characters',
  value = '',
  onChange,
  className = '',
  disabled = false,
  autoComplete = 'new-password',
  label = 'Password',
  error = '',
  required = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`form-input pr-10 ${className}`}
          style={{ paddingRight: '44px' }}
          aria-label={`${label} ${showPassword ? '(visible)' : '(hidden)'}`}
        />
        
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 transition-colors p-1 flex items-center justify-center"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          tabIndex={-1}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#888888',
            padding: '4px',
            transition: 'color 0.2s ease',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary, #4f46e5)'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#888888'}
        >
          {showPassword ? (
            <FaEyeSlash size={16} aria-hidden="true" />
          ) : (
            <FaEye size={16} aria-hidden="true" />
          )}
        </button>
      </div>
      
      {error && (
        <span className="form-error-msg display: block text-red-500 text-sm mt-1">
          {error}
        </span>
      )}
    </div>
  );
};

export default PasswordInput;
