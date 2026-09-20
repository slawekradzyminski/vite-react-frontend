import type { AxiosInstance, AxiosResponse } from 'axios';
import type { Product, ProductCreateDto, ProductUpdateDto } from '../types/product';
import type { Cart } from '../types/cart';
import type { Address, Order, OrderItem, OrderStatus } from '../types/order';
import type { InventoryAdjustmentRequest, InventoryItem, InventoryMovement, PageDto, StockStatus } from '../types/inventory';
import type { User } from '../types/auth';

type GraphQlError = { message: string; extensions?: { code?: string } };
type Envelope<T> = { data?: T; errors?: GraphQlError[] };
type WireProduct = Omit<Product, 'id' | 'price'> & { id: string; price: string };
type WireOrderItem = Omit<OrderItem, 'id' | 'productId' | 'unitPrice' | 'totalPrice'> & {
  id: string; productId: string; unitPrice: string; totalPrice: string;
};
type WireOrder = Omit<Order, 'id' | 'items' | 'totalAmount'> & {
  id: string; items: WireOrderItem[]; totalAmount: string;
};
type WireCart = Omit<Cart, 'items' | 'totalPrice'> & {
  totalPrice: string;
  items: { product: WireProduct; quantity: number; unitPrice: string }[];
};
type WirePage<T> = { items: T[]; total: number; page: number; size: number };
type WireInventory = Omit<InventoryItem, 'productId'> & { productId: string };
type WireMovement = Omit<InventoryMovement, 'id' | 'productId' | 'orderId'> & {
  id: string; productId: string; orderId?: string | null;
};

const PRODUCT = 'id name description price stockQuantity category imageUrl';
const CART = `username totalItems totalPrice items { quantity unitPrice product { ${PRODUCT} } }`;
const ORDER = `id username totalAmount status createdAt updatedAt
  shippingAddress { street city state zipCode country }
  items { id productId productName quantity unitPrice totalPrice }`;
const INVENTORY = 'productId name category availableQuantity stockStatus lastChangedAt';
const MOVEMENT = 'id productId orderId type delta quantityAfter actor reason requestId createdAt';

export class CommerceGraphQlError extends Error {
  readonly code: string;
  constructor(errors: GraphQlError[]) {
    super(errors.map(error => error.message).join('; '));
    this.name = 'CommerceGraphQlError';
    this.code = errors[0]?.extensions?.code ?? 'GRAPHQL_ERROR';
  }
}

function id(value: string): number {
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < 1) throw new Error('Unsupported commerce identifier');
  return result;
}

function money(value: string): number {
  const result = Number(value);
  if (!Number.isFinite(result) || !/^-?\d+(\.\d{1,2})?$/.test(value)) {
    throw new Error('Invalid commerce money value');
  }
  return result;
}

const product = (value: WireProduct): Product => ({ ...value, id: id(value.id), price: money(value.price) });
const order = (value: WireOrder): Order => ({
  ...value, id: id(value.id), totalAmount: money(value.totalAmount),
  items: value.items.map(item => ({ ...item, id: id(item.id), productId: id(item.productId),
    unitPrice: money(item.unitPrice), totalPrice: money(item.totalPrice) })),
});
const inventoryItem = (value: WireInventory): InventoryItem => ({ ...value, productId: id(value.productId) });
const movement = (value: WireMovement): InventoryMovement => ({
  ...value, id: id(value.id), productId: id(value.productId), orderId: value.orderId == null ? value.orderId : id(value.orderId),
});
const page = <T, R>(value: WirePage<T>, map: (item: T) => R): PageDto<R> => ({
  content: value.items.map(map), pageNumber: value.page, pageSize: value.size,
  totalElements: value.total, totalPages: Math.ceil(value.total / value.size),
});
const cart = (value: WireCart): Cart & { enriched: true } => ({
  ...value, enriched: true, totalPrice: money(value.totalPrice),
  items: value.items.map(item => ({
    productId: id(item.product.id), productName: item.product.name, imageUrl: item.product.imageUrl ?? '',
    quantity: item.quantity, unitPrice: money(item.unitPrice),
    totalPrice: Math.round(money(item.unitPrice) * 100) * item.quantity / 100,
  })),
});
const productInput = (input: ProductCreateDto | ProductUpdateDto) => ({
  ...input, ...(input.price === undefined ? {} : { price: String(input.price) }),
});

