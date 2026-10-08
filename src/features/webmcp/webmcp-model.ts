import type { Cart } from '../../types/cart';
import type { Product } from '../../types/product';

export const faults = {
  none: 'Healthy application',
  'broken-button': 'Broken Add to cart button',
  'wrong-product': 'Tool adds a different product',
  'stale-cart': 'Tool leaves the cart display stale',
  'wrong-total': 'Cart displays an incorrect total',
} as const;
export type DemoFault = keyof typeof faults;

export function readFault(value: string | null): DemoFault {
  return value && Object.prototype.hasOwnProperty.call(faults, value) ? value as DemoFault : 'none';
}

export interface ToolResult {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
}
export interface ShopTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint: boolean };
  execute: (input: unknown) => Promise<ToolResult>;
}
export interface ModelContext {
  registerTool: (tool: ShopTool, options: { signal: AbortSignal }) => Promise<void>;
}
export interface ToolCall {
  name: string;
  input: unknown;
  result: ToolResult;
}
export interface ShopServices {
  getProducts: () => Promise<Product[]>;
  getCart: () => Promise<Cart>;
  addToCart: (productId: number, quantity: number) => Promise<Cart>;
  onSearch: (query: string, inStockOnly: boolean) => void;
  onCart: (cart: Cart) => void;
}

export function getModelContext(): ModelContext | undefined {
  return (document as Document & { modelContext?: ModelContext }).modelContext;
}

export function filterProducts(products: Product[], query: string, inStockOnly: boolean) {
  const term = query.trim().toLocaleLowerCase();
  return products.filter(product =>
    [product.name, product.category, product.description ?? ""].some(value => value.toLocaleLowerCase().includes(term))
    && (!inStockOnly || product.stockQuantity > 0),
  ).sort((a, b) => a.price - b.price || a.id - b.id);
}

function argumentsObject(input: unknown, allowed: string[]): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Tool arguments must be an object.');
  }
  const value = input as Record<string, unknown>;
  if (Object.keys(value).some(key => !allowed.includes(key))) {
    throw new Error('Unknown tool argument.');
  }
  return value;
}

function positiveInteger(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return value;
}

const resultText = (value: unknown): ToolResult => ({
  content: [{ type: 'text', text: JSON.stringify(value) }],
});

export function createShopTools(
  services: ShopServices,
  fault: DemoFault = 'none',
  onCall: (call: ToolCall) => void = () => {},
): ShopTool[] {
  const reportCart = (value: Cart) => {
    if (fault !== 'stale-cart') services.onCart(value);
    return value;
  };
  const definitions = [
    {
      name: 'search_products',
      description: 'Search products by name, category or description, sorted by price ascending. Returns IDs, names, prices and stock. Also updates the visible catalogue filter.',
      inputSchema: {
        type: 'object', additionalProperties: false,
        properties: { query: { type: 'string', maxLength: 200 }, inStockOnly: { type: 'boolean' } },
        required: ['query'],
      },
      annotations: { readOnlyHint: true },
      run: async (input: unknown) => {
        const args = argumentsObject(input, ['query', 'inStockOnly']);
        if (typeof args.query !== 'string' || args.query.length > 200
          || (args.inStockOnly !== undefined && typeof args.inStockOnly !== 'boolean')) {
          throw new Error('Provide a query up to 200 characters and an optional boolean inStockOnly.');
        }
        const values = await services.getProducts();
        const inStockOnly = args.inStockOnly === true;
        services.onSearch(args.query, inStockOnly);
        return filterProducts(values, args.query, inStockOnly).map(({ id, name, price, stockQuantity }) =>
          ({ id, name, price, stockQuantity }),
        );
      },
    },
    {
      name: 'add_to_cart',
      description: 'Add units of a product to the authenticated user\'s cart. Quantity is additional units, not a replacement. Repeating a successful call adds more units. Does not place an order.',
      inputSchema: {
        type: 'object', additionalProperties: false,
        properties: { productId: { type: 'integer', minimum: 1 }, quantity: { type: 'integer', minimum: 1 } },
        required: ['productId', 'quantity'],
      },
      annotations: { readOnlyHint: false },
      run: async (input: unknown) => {
        const args = argumentsObject(input, ['productId', 'quantity']);
        let productId = positiveInteger(args.productId, 'productId');
        const quantity = positiveInteger(args.quantity, 'quantity');
        if (fault === 'wrong-product') {
          const values = await services.getProducts();
          const requested = values.find(product => product.id === productId);
          const other = values.find(product => product.id !== productId && product.category === requested?.category && product.stockQuantity >= quantity);
          if (!other) throw new Error('Seed another available product in the same category to demonstrate this fault.');
          productId = other.id;
        }
        return reportCart(await services.addToCart(productId, quantity));
      },
    },
    {
      name: 'get_cart',
      description: 'Read the authenticated user\'s saved cart, with product IDs, quantities, item count and total price. Also refreshes the visible cart.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      run: async (input: unknown) => {
        argumentsObject(input, []);
        return reportCart(await services.getCart());
      },
    },
  ];
  return definitions.map(({ run, ...definition }) => ({
    ...definition,
    async execute(input: unknown) {
      let result: ToolResult;
      try {
        result = resultText(await run(input));
      } catch (error) {
        result = { ...resultText({ error: error instanceof Error ? error.message : 'Application request failed.' }), isError: true };
      }
      onCall({ name: definition.name, input, result });
      return result;
    },
  }));
}

export async function registerShopTools(context: ModelContext, tools: ShopTool[], signal: AbortSignal) {
  for (const tool of tools) {
    if (signal.aborted) return;
    await context.registerTool(tool, { signal });
  }
}
