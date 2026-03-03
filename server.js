const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory data stores
const users = [];
const products = [];
const orders = [];
const carts = {};
const sessions = {};

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Commerce Demo API',
      version: '1.0.0',
      description: 'A comprehensive demo API for testing all test types (Unit, API, E2E, Integration, Contract)',
      contact: {
        name: 'EY VIBE Testing Platform',
        email: 'support@ey.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            id: {
              type: 'string',
              description: 'User ID (UUID)',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com'
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'User password (min 6 characters)',
              example: 'SecurePass123!'
            },
            name: {
              type: 'string',
              description: 'User full name',
              example: 'John Doe'
            },
            role: {
              type: 'string',
              enum: ['customer', 'admin'],
              description: 'User role',
              example: 'customer'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            }
          }
        },
        Product: {
          type: 'object',
          required: ['name', 'price', 'category'],
          properties: {
            id: {
              type: 'string',
              description: 'Product ID (UUID)'
            },
            name: {
              type: 'string',
              description: 'Product name',
              example: 'Laptop'
            },
            description: {
              type: 'string',
              description: 'Product description',
              example: 'High-performance laptop'
            },
            price: {
              type: 'number',
              format: 'float',
              minimum: 0,
              description: 'Product price',
              example: 999.99
            },
            category: {
              type: 'string',
              description: 'Product category',
              example: 'Electronics'
            },
            stock: {
              type: 'integer',
              minimum: 0,
              description: 'Available stock',
              example: 10
            },
            image: {
              type: 'string',
              description: 'Product image URL',
              example: 'https://example.com/laptop.jpg'
            }
          }
        },
        Cart: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'User ID who owns the cart'
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId: {
                    type: 'string',
                    description: 'Product ID'
                  },
                  quantity: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Quantity'
                  },
                  price: {
                    type: 'number',
                    description: 'Price at time of adding'
                  }
                }
              }
            },
            total: {
              type: 'number',
              description: 'Total cart value'
            }
          }
        },
        Order: {
          type: 'object',
          required: ['userId', 'items', 'total'],
          properties: {
            id: {
              type: 'string',
              description: 'Order ID (UUID)'
            },
            userId: {
              type: 'string',
              description: 'User ID who placed the order'
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId: { type: 'string' },
                  productName: { type: 'string' },
                  quantity: { type: 'integer' },
                  price: { type: 'number' }
                }
              }
            },
            total: {
              type: 'number',
              description: 'Order total'
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
              description: 'Order status'
            },
            shippingAddress: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zipCode: { type: 'string' },
                country: { type: 'string' }
              }
            },
            paymentMethod: {
              type: 'string',
              enum: ['credit_card', 'debit_card', 'paypal', 'cash'],
              description: 'Payment method'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            code: {
              type: 'string',
              description: 'Error code'
            }
          }
        }
      }
    }
  },
  apis: ['./server.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Health check endpoint (for Docker, Kubernetes, load balancers)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.APP_VERSION || '1.0.0'
  });
});

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve raw swagger JSON
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: Creates a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;

  // Validation
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required', code: 'MISSING_FIELDS' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters', code: 'WEAK_PASSWORD' });
  }

  // Check if user exists
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists', code: 'USER_EXISTS' });
  }

  // Create user
  const user = {
    id: uuidv4(),
    email,
    password, // In real app, hash this!
    name,
    role: 'customer',
    createdAt: new Date().toISOString()
  };

  users.push(user);

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  res.status(201).json({
    message: 'User registered successfully',
    userId: user.id,
    user: userWithoutPassword
  });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login user
 *     description: Authenticates a user and returns a session token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required', code: 'MISSING_CREDENTIALS' });
  }

  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
  }

  // Generate token (simplified)
  const token = `token_${user.id}_${Date.now()}`;
  sessions[token] = user.id;

  const { password: _, ...userWithoutPassword } = user;

  res.json({
    message: 'Login successful',
    token,
    user: userWithoutPassword
  });
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Logout user
 *     description: Invalidates the user session
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
app.post('/api/auth/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token && sessions[token]) {
    delete sessions[token];
  }

  res.json({ message: 'Logout successful' });
});

