/**
 * Currency Formatting Utilities
 * Handles all currency conversions and displays for Saudi Riyal (SAR)
 */

export const SAR_SYMBOL = "﷼"; // Official Saudi Riyal Symbol
export const SAR_CODE = "SAR";
export const DEFAULT_CURRENCY = "SAR";

export interface FormattingOptions {
  symbol?: string;
  decimals?: number;
  showCode?: boolean;
  arabicNumerals?: boolean;
  language?: "en" | "ar";
}

/**
 * Convert Arabic numerals to Western numerals
 */
function toWesternNumerals(str: string): string {
  const arabicNumbers = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  const westernNumbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  
  let result = str;
  arabicNumbers.forEach((arabic, index) => {
    result = result.replace(new RegExp(arabic, "g"), westernNumbers[index]);
  });
  return result;
}

/**
 * Convert Western numerals to Arabic numerals
 */
function toArabicNumerals(str: string): string {
  const arabicNumbers = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  const westernNumbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  
  let result = str;
  westernNumbers.forEach((western, index) => {
    result = result.replace(new RegExp(western, "g"), arabicNumbers[index]);
  });
  return result;
}

/**
 * Format amount as Saudi Riyal (SAR)
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatSAR(
  amount: number,
  options: FormattingOptions = {}
): string {
  const {
    symbol = SAR_SYMBOL,
    decimals = 2,
    showCode = false,
    arabicNumerals = false,
    language = "en",
  } = options;

  if (!amount && amount !== 0) return "-";
  if (isNaN(amount)) return "-";

  // Format the number
  const formatted = new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-SA", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  }).format(Math.abs(amount));

  // Build the result
  let result = `${symbol} ${formatted}`;
  
  if (showCode) {
    result = `${result} ${SAR_CODE}`;
  }

  // Handle negative amounts
  if (amount < 0) {
    result = `-${result}`;
  }

  // Convert to Arabic numerals if requested
  if (arabicNumerals) {
    result = toArabicNumerals(result);
  }

  return result;
}

/**
 * Format as currency with localization
 * @param amount - The amount to format
 * @param language - Language code ("en" or "ar")
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, language: "en" | "ar" = "en"): string {
  return formatSAR(amount, { language, arabicNumerals: language === "ar" });
}

/**
 * Get SAR symbol based on context
 */
export function getSARSymbol(): string {
  return SAR_SYMBOL;
}

/**
 * Parse currency string to number
 * @param value - Currency string to parse
 * @returns Numeric value
 */
export function parseCurrency(value: string | number): number {
  if (typeof value === "number") return value;
  
  // Remove all non-numeric characters except decimal point and minus
  const cleaned = value
    .replace(/[^\d.\-]/g, "")
    .replace(/,/g, "");
  
  const parsed = parseFloat(toWesternNumerals(cleaned));
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format price range
 * @param minPrice - Minimum price
 * @param maxPrice - Maximum price
 * @param language - Language code
 * @returns Formatted price range
 */
export function formatPriceRange(
  minPrice: number,
  maxPrice: number,
  language: "en" | "ar" = "en"
): string {
  const separator = language === "ar" ? "إلى" : "to";
  return `${formatCurrency(minPrice, language)} ${separator} ${formatCurrency(maxPrice, language)}`;
}

/**
 * Calculate tax amount
 * @param amount - Base amount
 * @param taxRate - Tax rate as percentage (e.g., 15 for 15%)
 * @returns Tax amount
 */
export function calculateTax(amount: number, taxRate: number): number {
  return (amount * taxRate) / 100;
}

/**
 * Format amount with tax
 * @param amount - Base amount
 * @param taxRate - Tax rate as percentage
 * @param language - Language code
 * @returns Formatted string showing amount + tax
 */
export function formatWithTax(
  amount: number,
  taxRate: number,
  language: "en" | "ar" = "en"
): string {
  const tax = calculateTax(amount, taxRate);
  const total = amount + tax;
  
  if (language === "ar") {
    return `${formatCurrency(amount, "ar")} + ضريبة ${formatCurrency(tax, "ar")} = ${formatCurrency(total, "ar")}`;
  }
  
  return `${formatCurrency(amount, "en")} + tax ${formatCurrency(tax, "en")} = ${formatCurrency(total, "en")}`;
}
