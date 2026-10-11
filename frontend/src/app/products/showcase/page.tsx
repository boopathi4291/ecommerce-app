'use client'

import ProductShowcase from '@/components/Products/ProductShowcase'
import { mockProducts } from '@/data/mockProducts'

const bestSellers = mockProducts.filter((p) => p.badge === 'Best Seller' || (p.rating ?? 0) > 4.5)
const newProducts = mockProducts.filter((p) => p.badge === 'New')
const onSale = mockProducts.filter((p) => p.originalPrice && p.originalPrice > p.price)

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-16 text-center text-white">
        <h1 className="text-4xl font-bold">Welcome to Our Store</h1>
        <p className="mt-4 text-lg opacity-90">
          Discover amazing products curated just for you
        </p>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12">
        <ProductShowcase
          title="Best Sellers"
          subtitle="Most loved by our customers"
          products={bestSellers}
        />

        <div className="my-16 border-t border-gray-200" />

        <ProductShowcase
          title="New Arrivals"
          subtitle="Fresh products added this week"
          products={newProducts}
        />

        <div className="my-16 border-t border-gray-200" />

        <ProductShowcase
          title="Special Offers"
          subtitle="Limited time deals on popular items"
          products={onSale}
        />
      </div>
    </div>
  )
}
