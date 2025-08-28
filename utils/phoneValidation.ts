/**
 * Phone Number Validation and Formatting Utilities
 * Handles Kenyan phone number formats for M-Pesa integration
 */

export interface PhoneValidationResult {
  isValid: boolean;
  formatted: string;
  original: string;
  error?: string;
}

/**
 * Format phone number to Kenyan M-Pesa format (254XXXXXXXXX)
 * Accepts various input formats:
 * - 0712345678 (Kenyan local format)
 * - 712345678 (without leading zero)
 * - 254712345678 (international format)
 * - +254712345678 (with country code prefix)
 */
export const formatKenyanPhoneNumber = (phone: string): PhoneValidationResult => {
  const original = phone;
  
  if (!phone || typeof phone !== 'string') {
    return {
      isValid: false,
      formatted: '',
      original,
      error: 'Phone number is required',
    };
  }

  // Remove all non-digit characters except the leading +
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  
  // Remove the + sign and get digits only
  const digitsOnly = cleanPhone.replace(/\+/g, '');
  
  // Handle different formats
  if (digitsOnly.length === 9 && (digitsOnly.startsWith('7') || digitsOnly.startsWith('1'))) {
    // Format: 7XXXXXXXX or 1XXXXXXXX -> 254XXXXXXXX
    const formatted = `254${digitsOnly}`;
    return {
      isValid: isValidKenyanNumber(formatted),
      formatted,
      original,
    };
  } else if (digitsOnly.length === 10 && (digitsOnly.startsWith('07') || digitsOnly.startsWith('01'))) {
    // Format: 07XXXXXXXX or 01XXXXXXXX -> 254XXXXXXXX  
    const formatted = `254${digitsOnly.substring(1)}`;
    return {
      isValid: isValidKenyanNumber(formatted),
      formatted,
      original,
    };
  } else if (digitsOnly.length === 12 && digitsOnly.startsWith('254')) {
    // Format: 254XXXXXXXXX -> already correct
    return {
      isValid: isValidKenyanNumber(digitsOnly),
      formatted: digitsOnly,
      original,
    };
  } else if (cleanPhone.startsWith('+254') && digitsOnly.length === 12) {
    // Format: +254XXXXXXXXX -> 254XXXXXXXXX
    const formatted = digitsOnly;
    return {
      isValid: isValidKenyanNumber(formatted),
      formatted,
      original,
    };
  }
  
  return {
    isValid: false,
    formatted: phone,
    original,
    error: 'Invalid phone number format. Please enter a valid Kenyan mobile number (e.g., 0712345678, 0112345678, 712345678, or 254712345678)',
  };
};

/**
 * Validate if a phone number is a valid Kenyan mobile number
 */
const isValidKenyanNumber = (phone: string): boolean => {
  // Must be exactly 12 digits starting with 254
  if (!/^254\d{9}$/.test(phone)) {
    return false;
  }
  
  // Check if it's a valid Kenyan mobile network prefix
  // Updated based on actual Kenyan mobile network prefixes
  const prefix = phone.substring(3, 5); // Get the first two digits after 254
  const validPrefixes = [
    // Safaricom prefixes
    '70', '71', '72', '73', '74', '75', '76', '77', '78', '79',
    
    // Airtel Kenya prefixes  
    '73', '78', '10', '11', '12', '13', '14', '15',
    
    // Telkom Kenya (Orange) prefixes
    '77', '76',
    
    // Additional documented Kenyan mobile prefixes
    '01', // Landline/Mobile hybrid numbers that can receive M-Pesa
    '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', // Some special mobile services
  ];
  
  return validPrefixes.includes(prefix);
};

/**
 * Format phone number for display (user-friendly format)
 */
export const formatPhoneForDisplay = (phone: string): string => {
  const result = formatKenyanPhoneNumber(phone);
  if (!result.isValid) {
    return phone; // Return original if invalid
  }
  
  const formatted = result.formatted;
  // Format as: +254 712 345 678
  return `+${formatted.substring(0, 3)} ${formatted.substring(3, 6)} ${formatted.substring(6, 9)} ${formatted.substring(9)}`;
};

/**
 * Validate phone number and return user-friendly error message
 */
export const validatePhoneNumber = (phone: string): { isValid: boolean; message?: string } => {
  const result = formatKenyanPhoneNumber(phone);
  
  if (result.isValid) {
    return { isValid: true };
  }
  
  if (result.error) {
    return { isValid: false, message: result.error };
  }
  
  // Provide specific error messages based on the input
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length === 0) {
    return { isValid: false, message: 'Please enter a phone number' };
  } else if (digitsOnly.length < 9) {
    return { isValid: false, message: 'Phone number is too short' };
  } else if (digitsOnly.length > 12) {
    return { isValid: false, message: 'Phone number is too long' };
  } else if (!digitsOnly.startsWith('7') && !digitsOnly.startsWith('1') && !digitsOnly.startsWith('07') && !digitsOnly.startsWith('01') && !digitsOnly.startsWith('254')) {
    return { isValid: false, message: 'Please enter a valid Kenyan mobile number starting with 07, 01, 7, 1, or 254' };
  }
  
  return { isValid: false, message: 'Invalid phone number format' };
};

/**
 * Get example phone number formats for user guidance
 */
export const getPhoneNumberExamples = (): string[] => {
  return [
    '0712345678',   // Safaricom
    '0112345678',   // Airtel
    '712345678',    // Safaricom without zero
    '112345678',    // Airtel without zero
    '254712345678', // International
    '+254112345678', // International Airtel
  ];
};

// Export commonly used validation function
export const isValidKenyanPhone = (phone: string): boolean => {
  return formatKenyanPhoneNumber(phone).isValid;
};
