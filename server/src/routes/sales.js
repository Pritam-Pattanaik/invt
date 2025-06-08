const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult, param, query } = require('express-validator');

const router = express.Router();
const prisma = new PrismaClient();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// GET /api/sales/orders - Get all orders
router.get('/orders', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
], handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const where = {};
    
    if (req.query.status) {
      where.status = req.query.status;
    }
    
    if (req.query.startDate || req.query.endDate) {
      where.orderDate = {};
      if (req.query.startDate) where.orderDate.gte = new Date(req.query.startDate);
      if (req.query.endDate) where.orderDate.lte = new Date(req.query.endDate);
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: true,
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// POST /api/sales/orders - Create new order
router.post('/orders', [
  body('customerName').notEmpty().trim(),
  body('customerPhone').notEmpty().trim(),
  body('customerAddress').optional().trim(),
  body('orderDate').isISO8601(),
  body('deliveryDate').isISO8601(),
  body('items').isArray({ min: 1 }),
  body('items.*.productId').notEmpty(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('items.*.price').isFloat({ min: 0 }),
], handleValidationErrors, async (req, res) => {
  try {
    const { customerName, customerPhone, customerAddress, orderDate, deliveryDate, items } = req.body;

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: { phone: customerPhone }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: customerName,
          phone: customerPhone,
          address: customerAddress || '',
          email: `${customerPhone}@temp.com` // Temporary email
        }
      });
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    // Generate order number
    const orderCount = await prisma.order.count();
    const orderNumber = `ORD-${String(orderCount + 1).padStart(6, '0')}`;

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        orderDate: new Date(orderDate),
        deliveryDate: new Date(deliveryDate),
        totalAmount,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.quantity * item.price
          }))
        }
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// PUT /api/sales/orders/:id - Update order
router.put('/orders/:id', [
  param('id').isUUID(),
  body('status').optional().isIn(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']),
  body('paymentStatus').optional().isIn(['PENDING', 'PAID', 'PARTIAL']),
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {};

    if (req.body.status) updateData.status = req.body.status;
    if (req.body.paymentStatus) updateData.paymentStatus = req.body.paymentStatus;

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// GET /api/sales/pos - Get POS transactions
router.get('/pos', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
], handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const where = {};
    
    if (req.query.startDate || req.query.endDate) {
      where.transactionDate = {};
      if (req.query.startDate) where.transactionDate.gte = new Date(req.query.startDate);
      if (req.query.endDate) where.transactionDate.lte = new Date(req.query.endDate);
    }

    const [transactions, total] = await Promise.all([
      prisma.pOSTransaction.findMany({
        where,
        include: {
          transactionItems: {
            include: {
              product: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.pOSTransaction.count({ where })
    ]);

    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching POS transactions:', error);
    res.status(500).json({ error: 'Failed to fetch POS transactions' });
  }
});

// POST /api/sales/pos - Create POS transaction
router.post('/pos', [
  body('customerName').optional().trim(),
  body('items').isArray({ min: 1 }),
  body('items.*.productId').notEmpty(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('items.*.price').isFloat({ min: 0 }),
  body('paymentMethod').isIn(['CASH', 'CARD', 'UPI']),
  body('cashierName').notEmpty().trim(),
], handleValidationErrors, async (req, res) => {
  try {
    const { customerName, items, paymentMethod, cashierName } = req.body;

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    // Generate transaction number
    const transactionCount = await prisma.pOSTransaction.count();
    const transactionNumber = `POS-${String(transactionCount + 1).padStart(6, '0')}`;

    // Create POS transaction
    const transaction = await prisma.pOSTransaction.create({
      data: {
        transactionNumber,
        customerName: customerName || null,
        totalAmount,
        paymentMethod,
        transactionDate: new Date(),
        cashierName,
        transactionItems: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.quantity * item.price
          }))
        }
      },
      include: {
        transactionItems: {
          include: {
            product: true
          }
        }
      }
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating POS transaction:', error);
    res.status(500).json({ error: 'Failed to create POS transaction' });
  }
});

// GET /api/sales/reports - Get sales reports
router.get('/reports', [
  query('period').optional().isIn(['today', 'yesterday', 'this-week', 'this-month', 'last-month', 'custom']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
], handleValidationErrors, async (req, res) => {
  try {
    const { period = 'today', startDate, endDate } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFilter = { gte: today };
        break;
      case 'yesterday':
        const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFilter = { gte: yesterday, lt: yesterdayEnd };
        break;
      case 'this-week':
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        dateFilter = { gte: weekStart };
        break;
      case 'this-month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { gte: monthStart };
        break;
      case 'last-month':
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { gte: lastMonthStart, lt: lastMonthEnd };
        break;
      case 'custom':
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) dateFilter.lte = new Date(endDate);
        break;
    }

    // Get orders data
    const orders = await prisma.order.findMany({
      where: { orderDate: dateFilter },
      include: { orderItems: true }
    });

    // Get POS data
    const posTransactions = await prisma.pOSTransaction.findMany({
      where: { transactionDate: dateFilter },
      include: { transactionItems: true }
    });

    // Calculate metrics
    const ordersRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const posRevenue = posTransactions.reduce((sum, transaction) => sum + transaction.totalAmount, 0);
    const totalRevenue = ordersRevenue + posRevenue;

    const report = {
      period: period === 'custom' ? `${startDate} to ${endDate}` : period,
      orders: {
        totalOrders: orders.length,
        totalRevenue: ordersRevenue,
        averageOrderValue: orders.length > 0 ? ordersRevenue / orders.length : 0
      },
      pos: {
        totalTransactions: posTransactions.length,
        totalRevenue: posRevenue,
        averageTransactionValue: posTransactions.length > 0 ? posRevenue / posTransactions.length : 0
      },
      totalRevenue,
      generatedAt: new Date().toISOString()
    };

    res.json(report);
  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).json({ error: 'Failed to generate sales report' });
  }
});

module.exports = router;
