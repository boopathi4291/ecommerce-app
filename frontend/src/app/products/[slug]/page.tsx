'use client'

import { useState } from 'react'
import { Heart, ShoppingCart, Star, Share2, ChevronLeft, ChevronRight } from 'lucide-react'
import { mockProducts } from '@/data/mockProducts'

export default function ProductDetailsPage({ params }: { params: { slug: string } }) {
  const product = mockProducts.find((p) => p.id.toString() === params.slug) || mockProducts[0]
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const relatedProducts = mockProducts.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 4)

  const discountPercentage =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) * 100
        )
      : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-8 text-sm text-gray-600">
          <a href="/" className="hover:text-blue-600">Home</a> / 
          <a href="/products" className="hover:text-blue-600"> Products</a> / 
          <span className="text-gray-900 font-semibold"> {product.name}</span>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl bg-gray-100 aspect-square">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
              {discountPercentage > 0 && (
                <div className="absolute left-4 top-4 rounded-full bg-red-500 px-3 py-1 text-sm font-bold text-white">
                  -{discountPercentage}%
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <button
                  key={i}
                  className="h-20 w-20 overflow-hidden rounded-lg border-2 border-gray-300 hover:border-blue-600"
                >
                  <img
                    src={product.image}
                    alt={`View ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-gray-600 mb-2">
                {product.category}
              </p>
              <h1 className="text-4xl font-bold text-gray-900">{product.name}</h1>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-700">
                {product.rating} ({product.reviews} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-gray-900">₹{product.price}</span>
                {product.originalPrice && (
                  <span className="text-xl text-gray-400 line-through">₹{product.originalPrice}</span>
                )}
              </div>
              {discountPercentage > 0 && (
                <p className="text-green-600 font-semibold">You save ₹{product.originalPrice! - product.price}</p>
              )}
            </div>

            {/* Stock Status */}
            <div className="p-4 rounded-lg bg-gray-100">
              {product.stock > 0 ? (
                <p className="text-green-600 font-semibold">✓ In Stock ({product.stock} available)</p>
              ) : (
                <p className="text-red-600 font-semibold">Out of Stock</p>
              )}
            </div>

            {/* Quantity and Actions */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100"
                  >
                    −
                  </button>
                  <span className="px-6 py-2 font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  disabled={product.stock === 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
                </button>
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                >
                  <Heart
                    className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                  />
                </button>
                <button className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                  <Share2 className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="border-t border-gray-200 pt-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">About this product</h3>
              <p className="text-gray-600 leading-relaxed">
                {product.description || 'Premium quality product with excellent features. Perfect for daily use and long-lasting durability.'}
              </p>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 border-t border-gray-200 pt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Products</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-gray-200 bg-white overflow-hidden hover:shadow-lg transition"
                >
                  <img src={p.image} alt={p.name} className="w-full h-48 object-cover" />
                  <div className="p-4">
                    <p className="text-xs uppercase text-gray-500 mb-1">{p.category}</p>
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">{p.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">₹{p.price}</span>
                      {p.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">₹{p.originalPrice}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
