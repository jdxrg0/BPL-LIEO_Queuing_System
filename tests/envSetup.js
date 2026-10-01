process.env.DATABASE_URL = "file:./test.db";
process.env.PORT = "5001"; // Avoid colliding with the main dev server on 5000
process.env.JWT_SECRET = "test-secret-key-123";
