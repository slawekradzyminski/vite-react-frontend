import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { renderWithProviders } from '../../test/test-utils';
import { KvCacheLabPage } from './KvCacheLabPage';

describe('KvCacheLabPage', () => {
  test('recalculates memory and reports invalid head geometry', () => {
    renderWithProviders(<KvCacheLabPage />);

    expect(screen.getByTestId('kv-cache-result-mha')).toHaveTextContent('4.00 GB');
    fireEvent.change(screen.getByTestId('kv-cache-contextLength'), { target: { value: '16384' } });
    expect(screen.getByTestId('kv-cache-result-mha')).toHaveTextContent('8.00 GB');

    fireEvent.change(screen.getByTestId('kv-cache-modelDim'), { target: { value: '4100' } });
    expect(screen.getByTestId('kv-cache-error')).toHaveTextContent('divisible by query heads');
    expect(screen.queryByTestId('kv-cache-results')).not.toBeInTheDocument();
  });
});
