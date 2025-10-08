/**
 * src/utils/currency.js
 * Single place to format Philippine Peso values.
 */
const phpFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

export const formatPHP = (value) => {
  const num = typeof value === 'number' ? value : Number(value || 0);
  return phpFormatter.format(num);
};
