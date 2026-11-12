import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, within } from '@testing-library/react';
import { ToastProvider } from './ToastProvider';
import { useToast } from '../../hooks/useToast';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router';

// Create a test component that uses the toast hook
function TestComponent() {
  const { toast, dismissErrors } = useToast();
  
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
      <button onClick={() => dismissErrors?.()} data-testid="dismiss-errors-button">
        Dismiss Errors
      </button>
    </div>
  );
}

function SaveAndLeave() {
  const { toast } = useToast();
  const navigate = useNavigate();
  return (
    <button
      onClick={() => {
        toast({ variant: 'success', title: 'Saved', description: 'Your changes are saved.' });
        navigate('/list');
      }}
      data-testid="save-and-leave-button"
    >
      Save
    </button>
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
    const toastElements = within(viewport).getAllByTestId(/toast-/);
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
    const toastElements = within(viewport).getAllByTestId(/toast-/);
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
    expect(within(viewport).queryAllByTestId(/toast-/)).toHaveLength(0);
    
    // Show toast
    const button = screen.getByTestId('show-toast-button');
    act(() => {
      button.click();
    });
    
    // Verify toast is shown
    expect(within(viewport).queryAllByTestId(/toast-/).length).toBeGreaterThan(0);
    const toastTitle = screen.getByTestId('toast-title');
    expect(toastTitle).toBeInTheDocument();
    expect(toastTitle).toHaveTextContent('Test Title');
    
    // This test just verifies that the toast appears correctly
    // We don't test automatic dismissal as it depends on animations
    // and would make the test brittle
  });

  it('allows the same toast to be shown again after it closes', () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      </MemoryRouter>
    );

    const button = screen.getByTestId('show-error-toast-button');

    act(() => {
      button.click();
    });

    const firstToast = within(screen.getByTestId('toast-viewport')).getAllByTestId(/toast-/)[0];
    expect(firstToast).toHaveAttribute('data-state', 'open');

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    act(() => {
      vi.advanceTimersByTime(250);
    });

    act(() => {
      button.click();
    });

    const reopenedToast = within(screen.getByTestId('toast-viewport')).getAllByTestId(/toast-/)[0];
    expect(reopenedToast).toHaveAttribute('data-state', 'open');
    expect(screen.getByTestId('toast-description')).toHaveTextContent('Error message');
  });

  it('closes only error toasts when errors are dismissed', () => {
    // given
    render(
      <MemoryRouter>
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      </MemoryRouter>
    );
    act(() => {
      screen.getByTestId('show-toast-button').click();
      screen.getByTestId('show-error-toast-button').click();
    });
    expect(screen.getByText('Error message')).toBeInTheDocument();

    // when
    act(() => {
      screen.getByTestId('dismiss-errors-button').click();
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // then
    expect(screen.queryByText('Error message')).not.toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('keeps a toast raised right before a navigation on the next page', () => {
    // given
    render(
      <MemoryRouter initialEntries={['/form']}>
        <ToastProvider>
          <Routes>
            <Route path="/form" element={<SaveAndLeave />} />
            <Route path="/list" element={<div data-testid="list-page">List</div>} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    );

    // when
    act(() => {
      screen.getByTestId('save-and-leave-button').click();
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // then
    expect(screen.getByTestId('list-page')).toBeInTheDocument();
    expect(screen.getByTestId('toast-title')).toHaveTextContent('Saved');
    expect(screen.getByTestId('toast-description')).toHaveTextContent('Your changes are saved.');
    expect(within(screen.getByTestId('toast-viewport')).getAllByTestId(/^toast-\d/)[0]).toHaveAttribute('data-state', 'open');

    // when
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // then
    expect(screen.queryByText('Your changes are saved.')).not.toBeInTheDocument();
  });
});
