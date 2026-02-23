import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn(() => new Map()),
  cookies: vi.fn(() => new Map()),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: (fn: any) => fn,
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
  })),
  usePathname: vi.fn(() => "/"),
}));
