import { type Page, type Locator } from '@playwright/test';

export class DesktopNavigation {
  readonly nav: Locator;
  readonly userFullName: Locator;
  readonly userProfileLink: Locator;
  readonly productsLink: Locator;
  readonly cartLink: Locator;
  readonly qrCodeLink: Locator;
  readonly logoutButton: Locator;

  constructor(protected readonly page: Page) {
    this.nav = page.locator('nav');
    this.userFullName = page.getByTestId('username-profile-link');
    this.userProfileLink = this.userFullName;
    this.productsLink = page.getByTestId('desktop-menu-products');
    this.cartLink = page.getByTestId('desktop-cart-icon');
    this.qrCodeLink = page.getByTestId('desktop-menu-qr-code');
    this.logoutButton = this.nav.getByRole('button', { name: 'Logout' });
  }

  async logout() {
    await this.logoutButton.click();
  }
  
  async navigateToProfile() {
    await this.userProfileLink.click();
  }
}

export class MobileNavigation {
  readonly nav: Locator;
  readonly menuButton: Locator;
  readonly mobileMenu: Locator;
  readonly homeLink: Locator;
  readonly productsLink: Locator;
  readonly cartLink: Locator;
  readonly qrCodeLink: Locator;
  readonly logoutButton: Locator;
  readonly userProfileLink: Locator;

  constructor(protected readonly page: Page) {
    this.nav = page.locator('nav');
    this.menuButton = this.nav.getByRole('button', { name: 'Open main menu' });
    this.mobileMenu = page.getByTestId('mobile-menu');
    this.homeLink = page.getByTestId('mobile-menu-home');
    this.productsLink = page.getByTestId('mobile-menu-products');
    this.cartLink = page.getByTestId('mobile-menu-cart');
    this.qrCodeLink = page.getByTestId('mobile-menu-qr-code');
    this.userProfileLink = page.getByTestId('mobile-menu-username');
    this.logoutButton = this.nav.getByRole('button', { name: 'Logout' });
  }

  async openMenu() {
    await this.menuButton.click();
    await this.mobileMenu.waitFor({ state: 'visible' });
  }

  async logout() {
    await this.logoutButton.click();
  }
  
  async navigateToProfile() {
    await this.userProfileLink.click();
  }

  async setMobileViewport() {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }
} 