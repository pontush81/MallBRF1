/**
 * Formats a number with spaces as thousand separators (e.g. 1 000 000)
 */
export const formatNumberWithSpaces = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

/**
 * Gets text for singular or plural form based on count
 */
export const getPlural = (count: number, singular: string, plural: string): string => {
  return count === 1 ? singular : plural;
};

/**
 * Formats date from ISO string to localized Swedish format
 */
export const formatDateSE = (dateStr: string): string => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

/**
 * Formats currency in SEK
 */
export const formatCurrency = (amount: number): string => {
  return `${formatNumberWithSpaces(amount)} kr`;
}; 