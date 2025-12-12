/**
 * Generate unique customer ID: YYMM + 5 random digits
 * Example: 251212345 (25年12月 + 12345)
 */
export function generateCustomerId(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Month (01-12)
  
  // Generate 5 random digits
  const randomDigits = Math.floor(10000 + Math.random() * 90000).toString();
  
  return `${year}${month}${randomDigits}`;
}

/**
 * Validate customer ID format
 */
export function isValidCustomerId(customerId: string): boolean {
  return /^\d{9}$/.test(customerId); // 9 digits: YYMM + 5 digits
}




