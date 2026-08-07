'use client';

import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

export interface DropdownSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
  /** Native tooltip / hover text (defaults to label) */
  title?: string;
}

export interface DropdownSelectProps {
  label?: string;
  options: DropdownSelectOption[];
  helperText?: string;
  error?: string;
  placeholder?: string;
  variant?: 'default' | 'ais';
  size?: 'sm' | 'md';
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  className?: string;
  wrapperClassName?: string;
  /** Max visible rows before the list scrolls */
  maxVisibleItems?: number;
}

function createSelectChangeEvent(value: string, name?: string): React.ChangeEvent<HTMLSelectElement> {
  return {
    target: { value, name } as HTMLSelectElement,
    currentTarget: { value, name } as HTMLSelectElement,
  } as React.ChangeEvent<HTMLSelectElement>;
}

const ITEM_HEIGHT = 36;

type PanelCoords = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

export const DropdownSelect: React.FC<DropdownSelectProps> = ({
  label,
  options,
  helperText,
  error,
  placeholder = 'Select an option',
  variant = 'default',
  size = 'md',
  value,
  defaultValue,
  onChange,
  onValueChange,
  disabled = false,
  required,
  name,
  id,
  className = '',
  wrapperClassName = '',
  maxVisibleItems = 8,
}) => {
  const generatedId = useId();
  const selectId = id || generatedId;
  const helperId = `${selectId}-helper`;
  const listboxId = `${selectId}-listbox`;

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const selectedValue = isControlled ? value : internalValue;

  const [isOpen, setIsOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [panelCoords, setPanelCoords] = useState<PanelCoords | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setPortalReady(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const isAis = variant === 'ais';
  const selectedOption = options.find((opt) => opt.value === selectedValue);
  const displayLabel = selectedOption?.label ?? (selectedValue ? selectedValue : placeholder);
  const hasSelection = Boolean(selectedOption);

  const selectableIndices = options
    .map((opt, i) => (!opt.disabled ? i : -1))
    .filter((i) => i !== -1);

  const emitChange = useCallback(
    (nextValue: string) => {
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
      onChange?.(createSelectChangeEvent(nextValue, name));
    },
    [isControlled, name, onChange, onValueChange],
  );

  const close = useCallback(() => {
    if (!isOpen) return;
    setClosing(true);
    window.setTimeout(() => {
      setIsOpen(false);
      setClosing(false);
      setActiveIndex(-1);
      setPanelCoords(null);
    }, 150);
  }, [isOpen]);

  const updatePanelPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const preferredHeight = Math.min(maxVisibleItems, Math.max(options.length, 1)) * ITEM_HEIGHT + 8;
    const gap = 6;
    const spaceBelow = window.innerHeight - rect.bottom - gap - 8;
    const spaceAbove = rect.top - gap - 8;
    const placeBottom = spaceBelow >= Math.min(preferredHeight, 120) || spaceBelow >= spaceAbove;
    const maxHeight = Math.max(
      ITEM_HEIGHT * 6,
      Math.min(preferredHeight, placeBottom ? spaceBelow : spaceAbove),
    );

    setPanelCoords({
      top: placeBottom ? rect.bottom + gap : Math.max(8, rect.top - gap - maxHeight),
      left: rect.left,
      width: rect.width,
      maxHeight,
    });
  }, [maxVisibleItems, options.length]);

  const open = useCallback(() => {
    if (disabled) return;
    setClosing(false);
    setIsOpen(true);
    const selectedIdx = options.findIndex((opt) => opt.value === selectedValue && !opt.disabled);
    const initial = selectedIdx >= 0 ? selectedIdx : selectableIndices[0] ?? -1;
    setActiveIndex(initial);
    window.requestAnimationFrame(() => {
      updatePanelPosition();
      itemRefs.current[initial]?.focus();
      itemRefs.current[initial]?.scrollIntoView({ block: 'nearest' });
    });
  }, [disabled, options, selectableIndices, selectedValue, updatePanelPosition]);

  const toggle = useCallback(() => {
    if (isOpen) close();
    else open();
  }, [close, isOpen, open]);

  const selectOption = useCallback(
    (opt: DropdownSelectOption) => {
      if (opt.disabled) return;
      emitChange(opt.value);
      close();
      triggerRef.current?.focus();
    },
    [close, emitChange],
  );

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePanelPosition();
  }, [isOpen, options, updatePanelPosition]);

  useEffect(() => {
    if (!isOpen) return;
    const onReposition = () => updatePanelPosition();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [isOpen, updatePanelPosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [close, isOpen]);

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const pos = selectableIndices.indexOf(activeIndex);
        const next = pos < selectableIndices.length - 1 ? selectableIndices[pos + 1] : selectableIndices[0];
        setActiveIndex(next);
        itemRefs.current[next]?.focus();
        itemRefs.current[next]?.scrollIntoView({ block: 'nearest' });
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const pos = selectableIndices.indexOf(activeIndex);
        const prev = pos > 0 ? selectableIndices[pos - 1] : selectableIndices[selectableIndices.length - 1];
        setActiveIndex(prev);
        itemRefs.current[prev]?.focus();
        itemRefs.current[prev]?.scrollIntoView({ block: 'nearest' });
        break;
      }
      case 'Home': {
        e.preventDefault();
        const first = selectableIndices[0];
        if (first !== undefined) {
          setActiveIndex(first);
          itemRefs.current[first]?.focus();
        }
        break;
      }
      case 'End': {
        e.preventDefault();
        const last = selectableIndices[selectableIndices.length - 1];
        if (last !== undefined) {
          setActiveIndex(last);
          itemRefs.current[last]?.focus();
        }
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        if (activeIndex >= 0) selectOption(options[activeIndex]);
        break;
      }
      case 'Escape':
        e.preventDefault();
        close();
        triggerRef.current?.focus();
        break;
      case 'Tab':
        close();
        break;
    }
  };

  const heightClass = size === 'sm' ? 'h-9 text-xs' : 'h-10 text-sm';

  const triggerClasses = isAis
    ? `w-full min-w-0 overflow-hidden ${heightClass} px-3 pr-9 text-left bg-white border rounded-lg transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-ais-primary/20 focus:border-ais-primary/40 ${
        error
          ? 'border-ais-error text-ais-on-surface'
          : isOpen
            ? 'border-ais-primary/40 ring-2 ring-ais-primary/20'
            : 'border-ais-card-border text-ais-on-surface hover:border-ais-primary/30'
      } ${disabled ? 'opacity-50 cursor-not-allowed bg-ais-surface-container-low/50' : ''} ${className}`
    : `w-full min-w-0 overflow-hidden ${heightClass} px-3 pr-9 text-left bg-card border rounded-md shadow-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${
        error
          ? 'border-destructive text-foreground'
          : isOpen
            ? 'border-primary ring-2 ring-ring/20'
            : 'border-border text-foreground hover:border-primary/30'
      } ${disabled ? 'opacity-50 cursor-not-allowed bg-muted' : ''} ${className}`;

  const labelClasses = isAis
    ? 'text-[10px] font-bold uppercase tracking-wider text-ais-on-surface-variant'
    : 'text-xs font-semibold text-muted-foreground uppercase tracking-wider';

  const panelClasses = isAis
    ? 'overflow-hidden rounded-lg border border-ais-card-border bg-white shadow-[0_8px_24px_rgba(15,23,42,0.12)]'
    : 'overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg';

  const listbox =
    isOpen && panelCoords && portalReady
      ? createPortal(
          <div
            ref={panelRef}
            id={listboxId}
            role="listbox"
            aria-labelledby={label ? selectId : undefined}
            className={`fixed z-[120] ${panelClasses} ${closing ? 'animate-dropdown-exit' : 'animate-dropdown-enter'}`}
            style={{
              top: panelCoords.top,
              left: panelCoords.left,
              width: panelCoords.width,
              animationDuration: '150ms',
              animationFillMode: 'forwards',
            }}
          >
            <div className="overflow-y-auto py-1" style={{ maxHeight: panelCoords.maxHeight }}>
              {options.length === 0 ? (
                <p
                  className={`px-3 py-2 text-sm ${isAis ? 'text-ais-on-surface-variant' : 'text-muted-foreground'}`}
                >
                  No options available
                </p>
              ) : (
                options.map((opt, idx) => {
                  const isSelected = opt.value === selectedValue;
                  const isActive = activeIndex === idx;

                  return (
                    <button
                      key={`${opt.value}-${idx}`}
                      ref={(el) => {
                        itemRefs.current[idx] = el;
                      }}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={opt.disabled}
                      tabIndex={-1}
                      onClick={() => selectOption(opt)}
                      onMouseEnter={() => !opt.disabled && setActiveIndex(idx)}
                      className={`
                        flex w-full items-start gap-2 px-3 py-2 text-left transition-colors duration-100
                        focus-visible:outline-none
                        ${size === 'sm' ? 'text-xs' : 'text-sm'}
                        ${opt.disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}
                        ${
                          isAis
                            ? isSelected
                              ? 'bg-ais-primary/10 text-ais-primary font-medium'
                              : isActive
                                ? 'bg-ais-surface-container-low text-ais-on-surface'
                                : 'text-ais-on-surface hover:bg-ais-surface-container-low'
                            : isSelected
                              ? 'bg-primary/10 text-primary font-medium'
                              : isActive
                                ? 'bg-muted text-foreground'
                                : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                        }
                      `}
                    >
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                        {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate" title={opt.title || opt.label}>
                          {opt.label}
                        </span>
                        {opt.description && (
                          <span
                            className={`mt-0.5 block truncate text-[11px] ${
                              isAis ? 'text-ais-on-surface-variant' : 'text-muted-foreground'
                            }`}
                            title={opt.description}
                          >
                            {opt.description}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={`flex w-full flex-col space-y-1 text-left ${wrapperClassName}`} ref={containerRef}>
      {label && (
        <label htmlFor={selectId} className={labelClasses}>
          {label}
          {required && <span className="ml-0.5 text-ais-error">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          ref={triggerRef}
          id={selectId}
          type="button"
          role="combobox"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-invalid={!!error}
          aria-describedby={error || helperText ? helperId : undefined}
          disabled={disabled}
          onClick={toggle}
          onKeyDown={handleTriggerKeyDown}
          className={triggerClasses}
        >
          <span
            title={selectedOption?.title || displayLabel}
            className={`block min-w-0 truncate ${hasSelection ? '' : isAis ? 'text-ais-on-surface-variant' : 'text-muted-foreground'}`}
          >
            {displayLabel}
          </span>
        </button>

        <span
          className={`pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 transition-transform duration-200 ${
            isAis ? 'text-ais-on-surface-variant' : 'text-muted-foreground'
          } ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <ChevronDown className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} strokeWidth={2} />
        </span>
      </div>

      {listbox}

      {name && <input type="hidden" name={name} value={selectedValue} required={required} />}

      {(error || helperText) && (
        <p
          id={helperId}
          className={`text-xxs ${error ? (isAis ? 'text-ais-error' : 'text-destructive') : isAis ? 'text-ais-on-surface-variant' : 'text-muted-foreground'}`}
        >
          {error || helperText}
        </p>
      )}

      <style>{`
        @keyframes dropdown-enter {
          from { opacity: 0; transform: translateY(-4px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dropdown-exit {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(-4px) scale(0.97); }
        }
        .animate-dropdown-enter { animation-name: dropdown-enter; animation-timing-function: cubic-bezier(0.16,1,0.3,1); }
        .animate-dropdown-exit  { animation-name: dropdown-exit;  animation-timing-function: cubic-bezier(0.16,1,0.3,1); }
      `}</style>
    </div>
  );
};
