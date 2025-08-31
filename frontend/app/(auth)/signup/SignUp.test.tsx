import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignupPage from './page';
import { useRouter } from 'next/navigation';

// Mock the Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the auth store
jest.mock('@/stores/auth.store', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    register: jest.fn(),
    isLoading: false,
    error: null,
    clearError: jest.fn(),
  })),
}));

// Mock Lucide icons to avoid SVG rendering issues in tests
jest.mock('lucide-react', () => ({
  Eye: () => <div>Eye Icon</div>,
  EyeOff: () => <div>EyeOff Icon</div>,
  Loader2: () => <div>Loader Icon</div>,
  Check: () => <div>Check Icon</div>,
  X: () => <div>X Icon</div>,
}));

describe('SignUp Component', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should display validation errors for invalid form submission', async () => {
    render(<SignupPage />);

    // Find and click the submit button without filling any fields
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    // Wait for validation errors to appear
    await waitFor(() => {
      // Check for required field error messages
      expect(screen.getByText(/display name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/household name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/you must agree to the terms and privacy policy/i)).toBeInTheDocument();
    });
  });

  it('should show password validation requirements', async () => {
    render(<SignupPage />);

    // Find the password input
    const passwordInput = screen.getByPlaceholderText(/create a strong password/i);
    
    // Type a weak password
    fireEvent.change(passwordInput, { target: { value: 'weak' } });

    await waitFor(() => {
      // Should show unchecked requirements
      const requirements = screen.getByText(/8\+ characters/i);
      expect(requirements).toBeInTheDocument();
      expect(requirements.parentElement).toHaveClass('text-gray-400');
    });

    // Type a strong password
    fireEvent.change(passwordInput, { target: { value: 'StrongPass123' } });

    await waitFor(() => {
      // Should show checked requirements
      const requirements = screen.getByText(/8\+ characters/i);
      expect(requirements).toBeInTheDocument();
      expect(requirements.parentElement).toHaveClass('text-green-600');
    });
  });

  it('should validate email format', async () => {
    render(<SignupPage />);

    // Find the email input
    const emailInput = screen.getByPlaceholderText(/john@example.com/i);
    
    // Type an invalid email
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it('should toggle password visibility', () => {
    render(<SignupPage />);

    const passwordInput = screen.getByPlaceholderText(/create a strong password/i);
    
    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Find and click the toggle button
    const toggleButton = passwordInput.parentElement?.querySelector('button[type="button"]');
    if (toggleButton) {
      fireEvent.click(toggleButton);
    }

    // Password should now be visible
    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('should have a link to login page', () => {
    render(<SignupPage />);

    const loginLink = screen.getByRole('link', { name: /sign in/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});