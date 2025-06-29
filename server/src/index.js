const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const manufacturingRoutes = require('./routes/manufacturing');
const hotelRoutes = require('./routes/hotels');
const hostelRoutes = require('./routes/hostels');
const counterRoutes = require('./routes/counters');
const reportRoutes = require('./routes/reports');
const salesRoutes = require('./routes/sales');
const financeRoutes = require('./routes/finance');
const hrRoutes = require('./routes/hr');
const settingsRoutes = require('./routes/settings');

const errorHandler = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://localhost:5173',
    'https://localhost:5174',
    process.env.FRONTEND_URL,
    /\.vercel\.app$/
  ].filter(Boolean),
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Roti Factory ERP API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Database status endpoint
app.get('/db-status', async (req, res) => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Test database connection
    await prisma.$connect();

    // Get basic stats
    const stats = {
      users: await prisma.user.count(),
      products: await prisma.product.count(),
      franchises: await prisma.franchise.count(),
      orders: await prisma.order.count(),
      customers: await prisma.customer.count(),
    };

    // Get database info
    const dbInfo = await prisma.$queryRaw`SELECT version()`;

    res.status(200).json({
      status: 'Connected',
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
      database: {
        type: 'PostgreSQL',
        version: dbInfo[0].version.split(' ')[1],
        host: 'Neon Database',
      },
      statistics: stats,
    });

  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  } finally {
    await prisma.$disconnect();
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/manufacturing', authenticateToken, manufacturingRoutes);
app.use('/api/hotels', authenticateToken, hotelRoutes);
app.use('/api/hostels', authenticateToken, hostelRoutes);
app.use('/api/counters', authenticateToken, counterRoutes);
app.use('/api/reports', authenticateToken, reportRoutes);
app.use('/api/sales', authenticateToken, salesRoutes);
app.use('/api/finance', authenticateToken, financeRoutes);
app.use('/api/hr', authenticateToken, hrRoutes);
app.use('/api/settings', authenticateToken, settingsRoutes);

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Roti Factory ERP API Documentation',
    version: '1.0.0',
    description: 'Comprehensive ERP system for roti manufacturing business',
    endpoints: {
      authentication: {
        'POST /api/auth/login': 'User login',
        'POST /api/auth/register': 'User registration (admin only)',
        'POST /api/auth/refresh': 'Refresh access token',
        'POST /api/auth/logout': 'User logout',
      },
      users: {
        'GET /api/users': 'Get all users',
        'GET /api/users/:id': 'Get user by ID',
        'PUT /api/users/:id': 'Update user',
        'DELETE /api/users/:id': 'Delete user',
      },
      manufacturing: {
        'GET /api/manufacturing/products': 'Get all products',
        'POST /api/manufacturing/products': 'Create product',
        'GET /api/manufacturing/inventory': 'Get inventory status',
        'POST /api/manufacturing/production': 'Create production batch',
        'GET /api/manufacturing/quality-checks': 'Get quality checks',
      },
      franchises: {
        'GET /api/franchises': 'Get all franchises',
        'POST /api/franchises': 'Create franchise',
        'GET /api/franchises/:id': 'Get franchise details',
        'PUT /api/franchises/:id': 'Update franchise',
      },
      counters: {
        'GET /api/counters': 'Get all counters',
        'POST /api/counters/orders': 'Create order',
        'GET /api/counters/orders': 'Get orders',
        'PUT /api/counters/orders/:id': 'Update order status',
      },
      reports: {
        'GET /api/reports/dashboard': 'Get dashboard data',
        'GET /api/reports/sales': 'Get sales reports',
        'GET /api/reports/inventory': 'Get inventory reports',
        'GET /api/reports/production': 'Get production reports',
      },
    },
    currency: 'INR (₹)',
    authentication: 'JWT Bearer Token',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist.`,
  });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Roti Factory ERP Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/api/docs`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
