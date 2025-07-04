// Vercel Serverless Function Entry Point
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import all routes
const authRoutes = require('../server/src/routes/auth');
const salesRoutes = require('../server/src/routes/sales');
const reportsRoutes = require('../server/src/routes/reports');
const manufacturingRoutes = require('../server/src/routes/manufacturing');
const financeRoutes = require('../server/src/routes/finance');
const franchiseRoutes = require('../server/src/routes/franchises');
const counterRoutes = require('../server/src/routes/counters');
const hrRoutes = require('../server/src/routes/hr');
const settingsRoutes = require('../server/src/routes/settings');
const userRoutes = require('../server/src/routes/users');

// Import middleware
const errorHandler = require('../server/src/middleware/errorHandler');
const { authenticateToken } = require('../server/src/middleware/auth');

const app = express();

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://invt-pritam-pattanaiks-projects.vercel.app',
      'https://invt-git-main-pritam-pattanaiks-projects.vercel.app',
      /https:\/\/invt.*\.vercel\.app$/,
      /https:\/\/.*\.vercel\.app$/
    ];

    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all origins for now to fix mobile issue
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add request logging for debugging mobile issues
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.get('Origin')} - User-Agent: ${req.get('User-Agent')}`);
  next();
});

// Handle preflight OPTIONS requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Roti Factory ERP Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    userAgent: req.get('User-Agent'),
    origin: req.get('Origin'),
    host: req.get('Host'),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    envCheck: {
      hasDatabase: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV
    }
  });
});

// Mobile-specific test endpoint
app.get('/mobile-test', (req, res) => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(req.get('User-Agent') || '');
  res.json({
    status: 'OK',
    message: 'Mobile connectivity test successful',
    isMobile,
    userAgent: req.get('User-Agent'),
    origin: req.get('Origin'),
    host: req.get('Host'),
    timestamp: new Date().toISOString()
  });
});

app.get('/db-status', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    console.log('Testing database connection...');
    await prisma.$connect();

    // Get actual data counts
    const [userCount, orderCount, posCount, productCount] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.pOSTransaction.count(),
      prisma.product.count()
    ]);

    // Get today's data specifically
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const [todayOrders, todayPOS] = await Promise.all([
      prisma.order.count({
        where: {
          deliveryDate: {
            gte: startOfDay,
            lt: endOfDay
          }
        }
      }),
      prisma.pOSTransaction.count({
        where: {
          transactionDate: {
            gte: startOfDay,
            lt: endOfDay
          }
        }
      })
    ]);

    await prisma.$disconnect();

    res.json({
      status: 'OK',
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      data: {
        total: {
          users: userCount,
          orders: orderCount,
          posTransactions: posCount,
          products: productCount
        },
        today: {
          orders: todayOrders,
          posTransactions: todayPOS,
          date: today.toISOString().split('T')[0]
        }
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString(),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sales', authenticateToken, salesRoutes);
app.use('/api/reports', authenticateToken, reportsRoutes);
app.use('/api/manufacturing', authenticateToken, manufacturingRoutes);
app.use('/api/finance', authenticateToken, financeRoutes);
app.use('/api/franchises', authenticateToken, franchiseRoutes);
app.use('/api/counters', authenticateToken, counterRoutes);
app.use('/api/hr', authenticateToken, hrRoutes);
app.use('/api/settings', authenticateToken, settingsRoutes);
app.use('/api/users', authenticateToken, userRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Export for Vercel
module.exports = app;