// ============================================
// USER ENDPOINTS
// ============================================

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user by ID
 *     description: Retrieves a user's profile information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
app.get('/api/users/:userId', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !sessions[token]) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const user = users.find(u => u.id === req.params.userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

/**
 * @swagger
 * /api/users/{userId}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update user profile
 *     description: Updates user information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
app.put('/api/users/:userId', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !sessions[token]) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const userIndex = users.findIndex(u => u.id === req.params.userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
  }

  // Only allow user to update their own profile
  if (sessions[token] !== req.params.userId) {
    return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
  }

  const { name, email } = req.body;

  if (name) users[userIndex].name = name;
  if (email) users[userIndex].email = email;

  const { password: _, ...userWithoutPassword } = users[userIndex];
  res.json({
    message: 'User updated successfully',
    user: userWithoutPassword
  });
});

// ============================================
// PRODUCT ENDPOINTS
// ============================================

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get all products
 *     description: Retrieves a list of all products with optional filtering
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get('/api/products', (req, res) => {
  let filteredProducts = [...products];

  // Filter by category
  if (req.query.category) {
    filteredProducts = filteredProducts.filter(p => 
      p.category.toLowerCase() === req.query.category.toLowerCase()
    );
  }

  // Filter by price range
  if (req.query.minPrice) {
    filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(req.query.minPrice));
  }

  if (req.query.maxPrice) {
    filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(req.query.maxPrice));
  }

  res.json(filteredProducts);
});

/**
 * @swagger
 * /api/products/{productId}:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get product by ID
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product found
 *       404:
 *         description: Product not found
 */
app.get('/api/products/:productId', (req, res) => {
  const product = products.find(p => p.id === req.params.productId);

  if (!product) {
    return res.status(404).json({ error: 'Product not found', code: 'PRODUCT_NOT_FOUND' });
  }

  res.json(product);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     tags:
 *       - Products
 *     summary: Create a new product
 *     description: Admin only - Creates a new product
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
app.post('/api/products', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !sessions[token]) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const userId = sessions[token];
  const user = users.find(u => u.id === userId);

  // Check admin role
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required', code: 'FORBIDDEN' });
  }

  const { name, description, price, category, stock, image } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({ error: 'Name, price, and category are required', code: 'MISSING_FIELDS' });
  }

  const product = {
    id: uuidv4(),
    name,
    description: description || '',
    price: parseFloat(price),
    category,
    stock: parseInt(stock) || 0,
    image: image || '',
    createdAt: new Date().toISOString()
  };

  products.push(product);

  res.status(201).json({
    message: 'Product created successfully',
    product
  });
});

// ============================================
// CART ENDPOINTS
// ============================================

/**
 * @swagger
 * /api/cart:
 *   get:
 *     tags:
 *       - Cart
 *     summary: Get user's cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 */
app.get('/api/cart', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !sessions[token]) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const userId = sessions[token];
  const cart = carts[userId] || { userId, items: [], total: 0 };

  res.json(cart);
});

/**
 * @swagger
 * /api/cart/items:
 *   post:
 *     tags:
 *       - Cart
 *     summary: Add item to cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       201:
 *         description: Item added to cart
 *       404:
 *         description: Product not found
 */
