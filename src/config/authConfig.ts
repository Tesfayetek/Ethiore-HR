/**
 * Ethiopian Reinsurance S.C. (EthioRe) HRMS
 * Centralized Authentication & Email Authorization Allowlist Configuration
 *
 * Rules:
 * 1. Default allowed corporate domain: @ethiopianre.com
 * 2. Explicit authorized external email exceptions:
 *    - contactesfaye@gmail.com
 *    - tesfayeteklufeyissa@gmail.com
 * 3. All other external/personal domains (including other Gmail accounts) remain strictly blocked.
 * 4. Matching is case-insensitive.
 */

export const AUTH_CONFIG = {
  // Official Ethiopian Reinsurance corporate email domain
  allowedCorporateDomain: '@ethiopianre.com',
  corporateDomainOnly: 'ethiopianre.com',

  // The TWO explicit external email exceptions authorized by management
  authorizedExternalEmailExceptions: [
    'contactesfaye@gmail.com',
    'tesfayeteklufeyissa@gmail.com',
  ] as const,

  // Standard rejection error message specified by the prompt
  unauthorizedDomainErrorMessage: 'Please use your Ethiopian Reinsurance corporate email address.',

  /**
   * Validate whether an email address is authorized for employee account registration.
   */
  validateRegistrationEmail(email: string): { isValid: boolean; normalizedEmail: string; message?: string } {
    if (!email || typeof email !== 'string') {
      return {
        isValid: false,
        normalizedEmail: '',
        message: 'A valid email address is required.',
      };
    }

    const trimmed = email.trim().toLowerCase();

    // Check corporate domain
    if (trimmed.endsWith(AUTH_CONFIG.allowedCorporateDomain)) {
      return {
        isValid: true,
        normalizedEmail: trimmed,
      };
    }

    // Check exact match with the two explicit exceptions
    const isException = AUTH_CONFIG.authorizedExternalEmailExceptions.some(
      (exceptionEmail) => exceptionEmail.toLowerCase() === trimmed
    );

    if (isException) {
      return {
        isValid: true,
        normalizedEmail: trimmed,
      };
    }

    // Unauthorized external domain or email
    return {
      isValid: false,
      normalizedEmail: trimmed,
      message: AUTH_CONFIG.unauthorizedDomainErrorMessage,
    };
  },
};
