export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'

export type PaymentMethod =
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'BANK_TRANSFER'
  | 'CASH'
  | 'OTHER'

export type PaymentStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'

export interface Order {
  id: string
  customerId: string
  status: OrderStatus
  subtotal: number
  discount: number
  tax: number
  shippingCost: number
  total: number
  currency: string
  shipAddress?: string
  shipCity?: string
  shipState?: string
  shipPostal?: string
  shipCountry?: string
  notes?: string
  items: OrderItem[]
  payments: Payment[]
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  orderId: string
  variantId: string
  productName: string
  variantSku: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

export interface Payment {
  id: string
  orderId: string
  amount: number
  currency: string
  method: PaymentMethod
  status: PaymentStatus
  gatewayReference?: string
  paidAt?: string
  createdAt: string
}