/** Uses the existing authenticated Axios instance; execution errors never trigger REST fallback. */
export function createCommerceGraphql(api: AxiosInstance) {
  async function execute<T, R>(document: string, field: string, variables: object, map: (value: T) => R): Promise<AxiosResponse<R>> {
    const response = await api.post<Envelope<Record<string, T>>>('/api/v1/graphql', { query: document, variables });
    if (response.data.errors?.length) throw new CommerceGraphQlError(response.data.errors);
    const value = response.data.data?.[field];
    if (value == null) throw new Error('GraphQL returned no commerce data');
    return { ...response, data: map(value) };
  }
  const readOrder = (document: string, field: string, variables: object) => execute(document, field, variables, order);
  const readCart = (document: string, field: string, variables: object) => execute(document, field, variables, cart);
  const orderPage = (variables: object) => execute<WirePage<WireOrder>, PageDto<Order>>(
    `query Orders($page:Int!,$size:Int!,$status:OrderStatus,$username:String) {
      orders(page:$page,size:$size,status:$status,username:$username) { total page size items { ${ORDER} } }
    }`, 'orders', variables, value => page(value, order));

  return {
    products: {
      async getAllProducts(): Promise<AxiosResponse<Product[]>> {
        const items: Product[] = [];
        let offset = 0;
        while (true) {
          const response = await execute<{ items: WireProduct[]; total: number }, { items: Product[]; total: number }>(
            `query Products($offset:Int!) { products(offset:$offset,limit:25) { total items { ${PRODUCT} } } }`,
            'products', { offset }, value => ({ items: value.items.map(product), total: value.total }));
          items.push(...response.data.items);
          offset += response.data.items.length;
          if (offset >= response.data.total || response.data.items.length === 0) return { ...response, data: items };
        }
      },
      getProductById: (productId: number) => execute(`query Product($id:ID!) { product(id:$id) { ${PRODUCT} } }`, 'product', { id: String(productId) }, product),
      createProduct: (input: ProductCreateDto) => execute(`mutation CreateProduct($input:ProductCreateInput!) { createProduct(input:$input) { ${PRODUCT} } }`, 'createProduct', { input: productInput(input) }, product),
      updateProduct: (productId: number, input: ProductUpdateDto) => execute(`mutation UpdateProduct($id:ID!,$input:ProductUpdateInput!) { updateProduct(id:$id,input:$input) { ${PRODUCT} } }`, 'updateProduct', { id: String(productId), input: productInput(input) }, product),
      deleteProduct: (productId: number) => execute<boolean, boolean>('mutation DeleteProduct($id:ID!) { deleteProduct(id:$id) }', 'deleteProduct', { id: String(productId) }, value => value),
    },
    cart: {
      getCart: () => readCart(`query Cart { cart { ${CART} } }`, 'cart', {}),
      addToCart: (input: { productId: number; quantity: number }) => readCart(`mutation AddCartItem($id:ID!,$quantity:Int!) { addCartItem(productId:$id,quantity:$quantity) { ${CART} } }`, 'addCartItem', { id: String(input.productId), quantity: input.quantity }),
      updateCartItem: (productId: number, input: { quantity: number }) => readCart(`mutation UpdateCartItem($id:ID!,$quantity:Int!) { updateCartItem(productId:$id,quantity:$quantity) { ${CART} } }`, 'updateCartItem', { id: String(productId), quantity: input.quantity }),
      removeFromCart: (productId: number) => readCart(`mutation RemoveCartItem($id:ID!) { removeCartItem(productId:$id) { ${CART} } }`, 'removeCartItem', { id: String(productId) }),
      clearCart: () => readCart(`mutation ClearCart { clearCart { ${CART} } }`, 'clearCart', {}),
    },
    orders: {
      async getUserOrders(pageNumber = 0, size = 10, status?: OrderStatus) {
        // Admin profile pages also mean "my orders", whereas an unfiltered GraphQL query means all orders for admins.
        const user = await api.get<User>('/api/v1/users/me');
        return orderPage({ page: pageNumber, size, status, username: user.data.username });
      },
      getAllOrders: (pageNumber = 0, size = 10, status?: OrderStatus) => orderPage({ page: pageNumber, size, status }),
      getOrderById: (orderId: number) => readOrder(`query Order($id:ID!) { order(id:$id) { ${ORDER} } }`, 'order', { id: String(orderId) }),
      createOrder: (address: Address) => readOrder(`mutation Checkout($address:AddressInput!) { checkout(address:$address) { ${ORDER} } }`, 'checkout', { address }),
      updateOrderStatus: (orderId: number, status: OrderStatus) => readOrder(`mutation UpdateOrderStatus($id:ID!,$status:OrderStatus!) { updateOrderStatus(id:$id,status:$status) { ${ORDER} } }`, 'updateOrderStatus', { id: String(orderId), status }),
      cancelOrder: (orderId: number) => readOrder(`mutation CancelOrder($id:ID!) { cancelOrder(id:$id) { ${ORDER} } }`, 'cancelOrder', { id: String(orderId) }),
    },
    inventory: {
      list: (params: { page?: number; size?: number; search?: string; category?: string; status?: StockStatus; lowStockThreshold?: number } = {}) => execute<WirePage<WireInventory>, PageDto<InventoryItem>>(
        `query Inventory($page:Int!,$size:Int!,$search:String,$category:String,$status:StockStatus,$lowStockThreshold:Int!) {
          inventory(page:$page,size:$size,search:$search,category:$category,status:$status,lowStockThreshold:$lowStockThreshold) {
            total page size items { ${INVENTORY} }
          }
        }`, 'inventory', { page: 0, size: 20, lowStockThreshold: 10, ...Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined)) }, value => page(value, inventoryItem)),
      get: (productId: number, lowStockThreshold = 10) => execute(`query InventoryItem($id:ID!,$threshold:Int!) { inventoryItem(productId:$id,lowStockThreshold:$threshold) { ${INVENTORY} } }`, 'inventoryItem', { id: String(productId), threshold: lowStockThreshold }, inventoryItem),
      adjust: (productId: number, input: InventoryAdjustmentRequest) => execute(`mutation AdjustInventory($id:ID!,$input:InventoryAdjustmentInput!) { adjustInventory(productId:$id,input:$input) { ${MOVEMENT} } }`, 'adjustInventory', { id: String(productId), input }, movement),
      movements: (productId: number, pageNumber = 0, size = 20) => execute<WirePage<WireMovement>, PageDto<InventoryMovement>>(`query InventoryMovements($id:ID!,$page:Int!,$size:Int!) { inventoryMovements(productId:$id,page:$page,size:$size) { total page size items { ${MOVEMENT} } } }`, 'inventoryMovements', { id: String(productId), page: pageNumber, size }, value => page(value, movement)),
    },
  };
}
