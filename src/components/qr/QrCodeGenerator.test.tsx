import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QrCodeGenerator } from './QrCodeGenerator';
import { qr } from '../../lib/api';
import { ToastContext } from '../../hooks/useToast';

vi.mock('../../lib/api', () => ({
  qr: {
    create: vi.fn(),
  },
}));

const mockToast = vi.fn();

const renderComponent = () =>
  render(
    <ToastContext.Provider value={{ toast: mockToast }}>
      <QrCodeGenerator />
    </ToastContext.Provider>
  );

describe('QrCodeGenerator', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => 'blob:test-url');
    URL.revokeObjectURL = vi.fn();
  });

  // given
  it('should generate QR code on submit', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' });
    vi.mocked(qr.create).mockResolvedValue({ type: 'image/png', data: mockBlob });
    renderComponent();

    // when
    await user.type(screen.getByRole('textbox'), 'test text');
    await user.click(screen.getByRole('button', { name: /generate/i }));

    // then
    await waitFor(() => {
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
    expect(qr.create).toHaveBeenCalledWith({ text: 'test text' });
    expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
  });

  // given
  it('should show loading state while generating', async () => {
    vi.mocked(qr.create).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    renderComponent();

    // when
    await user.type(screen.getByRole('textbox'), 'test');
    await user.click(screen.getByRole('button', { name: /generate/i }));

    // then
    expect(screen.getByRole('button', { name: /generating/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  // given
  it('should clear QR code', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' });
    vi.mocked(qr.create).mockResolvedValue({ type: 'image/png', data: mockBlob });
    renderComponent();

    // when
    await user.type(screen.getByRole('textbox'), 'test text');
    await user.click(screen.getByRole('button', { name: /generate/i }));
    await waitFor(() => {
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /clear/i }));

    // then
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
  });

  // given
  it('should show error toast when API fails', async () => {
    vi.mocked(qr.create).mockRejectedValue(new Error('API Error'));
    renderComponent();

    // when
    await user.type(screen.getByRole('textbox'), 'test');
    await user.click(screen.getByRole('button', { name: /generate/i }));

    // then
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to generate QR code',
        variant: 'error',
      });
    });
  });

  // given
  it('should show error toast when text is empty', async () => {
    renderComponent();

    // when
    await user.click(screen.getByRole('button', { name: /generate/i }));

    // then
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Please enter text to generate QR code',
      variant: 'error',
    });
    expect(qr.create).not.toHaveBeenCalled();
  });
}); 