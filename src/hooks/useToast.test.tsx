import React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useToast } from './useToast';
import { ToastProvider } from '../components/ui/ToastProvider';
import { MemoryRouter } from 'react-router-dom';

// Mock react-router-dom's useLocation
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ pathname: '/test' }),
  };
});

describe('useToast', () => {
  // given
  it('throws error when used outside of ToastProvider', () => {
    // Suppress the error output for this test
    const originalConsoleError = console.error;
    console.error = vi.fn();
    
    // when/then
    expect(() => renderHook(() => useToast())).toThrow('useToast must be used within a ToastProvider');
    
    // Restore console.error
    console.error = originalConsoleError;
  });

  // given
  it('returns toast function when used within ToastProvider', () => {
    // when
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter>
        <ToastProvider>{children}</ToastProvider>
      </MemoryRouter>
    );

    const { result } = renderHook(() => useToast(), { wrapper });

    // then
    expect(result.current.toast).toBeDefined();
    expect(typeof result.current.toast).toBe('function');
  });
}); 