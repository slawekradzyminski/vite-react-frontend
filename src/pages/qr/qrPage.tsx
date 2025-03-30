import { QrCodeGenerator } from '../../components/qr/QrCodeGenerator';
import { Flex } from '@radix-ui/themes';

export function QrCodePage() {
  return (
    <div className="container mx-auto px-4 py-8" data-testid="qr-code-page">
      <Flex direction="column" align="center" data-testid="qr-code-container">
        <h1 className="text-2xl font-bold mb-4" data-testid="qr-code-title">QR Code Generator</h1>
        <QrCodeGenerator />
      </Flex>
    </div>
  );
} 