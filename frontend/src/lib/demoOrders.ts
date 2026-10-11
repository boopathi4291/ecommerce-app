import { CartLine, DemoOrder } from '@/types/checkout'

const CART_KEY = 'atelier.demo.cart'
const ORDERS_KEY = 'atelier.demo.orders'

export function readDemoCart(): CartLine[] {
  try {
    const value = JSON.parse(sessionStorage.getItem(CART_KEY) || '[]') as CartLine[]
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function writeDemoCart(cart: CartLine[]): void {
  sessionStorage.setItem(CART_KEY, JSON.stringify(cart))
}

export function readDemoOrders(): DemoOrder[] {
  try {
    const value = JSON.parse(sessionStorage.getItem(ORDERS_KEY) || '[]') as DemoOrder[]
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function saveDemoOrder(order: DemoOrder): void {
  sessionStorage.setItem(ORDERS_KEY, JSON.stringify([...readDemoOrders(), order]))
}

export function findDemoOrder(orderId: string, userId: string): DemoOrder | null {
  return readDemoOrders().find((order) => order.id === orderId && order.userId === userId && order.paymentStatus === 'paid') ?? null
}