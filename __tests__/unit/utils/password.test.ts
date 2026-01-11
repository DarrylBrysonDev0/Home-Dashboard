/**
 * Unit tests for password hashing utilities
 *
 * Tests the bcryptjs-based password hashing and verification functions.
 * These utilities are critical for secure authentication (FR-002).
 */

import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/utils/password";

describe("Password Utilities", () => {
  describe("hashPassword", () => {
    it("should hash a password successfully", async () => {
      const password = "TestPassword123";
      const hash = await hashPassword(password);

      // Bcrypt hashes start with $2a$ or $2b$ followed by rounds
      expect(hash).toMatch(/^\$2[ab]\$\d{2}\$/);
      expect(hash.length).toBeGreaterThan(50);
    });

    it("should produce different hashes for the same password (random salt)", async () => {
      const password = "TestPassword123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // Same password should produce different hashes due to random salt
      expect(hash1).not.toBe(hash2);
    });

    it("should handle minimum length passwords", async () => {
      const password = "Pass123!"; // 8 characters (minimum per FR-004)
      const hash = await hashPassword(password);

      expect(hash).toMatch(/^\$2[ab]\$\d{2}\$/);
    });

    it("should handle maximum length passwords (72 bytes)", async () => {
      // bcrypt has 72-byte limit
      const password = "A".repeat(72);
      const hash = await hashPassword(password);

      expect(hash).toMatch(/^\$2[ab]\$\d{2}\$/);
    });

    it("should handle passwords with special characters", async () => {
      const password = "P@ssw0rd!#$%^&*()_+-=[]{}|;:',.<>?/~`";
      const hash = await hashPassword(password);

      expect(hash).toMatch(/^\$2[ab]\$\d{2}\$/);
    });

    it("should handle Unicode characters", async () => {
      const password = "パスワード123"; // Japanese characters
      const hash = await hashPassword(password);

      expect(hash).toMatch(/^\$2[ab]\$\d{2}\$/);
    });
  });

  describe("verifyPassword", () => {
    it("should verify a correct password", async () => {
      const password = "TestPassword123";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it("should reject an incorrect password", async () => {
      const password = "TestPassword123";
      const wrongPassword = "WrongPassword456";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it("should be case-sensitive", async () => {
      const password = "TestPassword123";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword("testpassword123", hash);

      expect(isValid).toBe(false);
    });

    it("should reject password with extra characters", async () => {
      const password = "TestPassword123";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword("TestPassword123!", hash);

      expect(isValid).toBe(false);
    });

    it("should reject password with missing characters", async () => {
      const password = "TestPassword123";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword("TestPassword12", hash);

      expect(isValid).toBe(false);
    });

    it("should handle empty password verification", async () => {
      const password = "TestPassword123";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword("", hash);

      expect(isValid).toBe(false);
    });

    it("should handle verification against invalid hash format", async () => {
      const password = "TestPassword123";
      const invalidHash = "not-a-valid-bcrypt-hash";

      // bcrypt.compare returns false for invalid hashes (doesn't throw)
      const result = await verifyPassword(password, invalidHash);
      expect(result).toBe(false);
    });

    it("should verify passwords with special characters", async () => {
      const password = "P@ssw0rd!#$%";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it("should verify passwords with Unicode characters", async () => {
      const password = "パスワード123";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });
  });

  describe("Security Properties", () => {
    it("should use sufficient salt rounds (detectable via hash timing)", async () => {
      const password = "TestPassword123";
      const startTime = Date.now();
      await hashPassword(password);
      const duration = Date.now() - startTime;

      // 12 salt rounds should take at least 50ms (usually ~100ms)
      // This ensures we're not using insecure low round counts
      expect(duration).toBeGreaterThan(50);
    });

    it("should handle concurrent hashing operations", async () => {
      const password = "TestPassword123";

      // Hash multiple passwords concurrently
      const hashes = await Promise.all([
        hashPassword(password),
        hashPassword(password),
        hashPassword(password),
      ]);

      // All should succeed and be different
      expect(hashes[0]).toMatch(/^\$2[ab]\$\d{2}\$/);
      expect(hashes[1]).toMatch(/^\$2[ab]\$\d{2}\$/);
      expect(hashes[2]).toMatch(/^\$2[ab]\$\d{2}\$/);
      expect(hashes[0]).not.toBe(hashes[1]);
      expect(hashes[1]).not.toBe(hashes[2]);
    });

    it("should maintain verification correctness under concurrent operations", async () => {
      const password = "TestPassword123";
      const hash = await hashPassword(password);

      // Verify multiple times concurrently
      const results = await Promise.all([
        verifyPassword(password, hash),
        verifyPassword(password, hash),
        verifyPassword("WrongPassword", hash),
      ]);

      expect(results[0]).toBe(true);
      expect(results[1]).toBe(true);
      expect(results[2]).toBe(false);
    });
  });
});
