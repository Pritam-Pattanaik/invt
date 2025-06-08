const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { requireMinRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all counters
router.get('/', requireMinRole('MANAGER'), [
  query('franchiseId').optional().isString(),
  query('isActive').optional().isBoolean(),
], async (req, res) => {
  try {
    const { franchiseId, isActive } = req.query;

    let where = {};
    if (franchiseId) where.franchiseId = franchiseId;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    // Franchise managers can only see their franchise counters
    if (req.user.role === 'FRANCHISE_MANAGER') {
      where.franchise = {
        managedBy: req.user.id,
      };
    }

    const counters = await prisma.counter.findMany({
      where,
      include: {
        franchise: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
          },
        },
        _count: {
          select: {
            orders: true,
            sales: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      message: 'Counters retrieved successfully',
      data: counters,
    });
  } catch (error) {
    console.error('Get counters error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve counters',
    });
  }
});

// Create counter
router.post('/', requireMinRole('ADMIN'), [
  body('franchiseId').isString(),
  body('name').trim().isLength({ min: 1 }),
  body('location').trim().isLength({ min: 1 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        details: errors.array(),
      });
    }

    const { franchiseId, name, location } = req.body;

    // Check if franchise exists
    const franchise = await prisma.franchise.findUnique({
      where: { id: franchiseId },
    });

    if (!franchise) {
      return res.status(404).json({
        error: 'Franchise not found',
        message: 'The specified franchise does not exist',
      });
    }

    const counter = await prisma.counter.create({
      data: {
        franchiseId,
        name,
        location,
        isActive: true,
      },
      include: {
        franchise: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Counter created successfully',
      counter,
    });
  } catch (error) {
    console.error('Create counter error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create counter',
    });
  }
});

// Create order
router.post('/orders', requireMinRole('COUNTER_OPERATOR'), [
  body('counterId').isString(),
  body('items').isArray({ min: 1 }),
  body('items.*.productId').isString(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('items.*.unitPrice').isDecimal({ decimal_digits: '0,2' }),
  body('customerId').optional().isString(),
  body('paymentMethod').optional().isString(),
  body('discount').optional().isDecimal({ decimal_digits: '0,2' }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        details: errors.array(),
      });
    }

    const { counterId, items, customerId, paymentMethod, discount = 0, notes } = req.body;

    // Check if counter exists and is active
    const counter = await prisma.counter.findUnique({
      where: { id: counterId },
      include: {
        franchise: true,
      },
    });

    if (!counter || !counter.isActive) {
      return res.status(404).json({
        error: 'Counter not found',
        message: 'Counter not found or inactive',
      });
    }

    // Calculate totals
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product || !product.isActive) {
        return res.status(400).json({
          error: 'Invalid product',
          message: `Product ${item.productId} not found or inactive`,
        });
      }

      const itemTotal = item.quantity * parseFloat(item.unitPrice);
      totalAmount += itemTotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice),
        totalPrice: itemTotal,
        notes: item.notes,
      });
    }

    // Apply discount and calculate tax (assuming 5% GST)
    const discountAmount = parseFloat(discount);
    const taxableAmount = totalAmount - discountAmount;
    const tax = taxableAmount * 0.05; // 5% GST
    const finalAmount = taxableAmount + tax;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNumber,
        counterId,
        customerId,
        status: 'PENDING',
        totalAmount,
        discount: discountAmount,
        tax,
        finalAmount,
        paymentMethod,
        notes,
        createdBy: req.user.id,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
                unit: true,
              },
            },
          },
        },
        counter: {
          select: {
            name: true,
            location: true,
            franchise: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Order created successfully',
      order,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create order',
    });
  }
});

// Get orders
router.get('/orders', [
  query('counterId').optional().isString(),
  query('status').optional().isIn(['PENDING', 'CONFIRMED', 'IN_PREPARATION', 'READY', 'DELIVERED', 'CANCELLED']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('date').optional().isISO8601(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        details: errors.array(),
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { counterId, status, date } = req.query;

    let where = {};
    if (counterId) where.counterId = counterId;
    if (status) where.status = status;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      where.createdAt = {
        gte: startDate,
        lt: endDate,
      };
    }

    // Franchise managers and counter operators see limited data
    if (req.user.role === 'FRANCHISE_MANAGER') {
      where.counter = {
        franchise: {
          managedBy: req.user.id,
        },
      };
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true,
                  unit: true,
                },
              },
            },
          },
          counter: {
            select: {
              name: true,
              location: true,
              franchise: {
                select: {
                  name: true,
                  code: true,
                },
              },
            },
          },
          customer: {
            select: {
              name: true,
              phone: true,
            },
          },
          creator: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      message: 'Orders retrieved successfully',
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve orders',
    });
  }
});

// Update order status
router.put('/orders/:id', requireMinRole('COUNTER_OPERATOR'), [
  body('status').isIn(['PENDING', 'CONFIRMED', 'IN_PREPARATION', 'READY', 'DELIVERED', 'CANCELLED']),
  body('notes').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        details: errors.array(),
      });
    }

    const { id } = req.params;
    const { status, notes } = req.body;

    const order = await prisma.order.update({
      where: { id },
      data: {
        status,
        notes: notes || undefined,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
        counter: {
          select: {
            name: true,
            franchise: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    res.json({
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update order',
    });
  }
});

module.exports = router;
