const storefrontProducts = [
  {
    id: 'broccoli',
    name: 'Organic Green Broccoli',
    brand: 'Farm Fresh',
    category: 'vegetables',
    categoryLabel: 'Vegetables',
    size: '500g',
    price: 45,
    originalPrice: 59,
    badge: 'Fresh',
    accent: '#9CD56A',
    imageLabel: 'Broccoli Image',
    description:
      'Fresh-cut broccoli florets packed with crunch and color for stir fries, soups, and salads.',
    stock: 18,
    benefits: [
      'Rich in fiber and folate',
      'Delivers a fresh farm-picked crunch'
    ],
    storage:
      'Keep refrigerated and use within 3 days for the best texture.',
    tags: ['Fresh Today', 'Organic Certified'],
    gallery: [
      { id: 'broccoli-main', label: 'Broccoli Hero', accent: '#9CD56A' },
      { id: 'broccoli-cut', label: 'Cut Florets', accent: '#7FB95C' },
      { id: 'broccoli-salad', label: 'Salad Bowl', accent: '#A8DC7C' },
      { id: 'broccoli-farm', label: 'Farm Harvest', accent: '#B8E58F' }
    ],
    relatedIds: ['cucumber', 'basil', 'olive-oil', 'mozzarella']
  },
  {
    id: 'tomatoes',
    name: 'Fresh Organic Vine Tomatoes',
    brand: 'Heritage Collection',
    category: 'vegetables',
    categoryLabel: 'Vegetables',
    size: '500g Pack',
    price: 4.99,
    originalPrice: 6.5,
    badge: 'Fresh Today',
    accent: '#F1694B',
    imageLabel: 'Tomato Image',
    description:
      'Sun-ripened tomatoes with a deep red color, balanced sweetness, and a bright garden finish that works beautifully in salads, sauces, and sandwiches.',
    stock: 12,
    benefits: [
      'Pesticide free with natural farming practices',
      'High in lycopene and vitamin C'
    ],
    storage:
      'Store at room temperature until perfectly ripe, then refrigerate for up to 2 days.',
    tags: ['Organic Certified', 'Fresh Today'],
    gallery: [
      { id: 'tomatoes-main', label: 'Tomato Hero', accent: '#F1694B' },
      { id: 'tomatoes-slice', label: 'Tomato Slice', accent: '#FF8E72' },
      { id: 'tomatoes-vine', label: 'Tomato Vine', accent: '#D55437' },
      { id: 'tomatoes-basket', label: 'Tomato Basket', accent: '#E97C62' }
    ],
    relatedIds: ['cucumber', 'basil', 'olive-oil', 'mozzarella']
  },
  {
    id: 'milk',
    name: 'Fresh Full Cream Milk',
    brand: 'Dairy Best',
    category: 'dairy',
    categoryLabel: 'Dairy & Eggs',
    size: '500ml',
    price: 32,
    badge: 'Top Rated',
    accent: '#F4D35E',
    imageLabel: 'Milk Image',
    description:
      'Creamy full-fat milk sourced daily, ideal for tea, coffee, and breakfast bowls.',
    stock: 26
  },
  {
    id: 'bread',
    name: 'Multigrain Brown Bread',
    brand: 'Daily Bake',
    category: 'munchies',
    categoryLabel: 'Munchies',
    size: '400g',
    price: 55,
    accent: '#C89F7A',
    imageLabel: 'Bread Image',
    description:
      'Soft sliced bread made with multigrain flour for hearty sandwiches and toast.',
    stock: 10
  },
  {
    id: 'chips',
    name: 'Classic Salted Potato Chips',
    brand: 'Munchies',
    category: 'munchies',
    categoryLabel: 'Munchies',
    size: '150g',
    price: 30,
    accent: '#F6C453',
    imageLabel: 'Chips Image',
    description:
      'Thin, crispy chips with a clean salted finish for snack time cravings.',
    stock: 20
  },
  {
    id: 'berry-blast',
    name: 'Cold Pressed Berry Blast',
    brand: 'New Launch',
    category: 'beverages',
    categoryLabel: 'Beverages',
    size: '250ml',
    price: 120,
    accent: '#F58AA0',
    imageLabel: 'Berry Drink',
    description: 'Cold pressed mixed berry juice with no added sugar.',
    stock: 16
  },
  {
    id: 'dark-chocolate',
    name: 'Dark Sea Salt Chocolate',
    brand: 'Artisanal',
    category: 'munchies',
    categoryLabel: 'Munchies',
    size: '80g',
    price: 185,
    accent: '#7C4A3D',
    imageLabel: 'Chocolate Bar',
    description: 'Small-batch dark chocolate finished with sea salt flakes.',
    stock: 14
  },
  {
    id: 'cucumber',
    name: 'Organic Cucumber',
    brand: 'Vegetables',
    category: 'vegetables',
    categoryLabel: 'Vegetables',
    size: '1 pc',
    price: 1.2,
    accent: '#8FD67F',
    imageLabel: 'Cucumber Image'
  },
  {
    id: 'basil',
    name: 'Fresh Sweet Basil',
    brand: 'Herbs',
    category: 'vegetables',
    categoryLabel: 'Herbs',
    size: '25g',
    price: 0.95,
    accent: '#4CB35E',
    imageLabel: 'Basil Image'
  },
  {
    id: 'olive-oil',
    name: 'Extra Virgin Olive Oil',
    brand: 'Pantry',
    category: 'beverages',
    categoryLabel: 'Pantry',
    size: '250ml',
    price: 12.5,
    accent: '#9EBE5A',
    imageLabel: 'Olive Oil Image'
  },
  {
    id: 'mozzarella',
    name: 'Buffalo Mozzarella',
    brand: 'Dairy',
    category: 'dairy',
    categoryLabel: 'Dairy',
    size: '1kg',
    price: 3.25,
    accent: '#D6E5C6',
    imageLabel: 'Mozzarella Image'
  }
]

const getStorefrontProducts = () => storefrontProducts

const findStorefrontProductById = (id) =>
  storefrontProducts.find((product) => product.id === id)

const searchStorefrontProducts = (query = '') => {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return storefrontProducts
  }

  return storefrontProducts.filter((product) =>
    [
      product.name,
      product.brand,
      product.category,
      product.categoryLabel,
      product.size
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalizedQuery))
  )
}

module.exports = {
  storefrontProducts,
  getStorefrontProducts,
  findStorefrontProductById,
  searchStorefrontProducts
}
