import { useLocation } from 'react-router';

/** Exposes the router's current pathname as `test-location` for navigation assertions. */
export function LocationProbe() {
  const location = useLocation();
  return <div data-testid="test-location">{location.pathname}</div>;
}
