import { useRef, useState } from 'react';
import { qr } from '../../lib/api';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/useToast';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Surface } from '../ui/surface';

export function QrCodeGenerator() {
  const [text, setText] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [encodedText, setEncodedText] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

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

    setIsLoading(true);
    setStatusMessage('');
    try {
      const response = await qr.create({ text });
      const imageUrl = URL.createObjectURL(response.data);
      setQrCode(imageUrl);
      setEncodedText(text);
      setStatusMessage('QR code generated');
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to generate QR code',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setText('');
    setEncodedText('');
    setStatusMessage('');
    if (qrCode) {
      URL.revokeObjectURL(qrCode);
      setQrCode(null);
    }
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
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading}
            className="mt-2 min-h-[180px]"
            data-testid="qr-text-input"
          />
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
        <div className="mt-8 flex justify-center" data-testid="qr-code-result">
          <Surface variant="inset" padding="sm" data-testid="qr-code-container">
            <img
              src={qrCode}
              alt={`QR code for ${encodedText}`}
              className="w-64 h-64"
              data-testid="qr-code-image"
            />
          </Surface>
        </div>
      )}
    </Surface>
  );
} 
