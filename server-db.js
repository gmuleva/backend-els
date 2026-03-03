const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const connectDB = require('./db');
const User = require('./models/User');
const Product = require('./models/Product');
const Cart = require('./models/Cart');
const Order = require('./models/Order');

const app = express();
const PORT = process.env.PORT || 3001;

connectDB();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const sessions = {};

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Commerce Demo API',
      version: '1.0.0',
      description: 'A comprehensive demo API with MongoDB integration'
    },
    servers: [{ url: `http://localhost:${PORT}` }]
  },
  apis: ['./server-db.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'mongodb'
  });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *               name: { type: string }
 *     responses:
 *       201:
 *         description: User registered successfully
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required', code: 'MISSING_FIELDS' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters', code: 'WEAK_PASSWORD' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists', code: 'USER_EXISTS' });
    }

    const user = new User({ email, password, name });
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'User registered successfully',
      userId: user._id,
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required', code: 'MISSING_CREDENTIALS' });
    }

    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const token = `token_${user._id}_${Date.now()}`;
    sessions[token] = user._id.toString();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ message: 'Login successful', token, user: userResponse });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout user
 *     responses:
 *       200:
 *         description: Logout successful
 */
app.post('/api/auth/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token && sessions[token]) {
    delete sessions[token];
  }
  res.json({ message: 'Logout successful' });
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: Get all products
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: List of products
 */
app.get('/api/products', async (req, res) => {
  try {
    let query = {};

    if (req.query.category) {
      query.category = new RegExp(req.query.category, 'i');
    }

    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
    }

    const products = await Product.find(query);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

/**
 * @swagger
 * /api/products/{productId}:
 *   get:
 *     tags: [Products]
 *     summary: Get product by ID
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product found
 */
app.get('/api/products/:productId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found', code: 'PRODUCT_NOT_FOUND' });
    }
    res.json(product);
  } catch (error) {
    res.status(404).json({ error: 'Product not found', code: 'PRODUCT_NOT_FOUND' });
  }
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     tags: [Products]
 *     summary: Create a new product (admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Product created
 */
app.post('/api/products', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !sessions[token]) {
      return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    }

    const user = await User.findById(sessions[token]);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required', code: 'FORBIDDEN' });
    }

    const { name, description, price, category, stock, image } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Name, price, and category are required', code: 'MISSING_FIELDS' });
    }

    const product = new Product({
      name,
      description: description || '',
      price: parseFloat(price),
      category,
      stock: parseInt(stock) || 0,
      image: image || ''
    });

    await product.save();

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

/**
 * @swagger
 * /api/cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get user's cart
 *     responses:
 *       200:
 *         description: Cart retrieved
 */
app.get('/api/cart', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !sessions[token]) {
      return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    }

    const userId = sessions[token];
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = { userId, items: [], total: 0 };
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

/**
 * @swagger
 * /api/cart/items:
 *   post:
 *     tags: [Cart]
 *     summary: Add item to cart
 *     responses:
 *       201:
 *         description: Item added
 */
app.post('/api/cart/items', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !sessions[token]) {
      return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    }

    const userId = sessions[token];
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ error: 'Product ID and quantity are required', code: 'MISSING_FIELDS' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found', code: 'PRODUCT_NOT_FOUND' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock', code: 'INSUFFICIENT_STOCK' });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [], total: 0 });
    }

    const existingItemIndex = cart.items.findIndex(item => 
      item.productId.toString() === productId
    );

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += parseInt(quantity);
    } else {
      cart.items.push({
        productId,
        productName: product.name,
        quantity: parseInt(quantity),
        price: product.price
      });
    }

    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cart.updatedAt = Date.now();

    await cart.save();

    res.status(201).json({
      message: 'Item added to cart',
      cart
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create order
 *     responses:
 *       201:
 *         description: Order created
 */
app.post('/api/orders', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !sessions[token]) {
      return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    }

    const userId = sessions[token];
    const { shippingAddress, paymentMethod } = req.body;

    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({ error: 'Shipping address and payment method are required', code: 'MISSING_FIELDS' });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty', code: 'CART_EMPTY' });
    }

    const order = new Order({
      userId,
      items: cart.items,
      total: cart.total,
      status: 'pending',
      shippingAddress,
      paymentMethod
    });

    await order.save();

    cart.items = [];
    cart.total = 0;
    await cart.save();

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

/**
 * @swagger
 * /api/orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get user's orders
 *     responses:
 *       200:
 *         description: Orders list
 */
app.get('/api/orders', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !sessions[token]) {
      return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    }

    const userId = sessions[token];
    const orders = await Order.find({ userId });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

async function seedData() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('⏭️  Database already seeded, skipping...');
      return;
    }

    const admin = new User({
      email: 'admin@example.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin'
    });
    await admin.save();

    const customer = new User({
      email: 'customer@example.com',
      password: 'customer123',
      name: 'John Customer',
      role: 'customer'
    });
    await customer.save();

    const sampleProducts = [
      { name: 'Laptop Pro 15', description: 'High-performance laptop', price: 1299.99, category: 'Electronics', stock: 15 },
      { name: 'Wireless Mouse', description: 'Ergonomic wireless mouse', price: 29.99, category: 'Electronics', stock: 50 },
      { name: 'Office Chair', description: 'Comfortable office chair', price: 299.99, category: 'Furniture', stock: 20 },
      { name: 'Desk Lamp', description: 'LED desk lamp', price: 49.99, category: 'Furniture', stock: 30 },
      { name: 'USB-C Cable', description: '6ft USB-C cable', price: 12.99, category: 'Accessories', stock: 100 }
    ];

    await Product.insertMany(sampleProducts);

    console.log('✅ Seed data created:');
    console.log('   - 2 users (admin@example.com / admin123, customer@example.com / customer123)');
    console.log('   - 5 products');
  } catch (error) {
    console.error('❌ Seed data error:', error.message);
  }
}

app.get('/', (req, res) => {
  res.json({
    message: 'E-Commerce Demo API with MongoDB',
    version: '1.0.0',
    documentation: `http://localhost:${PORT}/api-docs`
  });
});

if (require.main === module) {
  app.listen(PORT, async () => {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🚀 E-Commerce Demo API Server Started (MongoDB)');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📍 Server: http://localhost:${PORT}`);
    console.log(`📚 Swagger: http://localhost:${PORT}/api-docs`);
    console.log('═══════════════════════════════════════════════════════════════');
    
    await seedData();
    
    console.log('🎯 Ready for testing!');
    console.log('═══════════════════════════════════════════════════════════════');
  });
}

module.exports = app;
