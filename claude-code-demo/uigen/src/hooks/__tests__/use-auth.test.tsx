import { test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSignInAction = vi.fn();
const mockSignUpAction = vi.fn();
const mockGetProjects = vi.fn();
const mockCreateProject = vi.fn();

vi.mock("@/actions", () => ({
  signIn: (...args: any[]) => mockSignInAction(...args),
  signUp: (...args: any[]) => mockSignUpAction(...args),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: () => mockGetProjects(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: (args: any) => mockCreateProject(args),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: () => null,
  clearAnonWork: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test("signIn returns result and redirects to existing project on success", async () => {
  mockSignInAction.mockResolvedValue({ success: true });
  mockGetProjects.mockResolvedValue([{ id: "proj-1" }]);

  const { result } = renderHook(() => useAuth());

  let ret: any;
  await act(async () => {
    ret = await result.current.signIn("a@b.com", "password");
  });

  expect(ret.success).toBe(true);
  expect(mockPush).toHaveBeenCalledWith("/proj-1");
});

test("signIn returns error and does not redirect on failure", async () => {
  mockSignInAction.mockResolvedValue({ success: false, error: "Invalid credentials" });

  const { result } = renderHook(() => useAuth());

  let ret: any;
  await act(async () => {
    ret = await result.current.signIn("a@b.com", "wrong");
  });

  expect(ret.success).toBe(false);
  expect(mockPush).not.toHaveBeenCalled();
});

test("signUp creates new project and redirects when no projects exist", async () => {
  mockSignUpAction.mockResolvedValue({ success: true });
  mockGetProjects.mockResolvedValue([]);
  mockCreateProject.mockResolvedValue({ id: "new-proj" });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signUp("a@b.com", "password");
  });

  expect(mockCreateProject).toHaveBeenCalled();
  expect(mockPush).toHaveBeenCalledWith("/new-proj");
});

test("isLoading is true during signIn and false after", async () => {
  let resolve: (v: any) => void;
  mockSignInAction.mockReturnValue(new Promise((r) => (resolve = r)));
  mockGetProjects.mockResolvedValue([]);
  mockCreateProject.mockResolvedValue({ id: "x" });

  const { result } = renderHook(() => useAuth());

  expect(result.current.isLoading).toBe(false);

  act(() => { result.current.signIn("a@b.com", "pw"); });
  expect(result.current.isLoading).toBe(true);

  await act(async () => { resolve!({ success: false }); });
  expect(result.current.isLoading).toBe(false);
});