app.post('/api/cart/items', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !sessions[token]) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const userId = sessions[token];
  const { productId, quantity } = req.body;

  if (!productId || !quantity) {
    return res.status(400).json({ error: 'Product ID and quantity are required', code: 'MISSING_FIELDS' });
  }

  const product = products.find(p => p.id === productId);

  if (!product) {
    return res.status(404).json({ error: 'Product not found', code: 'PRODUCT_NOT_FOUND' });
  }

  if (product.stock < quantity) {
    return res.status(400).json({ error: 'Insufficient stock', code: 'INSUFFICIENT_STOCK' });
  }

  // Initialize cart if doesn't exist
  if (!carts[userId]) {
    carts[userId] = { userId, items: [], total: 0 };
  }

  // Add or update item
  const existingItemIndex = carts[userId].items.findIndex(item => item.productId === productId);

  if (existingItemIndex >= 0) {
    carts[userId].items[existingItemIndex].quantity += parseInt(quantity);
  } else {
    carts[userId].items.push({
      productId,
      productName: product.name,
      quantity: parseInt(quantity),
      price: product.price
    });
  }

  // Recalculate total
  carts[userId].total = carts[userId].items.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0
  );

  res.status(201).json({
    message: 'Item added to cart',
    cart: carts[userId]
  });
});

/**
 * @swagger
 * /api/cart/items/{productId}:
 *   delete:
 *     tags:
 *       - Cart
 *     summary: Remove item from cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item removed
 *       404:
 *         description: Item not in cart
 */
app.delete('/api/cart/items/:productId', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !sessions[token]) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const userId = sessions[token];
  const { productId } = req.params;

  if (!carts[userId]) {
    return res.status(404).json({ error: 'Cart is empty', code: 'CART_EMPTY' });
  }

  const itemIndex = carts[userId].items.findIndex(item => item.productId === productId);

  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Item not in cart', code: 'ITEM_NOT_FOUND' });
  }

  carts[userId].items.splice(itemIndex, 1);

  // Recalculate total
  carts[userId].total = carts[userId].items.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0
  );

  res.json({
    message: 'Item removed from cart',
    cart: carts[userId]
  });
});

// ============================================
// ORDER ENDPOINTS
// ============================================

/**
 * @swagger
 * /api/orders:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Create order from cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddress
 *               - paymentMethod
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   street: { type: string }
 *                   city: { type: string }
 *                   state: { type: string }
 *                   zipCode: { type: string }
 *                   country: { type: string }
 *               paymentMethod:
 *                 type: string
 *                 enum: [credit_card, debit_card, paypal, cash]
 *     responses:
 *       201:
 *         description: Order created
 *       400:
 *         description: Cart is empty or invalid data
 */
app.post('/api/orders', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !sessions[token]) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const userId = sessions[token];
  const { shippingAddress, paymentMethod } = req.body;

  if (!shippingAddress || !paymentMethod) {
    return res.status(400).json({ error: 'Shipping address and payment method are required', code: 'MISSING_FIELDS' });
  }

  const cart = carts[userId];

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty', code: 'CART_EMPTY' });
  }

  const order = {
    id: uuidv4(),
    userId,
    items: [...cart.items],
    total: cart.total,
    status: 'pending',
    shippingAddress,
    paymentMethod,
    createdAt: new Date().toISOString()
  };

  orders.push(order);

  // Clear cart
  carts[userId] = { userId, items: [], total: 0 };

  res.status(201).json({
    message: 'Order created successfully',
    order
  });
});

/**
 * @swagger
 * /api/orders:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get user's orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 */
app.get('/api/orders', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !sessions[token]) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const userId = sessions[token];
  const userOrders = orders.filter(o => o.userId === userId);

  res.json(userOrders);
});

/**
 * @swagger
 * /api/orders/{orderId}:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get order by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order found
 *       404:
 *         description: Order not found
 */
app.get('/api/orders/:orderId', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !sessions[token]) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const userId = sessions[token];
  const order = orders.find(o => o.id === req.params.orderId);

  if (!order) {
    return res.status(404).json({ error: 'Order not found', code: 'ORDER_NOT_FOUND' });
  }

  // Check if order belongs to user
  if (order.userId !== userId) {
    return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
  }

  res.json(order);
});

/**
 * @swagger
 * /api/orders/{orderId}/status:
 *   put:
 *     tags:
 *       - Orders
 *     summary: Update order status
 *     description: Admin only - Updates order status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, shipped, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Order status updated
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Order not found
 */
