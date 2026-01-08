import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string; [key: string]: unknown }) => {
    return props;
  },
}));

// Suppress console errors during tests (optional - uncomment if needed)
// const originalError = console.error;
// beforeAll(() => {
//   console.error = (...args) => {
//     if (
//       typeof args[0] === "string" &&
//       args[0].includes("Warning: ReactDOM.render is no longer supported")
//     ) {
//       return;
//     }
//     originalError.call(console, ...args);
//   };
// });
// afterAll(() => {
//   console.error = originalError;
// });

// Global test utilities
export const createMockResponse = <T>(data: T, status = 200) => {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response;
};

// Mock fetch for API tests
export const mockFetch = (response: unknown, status = 200) => {
  global.fetch = vi.fn().mockResolvedValue(createMockResponse(response, status));
};
