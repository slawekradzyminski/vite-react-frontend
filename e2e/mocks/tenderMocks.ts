import type { Page } from '@playwright/test';
import { cartMocks, toCartDto, type CartFixture } from './cartMocks';
import { fulfillWithSchema, type BackendSchema } from './backendContract';

type CartDto = BackendSchema<'CartDto'>;

/**
 * Cart summary with gift card and loyalty point tenders. Like the backend, the summary only
 * carries the tender fields and amountDue while a gift card or points are applied.
 */
export class CartTendersMock {
  private giftCard: { code: string; balance: number } | null = null;
  private points = 0;

  constructor(
    private readonly cart: CartFixture,
    private readonly giftCards: Record<string, number>,
    private readonly loyaltyBalance: number,
  ) {}

  summary(): CartDto {
    const base = toCartDto(this.cart);
    const total = base.totalPrice ?? 0;
    if (!this.giftCard && this.points === 0) return base;
    const giftCardAmount = this.giftCard ? Math.min(this.giftCard.balance, total) : 0;
    const pointsAmount = Math.min(this.points / 100, total - giftCardAmount);
    const pointsRedeemed = Math.round(pointsAmount * 100);
    return {
      ...base,
      totalAfterDiscount: total,
      discountAmount: 0,
      ...(this.giftCard ? { giftCardCode: this.giftCard.code, giftCardAmount } : {}),
      ...(pointsRedeemed > 0 ? { pointsRedeemed, pointsAmount } : {}),
      amountDue: Number((total - giftCardAmount - pointsAmount).toFixed(2)),
    };
  }

  async install(page: Page) {
    await cartMocks.mockCartWithState(page, this.cart);
    await page.route('**/api/v1/cart', async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      await fulfillWithSchema(route, 'CartDto', this.summary());
    });
    await page.route('**/api/v1/cart/gift-card', async (route) => {
      if (route.request().method() === 'DELETE') {
        this.giftCard = null;
        return fulfillWithSchema(route, 'CartDto', this.summary());
      }
      const { code } = route.request().postDataJSON() as BackendSchema<'ApplyGiftCardDto'>;
      const balance = this.giftCards[code];
      if (balance === undefined) {
        return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'Gift card not found' }) });
      }
      this.giftCard = { code, balance };
      await fulfillWithSchema(route, 'CartDto', this.summary());
    });
    await page.route('**/api/v1/cart/loyalty-points', async (route) => {
      if (route.request().method() === 'DELETE') {
        this.points = 0;
        return fulfillWithSchema(route, 'CartDto', this.summary());
      }
      const { points } = route.request().postDataJSON() as BackendSchema<'ApplyLoyaltyPointsDto'>;
      this.points = points;
      await fulfillWithSchema(route, 'CartDto', this.summary());
    });
    await page.route('**/api/v1/loyalty', async (route) => {
      await fulfillWithSchema(route, 'LoyaltyAccountDto', {
        balance: this.loyaltyBalance,
        tier: 'SILVER',
        valueOfBalance: this.loyaltyBalance / 100,
        lifetimeEarned: this.loyaltyBalance,
      });
    });
  }
}
