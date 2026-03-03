# 🛒 E-Commerce Demo API for Test Case Generation

## 📋 Overview

A comprehensive demo API designed to showcase **all types of software testing**:
- ✅ **Unit Tests** - Individual function testing
- ✅ **API Tests** - REST API endpoint testing
- ✅ **E2E Tests** - Complete user flow testing
- ✅ **Integration Tests** - API + Database interactions
- ✅ **Contract Tests (PACT)** - API contract validation

This API includes complete **Swagger/OpenAPI** documentation for automated test case generation.

---

## 🚀 Quick Start

### **1. Install Dependencies**

```bash
cd /Users/Harish.Muleva/project/devjourney/automation_framework_v2/demoapp
npm install
```

### **2. Start Server**

```bash
npm start

# Or for development with auto-reload:
npm run dev
```

**Expected Output:**
```
═══════════════════════════════════════════════════════════════
🚀 E-Commerce Demo API Server Started
═══════════════════════════════════════════════════════════════
📍 Server running on: http://localhost:3001
📚 Swagger UI: http://localhost:3001/api-docs
📄 Swagger JSON: http://localhost:3001/swagger.json
═══════════════════════════════════════════════════════════════
✅ Seed data created:
   - 2 users (admin@example.com / admin123, customer@example.com / customer123)
   - 5 products
   
🎯 Ready for test case generation!
   Use the Swagger JSON URL in your Functional Testing tab
═══════════════════════════════════════════════════════════════
```

### **3. Access Documentation**

- **Swagger UI:** http://localhost:3001/api-docs
- **Swagger JSON:** http://localhost:3001/swagger.json
- **API Root:** http://localhost:3001/

---

## 📊 API Architecture

### **Domain Model:**

```
┌─────────────┐
│    User     │
└─────┬───────┘
      │ creates
      ▼
┌─────────────┐      ┌─────────────┐
│    Cart     │─────▶│   Product   │
└─────┬───────┘ contains └─────────────┘
      │ converts to
      ▼
┌─────────────┐
│    Order    │
└─────────────┘
```

### **API Endpoints by Domain:**

#### **Authentication (3 endpoints)**
```
POST /api/auth/register  - Register new user
POST /api/auth/login     - Login and get token
POST /api/auth/logout    - Logout user
```

#### **Users (2 endpoints)**
```
GET  /api/users/:userId  - Get user profile
PUT  /api/users/:userId  - Update user profile
```

#### **Products (3 endpoints)**
```
GET  /api/products              - List all products (with filters)
GET  /api/products/:productId   - Get single product
POST /api/products              - Create product (admin only)
```

#### **Cart (3 endpoints)**
```
GET    /api/cart                     - Get user's cart
POST   /api/cart/items               - Add item to cart
DELETE /api/cart/items/:productId    - Remove item from cart
```

#### **Orders (4 endpoints)**
```
POST /api/orders                  - Create order from cart
GET  /api/orders                  - List user's orders
GET  /api/orders/:orderId         - Get order details
PUT  /api/orders/:orderId/status  - Update order status (admin)
```

**Total: 15 endpoints**

---

## 🧪 Test Case Generation Examples

### **Unit Tests Examples:**

These test individual functions/utilities:

```javascript
// Utility functions that should be tested:
1. validateEmail(email) → boolean
2. calculateCartTotal(items) → number
3. hashPassword(password) → string
4. generateToken(userId) → string
5. validateProductStock(productId, quantity) → boolean
```

**Generated Unit Test:**
```javascript
describe('validateEmail', () => {
  it('should return true for valid email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });
  
  it('should return false for invalid email', () => {
    expect(validateEmail('invalid-email')).toBe(false);
  });
});
```

---

### **API Tests Examples:**

Test each endpoint individually:

#### **Positive API Tests:**

