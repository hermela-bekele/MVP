'use client';

import React from 'react';

/**
 * Fixed bottom action bar shared by every dedicated generation page (assessments, weekly
 * plans, lesson notes). Sticks to the bottom of the scrolling content area — via `sticky`,
 * not `fixed`, so it only pins once you scroll past it rather than floating over content —
 * with Cancel/Generate grouped on the left and the primary Submit/Publish action on the
 * right, matching the page's own horizontal padding via matching negative-margin offsets.
 */
export function GeneratorActionBar({
  left,
  right,
}: {
  left: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 -mb-4 border-t border-border/70 bg-background/95 px-4 py-4 backdrop-blur-sm sm:-mx-5 sm:-mb-5 sm:px-5 lg:-mx-4 lg:mb-0 lg:px-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">{left}</div>
        {right && <div className="flex flex-wrap items-center gap-3">{right}</div>}
      </div>
    </div>
  );
}
