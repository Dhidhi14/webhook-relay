process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-at-least-32-characters-long';
process.env.JWT_EXPIRES = '7d';
process.env.REDIS_URL = 'redis://127.0.0.1:6379';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/webhookrelay-test';
process.env.BACKOFF_DELAY_MS = '1000';
process.env.PORT = '5000';
