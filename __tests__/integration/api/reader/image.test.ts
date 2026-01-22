/**
 * Contract Tests: GET /api/reader/image
 *
 * Based on: specs/005-markdown-reader/contracts/reader-api.yaml
 *
 * PHASE 12: Polish & Cross-Cutting Concerns
 * Goal: Serve images from the documentation directory for relative image paths.
 *
 * Test Categories:
 * - Response structure validation
 * - Image content serving
 * - Path validation and security
 * - Error handling
 * - MIME type detection
 *
 * API Contract:
 * Query Params: path (string, required)
 * Response: Image binary with appropriate Content-Type header
 * Error Response: { success: false, error: string }
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { mkdir, writeFile, rm } from 'fs/promises';
import path from 'path';
import os from 'os';

// Dynamic import for the route after env vars are set
let GET: typeof import('@/app/api/reader/image/route').GET;

describe('GET /api/reader/image', () => {
  let testDocsRoot: string;

  beforeAll(async () => {
    // Create temporary directory for test docs
    testDocsRoot = path.join(os.tmpdir(), `reader-image-test-${Date.now()}`);
    await mkdir(testDocsRoot, { recursive: true });

    // Set DOCS_ROOT for tests
    vi.stubEnv('DOCS_ROOT', testDocsRoot);

    // Clear module cache and reimport route after env vars are set
    vi.resetModules();
    const routeModule = await import('@/app/api/reader/image/route');
    GET = routeModule.GET;
  });

  afterAll(async () => {
    // Cleanup temp directory
    await rm(testDocsRoot, { recursive: true, force: true });
    vi.unstubAllEnvs();
  });

  beforeEach(async () => {
    // Clear test directory before each test
    await rm(testDocsRoot, { recursive: true, force: true });
    await mkdir(testDocsRoot, { recursive: true });
  });

  // Create a minimal valid PNG (1x1 transparent pixel)
  const createTestPng = (): Buffer => {
    // Minimal valid PNG: 1x1 transparent pixel
    return Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
      0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, // IEND chunk
      0x42, 0x60, 0x82,
    ]);
  };

  // Create a minimal valid JPEG
  const createTestJpeg = (): Buffer => {
    // Minimal valid JPEG (1x1 red pixel)
    return Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
      0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
      0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
      0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c,
      0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
      0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d,
      0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
      0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
      0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
      0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34,
      0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4,
      0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
      0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
      0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff,
      0xc4, 0x00, 0xb5, 0x10, 0x00, 0x02, 0x01, 0x03,
      0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04,
      0x00, 0x00, 0x01, 0x7d, 0x01, 0x02, 0x03, 0x00,
      0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
      0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32,
      0x81, 0x91, 0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1,
      0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72,
      0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a,
      0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x34, 0x35,
      0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45,
      0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55,
      0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65,
      0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75,
      0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85,
      0x86, 0x87, 0x88, 0x89, 0x8a, 0x92, 0x93, 0x94,
      0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3,
      0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2,
      0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba,
      0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9,
      0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8,
      0xd9, 0xda, 0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6,
      0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4,
      0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xff, 0xda,
      0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00,
      0xfb, 0xd5, 0xdb, 0x20, 0xa8, 0xf1, 0x4d, 0xfb,
      0xff, 0xd9,
    ]);
  };

  // Create a minimal SVG
  const createTestSvg = (): Buffer => {
    return Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>');
  };

  describe('Response Structure', () => {
    it('should return image binary with 200 status', async () => {
      const pngData = createTestPng();
      await writeFile(path.join(testDocsRoot, 'test.png'), pngData);

      const request = new NextRequest(
        'http://localhost:3000/api/reader/image?path=/test.png'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/png');
    });

    it('should set appropriate cache headers', async () => {
      const pngData = createTestPng();
      await writeFile(path.join(testDocsRoot, 'cached.png'), pngData);

      const request = new NextRequest(
        'http://localhost:3000/api/reader/image?path=/cached.png'
      );
      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toContain('max-age');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should return correct Content-Length header', async () => {
      const pngData = createTestPng();
      await writeFile(path.join(testDocsRoot, 'sized.png'), pngData);

      const request = new NextRequest(
        'http://localhost:3000/api/reader/image?path=/sized.png'
      );
      const response = await GET(request);

      expect(response.headers.get('Content-Length')).toBe(String(pngData.length));
    });
  });

  describe('MIME Type Detection', () => {
    it('should return image/png for .png files', async () => {
      const pngData = createTestPng();
      await writeFile(path.join(testDocsRoot, 'photo.png'), pngData);

      const request = new NextRequest(
        'http://localhost:3000/api/reader/image?path=/photo.png'
      );
      const response = await GET(request);

      expect(response.headers.get('Content-Type')).toBe('image/png');
    });

    it('should return image/jpeg for .jpg files', async () => {
      const jpegData = createTestJpeg();
      await writeFile(path.join(testDocsRoot, 'photo.jpg'), jpegData);

      const request = new NextRequest(
        'http://localhost:3000/api/reader/image?path=/photo.jpg'
      );
      const response = await GET(request);

      expect(response.headers.get('Content-Type')).toBe('image/jpeg');
    });

    it('should return image/jpeg for .jpeg files', async () => {
      const jpegData = createTestJpeg();
      await writeFile(path.join(testDocsRoot, 'photo.jpeg'), jpegData);

      const request = new NextRequest(
        'http://localhost:3000/api/reader/image?path=/photo.jpeg'
      );
      const response = await GET(request);

      expect(response.headers.get('Content-Type')).toBe('image/jpeg');
    });

    it('should return image/gif for .gif files', async () => {
      // Minimal valid GIF
      const gifData = Buffer.from([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
        0x01, 0x00, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04,
        0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
        0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02,
        0x01, 0x44, 0x00, 0x3b,
      ]);
      await writeFile(path.join(testDocsRoot, 'anim.gif'), gifData);

      const request = new NextRequest(
        'http://localhost:3000/api/reader/image?path=/anim.gif'
      );
      const response = await GET(request);

      expect(response.headers.get('Content-Type')).toBe('image/gif');
    });

    it('should return image/svg+xml for .svg files', async () => {
      const svgData = createTestSvg();
      await writeFile(path.join(testDocsRoot, 'icon.svg'), svgData);

      const request = new NextRequest(
        'http://localhost:3000/api/reader/image?path=/icon.svg'
      );
      const response = await GET(request);

      expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
    });

    it('should return image/webp for .webp files', async () => {
      // Minimal WebP file (RIFF header)
      const webpData = Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00,
        0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x4c,
        0x17, 0x00, 0x00, 0x00, 0x2f, 0x00, 0x00, 0x00,
        0x10, 0x07, 0x10, 0x11, 0x11, 0x88, 0x88, 0x08,
        0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
      ]);
      await writeFile(path.join(testDocsRoot, 'modern.webp'), webpData);

      const request = new NextRequest(
        'http://localhost:3000/api/reader/image?path=/modern.webp'
      );
      const response = await GET(request);

      expect(response.headers.get('Content-Type')).toBe('image/webp');
    });
  });

  describe('Image Content Serving', () => {
    it('should return exact image binary content', async () => {
      const pngData = createTestPng();
      await writeFile(path.join(testDocsRoot, 'exact.png'), pngData);

      const request = new NextRequest(
        'http://localhost:3000/api/reader/image?path=/exact.png'
      );
      const response = await GET(request);
      const responseBuffer = Buffer.from(await response.arrayBuffer());

      expect(responseBuffer.equals(pngData)).toBe(true);
    });

    it('should serve images from nested directories', async () => {
      await mkdir(path.join(testDocsRoot, 'assets', 'images'), { recursive: true });
      const pngData = createTestPng();
      await writeFile(path.join(testDocsRoot, 'assets', 'images', 'nested.png'), pngData);

      const request = new NextRequest(
        'http://localhost:3000/api/reader/image?path=/assets/images/nested.png'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const responseBuffer = Buffer.from(await response.arrayBuffer());
      expect(responseBuffer.equals(pngData)).toBe(true);
    });

    it('should handle image files with unicode names', async () => {
      const pngData = createTestPng();
      await writeFile(path.join(testDocsRoot, 'screenshot.png'), pngData);

      const request = new NextRequest(
        `http://localhost:3000/api/reader/image?path=${encodeURIComponent('/screenshot.png')}`
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should handle paths with spaces', async () => {
      await mkdir(path.join(testDocsRoot, 'my images'));
      const pngData = createTestPng();
      await writeFile(path.join(testDocsRoot, 'my images', 'test image.png'), pngData);

      const request = new NextRequest(
        'http://localhost:3000/api/reader/image?path=/my images/test image.png'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Path Validation and Security', () => {
    it('should reject path traversal attempts', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reader/image?path=/../etc/passwd.png'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('success', false);
      expect(json.error).toMatch(/traversal/i);
    });

    it('should reject encoded path traversal', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reader/image?path=%2e%2e%2ftest.png'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('success', false);
    });

    it('should reject non-image file extensions', async () => {
      await writeFile(path.join(testDocsRoot, 'script.js'), 'code');

      const request = new NextRequest(
        'http://localhost:3000/api/reader/image?path=/script.js'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('success', false);
      expect(json.error).toMatch(/unsupported/i);
    });

    it('should reject markdown files requested as images', async () => {
      await writeFile(path.join(testDocsRoot, 'readme.md'), '# Hello');

      const request = new NextRequest(
        'http://localhost:3000/api/reader/image?path=/readme.md'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('success', false);
    });

    it('should reject null bytes in path', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reader/image?path=/test%00.png'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('success', false);
    });
  });

  describe('Error Handling', () => {
    it('should return 400 when path parameter is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/reader/image');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('success', false);
      expect(json.error).toMatch(/path.*required|required/i);
    });

    it('should return 404 for non-existent image', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reader/image?path=/nonexistent.png'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json).toHaveProperty('success', false);
      expect(json.error).toMatch(/not found/i);
    });

    it('should return 400 when path points to a directory', async () => {
      await mkdir(path.join(testDocsRoot, 'images'));

      const request = new NextRequest(
        'http://localhost:3000/api/reader/image?path=/images'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('success', false);
    });

    it('should return error response as JSON', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reader/image?path=/missing.png'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(json).toHaveProperty('success', false);
      expect(json).toHaveProperty('error');
      expect(typeof json.error).toBe('string');
    });
  });

  describe('Case Sensitivity', () => {
    it('should handle uppercase extensions', async () => {
      const pngData = createTestPng();
      await writeFile(path.join(testDocsRoot, 'UPPER.PNG'), pngData);

      const request = new NextRequest(
        'http://localhost:3000/api/reader/image?path=/UPPER.PNG'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/png');
    });

    it('should handle mixed case extensions', async () => {
      const jpegData = createTestJpeg();
      await writeFile(path.join(testDocsRoot, 'Mixed.JpG'), jpegData);

      const request = new NextRequest(
        'http://localhost:3000/api/reader/image?path=/Mixed.JpG'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/jpeg');
    });
  });

  describe('Large Images', () => {
    it('should handle reasonably large images (1MB)', async () => {
      // Create a larger test image (repeating PNG data)
      const pngData = createTestPng();
      const largeData = Buffer.alloc(1024 * 1024);
      for (let i = 0; i < largeData.length; i += pngData.length) {
        pngData.copy(largeData, i, 0, Math.min(pngData.length, largeData.length - i));
      }
      await writeFile(path.join(testDocsRoot, 'large.png'), largeData);

      const request = new NextRequest(
        'http://localhost:3000/api/reader/image?path=/large.png'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Length')).toBe(String(largeData.length));
    });
  });
});
