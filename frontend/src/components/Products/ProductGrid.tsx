'use client'

import ProductCard from './ProductCard'
import { Product } from '@/types/product'
import { Language } from '@/lib/locales'

interface ProductGridProps {
  products: Product[]
  onAddToCart?: (product: Product) => boolean | void
  onBuyNow?: (product: Product) => void
  onFavoriteToggle?: (productId: string | number) => boolean | void
  columns?: 'auto' | 1 | 2 | 3 | 4
  gap?: 'small' | 'medium' | 'large'
  currency?: string
  locale?: string
  language?: Language
}

const columnClasses = {
  auto: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
}

const gapClasses = {
  small: 'gap-4',
  medium: 'gap-6',
  large: 'gap-8',
}

export default function ProductGrid({
  products,
  onAddToCart,
  onBuyNow,
  onFavoriteToggle,
  columns = 'auto',
  gap = 'medium',
  currency,
  locale,
  language,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">No products found</p>
          <p className="mt-2 text-sm text-gray-600">Try adjusting your filters</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]}`}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onBuyNow={onBuyNow}
          onFavoriteToggle={onFavoriteToggle}
          currency={currency}
          locale={locale}
          language={language}
        />
      ))}
    </div>
  )
}
