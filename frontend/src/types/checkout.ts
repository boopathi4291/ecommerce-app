import { Product } from '@/types/product'

export interface CartLine {
  product: Product
  quantity: number
}

export type PaymentMethod = 'upi' | 'paypal' | 'zelle' | 'online-banking' | 'card'

export interface ShippingDetails {
  fullName: string
  email: string
  mobile: string
  address: string
  city: string
  postalCode: string
}

export interface DemoOrder {
  id: string
  userId: string
  trackingCode: string
  paymentMethod: PaymentMethod
  paymentStatus: 'paid'
  createdAt: string
  currency: string
  items: CartLine[]
  shipping: ShippingDetails
  total: number
}