const { Verifier } = require('@pact-foundation/pact');
const path = require('path');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server-db');
const User = require('../models/User');
const Product = require('../models/Product');
const fs = require('fs');

let mongoServer;
let server;

describe('Pact Provider Verification (Local Pacts)', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(mongoUri);

    await User.deleteMany({});
    await Product.deleteMany({});

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
      name: 'Test Customer'
    });
    await customer.save();

    const products = [
      {
        name: 'Laptop Pro',
        description: 'High-performance laptop',
        price: 1299.99,
        category: 'Electronics',
        stock: 10
      },
      {
        name: 'Wireless Mouse',
        description: 'Ergonomic mouse',
        price: 29.99,
        category: 'Electronics',
        stock: 50
      }
    ];
    await Product.insertMany(products);

    server = app.listen(9001);
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      server = null;
    }
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    if (mongoServer) {
      await mongoServer.stop();
      mongoServer = null;
    }
  });

  it('should validate provider against local consumer pacts', async () => {
    const pactDir = path.resolve(__dirname, '../../frontend/pacts');
    
    // Check if pact files exist
    if (!fs.existsSync(pactDir)) {
      console.log('ℹ️  No pact files found. Run consumer tests first:');
      console.log('   cd ../frontend && npm run test:pact');
      return; // Skip test if no pacts
    }

    const pactFiles = fs.readdirSync(pactDir).filter(f => f.endsWith('.json'));
    
    if (pactFiles.length === 0) {
      console.log('ℹ️  No pact files found. Run consumer tests first:');
      console.log('   cd ../frontend && npm run test:pact');
      return; // Skip test if no pacts
    }

    const pactUrls = pactFiles.map(f => path.join(pactDir, f));

    const opts = {
      provider: 'ECommerceAPI',
      providerBaseUrl: 'http://localhost:9001',
      
      // Use local pact files
      pactUrls: pactUrls,
      
      logLevel: 'info',
      
      stateHandlers: {
        'user does not exist': async () => {
          await User.deleteMany({});
        },
        'user exists': async () => {
          await User.deleteMany({});
          const user = new User({
            email: 'customer@example.com',
            password: 'customer123',
            name: 'Test Customer'
          });
          await user.save();
        },
        'products exist': async () => {
          await Product.deleteMany({});
          const products = [
            {
              name: 'Laptop Pro',
              description: 'High-performance laptop',
              price: 1299.99,
              category: 'Electronics',
              stock: 10
            }
          ];
          await Product.insertMany(products);
        }
      }
    };

    const output = await new Verifier(opts).verifyProvider();
    console.log('✅ Pact Verification Complete (Local Files)!');
    console.log(output);
  });
});
