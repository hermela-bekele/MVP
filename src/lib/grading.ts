/**
 * Ethiopian schools report academic performance as a percentage mark (0-100%),
 * not a US-style 4.0 GPA. `Student.gpa` remains the stored field (0-4.0) so
 * existing sort/threshold logic keeps working, but anything shown to a user
 * should go through this conversion instead of rendering the raw GPA number.
 */
export function gpaToMark(gpa: number): number {
  return Math.round(gpa * 25);
}

export function formatMark(gpa: number): string {
  return `${gpaToMark(gpa)}%`;
}

/** Inverse of gpaToMark — used when a form collects a 0-100 mark for storage in the 0-4 field. */
export function markToGpa(mark: number): number {
  return Math.round((mark / 25) * 100) / 100;
}
