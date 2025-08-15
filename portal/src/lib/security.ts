import crypto from 'crypto';

// Input validation helpers
export const validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  url: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  
  phone: (phone: string): boolean => {
    // Basic phone validation - can be enhanced based on requirements
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.length >= 10;
  },
  
  alphanumeric: (str: string): boolean => {
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    return alphanumericRegex.test(str);
  },
  
  sanitizeString: (str: string): string => {
    // Remove potential XSS vectors
    return str
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  },
  
  sanitizeHtml: (html: string): string => {
    // Basic HTML sanitization - use a library like DOMPurify for production
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  },
};

// CSRF token generation and validation
export const csrf = {
  generateToken: (): string => {
    return crypto.randomBytes(32).toString('hex');
  },
  
  validateToken: (token: string, storedToken: string): boolean => {
    if (!token || !storedToken) return false;
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(storedToken)
    );
  },
};

// Password policy
export const passwordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  
  validate: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < passwordPolicy.minLength) {
      errors.push(`Password must be at least ${passwordPolicy.minLength} characters long`);
    }
    
    if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (passwordPolicy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (passwordPolicy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

// File upload security
export const fileUploadSecurity = {
  maxFileSize: 25 * 1024 * 1024, // 25MB
  
  allowedMimeTypes: {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    documents: ['application/pdf', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    all: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  },
  
  validateFile: (file: { size: number; type: string }, category: keyof typeof fileUploadSecurity.allowedMimeTypes = 'all'): { valid: boolean; error?: string } => {
    if (file.size > fileUploadSecurity.maxFileSize) {
      return { valid: false, error: 'File size exceeds maximum allowed size' };
    }
    
    const allowedTypes = fileUploadSecurity.allowedMimeTypes[category];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not allowed' };
    }
    
    return { valid: true };
  },
  
  sanitizeFilename: (filename: string): string => {
    // Remove potentially dangerous characters from filename
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace non-alphanumeric chars with underscore
      .replace(/\.{2,}/g, '.') // Remove multiple dots
      .substring(0, 255); // Limit length
  },
};

// API Security
export const apiSecurity = {
  // Validate MongoDB ObjectId
  isValidObjectId: (id: string): boolean => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  },
  
  // Sanitize query parameters
  sanitizeQueryParams: (params: Record<string, any>): Record<string, any> => {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(params)) {
      // Skip if key contains suspicious characters
      if (!/^[a-zA-Z0-9_]+$/.test(key)) continue;
      
      // Sanitize based on type
      if (typeof value === 'string') {
        sanitized[key] = validators.sanitizeString(value);
      } else if (typeof value === 'number') {
        sanitized[key] = Number(value);
      } else if (typeof value === 'boolean') {
        sanitized[key] = Boolean(value);
      }
    }
    
    return sanitized;
  },
  
  // Prevent NoSQL injection
  sanitizeMongoQuery: (query: any): any => {
    if (typeof query !== 'object' || query === null) return query;
    
    const sanitized: any = {};
    for (const [key, value] of Object.entries(query)) {
      // Skip keys starting with $ (MongoDB operators)
      if (key.startsWith('$')) continue;
      
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = apiSecurity.sanitizeMongoQuery(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  },
};

// Session security
export const sessionSecurity = {
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  
  isSessionValid: (sessionTime: number): boolean => {
    return Date.now() - sessionTime < sessionSecurity.sessionTimeout;
  },
};

// Encryption utilities
export const encryption = {
  algorithm: 'aes-256-gcm',
  
  encrypt: (text: string, key: string): { encrypted: string; iv: string; tag: string } => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(encryption.algorithm, Buffer.from(key, 'hex'), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  },
  
  decrypt: (encryptedData: { encrypted: string; iv: string; tag: string }, key: string): string => {
    const decipher = crypto.createDecipheriv(
      encryption.algorithm,
      Buffer.from(key, 'hex'),
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  },
};
