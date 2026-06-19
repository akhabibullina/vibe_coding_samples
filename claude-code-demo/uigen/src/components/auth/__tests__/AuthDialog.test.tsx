import { test, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AuthDialog } from "@/components/auth/AuthDialog";

afterEach(() => { cleanup(); });

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ signIn: vi.fn(), signUp: vi.fn(), isLoading: false }),
}));

test("renders sign in form by default", () => {
  render(<AuthDialog open={true} onOpenChange={vi.fn()} />);
  expect(screen.getByText("Welcome back")).toBeDefined();
});

test("renders sign up form when defaultMode is signup", () => {
  render(<AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signup" />);
  expect(screen.getByText("Create an account")).toBeDefined();
});

test("switches to sign up form when Sign up link is clicked", () => {
  render(<AuthDialog open={true} onOpenChange={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: /sign up/i }));
  expect(screen.getByText("Create an account")).toBeDefined();
});

test("switches to sign in form when Sign in link is clicked", () => {
  render(<AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signup" />);
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
  expect(screen.getByText("Welcome back")).toBeDefined();
});

test("does not render dialog content when closed", () => {
  render(<AuthDialog open={false} onOpenChange={vi.fn()} />);
  expect(screen.queryByText("Welcome back")).toBeNull();
});
