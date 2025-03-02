import { Product } from '../mocks/productMocks';

export function generateProduct(overrides?: Partial<Product>): Product {
  const id = Math.floor(Math.random() * 100000);
  const name = `Product ${Math.random().toString(16).slice(2, 8)}`;
  const price = Math.floor(Math.random() * 1000);
  const categories = ['Tech', 'Home', 'Office', 'Clothing', 'Food', 'Sports'];
  const category = categories[Math.floor(Math.random() * categories.length)];
  
  return {
    id,
    name,
    price,
    category,
    description: `Description for ${name}`,
    imageUrl: `/images/product-${id}.jpg`,
    ...overrides
  };
}

export function generateProducts(count: number, overrides?: Partial<Product>): Product[] {
  return Array.from({ length: count }, () => generateProduct(overrides));
}

export function generateProductsByCategory(count: number, category: string): Product[] {
  return generateProducts(count, { category });
}

export function generateProductsInPriceRange(count: number, minPrice: number, maxPrice: number): Product[] {
  return Array.from({ length: count }, () => {
    const price = minPrice + Math.floor(Math.random() * (maxPrice - minPrice));
    return generateProduct({ price });
  });
} 