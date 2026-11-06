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
    const generating = screen.getByRole('button', { name: /generating/i });
    expect(generating).toHaveAttribute('aria-disabled', 'true');
    expect(generating).toHaveFocus();
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  // given
  it('ignores repeated submits while generating', async () => {
    let resolveCreate: (value: Awaited<ReturnType<typeof qr.create>>) => void = () => {};
    vi.mocked(qr.create).mockImplementation(() => new Promise((resolve) => { resolveCreate = resolve; }));
    renderComponent();
    await user.type(screen.getByRole('textbox'), 'test');
    await user.click(screen.getByRole('button', { name: /generate/i }));

    // when
    await user.click(screen.getByRole('button', { name: /generating/i }));

    // then
    expect(qr.create).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    resolveCreate({ type: 'image/png', data: new Blob(['x']) } as Awaited<ReturnType<typeof qr.create>>);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Generate QR Code' })).not.toHaveAttribute('aria-disabled', 'true'));
  });

  // given
  it('announces the generated code and describes what it encodes', async () => {
    vi.mocked(qr.create).mockResolvedValue({ type: 'image/png', data: new Blob(['test']) });
    renderComponent();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    // when
    await user.type(screen.getByRole('textbox'), 'https://www.awesome-testing.com');
    await user.click(screen.getByRole('button', { name: /generate/i }));

    // then
    expect(await screen.findByRole('img', { name: 'QR code for https://www.awesome-testing.com' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('QR code generated');
    expect(screen.getByRole('button', { name: 'Generate QR Code' })).toHaveFocus();
  });

  // given
  it('clears the previous success message when a new code is requested', async () => {
    vi.mocked(qr.create).mockResolvedValueOnce({ type: 'image/png', data: new Blob(['test']) });
    renderComponent();
    await user.type(screen.getByRole('textbox'), 'first');
    await user.click(screen.getByRole('button', { name: /generate/i }));
    await screen.findByText('QR code generated');
    vi.mocked(qr.create).mockReturnValueOnce(new Promise(() => {}));

    // when
    await user.click(screen.getByRole('button', { name: /generate/i }));

    // then
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  // given
  it('describes the encoded text even after the input changes', async () => {
    vi.mocked(qr.create).mockResolvedValue({ type: 'image/png', data: new Blob(['test']) });
    renderComponent();
    await user.type(screen.getByRole('textbox'), 'first');
    await user.click(screen.getByRole('button', { name: /generate/i }));
    await screen.findByRole('img');

    // when
    await user.type(screen.getByRole('textbox'), ' edited');

    // then
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'QR code for first');
  });

  // given
  it('moves focus to the text field after Clear disables itself', async () => {
    vi.mocked(qr.create).mockResolvedValue({ type: 'image/png', data: new Blob(['test']) });
    renderComponent();
    await user.type(screen.getByRole('textbox'), 'test');
    await user.click(screen.getByRole('button', { name: /generate/i }));
    await screen.findByRole('img');

    // when
    await user.click(screen.getByRole('button', { name: /clear/i }));

    // then
    expect(screen.getByRole('button', { name: /clear/i })).toBeDisabled();
    expect(screen.getByRole('textbox')).toHaveFocus();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
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