app.put('/api/orders/:orderId/status', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !sessions[token]) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const userId = sessions[token];
  const user = users.find(u => u.id === userId);

  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required', code: 'FORBIDDEN' });
  }

  const orderIndex = orders.findIndex(o => o.id === req.params.orderId);

  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found', code: 'ORDER_NOT_FOUND' });
  }

  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required', code: 'MISSING_FIELDS' });
  }

  orders[orderIndex].status = status;

  res.json({
    message: 'Order status updated',
    order: orders[orderIndex]
  });
});

// ============================================
// SEED DATA
// ============================================

// Create seed data
function seedData() {
  // Create admin user
  const admin = {
    id: uuidv4(),
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
    createdAt: new Date().toISOString()
  };
  users.push(admin);

  // Create customer user
  const customer = {
    id: uuidv4(),
    email: 'customer@example.com',
    password: 'hashed-password-placeholder',
    name: 'John Customer',
    role: 'customer',
    createdAt: new Date().toISOString()
  };
  users.push(customer);

  // Create products
  const sampleProducts = [
    {
      id: uuidv4(),
      name: 'Laptop Pro 15',
      description: 'High-performance laptop with 16GB RAM',
      price: 1299.99,
      category: 'Electronics',
      stock: 15,
      image: 'https://example.com/laptop.jpg'
    },
    {
      id: uuidv4(),
      name: 'Wireless Mouse',
      description: 'Ergonomic wireless mouse',
      price: 29.99,
      category: 'Electronics',
      stock: 50,
      image: 'https://example.com/mouse.jpg'
    },
    {
      id: uuidv4(),
      name: 'Office Chair',
      description: 'Comfortable office chair with lumbar support',
      price: 299.99,
      category: 'Furniture',
      stock: 20,
      image: 'https://example.com/chair.jpg'
    },
    {
      id: uuidv4(),
      name: 'Desk Lamp',
      description: 'LED desk lamp with adjustable brightness',
      price: 49.99,
      category: 'Furniture',
      stock: 30,
      image: 'https://example.com/lamp.jpg'
    },
    {
      id: uuidv4(),
      name: 'USB-C Cable',
      description: '6ft USB-C charging cable',
      price: 12.99,
      category: 'Accessories',
      stock: 100,
      image: 'https://example.com/cable.jpg'
    }
  ];

  products.push(...sampleProducts);

  console.log('✅ Seed data created:');
  console.log(`   - ${users.length} users (admin@example.com / admin123, customer@example.com / customer123)`);
  console.log(`   - ${products.length} products`);
}

// ============================================
// START SERVER
// ============================================

app.get('/', (req, res) => {
  res.json({
    message: 'E-Commerce Demo API',
    version: '1.0.0',
    documentation: `http://localhost:${PORT}/api-docs`,
    swagger: `http://localhost:${PORT}/swagger.json`,
    endpoints: {
      authentication: [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'POST /api/auth/logout'
      ],
      users: [
        'GET /api/users/:userId',
        'PUT /api/users/:userId'
      ],
      products: [
        'GET /api/products',
        'GET /api/products/:productId',
        'POST /api/products (admin)'
      ],
      cart: [
        'GET /api/cart',
        'POST /api/cart/items',
        'DELETE /api/cart/items/:productId'
      ],
      orders: [
        'POST /api/orders',
        'GET /api/orders',
        'GET /api/orders/:orderId',
        'PUT /api/orders/:orderId/status (admin)'
      ]
    }
  });
});

app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🚀 E-Commerce Demo API Server Started');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`📚 Swagger UI: http://localhost:${PORT}/api-docs`);
  console.log(`📄 Swagger JSON: http://localhost:${PORT}/swagger.json`);
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Seed data
  seedData();
  
  console.log('');
  console.log('🎯 Ready for test case generation!');
  console.log('   Use the Swagger JSON URL in your Functional Testing tab');
  console.log('═══════════════════════════════════════════════════════════════');
});
