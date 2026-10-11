'use client'

import { useState } from 'react'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import { Product } from '@/types/product'

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
  onFavoriteToggle?: (productId: string | number) => void
  showRating?: boolean
  showStock?: boolean
}

export default function ProductCard({
  product,
  onAddToCart,
  onFavoriteToggle,
  showRating = true,
  showStock = true,
}: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(product.isFavorite || false)
  const [isAdding, setIsAdding] = useState(false)

  const handleFavoriteClick = () => {
    setIsFavorite(!isFavorite)
    onFavoriteToggle?.(product.id)
  }

  const handleAddToCart = async () => {
    setIsAdding(true)
    try {
      onAddToCart?.(product)
      await new Promise((resolve) => setTimeout(resolve, 500))
    } finally {
      setIsAdding(false)
    }
  }

  const discountPercentage =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100
        )
      : product.discount

  const isOutOfStock = product.stock <= 0

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
        />

        <button
          onClick={handleFavoriteClick}
          className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow-md transition hover:bg-white"
          aria-label="Add to favorites"
        >
          <Heart
            className={`h-5 w-5 transition ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
          />
        </button>

        {product.badge && (
          <div className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">
            {product.badge}
          </div>
        )}

        {discountPercentage && discountPercentage > 0 && (
          <div className="absolute left-3 top-3 rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white">
            -{discountPercentage}%
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="text-lg font-bold text-white">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {product.category}
        </p>

        <h3 className="mt-2 line-clamp-2 font-semibold text-gray-900 hover:text-blue-600">
          {product.name}
        </h3>

        {showRating && product.rating !== undefined && (
          <div className="mt-2 flex items-center gap-1">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating || 0)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600">
              {product.rating}
              {product.reviews && <span className="text-gray-400"> ({product.reviews})</span>}
            </span>
          </div>
        )}

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-xl font-bold text-gray-900">₹{product.price}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-sm text-gray-400 line-through">₹{product.originalPrice}</span>
          )}
        </div>

        {showStock && (
          <div className="mt-2">
            {isOutOfStock ? (
              <p className="text-xs font-medium text-red-600">Out of Stock</p>
            ) : product.stock < 5 ? (
              <p className="text-xs font-medium text-orange-600">Only {product.stock} left</p>
            ) : (
              <p className="text-xs font-medium text-green-600">In Stock</p>
            )}
          </div>
        )}

        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || isAdding}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingCart className="h-5 w-5" />
          {isAdding ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}
