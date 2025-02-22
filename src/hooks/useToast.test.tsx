import React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useToast, ToastContext } from './useToast';

describe('useToast', () => {
  // given
  it('throws error when used outside of ToastProvider', () => {
    // when/then
    expect(() => renderHook(() => useToast())).toThrow(
      'useToast must be used within a ToastProvider'
    );
  });

  // given
  it('returns toast function when used within ToastProvider', () => {
    // when
    const mockToast = vi.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastContext.Provider value={{ toast: mockToast }}>
        {children}
      </ToastContext.Provider>
    );

    const { result } = renderHook(() => useToast(), { wrapper });

    // then
    expect(result.current.toast).toBeDefined();
    expect(typeof result.current.toast).toBe('function');
    expect(result.current.toast).toBe(mockToast);
  });
}); 