import { test, expect } from '../fixtures/auth.fixture';
import { cartMocks } from '../mocks/cartMocks';
import { productsMocks, Product } from '../mocks/productMocks';
import { ProductDetailsPage } from '../pages/product-details.page.object';

test.describe('Product Details Page', () => {
  let productDetailsPage: ProductDetailsPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    productDetailsPage = new ProductDetailsPage(authenticatedPage.page);
  });

  test('should display product details', async ({ authenticatedPage }) => {
    // given
    const productId = 123;
    const productData: Product = {
      id: productId,
      name: 'Mocked Product Name',
      description: 'This is a test product description',
      price: 9.99,
      category: 'Electronics',
      stockQuantity: 10,
      imageUrl: '/images/product-123.jpg'
    };
    await productsMocks.mockGetProductDetailsSuccess(authenticatedPage.page, productId, productData);
    await cartMocks.mockEmptyCart(authenticatedPage.page);

    // when
    await productDetailsPage.goto(productId);

    // then
    await expect(productDetailsPage.productTitle).toHaveText(productData.name);
    await expect(productDetailsPage.productPrice).toHaveText(`$${productData.price.toFixed(2)}`);
    await expect(productDetailsPage.productDescription).toHaveText(productData.description || '');
    await expect(productDetailsPage.productCategory).toHaveText(productData.category);
    await expect(productDetailsPage.addToCartButton).toBeEnabled();
  });

  test('should display not found message for invalid product ID', async ({ authenticatedPage }) => {
    // given
    const invalidProductId = 9999;
    await productsMocks.mockGetProductDetailsNotFound(authenticatedPage.page, invalidProductId);

    // when
    await productDetailsPage.goto(invalidProductId);

    // then
    await productDetailsPage.notFoundMessage.waitFor({ state: 'visible' });
    const errorMessage = authenticatedPage.page.locator('p.text-red-500');
    await expect(errorMessage).toHaveText('Error loading product details');
    const backToProductsLink = authenticatedPage.page.getByRole('link', { name: /back to products/i });
    await expect(backToProductsLink).toBeVisible();
  });

  test('should add product to cart', async ({ authenticatedPage }) => {
    // given
    const productId = 777;
    const productData: Product = {
      id: productId,
      name: 'Another Mocked Product',
      description: 'This is another test product',
      price: 14.99,
      category: 'Home',
      stockQuantity: 5
    };
    
    await productsMocks.mockGetProductDetailsSuccess(authenticatedPage.page, productId, productData);
    await cartMocks.mockEmptyCart(authenticatedPage.page);
    await cartMocks.mockAddCartItem(authenticatedPage.page);
    await productDetailsPage.goto(productId);

    // when
    await productDetailsPage.addToCartButton.click();

    // then
    const toastElement = authenticatedPage.page.locator('[role="status"]').first();
    await expect(toastElement).toContainText('added to your cart');
  });

  test('should update cart quantity', async ({ authenticatedPage }) => {
    // given
    const productId = 1;
    const initialQuantity = 2;
    const productData: Product = {
      id: productId,
      name: 'Product to Update',
      description: 'This product will have its quantity updated',
      price: 19.99,
      category: 'Office',
      stockQuantity: 20
    };
    await productsMocks.mockGetProductDetailsSuccess(authenticatedPage.page, productId, productData);
    await cartMocks.mockCartWithItems(authenticatedPage.page);
    await cartMocks.mockUpdateSuccess(authenticatedPage.page, productId);

    await productDetailsPage.goto(productId);
    await expect(productDetailsPage.quantityValue).toHaveText(initialQuantity.toString());
    
    // when
    await productDetailsPage.increaseQuantity(3);
    await productDetailsPage.addToCartButton.click();

    // then
    const toastElement = authenticatedPage.page.locator('[role="status"]').first();
    await expect(toastElement).toBeVisible();
    await expect(toastElement).toContainText('quantity set to');
  });

  test('should remove product from cart', async ({ authenticatedPage }) => {
    // given
    const productId = 1;
    const productData: Product = {
      id: productId,
      name: 'Product to Update',
      description: 'This product will have its quantity updated',
      price: 19.99,
      category: 'Office',
      stockQuantity: 20
    };
    await productsMocks.mockGetProductDetailsSuccess(authenticatedPage.page, productId, productData);
    await cartMocks.mockCartWithItems(authenticatedPage.page);
    await cartMocks.mockUpdateSuccess(authenticatedPage.page, productId);

    await productDetailsPage.goto(productId);

    // when
    await productDetailsPage.removeFromCartButton.click();

    // then
    const toastElement = authenticatedPage.page.locator('[role="status"]').first();
    await expect(toastElement).toBeVisible();
    await expect(toastElement).toContainText('removed from your cart');
  });

}); 