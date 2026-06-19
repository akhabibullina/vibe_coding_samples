import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { SignUpForm } from "@/components/auth/SignUpForm";

const mockSignUp = vi.fn();

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ signUp: mockSignUp, isLoading: false }),
}));

beforeEach(() => { vi.clearAllMocks(); });
afterEach(() => { cleanup(); });

test("renders email, password, and confirm password fields", () => {
  render(<SignUpForm />);
  expect(screen.getByLabelText(/^email/i)).toBeDefined();
  expect(screen.getByLabelText(/^password/i)).toBeDefined();
  expect(screen.getByLabelText(/confirm password/i)).toBeDefined();
});

test("shows error when passwords do not match", async () => {
  render(<SignUpForm />);

  fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "a@b.com" } });
  fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "password1" } });
  fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "password2" } });
  fireEvent.submit(screen.getByRole("button", { name: /sign up/i }));

  await waitFor(() => expect(screen.getByText("Passwords do not match")).toBeDefined());
  expect(mockSignUp).not.toHaveBeenCalled();
});

test("calls signUp with credentials when passwords match", async () => {
  mockSignUp.mockResolvedValue({ success: true });
  render(<SignUpForm />);

  fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "a@b.com" } });
  fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "password1" } });
  fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "password1" } });
  fireEvent.submit(screen.getByRole("button", { name: /sign up/i }));

  await waitFor(() => expect(mockSignUp).toHaveBeenCalledWith("a@b.com", "password1"));
});

test("shows error message on failed sign up", async () => {
  mockSignUp.mockResolvedValue({ success: false, error: "Email already in use" });
  render(<SignUpForm />);

  fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "a@b.com" } });
  fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "password1" } });
  fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "password1" } });
  fireEvent.submit(screen.getByRole("button", { name: /sign up/i }));

  await waitFor(() => expect(screen.getByText("Email already in use")).toBeDefined());
});

test("calls onSuccess when sign up succeeds", async () => {
  mockSignUp.mockResolvedValue({ success: true });
  const onSuccess = vi.fn();
  render(<SignUpForm onSuccess={onSuccess} />);

  fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "a@b.com" } });
  fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "password1" } });
  fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "password1" } });
  fireEvent.submit(screen.getByRole("button", { name: /sign up/i }));

  await waitFor(() => expect(onSuccess).toHaveBeenCalled());
});
