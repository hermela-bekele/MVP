import React from 'react';
import Image from 'next/image';

/**
 * Prime EduAI brand mark (public/logo2.png — background keyed to transparent, cropped to
 * content bounds). Single shared component so every "logo position" in the app (login,
 * sidebar, topbar, auth pages) stays in sync.
 */
export function Logo({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <span className={`relative inline-block shrink-0 ${className}`}>
      <Image 
        src="/logo2.png" 
        alt="Prime EduAI" 
        fill 
        sizes="64px" 
        className="object-contain"
        style={{ mixBlendMode: 'multiply' }}
      />
    </span>
  );
}
