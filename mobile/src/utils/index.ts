/**
 * ComplyWise Mobile - Utility Functions
 */

/**
 * Format date string to Indian Standard Time (IST) presentation.
 */
export function formatDateIST(dateInput: string | Date): string {
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateInput);
  }
}
