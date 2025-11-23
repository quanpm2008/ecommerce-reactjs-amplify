// Product Types
export interface Product {
  productId: string;
  name: string;
  price: number;
  category?: string;
  pictures?: string[];
  tags?: string[];
  package?: ProductPackage;
  createdDate?: string;
  modifiedDate?: string;
  quantity?: number;
}

export interface ProductPackage {
  weight?: number;
  width?: number;
  length?: number;
  height?: number;
}

export interface PaginatedProducts {
  products: Product[];
  nextToken?: string;
}

// Order Types
export interface Order {
  orderId: string;
  userId: string;
  status: OrderStatus;
  total: number;
  createdDate: string;
  modifiedDate?: string;
  products: OrderProduct[];
  address: Address;
  deliveryPrice: number;
  paymentToken?: string;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PACKAGING = 'PACKAGING',
  PACKAGED = 'PACKAGED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface OrderProduct {
  productId: string;
  name?: string;
  price: number;
  quantity: number;
}

export interface Address {
  name: string;
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  postCode?: string;
  phoneNumber: string;
}

export interface PaginatedOrders {
  orders: Order[];
  nextToken?: string;
}

// Delivery Types
export interface DeliveryPricingInput {
  products: OrderProduct[];
  address: Address;
}

export interface DeliveryPricingResponse {
  pricing: number;
}

export interface Delivery {
  orderId: string;
  address: Address;
}

export interface PaginatedDeliveries {
  deliveries: Delivery[];
  nextToken?: string;
}

export interface DeliveryInput {
  orderId: string;
}

// Cart Types
export interface CartItem {
  product: Product;
  quantity: number;
}

// Request/Response Types
export interface CreateOrderRequest {
  products: OrderProduct[];
  address: Address;
  deliveryPrice: number;
  paymentToken: string;
}

export interface CreateOrderResponse {
  success: boolean;
  order?: Order;
  message?: string;
  errors?: string[];
}

// Warehouse Types
export interface PackagingRequest {
  orderId: string;
  status: string;
  products: PackagingRequestProduct[];
}

export interface PackagingRequestProduct {
  productId: string;
  quantity: number;
}

export interface PaginatedPackagingRequestIds {
  packagingRequestIds: string[];
  nextToken?: string;
}

export interface PackagingInput {
  orderId: string;
}

export interface UpdatePackagingProductInput {
  orderId: string;
  productId: string;
  quantity: number;
}

export interface Response {
  success: boolean;
}
