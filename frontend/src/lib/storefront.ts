export type Category = {
  id: string
  name: string
  image?: string | null
  mongoId?: string
}

export type ProductGalleryItem = {
  id: string
  label: string
  accent: string
  imageUrl?: string
}

export type Product = {
  id: string
  name: string
  brand: string
  category: string
  categoryLabel: string
  size: string
  price: number
  originalPrice?: number
  badge?: string
  offer?: string
  accent: string
  imageLabel: string
  images?: string[]
  description?: string
  stock?: number
  maxPerOrder?: number | null
  expirationDate?: string | null
  benefits?: string[]
  storage?: string
  tags?: string[]
  gallery?: ProductGalleryItem[]
  relatedIds?: string[]
  isBestSeller?: boolean
  isNewArrival?: boolean
}

export const formatPrice = (price: number) => {
  const hasDecimals = !Number.isInteger(price)

  return `₹${hasDecimals ? price.toFixed(2) : price}`
}
