const productImage = (category, filename) => `/products/${category}/${filename}.avif`

const dairyImages = {
  milk: productImage('dairy', 'amul-shakti-milk-500ml'),
  curd: productImage('dairy', 'amul-plain-dahi-400g'),
  paneer: productImage('dairy', 'amul-fresh-paneer-200g'),
  eggs: productImage('dairy', 'brown-eggs-pack-of-6')
}

const beverageImages = {
  cola: productImage('beverages', 'coca-cola-original-300ml'),
  fanta: productImage('beverages', 'fanta-orange-300ml')
}

const categoryImages = {
  'Fruits & Vegetables': productImage('fruits-vegetables', 'fresh-shimla-apples'),
  'Dairy & Eggs': dairyImages.milk,
  Beverages: productImage('beverages', 'orange-juice-1l'),
  Snacks: productImage('snacks', 'ridged-potato-chips-82g'),
  Bakery: productImage('bakery', 'whole-wheat-bread-400g'),
  Staples: productImage('staples', 'basmati-rice-1kg'),
  'Instant Food': productImage('instant-food', 'instant-poha-160g'),
  'Frozen Food': productImage('frozen-food', 'green-peas-500g'),
  'Personal Care': productImage('personal-care', 'cream-bathing-bar-100g'),
  'Household Care': productImage('household', 'lemon-dishwash-gel-750ml'),
  Breakfast: productImage('breakfast', 'corn-flakes-475g'),
  'Tea & Coffee': productImage('tea-coffee', 'premium-tea-500g')
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
  imageFit = 'cover',
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
    imageFit,
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
  product({ name: 'Fresh Shimla Apples', slug: 'fresh-shimla-apples', brand: 'Buy Best Fresh', category: 'Fruits & Vegetables', subcategory: 'Fresh Fruits', size: '4 pieces (approx. 600 g)', price: 149, originalPrice: 179, stock: 36, imageUrl: productImage('fruits-vegetables', 'fresh-shimla-apples'), description: 'Crisp whole apples supplied as a four-piece pack. Wash before eating.', featured: true, tags: ['apple', 'fruit'] }),
  product({ name: 'Robusta Bananas', slug: 'robusta-bananas', brand: 'Buy Best Fresh', category: 'Fruits & Vegetables', subcategory: 'Fresh Fruits', size: '6 pieces', price: 54, originalPrice: 60, stock: 42, imageUrl: productImage('fruits-vegetables', 'robusta-bananas'), description: 'A six-piece pack of fresh Robusta bananas.', tags: ['banana', 'fruit'] }),
  product({ name: 'Farm Fresh Tomatoes', slug: 'farm-fresh-tomatoes', brand: 'Buy Best Fresh', category: 'Fruits & Vegetables', subcategory: 'Fresh Vegetables', size: '500 g', price: 32, originalPrice: 40, stock: 50, imageUrl: productImage('fruits-vegetables', 'farm-fresh-tomatoes-500g'), description: 'Fresh tomatoes packed by weight for everyday cooking.', tags: ['tomato', 'vegetable'] }),
  product({ name: 'Fresh Potatoes', slug: 'fresh-potatoes', brand: 'Buy Best Fresh', category: 'Fruits & Vegetables', subcategory: 'Fresh Vegetables', size: '1 kg', price: 42, stock: 48, imageUrl: productImage('fruits-vegetables', 'fresh-potatoes-1kg'), description: 'Everyday potatoes supplied in a one-kilogram pack.', tags: ['potato', 'vegetable'] }),
  product({ name: 'Amul Shakti Milk', slug: 'amul-shakti-milk', brand: 'Amul', category: 'Dairy & Eggs', subcategory: 'Milk', size: '500 ml', price: 28, originalPrice: 30, stock: 40, imageUrl: dairyImages.milk, imageFit: 'contain', description: 'Packaged dairy milk in a 500 ml pouch. Keep refrigerated.', maxPerOrder: 6, featured: true, tags: ['milk', 'dairy'] }),
  product({ name: 'Amul Plain Dahi', slug: 'amul-plain-dahi', brand: 'Amul', category: 'Dairy & Eggs', subcategory: 'Curd', size: '400 g', price: 35, originalPrice: 38, stock: 32, imageUrl: dairyImages.curd, imageFit: 'contain', description: 'Plain packaged curd for meals, raita and everyday use. Keep refrigerated.', maxPerOrder: 6, tags: ['curd', 'dahi'] }),
  product({ name: 'Amul Fresh Paneer', slug: 'amul-fresh-paneer', brand: 'Amul', category: 'Dairy & Eggs', subcategory: 'Paneer', size: '200 g', price: 95, originalPrice: 100, stock: 24, imageUrl: dairyImages.paneer, imageFit: 'contain', description: 'Packaged paneer for curries, snacks and salads. Keep refrigerated.', maxPerOrder: 4, tags: ['paneer'] }),
  product({ name: 'Buy Best Fresh Brown Eggs', slug: 'buy-best-fresh-brown-eggs', brand: 'Buy Best Fresh', category: 'Dairy & Eggs', subcategory: 'Eggs', size: 'pack of 6', price: 69, originalPrice: 75, stock: 28, imageUrl: dairyImages.eggs, description: 'Six brown table eggs packed in a protective carton.', maxPerOrder: 4, tags: ['egg'] }),
  product({ name: 'Coca-Cola Original Taste', slug: 'coca-cola-original-taste', brand: 'Coca-Cola', category: 'Beverages', subcategory: 'Soft Drinks', size: '300 ml can', price: 40, stock: 34, imageUrl: beverageImages.cola, imageFit: 'contain', description: 'Carbonated soft drink in a 300 ml can. Serve chilled.', maxPerOrder: 6, tags: ['cola', 'soft drink'] }),
  product({ name: 'Fanta Orange', slug: 'fanta-orange', brand: 'Fanta', category: 'Beverages', subcategory: 'Soft Drinks', size: '300 ml can', price: 40, stock: 29, imageUrl: beverageImages.fanta, imageFit: 'contain', description: 'Orange-flavoured carbonated soft drink in a 300 ml can. Serve chilled.', maxPerOrder: 6, tags: ['orange drink', 'soft drink'] }),
  product({ name: 'Buy Best Orange Juice', slug: 'buy-best-orange-juice', brand: 'Buy Best Beverages', category: 'Beverages', subcategory: 'Juices', size: '1 L', price: 115, originalPrice: 125, stock: 21, imageUrl: productImage('beverages', 'orange-juice-1l'), description: 'Orange juice sold in a one-litre pack. Serve chilled.', tags: ['juice', 'orange drink'] }),
  product({ name: 'Buy Best Ridged Potato Chips', slug: 'buy-best-ridged-potato-chips', brand: 'Buy Best Snacks', category: 'Snacks', subcategory: 'Chips', size: '82 g', price: 50, stock: 44, imageUrl: productImage('snacks', 'ridged-potato-chips-82g'), description: 'Crisp ridged potato chips in an 82 g pack.', maxPerOrder: 8, tags: ['chips', 'potato snack'] }),
  product({ name: 'Buy Best Chocolate Chip Cookies', slug: 'buy-best-chocolate-chip-cookies', brand: 'Buy Best Snacks', category: 'Snacks', subcategory: 'Biscuits & Cookies', size: '250 g', price: 25, stock: 55, imageUrl: productImage('snacks', 'chocolate-chip-cookies-250g'), description: 'Chocolate chip cookies in a 250 g pack.', tags: ['biscuit', 'cookies', 'chocolate chip'] }),
  product({ name: 'Buy Best Classic Salted Potato Chips', slug: 'buy-best-classic-salted-potato-chips', brand: 'Buy Best Snacks', category: 'Snacks', subcategory: 'Chips', size: '200 g', price: 55, originalPrice: 60, stock: 31, imageUrl: productImage('snacks', 'classic-salted-potato-chips-200g'), description: 'Classic crisp potato chips with a salted seasoning.', tags: ['chips', 'potato snack'] }),
  product({ name: 'Buy Best Whole Wheat Bread', slug: 'buy-best-whole-wheat-bread', brand: 'Buy Best Bakery', category: 'Bakery', subcategory: 'Bread', size: '400 g', price: 50, stock: 25, imageUrl: productImage('bakery', 'whole-wheat-bread-400g'), description: 'Sliced whole-wheat bread in a 400 g loaf.', maxPerOrder: 4, featured: true, tags: ['bread', 'loaf'] }),
  product({ name: 'Buy Best White Bread', slug: 'buy-best-white-bread', brand: 'Buy Best Bakery', category: 'Bakery', subcategory: 'Bread', size: '400 g', price: 45, stock: 22, imageUrl: productImage('bakery', 'white-bread-400g'), description: 'Soft sliced white bread for toast and sandwiches.', maxPerOrder: 4, tags: ['bread', 'loaf'] }),
  product({ name: 'Buy Best Burger Buns', slug: 'buy-best-burger-buns', brand: 'Buy Best Bakery', category: 'Bakery', subcategory: 'Buns', size: 'pack of 4', price: 45, originalPrice: 50, stock: 17, imageUrl: productImage('bakery', 'burger-buns-pack-of-4'), description: 'Four soft sesame-topped burger buns for home meals.', maxPerOrder: 4, isNewArrival: true, tags: ['bun', 'burger'] }),
  product({ name: 'Buy Best Basmati Rice', slug: 'buy-best-basmati-rice', brand: 'Buy Best Pantry', category: 'Staples', subcategory: 'Rice', size: '1 kg', price: 135, originalPrice: 155, stock: 38, imageUrl: productImage('staples', 'basmati-rice-1kg'), description: 'Everyday basmati rice supplied in a sealed one-kilogram pack.', maxPerOrder: 5, featured: true, tags: ['rice', 'basmati'] }),
  product({ name: 'Buy Best Whole Wheat Atta', slug: 'buy-best-whole-wheat-atta', brand: 'Buy Best Pantry', category: 'Staples', subcategory: 'Flour', size: '5 kg', price: 289, originalPrice: 315, stock: 26, imageUrl: productImage('staples', 'whole-wheat-atta-5kg'), description: 'Whole-wheat flour in a sealed five-kilogram pack.', maxPerOrder: 3, tags: ['atta', 'flour'] }),
  product({ name: 'Buy Best Toor Dal', slug: 'buy-best-toor-dal', brand: 'Buy Best Pantry', category: 'Staples', subcategory: 'Pulses', size: '1 kg', price: 189, originalPrice: 205, stock: 30, imageUrl: productImage('staples', 'toor-dal-1kg'), description: 'Split pigeon peas in a one-kilogram pack.', maxPerOrder: 4, tags: ['dal', 'pulse', 'toor'] }),
  product({ name: 'Maggi 2-Minute Masala Noodles', slug: 'maggi-2-minute-masala-noodles', brand: 'Maggi', category: 'Instant Food', subcategory: 'Noodles', size: 'pack of 4 × 70 g', price: 56, stock: 45, imageUrl: productImage('instant-food', 'maggi-masala-noodles-pack-of-4'), imageFit: 'contain', description: 'Four individual packs of masala instant noodles.', maxPerOrder: 6, tags: ['noodles', 'instant'] }),
  product({ name: 'Buy Best Instant Poha', slug: 'buy-best-instant-poha', brand: 'Buy Best Pantry', category: 'Instant Food', subcategory: 'Ready to Cook', size: '160 g', price: 55, originalPrice: 60, stock: 23, imageUrl: productImage('instant-food', 'instant-poha-160g'), description: 'Packaged poha mix for a quick breakfast or snack.', tags: ['poha', 'ready to cook'] }),
  product({ name: 'Buy Best Masala Noodles', slug: 'buy-best-masala-noodles', brand: 'Buy Best Pantry', category: 'Instant Food', subcategory: 'Noodles', size: '240 g', price: 55, stock: 27, imageUrl: productImage('instant-food', 'masala-noodles-240g'), description: 'Instant noodles with a masala seasoning sachet.', tags: ['noodles', 'instant'] }),
  product({ name: 'Buy Best Vanilla Berry Swirl Ice Cream', slug: 'buy-best-vanilla-berry-swirl-ice-cream', brand: 'Buy Best Frozen', category: 'Frozen Food', subcategory: 'Ice Cream', size: '1 L tub', price: 210, originalPrice: 230, stock: 14, imageUrl: productImage('frozen-food', 'vanilla-berry-swirl-ice-cream-1l'), description: 'Vanilla ice cream with a berry swirl in a one-litre tub. Keep frozen.', maxPerOrder: 3, featured: true, tags: ['ice cream', 'dessert', 'berry'] }),
  product({ name: 'Buy Best Frozen Green Peas', slug: 'buy-best-frozen-green-peas', brand: 'Buy Best Frozen', category: 'Frozen Food', subcategory: 'Frozen Vegetables', size: '500 g', price: 105, originalPrice: 115, stock: 18, imageUrl: productImage('frozen-food', 'green-peas-500g'), description: 'Frozen green peas in a 500 g pack. Keep frozen.', maxPerOrder: 4, tags: ['peas', 'frozen vegetable'] }),
  product({ name: 'Buy Best French Fries', slug: 'buy-best-french-fries', brand: 'Buy Best Frozen', category: 'Frozen Food', subcategory: 'Frozen Snacks', size: '420 g', price: 135, originalPrice: 145, stock: 19, imageUrl: productImage('frozen-food', 'french-fries-420g'), description: 'Frozen potato fries ready for home cooking. Keep frozen.', maxPerOrder: 4, tags: ['fries', 'frozen snack'] }),
  product({ name: 'Buy Best Cream Bathing Bar', slug: 'buy-best-cream-bathing-bar', brand: 'Buy Best Care', category: 'Personal Care', subcategory: 'Bath & Body', size: '100 g', price: 68, originalPrice: 72, stock: 34, imageUrl: productImage('personal-care', 'cream-bathing-bar-100g'), imageFit: 'contain', description: 'Cream bathing bar in a 100 g pack.', tags: ['soap', 'bath'] }),
  product({ name: 'Buy Best Fluoride Toothpaste', slug: 'buy-best-fluoride-toothpaste', brand: 'Buy Best Care', category: 'Personal Care', subcategory: 'Oral Care', size: '200 g', price: 118, originalPrice: 125, stock: 39, imageUrl: productImage('personal-care', 'fluoride-toothpaste-200g'), imageFit: 'contain', description: 'Fluoride toothpaste in a 200 g tube.', tags: ['toothpaste', 'oral care'] }),
  product({ name: 'Buy Best Lemon Dishwash Gel', slug: 'buy-best-lemon-dishwash-gel', brand: 'Buy Best Home', category: 'Household Care', subcategory: 'Dishwashing', size: '750 ml', price: 165, originalPrice: 175, stock: 25, imageUrl: productImage('household', 'lemon-dishwash-gel-750ml'), imageFit: 'contain', description: 'Lemon dishwashing gel in a 750 ml bottle.', maxPerOrder: 4, tags: ['dishwash', 'cleaning'] }),
  product({ name: 'Buy Best Toilet Cleaner', slug: 'buy-best-toilet-cleaner', brand: 'Buy Best Home', category: 'Household Care', subcategory: 'Bathroom Cleaning', size: '1 L', price: 199, originalPrice: 215, stock: 22, imageUrl: productImage('household', 'toilet-cleaner-1l'), imageFit: 'contain', description: 'Liquid toilet cleaner in a one-litre bottle.', maxPerOrder: 4, tags: ['toilet cleaner', 'bathroom'] }),
  product({ name: 'Buy Best Corn Flakes', slug: 'buy-best-corn-flakes', brand: 'Buy Best Pantry', category: 'Breakfast', subcategory: 'Cereals', size: '475 g', price: 205, originalPrice: 220, stock: 24, imageUrl: productImage('breakfast', 'corn-flakes-475g'), description: 'Toasted corn flakes in a 475 g pack.', maxPerOrder: 4, tags: ['cereal', 'corn flakes'] }),
  product({ name: 'Buy Best Rolled Oats', slug: 'buy-best-rolled-oats', brand: 'Buy Best Pantry', category: 'Breakfast', subcategory: 'Oats', size: '1 kg', price: 199, originalPrice: 215, stock: 27, imageUrl: productImage('breakfast', 'rolled-oats-1kg'), description: 'Rolled oats supplied in a one-kilogram pack.', maxPerOrder: 4, tags: ['oats', 'cereal'] }),
  product({ name: 'Buy Best Mixed Fruit Jam', slug: 'buy-best-mixed-fruit-jam', brand: 'Buy Best Pantry', category: 'Breakfast', subcategory: 'Spreads', size: '500 g', price: 165, originalPrice: 175, stock: 21, imageUrl: productImage('breakfast', 'mixed-fruit-jam-500g'), description: 'Mixed fruit jam in a 500 g jar.', tags: ['jam', 'spread'] }),
  product({ name: 'Buy Best Premium Tea', slug: 'buy-best-premium-tea', brand: 'Buy Best Pantry', category: 'Tea & Coffee', subcategory: 'Tea', size: '500 g', price: 285, originalPrice: 305, stock: 33, imageUrl: productImage('tea-coffee', 'premium-tea-500g'), description: 'Black tea blend in a 500 g pack.', maxPerOrder: 4, featured: true, tags: ['tea', 'chai'] }),
  product({ name: 'Buy Best Instant Coffee', slug: 'buy-best-instant-coffee', brand: 'Buy Best Pantry', category: 'Tea & Coffee', subcategory: 'Coffee', size: '100 g jar', price: 335, originalPrice: 360, stock: 19, imageUrl: productImage('tea-coffee', 'instant-coffee-100g'), description: 'Instant coffee granules in a 100 g jar.', maxPerOrder: 4, tags: ['coffee', 'instant coffee'] }),
  product({ name: 'Buy Best Natural Care Tea', slug: 'buy-best-natural-care-tea', brand: 'Buy Best Pantry', category: 'Tea & Coffee', subcategory: 'Tea', size: '500 g', price: 270, originalPrice: 285, stock: 25, imageUrl: productImage('tea-coffee', 'natural-care-tea-500g'), description: 'Loose black tea leaves sold in a 500 g pack.', maxPerOrder: 4, isNewArrival: true, tags: ['tea', 'chai', 'loose leaf'] })
]

const categories = Object.entries(categoryImages).map(([name, imageUrl]) => ({
  name,
  image: imageUrl
}))

module.exports = {
  products,
  categories
}
