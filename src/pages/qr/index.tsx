import { QrCodeGenerator } from '../../components/qr/QrCodeGenerator';
import { Flex } from '@radix-ui/themes';

export function QrCodePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Flex direction="column" align="center">
        <h1 className="text-2xl font-bold mb-4">QR Code Generator</h1>
        <QrCodeGenerator />
      </Flex>
    </div>
  );
} 