```
✅ TC_AUTH_001: Register user with valid data
   POST /api/auth/register
   Body: { email: "test@example.com", password: "Test123!", name: "Test User" }
   Expected: 201, userId returned

✅ TC_AUTH_002: Login with valid credentials
   POST /api/auth/login
   Body: { email: "test@example.com", password: "Test123!" }
   Expected: 200, token returned

✅ TC_PRODUCT_001: Get all products
   GET /api/products
   Expected: 200, array of products

✅ TC_PRODUCT_002: Get product by ID
   GET /api/products/{valid_id}
   Expected: 200, product object

✅ TC_CART_001: Add item to cart
   POST /api/cart/items
   Headers: { Authorization: Bearer {token} }
   Body: { productId: "{id}", quantity: 2 }
   Expected: 201, cart updated
```

#### **Negative API Tests:**

```
❌ TC_AUTH_NEG_001: Register with missing email
   POST /api/auth/register
   Body: { password: "Test123!", name: "Test User" }
   Expected: 400, error "Email is required"

❌ TC_AUTH_NEG_002: Register with weak password
   POST /api/auth/register
   Body: { email: "test@example.com", password: "123", name: "Test User" }
   Expected: 400, error "Password must be at least 6 characters"

❌ TC_AUTH_NEG_003: Login with invalid credentials
   POST /api/auth/login
   Body: { email: "test@example.com", password: "WrongPass!" }
   Expected: 401, error "Invalid credentials"

❌ TC_PRODUCT_NEG_001: Get non-existent product
   GET /api/products/invalid-id
   Expected: 404, error "Product not found"

❌ TC_CART_NEG_001: Add item without authentication
   POST /api/cart/items
   Body: { productId: "{id}", quantity: 2 }
   Expected: 401, error "Unauthorized"

❌ TC_CART_NEG_002: Add item with insufficient stock
   POST /api/cart/items
   Body: { productId: "{id}", quantity: 1000 }
   Expected: 400, error "Insufficient stock"
```

---

### **E2E Tests Examples:**

Test complete user flows across multiple APIs:

#### **E2E Test 1: Complete Purchase Flow**

```
Test Name: Complete User Registration and Product Purchase
Category: E2E
Priority: Critical

Steps:
1. POST /api/auth/register
   Body: { email: "buyer@test.com", password: "Test123!", name: "Buyer" }
   Verify: 201, userId returned
   
2. POST /api/auth/login
   Body: { email: "buyer@test.com", password: "Test123!" }
   Verify: 200, token returned
   Store: token
   
3. GET /api/products
   Headers: { Authorization: Bearer {token} }
   Verify: 200, products array not empty
   Store: productId from first product
   
4. POST /api/cart/items
   Headers: { Authorization: Bearer {token} }
   Body: { productId: "{stored_productId}", quantity: 2 }
   Verify: 201, cart total > 0
   
5. GET /api/cart
   Headers: { Authorization: Bearer {token} }
   Verify: 200, items.length === 1
   
6. POST /api/orders
   Headers: { Authorization: Bearer {token} }
   Body: { 
     shippingAddress: { street: "123 Main", city: "City", state: "ST", zipCode: "12345", country: "US" },
     paymentMethod: "credit_card"
   }
   Verify: 201, orderId returned
   Store: orderId
   
7. GET /api/orders/{orderId}
   Headers: { Authorization: Bearer {token} }
   Verify: 200, order.status === "pending"
   
8. GET /api/cart
   Headers: { Authorization: Bearer {token} }
   Verify: 200, items.length === 0 (cart cleared)

Expected Result: User can complete full purchase flow from registration to order creation
```

#### **E2E Test 2: Admin Product Management**

```
Test Name: Admin Creates Product and Customer Purchases
Category: E2E
Priority: High

Steps:
1. Login as admin
   POST /api/auth/login
   Body: { email: "admin@example.com", password: "admin123" }
   Verify: 200, token returned, user.role === "admin"
   Store: adminToken
   
2. Create new product
   POST /api/products
   Headers: { Authorization: Bearer {adminToken} }
   Body: { name: "New Product", price: 99.99, category: "Test", stock: 10 }
   Verify: 201, productId returned
   Store: newProductId
   
3. Login as customer
   POST /api/auth/login
   Body: { email: "customer@example.com", password: "customer123" }
   Store: customerToken
   
4. View new product
   GET /api/products/{newProductId}
   Verify: 200, product.name === "New Product"
   
5. Add to cart
   POST /api/cart/items
   Headers: { Authorization: Bearer {customerToken} }
   Body: { productId: "{newProductId}", quantity: 1 }
   Verify: 201, cart contains new product
   
6. Create order
   POST /api/orders
   Headers: { Authorization: Bearer {customerToken} }
   Verify: 201, order created
   Store: orderId
   
7. Update order status (admin)
   PUT /api/orders/{orderId}/status
   Headers: { Authorization: Bearer {adminToken} }
   Body: { status: "confirmed" }
   Verify: 200, order.status === "confirmed"

Expected Result: Admin can create product, customer can purchase it, admin can update order
```

