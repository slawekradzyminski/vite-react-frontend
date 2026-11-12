import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { NotFoundPage } from './notFoundPage';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<p>home page</p>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('NotFoundPage', () => {
  it('names the missing page in the only h1 and the document title', () => {
    renderAt('/this-page-does-not-exist');

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(document.title).toBe('Page not found – Awesome Testing');
    expect(screen.getByTestId('not-found-message')).toHaveTextContent('/this-page-does-not-exist');
  });

  it('links back to the home page', async () => {
    renderAt('/missing');

    await userEvent.click(screen.getByRole('link', { name: 'Go to the home page' }));

    expect(screen.getByText('home page')).toBeInTheDocument();
  });
});
