import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminCatalogCsv } from './AdminCatalogCsv';
import { catalogCsv } from '../../lib/api';
import { renderWithProviders } from '../../test/test-utils';

vi.mock('../../lib/api', () => ({ catalogCsv: { export: vi.fn(), import: vi.fn() } }));

const csvFile = () => new File(['name,description,price,stockQuantity,category\n'], 'products.csv', { type: 'text/csv' });

describe('AdminCatalogCsv', () => {
  beforeEach(() => vi.resetAllMocks());

  it('validates as a dry run by default and summarises the result', async () => {
    vi.mocked(catalogCsv.import).mockResolvedValue({ data: { dryRun: true, applied: false, totalRows: 2, created: 1, updated: 1, unchanged: 0, errors: [] } } as never);
    renderWithProviders(<AdminCatalogCsv />);

    await userEvent.upload(screen.getByTestId('catalog-csv-file'), csvFile());
    await userEvent.click(screen.getByTestId('catalog-csv-import'));

    expect(catalogCsv.import).toHaveBeenCalledWith(expect.any(File), true);
    expect(await screen.findByTestId('catalog-csv-summary')).toHaveTextContent('Valid: 1 new, 1 updated, 0 unchanged.');
  });

  it('lists every row error from a rejected import', async () => {
    vi.mocked(catalogCsv.import).mockRejectedValue(Object.assign(new Error('Bad Request'), {
      isAxiosError: true,
      response: { status: 400, data: { dryRun: false, applied: false, totalRows: 3, created: 0, updated: 0, unchanged: 0, errors: [
        { row: 3, field: 'price', message: 'Price must be greater than 0' },
        { row: 4, field: 'id', message: 'Product not found: 999' },
      ] } },
    }));
    renderWithProviders(<AdminCatalogCsv />);

    await userEvent.upload(screen.getByTestId('catalog-csv-file'), csvFile());
    await userEvent.click(screen.getByTestId('catalog-csv-dry-run'));
    await userEvent.click(screen.getByTestId('catalog-csv-import'));

    expect(await screen.findByTestId('catalog-csv-summary')).toHaveTextContent('Nothing was imported: 2 problems in 3 rows.');
    expect(screen.getByTestId('catalog-csv-error-0')).toHaveTextContent('Line 3, price: Price must be greater than 0');
    expect(screen.getByTestId('catalog-csv-error-1')).toHaveTextContent('Line 4, id: Product not found: 999');
  });
});
