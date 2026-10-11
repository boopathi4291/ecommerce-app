'use client'

import { useState } from 'react'
import ProductCard from './ProductCard'
import { Product } from '@/types/product'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ProductShowcaseProps {
  title: string
  subtitle?: string
  products: Product[]
  onAddToCart?: (product: Product) => void
  onFavoriteToggle?: (productId: string | number) => void
}

export default function ProductShowcase({
  title,
  subtitle,
  products,
  onAddToCart,
  onFavoriteToggle,
}: ProductShowcaseProps) {
  const [scrollPosition, setScrollPosition] = useState(0)

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('product-scroll')
    if (container) {
      const scrollAmount = 350
      if (direction === 'left') {
        container.scrollLeft -= scrollAmount
      } else {
        container.scrollLeft += scrollAmount
      }
      setScrollPosition(container.scrollLeft)
    }
  }

  return (
    <section className="py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
        </div>
        <div className="hidden gap-2 md:flex">
          <button
            onClick={() => scroll('left')}
            className="rounded-lg border border-gray-300 p-2 hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="rounded-lg border border-gray-300 p-2 hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        id="product-scroll"
        className="flex gap-6 overflow-x-auto scroll-smooth pb-2"
        style={{ scrollBehavior: 'smooth' }}
      >
        {products.map((product) => (
          <div key={product.id} className="flex-shrink-0 w-72">
            <ProductCard
              product={product}
              onAddToCart={onAddToCart}
              onFavoriteToggle={onFavoriteToggle}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
