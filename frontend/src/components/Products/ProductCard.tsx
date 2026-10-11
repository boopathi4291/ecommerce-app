'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, ShoppingBag, ShoppingCart, Star } from 'lucide-react'
import { Product } from '@/types/product'
import { formatCurrency } from '@/lib/formatCurrency'
import { Language, storeLabels, translateCategory } from '@/lib/locales'

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => boolean | void
  onBuyNow?: (product: Product) => void
  onFavoriteToggle?: (productId: string | number) => boolean | void
  showRating?: boolean
  showStock?: boolean
  currency?: string
  locale?: string
  language?: Language
}

export default function ProductCard({
  product,
  onAddToCart,
  onBuyNow,
  onFavoriteToggle,
  showRating = true,
  showStock = true,
  currency = 'INR',
  locale = 'en-IN',
  language = 'en',
}: ProductCardProps) {
  const labels = storeLabels[language]
  const [isFavorite, setIsFavorite] = useState(product.isFavorite || false)
  const [isAdding, setIsAdding] = useState(false)

  const handleFavoriteClick = () => {
    const allowed = onFavoriteToggle?.(product.id)
    if (allowed !== false) setIsFavorite(!isFavorite)
  }

  const handleAddToCart = async () => {
    setIsAdding(true)
    try {
      const added = onAddToCart?.(product)
      if (added !== false) await new Promise((resolve) => setTimeout(resolve, 500))
    } finally {
      setIsAdding(false)
    }
  }

  const handleBuyNow = () => {
    if (onBuyNow) onBuyNow(product)
    else onAddToCart?.(product)
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
        <Link href={`/products/${product.id}`} aria-label={`View ${product.name} details`} className="block h-full w-full">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </Link>

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
          <div className={`absolute left-3 ${product.badge ? 'top-12' : 'top-3'} rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white`}>
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
          {translateCategory(product.category, language)}
        </p>

        <h3 className="mt-2 line-clamp-2 font-semibold text-gray-900 hover:text-blue-600">
          <Link href={`/products/${product.id}`}>
            {product.name}
          </Link>
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
          <span className="text-xl font-bold text-gray-900">{formatCurrency(product.price, currency, locale)}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-sm text-gray-400 line-through">{formatCurrency(product.originalPrice, currency, locale)}</span>
          )}
        </div>

        {showStock && (
          <div className="mt-2">
            {isOutOfStock ? (
              <p className="text-xs font-medium text-red-600">{labels.outOfStock}</p>
            ) : product.stock < 5 ? (
              <p className="text-xs font-medium text-orange-600">{labels.lowStock.replace('{count}', String(product.stock))}</p>
            ) : (
              <p className="text-xs font-medium text-green-600">{labels.inStock}</p>
            )}
          </div>
        )}

        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || isAdding}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingCart className="h-5 w-5" />
          {isAdding ? labels.adding : labels.addToCart}
        </button>
        <button
          onClick={handleBuyNow}
          disabled={isOutOfStock || isAdding}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-[#294334] bg-[#294334] px-4 py-2.5 font-semibold text-white transition hover:bg-[#1e3327] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingBag className="h-5 w-5" />
          {labels.buyNow}
        </button>
      </div>
    </div>
  )
}
