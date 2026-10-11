'use client'

import { useEffect, useState } from 'react'
import { Heart, ShoppingCart, Star, Share2, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { mockProducts } from '@/data/mockProducts'
import { Product } from '@/types/product'
import { getDemoSession } from '@/lib/demoAuth'
import { usePathname } from 'next/navigation'
import AuthPrompt from '@/components/AuthPrompt'

export default function ProductDetailsPage({ params }: { params: { slug: string } }) {
  const pathname = usePathname()
  const product = mockProducts.find((p) => p.id.toString() === params.slug) || mockProducts[0]
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authPromptOpen, setAuthPromptOpen] = useState(false)
  const [cartMessage, setCartMessage] = useState('')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const productImages = product.images?.length ? product.images : [product.image]

  useEffect(() => {
    setIsAuthenticated(Boolean(getDemoSession()))
  }, [])

  useEffect(() => {
    if (!isImageModalOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsImageModalOpen(false)
      if (productImages.length > 1 && event.key === 'ArrowRight') {
        setSelectedImageIndex((current) => (current + 1) % productImages.length)
      }
      if (productImages.length > 1 && event.key === 'ArrowLeft') {
        setSelectedImageIndex((current) => (current - 1 + productImages.length) % productImages.length)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isImageModalOpen, productImages.length])

  const relatedProducts = mockProducts.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 4)

  const discountPercentage =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) * 100
        )
      : 0

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      setAuthPromptOpen(true)
      return
    }

    let cart: { product: Product; quantity: number }[] = []
    try {
      cart = JSON.parse(sessionStorage.getItem('atelier.demo.cart') || '[]') as { product: Product; quantity: number }[]
    } catch {
      cart = []
    }
    const existingLine = cart.find((line) => line.product.id === product.id)
    const updatedCart = existingLine
      ? cart.map((line) => line.product.id === product.id ? { ...line, quantity: line.quantity + quantity } : line)
      : [...cart, { product, quantity }]
    sessionStorage.setItem('atelier.demo.cart', JSON.stringify(updatedCart))
    setCartMessage(`${product.name} added to your cart.`)
  }

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
              <button type="button" onClick={() => setIsImageModalOpen(true)} aria-label={`View ${product.name} image larger`} className="block h-full w-full cursor-zoom-in">
                <img
                  src={productImages[selectedImageIndex]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </button>
              {discountPercentage > 0 && (
                <div className="absolute left-4 top-4 rounded-full bg-red-500 px-3 py-1 text-sm font-bold text-white">
                  -{discountPercentage}%
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {productImages.map((image, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedImageIndex(i)
                    setIsImageModalOpen(true)
                  }}
                  aria-label={`View image ${i + 1} larger`}
                  className={`h-20 w-20 overflow-hidden rounded-lg border-2 ${selectedImageIndex === i ? 'border-blue-600' : 'border-gray-300 hover:border-blue-600'}`}
                >
                  <img
                    src={image}
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
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
                </button>
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      setAuthPromptOpen(true)
                      return
                    }
                    setIsFavorite(!isFavorite)
                  }}
                  aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
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
              {cartMessage && <p role="status" className="text-sm text-green-700">{cartMessage}</p>}
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

        {isImageModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label={`${product.name} image gallery`}
            onClick={() => setIsImageModalOpen(false)}
          >
            <button type="button" onClick={() => setIsImageModalOpen(false)} aria-label="Close image gallery" className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
              <X size={24} />
            </button>
            <div className="flex h-full w-full max-w-6xl flex-col items-center justify-center gap-4" onClick={(event) => event.stopPropagation()}>
              <div className="flex min-h-0 w-full flex-1 items-center justify-center gap-2 sm:gap-6">
                {productImages.length > 1 && <button type="button" onClick={() => setSelectedImageIndex((current) => (current - 1 + productImages.length) % productImages.length)} aria-label="Previous image" className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><ChevronLeft size={28} /></button>}
                <img src={productImages[selectedImageIndex]} alt={`${product.name}, image ${selectedImageIndex + 1} of ${productImages.length}`} className="max-h-[78vh] max-w-[calc(100%-3.5rem)] object-contain sm:max-w-[calc(100%-7rem)]" />
                {productImages.length > 1 && <button type="button" onClick={() => setSelectedImageIndex((current) => (current + 1) % productImages.length)} aria-label="Next image" className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><ChevronRight size={28} /></button>}
              </div>
              {productImages.length > 1 && <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
                {productImages.map((image, index) => <button key={index} type="button" onClick={() => setSelectedImageIndex(index)} aria-label={`Select image ${index + 1}`} aria-pressed={selectedImageIndex === index} className={`h-14 w-14 flex-none overflow-hidden rounded border-2 ${selectedImageIndex === index ? 'border-white' : 'border-white/30 opacity-70'}`}><img src={image} alt="" className="h-full w-full object-cover" /></button>)}
              </div>}
            </div>
          </div>
        )}

        {authPromptOpen && <AuthPrompt returnTo={pathname || `/products/${params.slug}`} onClose={() => setAuthPromptOpen(false)} />}

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
