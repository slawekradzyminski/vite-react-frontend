import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, within } from '@testing-library/react';
import { ToastProvider } from './ToastProvider';
import { useToast } from '../../hooks/useToast';
import { MemoryRouter } from 'react-router-dom';

// Create a test component that uses the toast hook
function TestComponent() {
  const { toast } = useToast();
  
  return (
    <div>
      <button 
        onClick={() => toast({ title: 'Test Title', description: 'Test Description' })}
        data-testid="show-toast-button"
      >
        Show Toast
      </button>
      <button 
        onClick={() => toast({ description: 'Error message', variant: 'error' })}
        data-testid="show-error-toast-button"
      >
        Show Error Toast
      </button>
    </div>
  );
}

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });
  
  // given
  it('renders children correctly', () => {
    // when
    render(
      <MemoryRouter>
        <ToastProvider>
          <div data-testid="test-child">Test Child</div>
        </ToastProvider>
      </MemoryRouter>
    );
    
    // then
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByTestId('toast-viewport')).toBeInTheDocument();
  });

  // given
  it('shows toast when triggered from child component', () => {
    // when
    render(
      <MemoryRouter>
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      </MemoryRouter>
    );
    
    // Click button to show a toast
    const button = screen.getByTestId('show-toast-button');
    act(() => {
      button.click();
    });
    
    // then
    const viewport = screen.getByTestId('toast-viewport');
    const toastElements = within(viewport).getAllByRole('status');
    expect(toastElements.length).toBeGreaterThan(0);
    
    const toastTitle = screen.getByTestId('toast-title');
    const toastDescription = screen.getByTestId('toast-description');
    expect(toastTitle).toHaveTextContent('Test Title');
    expect(toastDescription).toHaveTextContent('Test Description');
  });

  // given
  it('shows variant toast with appropriate styling', () => {
    // when
    render(
      <MemoryRouter>
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      </MemoryRouter>
    );
    
    // Click button to show an error toast
    const button = screen.getByTestId('show-error-toast-button');
    act(() => {
      button.click();
    });
    
    // then
    const viewport = screen.getByTestId('toast-viewport');
    const toastElements = within(viewport).getAllByRole('status');
    expect(toastElements.length).toBeGreaterThan(0);
    
    // Check that the toast has the error class
    const toastElement = toastElements[0];
    expect(toastElement.className).toContain('error');
    expect(screen.getByTestId('toast-description')).toHaveTextContent('Error message');
  });

  // given
  it('handles toast lifecycle', () => {
    // when
    render(
      <MemoryRouter>
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      </MemoryRouter>
    );
    
    // Initially no toast elements
    const viewport = screen.getByTestId('toast-viewport');
    expect(within(viewport).queryAllByRole('status')).toHaveLength(0);
    
    // Show toast
    const button = screen.getByTestId('show-toast-button');
    act(() => {
      button.click();
    });
    
    // Verify toast is shown
    expect(within(viewport).queryAllByRole('status')).toHaveLength(1);
    const toastTitle = screen.getByTestId('toast-title');
    expect(toastTitle).toBeInTheDocument();
    expect(toastTitle).toHaveTextContent('Test Title');
    
    // This test just verifies that the toast appears correctly
    // We don't test automatic dismissal as it depends on animations
    // and would make the test brittle
  });
}); 