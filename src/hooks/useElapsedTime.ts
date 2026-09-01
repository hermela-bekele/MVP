import { useEffect, useRef, useState } from 'react';

/**
 * Ticks up an elapsed-seconds counter while `active` is true, resets to 0 whenever `active`
 * goes from false -> true. Used on the dedicated generation pages so a long-running request
 * (annual plans can take 60-150s+ across several batches) always shows the user *something*
 * moving — "Generating... 47s elapsed" — even during a stretch with no discrete batch/step
 * update, instead of a static spinner that gives no signal the request hasn't silently hung.
 */
export function useElapsedTime(active: boolean): number {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      startRef.current = null;
      return;
    }
    startRef.current = Date.now();
    setElapsed(0);
    const id = window.setInterval(() => {
      if (startRef.current !== null) {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [active]);

  return elapsed;
}

export function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}
