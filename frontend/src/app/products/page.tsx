'use client'

import { useState } from 'react'
import { Menu, X, Search } from 'lucide-react'
import ProductGrid from '@/components/Products/ProductGrid'
import { mockProducts } from '@/data/mockProducts'
import { Product } from '@/types/product'

const categories = [
  'All Products',
  'Electronics',
  'Fashion',
  'Home & Kitchen',
  'Beauty',
  'Sports',
]

export default function ProductsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('All Products')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('featured')

  const filteredProducts = mockProducts.filter((product) => {
    const matchesCategory =
      selectedCategory === 'All Products' || product.category === selectedCategory
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price
      case 'price-high':
        return b.price - a.price
      case 'rating':
        return (b.rating || 0) - (a.rating || 0)
      case 'newest':
        return b.id - a.id
      default:
        return 0
    }
  })

  const handleAddToCart = (product: Product) => {
    console.log('Added to cart:', product.name)
  }

  const handleFavoriteToggle = (productId: string | number) => {
    console.log('Toggled favorite for:', productId)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg border border-gray-300 p-2 md:hidden"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <div className="hidden flex-1 md:block md:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-8 md:flex-row">
          <aside
            className={`${
              sidebarOpen ? 'block' : 'hidden'
            } w-full space-y-6 md:block md:w-56 md:flex-shrink-0`}
          >
            <div className="rounded-lg border bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Categories
              </h2>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`block w-full rounded-lg px-4 py-2 text-left text-sm font-medium transition ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Sort By</h2>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none focus:border-blue-500"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </aside>

          <main className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold">{sortedProducts.length}</span> products
              </p>
            </div>

            <ProductGrid
              products={sortedProducts}
              onAddToCart={handleAddToCart}
              onFavoriteToggle={handleFavoriteToggle}
              columns="auto"
              gap="medium"
            />
          </main>
        </div>
      </div>
    </div>
  )
}
