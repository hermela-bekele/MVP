'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'bottom-right';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: TooltipPosition;
  /** Delay in milliseconds before showing */
  delay?: number;
  className?: string;
  /** Additional classes for the tooltip bubble */
  tooltipClassName?: string;
  disabled?: boolean;
}

const positionStyles: Record<TooltipPosition, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  // Opens downward like `bottom` (same direction as every other card in a row), but
  // right-edge-aligned instead of centered — for a trigger near the right edge of its
  // container, where a centered bubble would overflow off-screen.
  'bottom-right': 'top-full right-0 mt-2',
};

const arrowStyles: Record<TooltipPosition, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-foreground border-x-transparent border-b-transparent',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-foreground border-x-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-foreground border-y-transparent border-r-transparent',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-foreground border-y-transparent border-l-transparent',
  'bottom-right': 'bottom-full right-4 border-b-foreground border-x-transparent border-t-transparent',
};

const arrowSizes: Record<TooltipPosition, string> = {
  top: 'border-[4px]',
  bottom: 'border-[4px]',
  left: 'border-[4px]',
  right: 'border-[4px]',
  'bottom-right': 'border-[4px]',
};

const enterAnimations: Record<TooltipPosition, string> = {
  top: 'translate-y-1',
  bottom: '-translate-y-1',
  left: 'translate-x-1',
  right: '-translate-x-1',
  'bottom-right': '-translate-y-1',
};

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  delay = 200,
  className = '',
  tooltipClassName = '',
  disabled = false,
}) => {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay, disabled]);

  const hide = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setVisible(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}

      {/* Tooltip bubble */}
      <div
        className={`
          absolute z-50 pointer-events-none
          ${positionStyles[position]}
          transition-all duration-200 ease-out
          ${visible
            ? 'opacity-100 scale-100 translate-x-0 translate-y-0'
            : `opacity-0 scale-95 ${enterAnimations[position]}`
          }
          ${position === 'top' || position === 'bottom' ? '-translate-x-1/2' : ''}
          ${position === 'left' || position === 'right' ? '-translate-y-1/2' : ''}
        `}
        role="tooltip"
        aria-hidden={!visible}
      >
        <div
          className={`
            relative
            px-2.5 py-1.5
            text-xs font-medium
            text-background bg-foreground
            rounded-md
            shadow-lg
            ${tooltipClassName.includes('whitespace-') ? '' : 'whitespace-nowrap'}
            ${tooltipClassName}
          `}
        >
          {content}

          {/* Arrow */}
          <span
            className={`absolute w-0 h-0 ${arrowSizes[position]} ${arrowStyles[position]}`}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
};
