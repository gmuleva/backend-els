module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testTimeout: 30000,
  verbose: true,
  maxWorkers: 1, // Run tests serially to avoid port conflicts
  forceExit: true // Force exit after tests complete
};
