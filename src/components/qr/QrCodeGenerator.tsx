import { useEffect, useRef, useState } from 'react';
import { qr } from '../../lib/api';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/useToast';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Surface } from '../ui/surface';
import { fieldErrorId } from '../../lib/fieldError';
import { QR_MAX_BYTES, qrErrorMessage, utf8ByteLength } from '../../lib/qrText';

const tooLongMessage = (bytes: number) =>
  `Text is too long for a QR code: ${bytes.toLocaleString('en-US')} of ${QR_MAX_BYTES.toLocaleString('en-US')} bytes. Letters such as ą take 2 bytes and emoji 4.`;

export function QrCodeGenerator() {
  const [text, setText] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [encodedText, setEncodedText] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const { toast, dismissErrors } = useToast();
  const byteCount = utf8ByteLength(text);
  const overLimit = byteCount > QR_MAX_BYTES;

  const discardQrCode = () => {
    setEncodedText('');
    setQrCode((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
  };

  useEffect(() => {
    // On small screens the result renders below the fold.
    if (qrCode) {
      resultRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
    }
  }, [qrCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!text.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter text to generate QR code',
        variant: 'error',
      });
      return;
    }
    if (overLimit) {
      setTextError(tooLongMessage(byteCount));
      textInputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setStatusMessage('');
    setTextError(null);
    try {
      const response = await qr.create({ text });
      const imageUrl = URL.createObjectURL(response.data);
      discardQrCode();
      setQrCode(imageUrl);
      setEncodedText(text);
      setStatusMessage('QR code generated');
      dismissErrors?.();
    } catch (error) {
      // Never leave the code of the previous text next to the new one (BUG-010).
      discardQrCode();
      // A rejected text gets the API's reason next to the field; other failures a toast.
      const reason = await qrErrorMessage(error);
      if (reason) {
        setTextError(reason);
        textInputRef.current?.focus();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to generate QR code',
          variant: 'error',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setText('');
    setTextError(null);
    setStatusMessage('');
    discardQrCode();
    // Clear becomes disabled once the text is empty, so keep keyboard focus in the form.
    textInputRef.current?.focus();
  };

  return (
    <Surface variant="default" padding="lg" className="w-full" data-testid="qr-generator">
      <form onSubmit={handleSubmit} className="space-y-6" data-testid="qr-generator-form">
        <Surface variant="inset" padding="md" data-testid="qr-text-field">
          <Label htmlFor="qr-text" data-testid="qr-text-label">
            Text or URL for QR Code
          </Label>
          <Textarea
            ref={textInputRef}
            id="qr-text"
            placeholder="Enter text or URL"
            value={text}
            onChange={(e) => { setText(e.target.value); setTextError(null); }}
            disabled={isLoading}
            className="mt-2 min-h-[180px]"
            error={textError ?? undefined}
            aria-describedby="qr-text-byte-count"
            data-testid="qr-text-input"
          />
          <p
            id="qr-text-byte-count"
            className={`mt-2 text-right text-xs ${overLimit ? 'font-medium text-red-700' : 'text-slate-600'}`}
            data-testid="qr-text-byte-count"
          >
            {byteCount.toLocaleString('en-US')} / {QR_MAX_BYTES.toLocaleString('en-US')} bytes
          </p>
          {textError && (
            <p className="mt-1 text-sm text-red-700" id={fieldErrorId('qr-text')} role="alert" data-testid="qr-text-error">{textError}</p>
          )}
        </Surface>
        <div className="flex flex-col gap-3 sm:flex-row" data-testid="qr-generator-actions">
          {/* aria-disabled instead of disabled keeps focus on the button while generating. */}
          <Button 
            type="submit" 
            aria-disabled={isLoading}
            className="h-11 flex-1 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
            data-testid="qr-generate-button"
          >
            {isLoading ? 'Generating...' : 'Generate QR Code'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={isLoading || !text}
            className="h-11 flex-1"
            data-testid="qr-clear-button"
          >
            Clear
          </Button>
        </div>
      </form>

      <p role="status" className="sr-only" data-testid="qr-status">{statusMessage}</p>

      {qrCode && (
        <div ref={resultRef} className="mt-8 flex flex-col items-center gap-3" data-testid="qr-code-result">
          <Surface variant="inset" padding="sm" data-testid="qr-code-container">
            <img
              src={qrCode}
              alt={`QR code for ${encodedText}`}
              className="w-64 h-64"
              data-testid="qr-code-image"
            />
          </Surface>
          <p className="text-sm text-slate-600" data-testid="qr-code-caption">QR code generated</p>
          <a
            href={qrCode}
            download="qr-code.png"
            className="text-sm font-medium text-slate-900 underline-offset-4 hover:underline"
            data-testid="qr-code-download"
          >
            Download PNG
          </a>
        </div>
      )}
    </Surface>
  );
} 
