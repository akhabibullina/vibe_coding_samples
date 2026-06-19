// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";

const { mockVerifySession, mockJson, mockNext } = vi.hoisted(() => ({
  mockVerifySession: vi.fn(),
  mockJson: vi.fn((body: any, init: any) => ({ type: "json", body, init })),
  mockNext: vi.fn(() => ({ type: "next" })),
}));

vi.mock("@/lib/auth", () => ({
  verifySession: mockVerifySession,
}));

vi.mock("next/server", () => ({
  NextResponse: { next: mockNext, json: mockJson },
  NextRequest: class {},
}));

import { middleware } from "@/middleware";

function makeRequest(pathname: string) {
  return {
    nextUrl: { pathname },
    cookies: { get: () => undefined },
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
});

test("allows unauthenticated access to public routes", async () => {
  mockVerifySession.mockResolvedValue(null);
  await middleware(makeRequest("/api/chat"));
  expect(mockJson).not.toHaveBeenCalled();
  expect(mockNext).toHaveBeenCalled();
});

test("returns 401 for unauthenticated access to /api/projects", async () => {
  mockVerifySession.mockResolvedValue(null);
  await middleware(makeRequest("/api/projects"));
  expect(mockJson).toHaveBeenCalledWith(
    { error: "Authentication required" },
    { status: 401 }
  );
});

test("returns 401 for unauthenticated access to /api/filesystem", async () => {
  mockVerifySession.mockResolvedValue(null);
  await middleware(makeRequest("/api/filesystem/some-file"));
  expect(mockJson).toHaveBeenCalledWith(
    { error: "Authentication required" },
    { status: 401 }
  );
});

test("allows authenticated access to /api/projects", async () => {
  mockVerifySession.mockResolvedValue({ userId: "1", email: "a@b.com" });
  await middleware(makeRequest("/api/projects"));
  expect(mockJson).not.toHaveBeenCalled();
  expect(mockNext).toHaveBeenCalled();
});
