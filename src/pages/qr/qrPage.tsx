import { QrCodeGenerator } from '../../components/qr/QrCodeGenerator';
import { Surface } from '../../components/ui/surface';

export function QrCodePage() {
  return (
    <div className="space-y-6 pb-10" data-testid="qr-code-page">
      <Surface as="section" variant="hero" padding="xl" data-testid="qr-code-header">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Utilities</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl" data-testid="qr-code-title">QR Code Generator</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Generate a clean scannable code for text or URLs and review the result immediately in place.
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-stone-200 bg-white/80 px-4 py-3 text-sm text-slate-600">
            PNG output is returned directly from the generator endpoint.
          </div>
        </div>
      </Surface>

      <div className="mx-auto max-w-3xl" data-testid="qr-code-container">
        <QrCodeGenerator />
      </div>
    </div>
  );
} 
