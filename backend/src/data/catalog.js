const image = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`

const dairyImages = {
  milk: 'https://res.cloudinary.com/dh6w6qnvb/image/upload/v1777291564/final-project/products/product-1777291561665.jpg',
  curd: 'https://res.cloudinary.com/dh6w6qnvb/image/upload/v1777292780/final-project/products/product-1777292778541.jpg',
  paneer: 'https://res.cloudinary.com/dh6w6qnvb/image/upload/v1777293793/final-project/products/product-1777293790464.jpg',
  eggs: 'https://res.cloudinary.com/dh6w6qnvb/image/upload/v1777291666/final-project/products/product-1777291664294.jpg'
}

const beverageImages = {
  cola: 'https://res.cloudinary.com/dh6w6qnvb/image/upload/v1777359293/final-project/products/product-1777359291209.png',
  fanta: 'https://res.cloudinary.com/dh6w6qnvb/image/upload/v1777357710/final-project/products/product-1777357708428.jpg'
}

const categoryImages = {
  'Fruits & Vegetables': image('photo-1542838132-92c53300491e'),
  'Dairy & Eggs': dairyImages.milk,
  Beverages: image('photo-1600271886742-f049cd451bba'),
  Snacks: image('photo-1566478989037-eec170784d0b'),
  Bakery: image('photo-1509440159596-0249088772ff'),
  Staples: image('photo-1586201375761-83865001e31c'),
  'Instant Food': image('photo-1551183053-bf91a1d81141'),
  'Frozen Food': image('photo-1563805042-7684c019e1cb'),
  'Personal Care': image('photo-1556228720-195a672e8a03'),
  'Household Care': image('photo-1583947215259-38e31be8751f'),
  Breakfast: image('photo-1517673400267-0251440c45dc'),
  'Tea & Coffee': image('photo-1495474472287-4d71bcdd2085')
}

const categorySlug = (value) => value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const product = ({
  name,
  slug,
  brand,
  category,
  subcategory,
  size,
  price,
  originalPrice = null,
  stock,
  imageUrl,
  description,
  maxPerOrder = 8,
  isNewArrival = false,
  featured = false,
  tags = []
}) => {
  const discount = originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0

  return {
    slug,
    name,
    brand,
    category: categorySlug(category),
    categoryLabel: category,
    subcategory,
    size,
    price,
    originalPrice,
    offer: discount > 0 ? `${discount}% off` : '',
    badge: isNewArrival ? 'New' : featured ? 'Featured' : '',
    accent: '#16834a',
    imageLabel: name,
    images: [imageUrl],
    description,
    stock,
    maxPerOrder,
    expirationDate: null,
    benefits: [],
    storage: '',
    tags: [brand, category, subcategory, ...tags],
    relatedIds: [],
    isBestSeller: false,
    isNewArrival,
    featured,
    publish: true
  }
}

const products = [
  product({ name: 'Fresh Shimla Apples', slug: 'fresh-shimla-apples', brand: 'Buy Best Fresh', category: 'Fruits & Vegetables', subcategory: 'Fresh Fruits', size: '4 pieces (approx. 600 g)', price: 149, originalPrice: 179, stock: 36, imageUrl: image('photo-1560806887-1e4cd0b6cbd6'), description: 'Crisp whole apples supplied as a four-piece pack. Wash before eating.', featured: true, tags: ['apple', 'fruit'] }),
  product({ name: 'Robusta Bananas', slug: 'robusta-bananas', brand: 'Buy Best Fresh', category: 'Fruits & Vegetables', subcategory: 'Fresh Fruits', size: '6 pieces', price: 54, originalPrice: 60, stock: 42, imageUrl: image('photo-1603833665858-e61d17a86224'), description: 'A six-piece pack of fresh Robusta bananas.', tags: ['banana', 'fruit'] }),
  product({ name: 'Farm Fresh Tomatoes', slug: 'farm-fresh-tomatoes', brand: 'Buy Best Fresh', category: 'Fruits & Vegetables', subcategory: 'Fresh Vegetables', size: '500 g', price: 32, originalPrice: 40, stock: 50, imageUrl: image('photo-1592924357228-91a4daadcfea'), description: 'Fresh tomatoes packed by weight for everyday cooking.', tags: ['tomato', 'vegetable'] }),
  product({ name: 'Fresh Potatoes', slug: 'fresh-potatoes', brand: 'Buy Best Fresh', category: 'Fruits & Vegetables', subcategory: 'Fresh Vegetables', size: '1 kg', price: 42, stock: 48, imageUrl: image('photo-1518977676601-b53f82aba655'), description: 'Everyday potatoes supplied in a one-kilogram pack.', tags: ['potato', 'vegetable'] }),
  product({ name: 'Amul Shakti Milk', slug: 'amul-shakti-milk', brand: 'Amul', category: 'Dairy & Eggs', subcategory: 'Milk', size: '500 ml', price: 28, originalPrice: 30, stock: 40, imageUrl: dairyImages.milk, description: 'Packaged dairy milk in a 500 ml pouch. Keep refrigerated.', maxPerOrder: 6, featured: true, tags: ['milk', 'dairy'] }),
  product({ name: 'Amul Plain Dahi', slug: 'amul-plain-dahi', brand: 'Amul', category: 'Dairy & Eggs', subcategory: 'Curd', size: '400 g', price: 35, originalPrice: 38, stock: 32, imageUrl: dairyImages.curd, description: 'Plain packaged curd for meals, raita and everyday use. Keep refrigerated.', maxPerOrder: 6, tags: ['curd', 'dahi'] }),
  product({ name: 'Amul Fresh Paneer', slug: 'amul-fresh-paneer', brand: 'Amul', category: 'Dairy & Eggs', subcategory: 'Paneer', size: '200 g', price: 95, originalPrice: 100, stock: 24, imageUrl: dairyImages.paneer, description: 'Packaged paneer for curries, snacks and salads. Keep refrigerated.', maxPerOrder: 4, tags: ['paneer'] }),
  product({ name: 'Buy Best Fresh Brown Eggs', slug: 'buy-best-fresh-brown-eggs', brand: 'Buy Best Fresh', category: 'Dairy & Eggs', subcategory: 'Eggs', size: 'pack of 6', price: 69, originalPrice: 75, stock: 28, imageUrl: dairyImages.eggs, description: 'Six brown table eggs packed in a protective carton.', maxPerOrder: 4, tags: ['egg'] }),
  product({ name: 'Coca-Cola Original Taste', slug: 'coca-cola-original-taste', brand: 'Coca-Cola', category: 'Beverages', subcategory: 'Soft Drinks', size: '300 ml can', price: 40, stock: 34, imageUrl: beverageImages.cola, description: 'Carbonated soft drink in a 300 ml can. Serve chilled.', maxPerOrder: 6, tags: ['cola', 'soft drink'] }),
  product({ name: 'Fanta Orange', slug: 'fanta-orange', brand: 'Fanta', category: 'Beverages', subcategory: 'Soft Drinks', size: '300 ml can', price: 40, stock: 29, imageUrl: beverageImages.fanta, description: 'Orange-flavoured carbonated soft drink in a 300 ml can. Serve chilled.', maxPerOrder: 6, tags: ['orange drink', 'soft drink'] }),
  product({ name: 'Buy Best Orange Juice', slug: 'buy-best-orange-juice', brand: 'Buy Best Beverages', category: 'Beverages', subcategory: 'Juices', size: '1 L', price: 115, originalPrice: 125, stock: 21, imageUrl: image('photo-1600271886742-f049cd451bba'), description: 'Ready-to-serve orange beverage in a one-litre carton.', tags: ['juice', 'orange drink'] }),
  product({ name: 'Buy Best Masala Potato Chips', slug: 'buy-best-masala-potato-chips', brand: 'Buy Best Snacks', category: 'Snacks', subcategory: 'Chips', size: '82 g', price: 50, stock: 44, imageUrl: image('photo-1566478989037-eec170784d0b'), description: 'Potato chips with a spiced masala seasoning.', maxPerOrder: 8, tags: ['chips', 'namkeen'] }),
  product({ name: 'Buy Best Glucose Biscuits', slug: 'buy-best-glucose-biscuits', brand: 'Buy Best Snacks', category: 'Snacks', subcategory: 'Biscuits', size: '250 g', price: 25, stock: 55, imageUrl: image('photo-1558961363-fa8fdf82db35'), description: 'Glucose biscuits in a 250 g pack.', tags: ['biscuit', 'cookies'] }),
  product({ name: 'Buy Best Aloo Bhujia', slug: 'buy-best-aloo-bhujia', brand: 'Buy Best Snacks', category: 'Snacks', subcategory: 'Namkeen', size: '200 g', price: 55, originalPrice: 60, stock: 31, imageUrl: image('photo-1599490659213-e2b9527bd087'), description: 'Crispy potato and gram-flour savoury snack.', tags: ['namkeen', 'bhujia'] }),
  product({ name: 'Buy Best Whole Wheat Bread', slug: 'buy-best-whole-wheat-bread', brand: 'Buy Best Bakery', category: 'Bakery', subcategory: 'Bread', size: '400 g', price: 50, stock: 25, imageUrl: image('photo-1509440159596-0249088772ff'), description: 'Sliced whole-wheat bread in a 400 g loaf.', maxPerOrder: 4, featured: true, tags: ['bread', 'loaf'] }),
  product({ name: 'Buy Best White Bread', slug: 'buy-best-white-bread', brand: 'Buy Best Bakery', category: 'Bakery', subcategory: 'Bread', size: '400 g', price: 45, stock: 22, imageUrl: image('photo-1549931319-a545dcf3bc73'), description: 'Soft sliced white bread for toast and sandwiches.', maxPerOrder: 4, tags: ['bread', 'loaf'] }),
  product({ name: 'Buy Best Burger Buns', slug: 'buy-best-burger-buns', brand: 'Buy Best Bakery', category: 'Bakery', subcategory: 'Buns', size: 'pack of 4', price: 45, originalPrice: 50, stock: 17, imageUrl: image('photo-1586444248902-2f64eddc13df'), description: 'Four soft burger buns packed for home meals.', maxPerOrder: 4, isNewArrival: true, tags: ['bun', 'burger'] }),
  product({ name: 'Buy Best Basmati Rice', slug: 'buy-best-basmati-rice', brand: 'Buy Best Pantry', category: 'Staples', subcategory: 'Rice', size: '1 kg', price: 135, originalPrice: 155, stock: 38, imageUrl: image('photo-1586201375761-83865001e31c'), description: 'Everyday basmati rice supplied in a sealed one-kilogram pack.', maxPerOrder: 5, featured: true, tags: ['rice', 'basmati'] }),
  product({ name: 'Buy Best Whole Wheat Atta', slug: 'buy-best-whole-wheat-atta', brand: 'Buy Best Pantry', category: 'Staples', subcategory: 'Flour', size: '5 kg', price: 289, originalPrice: 315, stock: 26, imageUrl: image('photo-1627485937980-221c88ac04f9'), description: 'Whole-wheat flour in a sealed five-kilogram pack.', maxPerOrder: 3, tags: ['atta', 'flour'] }),
  product({ name: 'Buy Best Toor Dal', slug: 'buy-best-toor-dal', brand: 'Buy Best Pantry', category: 'Staples', subcategory: 'Pulses', size: '1 kg', price: 189, originalPrice: 205, stock: 30, imageUrl: image('photo-1708436477916-f97964f3ccf1'), description: 'Split pigeon peas in a one-kilogram pack.', maxPerOrder: 4, tags: ['dal', 'pulse', 'toor'] }),
  product({ name: 'Maggi 2-Minute Masala Noodles', slug: 'maggi-2-minute-masala-noodles', brand: 'Maggi', category: 'Instant Food', subcategory: 'Noodles', size: 'pack of 4 × 70 g', price: 56, stock: 45, imageUrl: 'https://images.openfoodfacts.org/images/products/890/105/800/0290/front_en.26.400.jpg', description: 'Four individual packs of masala instant noodles.', maxPerOrder: 6, tags: ['noodles', 'instant'] }),
  product({ name: 'Buy Best Instant Poha', slug: 'buy-best-instant-poha', brand: 'Buy Best Pantry', category: 'Instant Food', subcategory: 'Ready to Cook', size: '160 g', price: 55, originalPrice: 60, stock: 23, imageUrl: image('photo-1601050690597-df0568f70950'), description: 'Packaged poha mix for a quick breakfast or snack.', tags: ['poha', 'ready to cook'] }),
  product({ name: 'Buy Best Masala Noodles', slug: 'buy-best-masala-noodles', brand: 'Buy Best Pantry', category: 'Instant Food', subcategory: 'Noodles', size: '240 g', price: 55, stock: 27, imageUrl: image('photo-1551183053-bf91a1d81141'), description: 'Instant noodles with a masala seasoning sachet.', tags: ['noodles', 'instant'] }),
  product({ name: 'Buy Best Vanilla Ice Cream', slug: 'buy-best-vanilla-ice-cream', brand: 'Buy Best Frozen', category: 'Frozen Food', subcategory: 'Ice Cream', size: '1 L tub', price: 210, originalPrice: 230, stock: 14, imageUrl: image('photo-1563805042-7684c019e1cb'), description: 'Vanilla ice cream in a one-litre tub. Keep frozen.', maxPerOrder: 3, featured: true, tags: ['ice cream', 'dessert'] }),
  product({ name: 'Buy Best Frozen Green Peas', slug: 'buy-best-frozen-green-peas', brand: 'Buy Best Frozen', category: 'Frozen Food', subcategory: 'Frozen Vegetables', size: '500 g', price: 105, originalPrice: 115, stock: 18, imageUrl: image('photo-1592394533824-9440e5d68530'), description: 'Frozen green peas in a 500 g pack. Keep frozen.', maxPerOrder: 4, tags: ['peas', 'frozen vegetable'] }),
  product({ name: 'Buy Best French Fries', slug: 'buy-best-french-fries', brand: 'Buy Best Frozen', category: 'Frozen Food', subcategory: 'Frozen Snacks', size: '420 g', price: 135, originalPrice: 145, stock: 19, imageUrl: image('photo-1573080496219-bb080dd4f877'), description: 'Frozen potato fries ready for home cooking. Keep frozen.', maxPerOrder: 4, tags: ['fries', 'frozen snack'] }),
  product({ name: 'Buy Best Cream Bathing Bar', slug: 'buy-best-cream-bathing-bar', brand: 'Buy Best Care', category: 'Personal Care', subcategory: 'Bath & Body', size: '100 g', price: 68, originalPrice: 72, stock: 34, imageUrl: image('photo-1556228720-195a672e8a03'), description: 'Cream bathing bar in a 100 g pack.', tags: ['soap', 'bath'] }),
  product({ name: 'Buy Best Daily Care Shampoo', slug: 'buy-best-daily-care-shampoo', brand: 'Buy Best Care', category: 'Personal Care', subcategory: 'Hair Care', size: '340 ml', price: 190, originalPrice: 205, stock: 20, imageUrl: image('photo-1608248543803-ba4f8c70ae0b'), description: 'Everyday shampoo in a 340 ml bottle.', maxPerOrder: 4, tags: ['shampoo', 'hair care'] }),
  product({ name: 'Buy Best Fluoride Toothpaste', slug: 'buy-best-fluoride-toothpaste', brand: 'Buy Best Care', category: 'Personal Care', subcategory: 'Oral Care', size: '200 g', price: 118, originalPrice: 125, stock: 39, imageUrl: image('photo-1607613009820-a29f7bb81c04'), description: 'Fluoride toothpaste in a 200 g tube.', tags: ['toothpaste', 'oral care'] }),
  product({ name: 'Buy Best Front Load Detergent', slug: 'buy-best-front-load-detergent', brand: 'Buy Best Home', category: 'Household Care', subcategory: 'Laundry', size: '2 kg', price: 445, originalPrice: 475, stock: 16, imageUrl: image('photo-1583947215259-38e31be8751f'), description: 'Powder detergent formulated for front-load washing machines.', maxPerOrder: 3, featured: true, tags: ['detergent', 'laundry'] }),
  product({ name: 'Buy Best Lemon Dishwash Gel', slug: 'buy-best-lemon-dishwash-gel', brand: 'Buy Best Home', category: 'Household Care', subcategory: 'Dishwashing', size: '750 ml', price: 165, originalPrice: 175, stock: 25, imageUrl: image('photo-1590610994353-7b0e7546e681'), description: 'Lemon dishwashing gel in a 750 ml bottle.', maxPerOrder: 4, tags: ['dishwash', 'cleaning'] }),
  product({ name: 'Buy Best Toilet Cleaner', slug: 'buy-best-toilet-cleaner', brand: 'Buy Best Home', category: 'Household Care', subcategory: 'Bathroom Cleaning', size: '1 L', price: 199, originalPrice: 215, stock: 22, imageUrl: image('photo-1585421514738-01798e348b17'), description: 'Liquid toilet cleaner in a one-litre bottle.', maxPerOrder: 4, tags: ['toilet cleaner', 'bathroom'] }),
  product({ name: 'Buy Best Corn Flakes', slug: 'buy-best-corn-flakes', brand: 'Buy Best Pantry', category: 'Breakfast', subcategory: 'Cereals', size: '475 g', price: 205, originalPrice: 220, stock: 24, imageUrl: image('photo-1517673400267-0251440c45dc'), description: 'Toasted corn flakes in a 475 g pack.', maxPerOrder: 4, tags: ['cereal', 'corn flakes'] }),
  product({ name: 'Buy Best Rolled Oats', slug: 'buy-best-rolled-oats', brand: 'Buy Best Pantry', category: 'Breakfast', subcategory: 'Oats', size: '1 kg', price: 199, originalPrice: 215, stock: 27, imageUrl: image('photo-1502747220144-846486e80891'), description: 'Rolled oats supplied in a one-kilogram pack.', maxPerOrder: 4, tags: ['oats', 'cereal'] }),
  product({ name: 'Buy Best Mixed Fruit Jam', slug: 'buy-best-mixed-fruit-jam', brand: 'Buy Best Pantry', category: 'Breakfast', subcategory: 'Spreads', size: '500 g', price: 165, originalPrice: 175, stock: 21, imageUrl: image('photo-1528750997573-59b89d56f4f7'), description: 'Mixed fruit jam in a 500 g jar.', tags: ['jam', 'spread'] }),
  product({ name: 'Buy Best Premium Tea', slug: 'buy-best-premium-tea', brand: 'Buy Best Pantry', category: 'Tea & Coffee', subcategory: 'Tea', size: '500 g', price: 285, originalPrice: 305, stock: 33, imageUrl: image('photo-1597318181409-cf64d0b5d8a2'), description: 'Black tea blend in a 500 g pack.', maxPerOrder: 4, featured: true, tags: ['tea', 'chai'] }),
  product({ name: 'Buy Best Instant Coffee', slug: 'buy-best-instant-coffee', brand: 'Buy Best Pantry', category: 'Tea & Coffee', subcategory: 'Coffee', size: '100 g jar', price: 335, originalPrice: 360, stock: 19, imageUrl: image('photo-1495474472287-4d71bcdd2085'), description: 'Instant coffee granules in a 100 g jar.', maxPerOrder: 4, tags: ['coffee', 'instant coffee'] }),
  product({ name: 'Buy Best Natural Care Tea', slug: 'buy-best-natural-care-tea', brand: 'Buy Best Pantry', category: 'Tea & Coffee', subcategory: 'Tea', size: '500 g', price: 270, originalPrice: 285, stock: 25, imageUrl: image('photo-1597318181409-cf64d0b5d8a2'), description: 'Packaged black tea blend in a 500 g pack.', maxPerOrder: 4, isNewArrival: true, tags: ['tea', 'chai'] })
]

const categories = Object.entries(categoryImages).map(([name, imageUrl]) => ({
  name,
  image: imageUrl
}))

module.exports = {
  products,
  categories
}
