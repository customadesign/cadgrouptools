import { hashPassword, verifyPassword } from '../auth';

describe('auth utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(20);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify a correct password', async () => {
      const password = 'testPassword123';
      const hashedPassword = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword123';
      const hashedPassword = await hashPassword(password);
      
      const isValid = await verifyPassword(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });

    it('should handle empty passwords', async () => {
      const password = '';
      const hashedPassword = await hashPassword('somePassword');
      
      const isValid = await verifyPassword(password, hashedPassword);
      expect(isValid).toBe(false);
    });
  });
});
