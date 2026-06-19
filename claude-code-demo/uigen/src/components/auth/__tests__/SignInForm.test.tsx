import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { SignInForm } from "@/components/auth/SignInForm";

const mockSignIn = vi.fn();

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ signIn: mockSignIn, isLoading: false }),
}));

beforeEach(() => { vi.clearAllMocks(); });
afterEach(() => { cleanup(); });

test("renders email and password fields", () => {
  render(<SignInForm />);
  expect(screen.getByLabelText(/email/i)).toBeDefined();
  expect(screen.getByLabelText(/password/i)).toBeDefined();
});

test("calls signIn with entered credentials on submit", async () => {
  mockSignIn.mockResolvedValue({ success: true });
  render(<SignInForm />);

  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "a@b.com" } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "secret" } });
  fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));

  await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith("a@b.com", "secret"));
});

test("shows error message on failed sign in", async () => {
  mockSignIn.mockResolvedValue({ success: false, error: "Invalid credentials" });
  render(<SignInForm />);

  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "a@b.com" } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrong" } });
  fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));

  await waitFor(() => expect(screen.getByText("Invalid credentials")).toBeDefined());
});

test("calls onSuccess callback when sign in succeeds", async () => {
  mockSignIn.mockResolvedValue({ success: true });
  const onSuccess = vi.fn();
  render(<SignInForm onSuccess={onSuccess} />);

  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "a@b.com" } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "secret" } });
  fireEvent.submit(screen.getByRole("button", { name: /sign in/i }));

  await waitFor(() => expect(onSuccess).toHaveBeenCalled());
});