#### **E2E Test 3: Cart Management Flow**

```
Test Name: Add Multiple Items, Remove One, Then Checkout
Category: E2E
Priority: Medium

Steps:
1. Login
2. Get products list
3. Add product 1 to cart (quantity: 2)
4. Add product 2 to cart (quantity: 1)
5. Verify cart total is correct
6. Remove product 1 from cart
7. Verify cart only has product 2
8. Create order
9. Verify order contains only product 2
```

---

### **Integration Tests Examples:**

Test API interactions with external systems (simulated here):

```
✅ INT_TEST_001: Product Stock Deduction
   - Add item to cart
   - Create order
   - Verify product stock decreased
   - Check database consistency

✅ INT_TEST_002: Order Creation with Payment
   - Create order
   - Verify payment processing called
   - Verify order status updated
   - Check transaction log

✅ INT_TEST_003: User Session Management
   - Login creates session
   - Verify session in store
   - Logout removes session
   - Verify session cleanup
```

---

### **Contract Tests (PACT) Examples:**

Define API contracts between consumer and provider:

```javascript
// Consumer: Frontend
// Provider: E-Commerce API

describe('User Authentication Contract', () => {
  it('should return token on successful login', () => {
    const interaction = {
      state: 'user exists',
      uponReceiving: 'a login request with valid credentials',
      withRequest: {
        method: 'POST',
        path: '/api/auth/login',
        headers: { 'Content-Type': 'application/json' },
        body: {
          email: 'test@example.com',
          password: 'Test123!'
        }
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          message: 'Login successful',
          token: Matchers.string(),
          user: {
            id: Matchers.uuid(),
            email: 'test@example.com',
            name: Matchers.string(),
            role: Matchers.string()
          }
        }
      }
    };
  });
});
```

---

## 🎯 API Chains for E2E Testing

### **Chain 1: User Registration → First Purchase**

```
1. Register → userId
   ↓
2. Login → token
   ↓
3. Get Products → productId
   ↓
4. Add to Cart (use token, productId)
   ↓
5. Get Cart (verify items)
   ↓
6. Create Order (use token) → orderId
   ↓
7. Get Order (verify details)
```

### **Chain 2: Admin Product Management**

```
1. Login as Admin → adminToken
   ↓
2. Create Product → productId
   ↓
3. Login as Customer → customerToken
   ↓
4. Get Product (verify exists)
   ↓
5. Purchase Flow...
```

### **Chain 3: Multi-Item Cart**

```
1. Login → token
   ↓
2. Get Products → product1_id, product2_id
   ↓
3. Add Product 1 to Cart
   ↓
4. Add Product 2 to Cart
   ↓
5. Get Cart (verify 2 items)
   ↓
6. Remove Product 1
   ↓
7. Get Cart (verify 1 item)
   ↓
8. Checkout
```

---

## 📄 Swagger JSON for Test Generation

### **Download Swagger Document:**

```bash
# While server is running:
curl http://localhost:3001/swagger.json > swagger.json
```

### **Or use in Functional Testing Tab:**

```
URL: http://localhost:3001/swagger.json

Steps:
1. Open your automation platform
2. Go to Functional tab
3. Enter URL: http://localhost:3001/swagger.json
4. Click "🤖 Generate Test Cases"
5. GenAI will analyze and create test cases
```

---

## 🔑 Test Credentials

### **Pre-created Users:**

```
Admin Account:
Email: admin@example.com
Password: admin123
Role: admin

Customer Account:
Email: customer@example.com
Password: customer123
Role: customer
```

### **Create New User:**

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "Pass123!",
    "name": "New User"
  }'
