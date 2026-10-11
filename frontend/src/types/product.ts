export interface Product {
  id: string | number
  name: string
  description?: string
  price: number
  originalPrice?: number
  discount?: number
  rating?: number
  reviews?: number
  image: string
  images?: string[]
  category: string
  stock: number
  badge?: string
  isFavorite?: boolean
}

export interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
  onFavoriteToggle?: (productId: string | number) => void
  showRating?: boolean
  showStock?: boolean
}
