import { test, expect } from 'vitest';
import bcrypt from 'bcrypt';

test('password matches hash', async () => {
  const hash = '$2b$12$7mLcpymYtpUqS9XVC8EKe.3tM591JRZ5qB1KjVizVpIrf8N0MqlKy';
  const password = 'ChangeMe123!';
  const result = await bcrypt.compare(password, hash);
  console.log('Password match result:', result);
  expect(result).toBe(true);
});
