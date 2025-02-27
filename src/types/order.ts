export interface OrderDto {
  id: number;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItemDto[];
}

export interface OrderItemDto {
  id: number;
  productName: string;
  quantity: number;
  price: number;
}

export interface PageDtoOrderDto {
  content: OrderDto[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
} 