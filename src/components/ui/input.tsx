'use client';

import React, { useState, useRef, useId } from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** Show a clear button when input has text (for text-like inputs) */
  clearable?: boolean;
  inputSize?: 'sm' | 'md' | 'lg';
  /** Additional wrapper className */
  wrapperClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  success,
  leftIcon,
  rightIcon,
  clearable = false,
  inputSize = 'md',
  className = '',
  wrapperClassName = '',
  type = 'text',
  disabled,
  value,
  defaultValue,
  onChange,
  id,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const helperId = `${inputId}-helper`;
  const [focused, setFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue?.toString() ?? '');
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isControlled = value !== undefined;
  const currentValue = isControlled ? String(value) : internalValue;
  const hasValue = currentValue.length > 0;
  // Native date/time inputs always render their own placeholder (e.g. dd/mm/yyyy) which
  // isn't a real CSS placeholder and can't be hidden, so the label must stay floated up
  // at all times for these types or it visually collides with that native text.
  const isDateLikeType = ['date', 'time', 'datetime-local', 'month', 'week'].includes(type as string);
  const isFloating = focused || hasValue || isDateLikeType;
  const isPassword = type === 'password';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) {
      setInternalValue(e.target.value);
    }
    onChange?.(e);
  };

  const handleClear = () => {
    if (isControlled) {
      const nativeEvent = new Event('input', { bubbles: true });
      Object.defineProperty(nativeEvent, 'target', { value: { value: '' } });
      onChange?.({
        target: { value: '' },
        currentTarget: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>);
    } else {
      setInternalValue('');
    }
    inputRef.current?.focus();
  };

  // Border color based on state
  const borderColor = error
    ? 'border-destructive focus-within:ring-destructive/30'
    : success
    ? 'border-emerald-500 focus-within:ring-emerald-500/30'
    : 'border-border focus-within:border-primary focus-within:ring-ring/20';

  const sizeStyles = {
    sm: 'h-9 text-xs',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base',
  };

  const labelSizeStyles = {
    sm: { floating: 'text-[10px]', resting: 'text-xs' },
    md: { floating: 'text-xs', resting: 'text-sm' },
    lg: { floating: 'text-xs', resting: 'text-base' },
  };

  const showClear = clearable && hasValue && !disabled && !isPassword;
  const hasRightContent = rightIcon || showClear || isPassword;

  return (
    <div className={`w-full ${wrapperClassName}`}>
      <div
        className={`
          relative flex items-center w-full
          bg-card rounded-md border
          ${borderColor}
          focus-within:ring-2
          transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed bg-muted' : ''}
          ${sizeStyles[inputSize]}
        `}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Left icon */}
        {leftIcon && (
          <span className="pl-3 flex-shrink-0 text-muted-foreground [&>svg]:w-4 [&>svg]:h-4">
            {leftIcon}
          </span>
        )}

        {/* Input + floating label container */}
        <div className="relative flex-1 h-full">
          <input
            ref={inputRef}
            id={inputId}
            type={isPassword && showPassword ? 'text' : type}
            className={`
              peer w-full h-full bg-transparent outline-none
              text-foreground placeholder-transparent
              ${leftIcon ? 'pl-2' : 'pl-3'}
              ${hasRightContent ? 'pr-2' : 'pr-3'}
              ${label ? 'pt-3 pb-1' : ''}
              disabled:cursor-not-allowed
              ${className}
            `}
            value={isControlled ? value : internalValue}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={disabled}
            placeholder={label || props.placeholder}
            aria-invalid={!!error}
            aria-describedby={error || success || helperText ? helperId : undefined}
            {...props}
          />

          {/* Floating label */}
          {label && (
            <label
              htmlFor={inputId}
              className={`
                absolute pointer-events-none
                ${leftIcon ? 'left-2' : 'left-3'}
                transition-all duration-200 ease-out
                ${isFloating
                  ? `top-1 ${labelSizeStyles[inputSize].floating} font-medium ${
                      error
                        ? 'text-destructive'
                        : success
                        ? 'text-emerald-500'
                        : focused
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }`
                  : `top-1/2 -translate-y-1/2 ${labelSizeStyles[inputSize].resting} text-muted-foreground`
                }
              `}
            >
              {label}
            </label>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-0.5 pr-1.5 flex-shrink-0">
          {/* Clear button */}
          {showClear && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Clear input"
              tabIndex={-1}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Password toggle */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? (
                // Eye-off icon
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                // Eye icon
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          )}

          {/* Right icon */}
          {rightIcon && (
            <span className="p-1 text-muted-foreground [&>svg]:w-4 [&>svg]:h-4">
              {rightIcon}
            </span>
          )}
        </div>
      </div>

      {/* Helper / Error / Success text */}
      {(error || success || helperText) && (
        <p
          id={helperId}
          className={`mt-1.5 text-xs ${
            error
              ? 'text-destructive'
              : success
              ? 'text-emerald-500'
              : 'text-muted-foreground'
          }`}
        >
          {error || success || helperText}
        </p>
      )}
    </div>
  );
};
