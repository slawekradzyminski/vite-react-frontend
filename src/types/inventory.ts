export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export type InventoryMovementType =
  | 'INITIAL_STOCK'
  | 'ADMIN_ADJUSTMENT'
  | 'ORDER_DEDUCTED'
  | 'ORDER_RESTORED';

export interface PageDto<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export interface InventoryItem {
  productId: number;
  name: string;
  category: string;
  availableQuantity: number;
  stockStatus: StockStatus;
  lastChangedAt?: string | null;
}

export interface InventoryMovement {
  id: number;
  productId: number;
  orderId?: number | null;
  type: InventoryMovementType;
  delta: number;
  quantityAfter: number;
  actor: string;
  reason: string;
  requestId?: string | null;
  createdAt: string;
}

export interface InventoryAdjustmentRequest {
  delta: number;
  reason: string;
  requestId: string;
}
