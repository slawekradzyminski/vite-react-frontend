import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { AppErrorBoundary } from './AppErrorBoundary';

// Rendering an object as a React child is what a product with name {"en":"iPhone"} does (React error #31).
function BrokenProduct() {
  const name = { en: 'iPhone' } as unknown as string;
  return <h1>{name}</h1>;
}

function Shell() {
  const location = useLocation();
  return (
    <>
      <nav>
        <Link to="/products/1" data-testid="nav-broken">Broken product</Link>
        <Link to="/orders" data-testid="nav-orders">Orders</Link>
      </nav>
      <AppErrorBoundary key={location.pathname} testIdPrefix="route-error">
        <Routes>
          <Route path="/products/1" element={<BrokenProduct />} />
          <Route path="/orders" element={<p>Orders page</p>} />
        </Routes>
      </AppErrorBoundary>
    </>
  );
}

describe('AppErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('replaces a page that fails to render with a fallback and keeps the navigation', () => {
    // given
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // when
    render(<MemoryRouter initialEntries={['/products/1']}><Shell /></MemoryRouter>);

    // then
    expect(screen.getByTestId('route-error-title')).toHaveTextContent('Something went wrong');
    expect(screen.getByTestId('route-error-home')).toHaveAttribute('href', '/');
    expect(screen.getByTestId('nav-orders')).toBeInTheDocument();
  });

  it('resets after navigating to another page', () => {
    // given
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<MemoryRouter initialEntries={['/products/1']}><Shell /></MemoryRouter>);
    expect(screen.getByTestId('route-error')).toBeInTheDocument();

    // when
    fireEvent.click(screen.getByTestId('nav-orders'));

    // then
    expect(screen.getByText('Orders page')).toBeInTheDocument();
    expect(screen.queryByTestId('route-error')).not.toBeInTheDocument();
  });

  it('reloads the page from the fallback', () => {
    // given
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const reload = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', { configurable: true, value: { ...originalLocation, reload } });
    render(<AppErrorBoundary><BrokenProduct /></AppErrorBoundary>);

    // when
    fireEvent.click(screen.getByTestId('app-error-reload'));

    // then
    expect(reload).toHaveBeenCalledTimes(1);
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  it('renders its children when nothing fails', () => {
    render(<AppErrorBoundary><p>Healthy page</p></AppErrorBoundary>);

    expect(screen.getByText('Healthy page')).toBeInTheDocument();
    expect(screen.queryByTestId('app-error')).not.toBeInTheDocument();
  });
});
