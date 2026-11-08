import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { catalogCsv } from '../../lib/api';
import { serverMessage } from '../../lib/requestErrors';
import type { ImportReport } from '../../types/commerce';
import { Button } from '../ui/button';

function readReport(error: unknown): ImportReport | null {
  if (!axios.isAxiosError(error)) return null;
  const data = error.response?.data as ImportReport | undefined;
  return data && Array.isArray(data.errors) ? data : null;
}

/** CSV export download and all-or-nothing import with a dry-run option. */
export function AdminCatalogCsv() {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const exportCsv = useMutation({
    mutationFn: catalogCsv.export,
    onSuccess: (response) => {
      const disposition = String(response.headers['content-disposition'] ?? '');
      const filename = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? 'products.csv';
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    },
    onError: (mutationError) => setError(serverMessage(mutationError, 'Export failed.')),
  });
  const importCsv = useMutation({
    mutationFn: () => catalogCsv.import(file as File, dryRun),
    onSuccess: (response) => {
      setReport(response.data);
      setError(null);
      if (response.data.applied) {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
      }
    },
    onError: (mutationError) => {
      const failed = readReport(mutationError);
      setReport(failed);
      setError(failed ? null : serverMessage(mutationError, 'Import failed.'));
    },
  });

  return (
    <div className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50 p-4" data-testid="catalog-csv">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => exportCsv.mutate()} disabled={exportCsv.isPending} data-testid="catalog-csv-export">Export CSV</Button>
        <input ref={fileInput} type="file" accept=".csv,text/csv" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setReport(null); }} className="text-sm" aria-label="CSV file" data-testid="catalog-csv-file" />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={dryRun} onChange={(event) => setDryRun(event.target.checked)} data-testid="catalog-csv-dry-run" />
          Dry run
        </label>
        <Button size="sm" onClick={() => importCsv.mutate()} disabled={!file || importCsv.isPending} data-testid="catalog-csv-import">{dryRun ? 'Validate' : 'Import'}</Button>
      </div>
      {error && <p className="text-sm text-red-700" role="alert" data-testid="catalog-csv-error">{error}</p>}
      {report && (
        <div className="text-sm" role="status" data-testid="catalog-csv-report">
          <p className={report.errors?.length ? 'text-red-700' : 'text-emerald-700'} data-testid="catalog-csv-summary">
            {report.errors?.length
              ? `Nothing was imported: ${report.errors.length} problem${report.errors.length === 1 ? '' : 's'} in ${report.totalRows} rows.`
              : `${report.applied ? 'Imported' : 'Valid'}: ${report.created} new, ${report.updated} updated, ${report.unchanged} unchanged.`}
          </p>
          {(report.errors?.length ?? 0) > 0 && (
            <ul className="mt-2 max-h-48 list-disc overflow-auto pl-5 text-red-700" data-testid="catalog-csv-errors">
              {report.errors?.map((rowError, index) => (
                <li key={index} data-testid={`catalog-csv-error-${index}`}>Line {rowError.row}, {rowError.field}: {rowError.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