```

---

## 🧪 Manual Testing Examples

### **Test 1: Register and Login**

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User"
  }'

# Response: {"message":"User registered successfully","userId":"...","user":{...}}

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'

# Response: {"message":"Login successful","token":"token_...","user":{...}}
```

### **Test 2: Browse Products**

```bash
# Get all products
curl http://localhost:3001/api/products

# Filter by category
curl "http://localhost:3001/api/products?category=Electronics"

# Filter by price range
curl "http://localhost:3001/api/products?minPrice=20&maxPrice=100"
```

### **Test 3: Shopping Cart Flow**

```bash
# Get token first (from login response)
TOKEN="token_xxx_xxx"

# Get cart
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/cart

# Add item to cart
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":"product_id_here","quantity":2}' \
  http://localhost:3001/api/cart/items

# Create order
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": {
      "street": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zipCode": "94102",
      "country": "USA"
    },
    "paymentMethod": "credit_card"
  }' \
  http://localhost:3001/api/orders
```

---

## 📊 Test Coverage Matrix

| Test Type | Count | Coverage |
|-----------|-------|----------|
| **Unit Tests** | ~20 | Helper functions, validation logic |
| **API Tests (Positive)** | ~15 | One per endpoint |
| **API Tests (Negative)** | ~30+ | 2-4 per endpoint |
| **E2E Tests** | ~5 | Major user flows |
| **Integration Tests** | ~10 | API + Data interactions |
| **Contract Tests** | ~15 | API contracts per endpoint |
| **Total** | **~95** | Comprehensive coverage |

---

## 🎓 Test Generation Guidelines

### **For GenAI:**

When analyzing this API, generate:

1. **Unit Tests for:**
   - Email validation
   - Password strength check
   - Cart total calculation
   - Token generation
   - Stock validation

2. **API Tests for:**
   - Each endpoint (positive case)
   - Missing required fields (negative)
   - Invalid data types (negative)
   - Unauthorized access (negative)
   - Forbidden access (negative)
   - Non-existent resources (negative)

3. **E2E Tests for:**
   - Complete purchase flow
   - User registration to first order
   - Admin product creation to customer purchase
   - Cart management (add, update, remove, checkout)
   - Order status updates

4. **Integration Tests for:**
   - Order creation with cart clearing
   - Product stock updates
   - User session management
   - Role-based access control

5. **Contract Tests for:**
   - Request/response schemas per endpoint
   - Authentication flow contract
   - Admin operations contract

---

## 🔧 Customization

### **Add More Products:**

```javascript
// In server.js, modify seedData() function
sampleProducts.push({
  id: uuidv4(),
  name: 'Your Product',
  description: 'Description',
  price: 99.99,
  category: 'Category',
  stock: 10,
  image: 'url'
});
```

### **Add More Endpoints:**

```javascript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     tags:
 *       - YourTag
 *     summary: Your endpoint description
 *     responses:
 *       200:
 *         description: Success
 */
app.get('/api/your-endpoint', (req, res) => {
  // Your logic
});
```

---

## 📚 Technologies Used

- **Node.js** - Runtime
- **Express** - Web framework
- **Swagger/OpenAPI** - API documentation
- **swagger-jsdoc** - Generate Swagger from JSDoc
- **swagger-ui-express** - Swagger UI
- **uuid** - Unique ID generation
- **cors** - CORS handling

---

## 🎉 Summary

This demo API provides:

✅ **15 REST endpoints** covering authentication, users, products, cart, and orders
✅ **Complete Swagger/OpenAPI** documentation
✅ **Multiple API chains** for E2E testing
✅ **Role-based access** (customer vs admin)
✅ **Pre-seeded data** for immediate testing
✅ **Examples for all test types** (Unit, API, E2E, Integration, Contract)
✅ **Ready for GenAI** test case generation

---

## 🚀 Next Steps

1. **Start the server:** `npm start`
2. **View Swagger UI:** http://localhost:3001/api-docs
3. **Download Swagger JSON:** http://localhost:3001/swagger.json
4. **Import to Functional Testing tab** in your automation platform
5. **Generate test cases** using GenAI
6. **Execute tests** and validate

---

**🎯 Perfect for demonstrating comprehensive test automation capabilities! 🧪**
