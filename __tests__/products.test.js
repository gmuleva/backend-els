const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server-db');
const Product = require('../models/Product');
const User = require('../models/User');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.disconnect();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Product.deleteMany({});
  await User.deleteMany({});
});

describe('Products API Unit Tests', () => {
  describe('GET /api/products', () => {
    beforeEach(async () => {
      const products = [
        {
          name: 'Laptop',
          description: 'High-performance laptop',
          price: 1299.99,
          category: 'Electronics',
          stock: 10
        },
        {
          name: 'Mouse',
          description: 'Wireless mouse',
          price: 29.99,
          category: 'Electronics',
          stock: 50
        },
        {
          name: 'Desk Chair',
          description: 'Ergonomic chair',
          price: 299.99,
          category: 'Furniture',
          stock: 20
        }
      ];
      await Product.insertMany(products);
    });

    it('should retrieve all products', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('price');
      expect(response.body[0]).toHaveProperty('category');
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/api/products?category=Electronics')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      response.body.forEach(product => {
        expect(product.category).toBe('Electronics');
      });
    });
  });

  describe('GET /api/products/:productId', () => {
    let productId;

    beforeEach(async () => {
      const product = new Product({
        name: 'Test Product',
        description: 'Test description',
        price: 99.99,
        category: 'Test',
        stock: 5
      });
      const savedProduct = await product.save();
      productId = savedProduct._id.toString();
    });

    it('should retrieve a product by ID', async () => {
      const response = await request(app)
        .get(`/api/products/${productId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Test Product');
      expect(response.body).toHaveProperty('price', 99.99);
      expect(response.body).toHaveProperty('category', 'Test');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/products/${fakeId}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Product not found');
      expect(response.body).toHaveProperty('code', 'PRODUCT_NOT_FOUND');
    });
  });
});
