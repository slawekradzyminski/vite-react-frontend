import { useState } from 'react';
import { qr } from '../../lib/api';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/useToast';
import { Card, Text, TextArea, Flex } from '@radix-ui/themes';

export function QrCodeGenerator() {
  const [text, setText] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter text to generate QR code',
        variant: 'error',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await qr.create({ text });
      const imageUrl = URL.createObjectURL(response.data);
      setQrCode(imageUrl);
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
    if (qrCode) {
      URL.revokeObjectURL(qrCode);
      setQrCode(null);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6" data-testid="qr-generator">
      <form onSubmit={handleSubmit} className="space-y-6" data-testid="qr-generator-form">
        <div data-testid="qr-text-field">
          <Text as="label" size="2" htmlFor="qr-text" weight="medium" data-testid="qr-text-label">
            Text or URL for QR Code
          </Text>
          <TextArea 
            id="qr-text"
            placeholder="Enter text or URL"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading}
            className="mt-1.5"
            data-testid="qr-text-input"
          />
        </div>
        <Flex gap="3" data-testid="qr-generator-actions">
          <Button 
            type="submit" 
            disabled={isLoading}
            className="flex-1"
            data-testid="qr-generate-button"
          >
            {isLoading ? 'Generating...' : 'Generate QR Code'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={isLoading || !text}
            className="flex-1"
            data-testid="qr-clear-button"
          >
            Clear
          </Button>
        </Flex>
      </form>

      {qrCode && (
        <div className="mt-8 flex justify-center" data-testid="qr-code-result">
          <Card className="p-4" data-testid="qr-code-container">
            <img
              src={qrCode}
              alt="Generated QR Code"
              className="w-64 h-64"
              data-testid="qr-code-image"
            />
          </Card>
        </div>
      )}
    </Card>
  );
} 