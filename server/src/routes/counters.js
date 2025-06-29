const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { requireMinRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all counters
router.get('/', requireMinRole('MANAGER'), [
  query('isActive').optional().isBoolean(),
], async (req, res) => {
  try {
    const { isActive } = req.query;

    let where = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const counters = await prisma.counter.findMany({
      where,
      include: {
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
  body('name').trim().isLength({ min: 1 }),
  body('location').trim().isLength({ min: 1 }),
  body('managerName').optional().trim().isLength({ min: 1 }),
  body('managerPhone').optional().isMobilePhone(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        details: errors.array(),
      });
    }

    const { name, location, managerName, managerPhone } = req.body;

    const counter = await prisma.counter.create({
      data: {
        name,
        location,
        managerName,
        managerPhone,
        isActive: true,
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

// Create counter order (roti delivery to counter) - MOVED TO TOP FOR PRIORITY
router.post('/:counterId/orders', requireMinRole('MANAGER'), [
  body('items').isArray({ min: 1 }),
  body('items.*.packetSize').isInt({ min: 1 }),
  body('items.*.quantity').isInt({ min: 1 }),
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

    const { counterId } = req.params;
    const { items, notes } = req.body;

    // Check if counter exists
    const counter = await prisma.counter.findUnique({
      where: { id: counterId },
    });

    if (!counter) {
      return res.status(404).json({
        error: 'Counter not found',
        message: 'The specified counter does not exist',
      });
    }

    // Calculate totals
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPackets = items.reduce((sum, item) => sum + item.quantity, 0);

    // Create counter order
    const counterOrder = await prisma.counterOrder.create({
      data: {
        counterId,
        totalQuantity,
        totalPackets,
        notes,
        items: {
          create: items.map(item => ({
            packetSize: item.packetSize,
            quantity: item.quantity,
            totalRotis: item.packetSize * item.quantity,
          })),
        },
      },
      include: {
        items: true,
        counter: {
          select: {
            name: true,
            location: true,
          },
        },
      },
    });

    // Update counter inventory
    for (const item of items) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.counterInventory.upsert({
        where: {
          counterId_date_packetSize: {
            counterId,
            date: today,
            packetSize: item.packetSize,
          },
        },
        update: {
          totalPackets: {
            increment: item.quantity,
          },
          totalRotis: {
            increment: item.packetSize * item.quantity,
          },
          remainingPackets: {
            increment: item.quantity,
          },
          remainingRotis: {
            increment: item.packetSize * item.quantity,
          },
        },
        create: {
          counterId,
          date: today,
          packetSize: item.packetSize,
          totalPackets: item.quantity,
          totalRotis: item.packetSize * item.quantity,
          remainingPackets: item.quantity,
          remainingRotis: item.packetSize * item.quantity,
        },
      });
    }

    res.status(201).json({
      message: 'Counter order created successfully',
      order: counterOrder,
    });
  } catch (error) {
    console.error('Create counter order error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create counter order',
    });
  }
});

// Create regular order
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

// Get regular orders
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

    // Counter operators see limited data
    // No additional filtering needed for counter operators

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
            location: true,
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

// Get counter orders
router.get('/:counterId/orders', requireMinRole('MANAGER'), [
  query('date').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        details: errors.array(),
      });
    }

    const { counterId } = req.params;
    const { date, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = { counterId };

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      where.orderDate = {
        gte: startDate,
        lt: endDate,
      };
    }

    const [orders, total] = await Promise.all([
      prisma.counterOrder.findMany({
        where,
        include: {
          items: true,
          counter: {
            select: {
              name: true,
              location: true,
            },
          },
        },
        orderBy: { orderDate: 'desc' },
        skip: offset,
        take: parseInt(limit),
      }),
      prisma.counterOrder.count({ where }),
    ]);

    res.json({
      message: 'Counter orders retrieved successfully',
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get counter orders error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve counter orders',
    });
  }
});

// Get counter inventory
router.get('/:counterId/inventory', requireMinRole('MANAGER'), [
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

    const { counterId } = req.params;
    const { date } = req.query;

    let where = { counterId };

    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      where.date = targetDate;
    } else {
      // Default to today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.date = today;
    }

    const inventory = await prisma.counterInventory.findMany({
      where,
      include: {
        counter: {
          select: {
            name: true,
            location: true,
          },
        },
      },
      orderBy: { packetSize: 'asc' },
    });

    // Calculate totals
    const totals = inventory.reduce((acc, item) => ({
      totalPackets: acc.totalPackets + item.totalPackets,
      totalRotis: acc.totalRotis + item.totalRotis,
      soldPackets: acc.soldPackets + item.soldPackets,
      soldRotis: acc.soldRotis + item.soldRotis,
      remainingPackets: acc.remainingPackets + item.remainingPackets,
      remainingRotis: acc.remainingRotis + item.remainingRotis,
    }), {
      totalPackets: 0,
      totalRotis: 0,
      soldPackets: 0,
      soldRotis: 0,
      remainingPackets: 0,
      remainingRotis: 0,
    });

    res.json({
      message: 'Counter inventory retrieved successfully',
      data: inventory,
      totals,
    });
  } catch (error) {
    console.error('Get counter inventory error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve counter inventory',
    });
  }
});

// Update counter sales (when rotis are sold)
router.post('/:counterId/sales', requireMinRole('COUNTER_OPERATOR'), [
  body('items').isArray({ min: 1 }),
  body('items.*.packetSize').isInt({ min: 1 }),
  body('items.*.soldPackets').isInt({ min: 1 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        details: errors.array(),
      });
    }

    const { counterId } = req.params;
    const { items } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Update inventory for each item sold
    for (const item of items) {
      const soldRotis = item.packetSize * item.soldPackets;

      await prisma.counterInventory.updateMany({
        where: {
          counterId,
          date: today,
          packetSize: item.packetSize,
        },
        data: {
          soldPackets: {
            increment: item.soldPackets,
          },
          soldRotis: {
            increment: soldRotis,
          },
          remainingPackets: {
            decrement: item.soldPackets,
          },
          remainingRotis: {
            decrement: soldRotis,
          },
        },
      });
    }

    res.json({
      message: 'Sales updated successfully',
    });
  } catch (error) {
    console.error('Update counter sales error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update sales',
    });
  }
});

module.exports = router;
