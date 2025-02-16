import { screen } from '@testing-library/react';
import { QrCodePage } from './index';
import { renderWithProviders } from '../../test/test-utils';

describe('QrCodePage', () => {
  // given
  it('should render the page title', () => {
    // when
    renderWithProviders(<QrCodePage />);
    
    // then
    expect(screen.getByRole('heading')).toHaveTextContent(/qr code generator/i);
  });
}); 