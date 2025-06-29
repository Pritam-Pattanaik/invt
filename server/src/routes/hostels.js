const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { requireMinRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all hostels
router.get('/', requireMinRole('MANAGER'), [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isString(),
  query('search').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        details: errors.array(),
      });
    }

    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { managerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [hostels, total] = await Promise.all([
      prisma.hostel.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          creator: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          manager: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              orders: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.hostel.count({ where }),
    ]);

    res.json({
      hostels,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get hostels error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve hostels',
    });
  }
});

// Create hostel
router.post('/', requireMinRole('ADMIN'), [
  body('name').trim().isLength({ min: 1 }),
  body('code').trim().isLength({ min: 1 }),
  body('managerName').trim().isLength({ min: 1 }),
  body('managerPhone').isMobilePhone(),
  body('address').trim().isLength({ min: 1 }),
  body('city').trim().isLength({ min: 1 }),
  body('state').trim().isLength({ min: 1 }),
  body('pincode').trim().isLength({ min: 6, max: 6 }),
  body('managedBy').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        details: errors.array(),
      });
    }

    const {
      name,
      code,
      managerName,
      managerPhone,
      address,
      city,
      state,
      pincode,
      gstNumber,
      licenseNumber,
      managedBy,
      openingDate,
    } = req.body;

    // Check if manager exists (if provided)
    if (managedBy) {
      const manager = await prisma.user.findUnique({
        where: { id: managedBy },
      });

      if (!manager) {
        return res.status(400).json({
          error: 'Invalid manager',
          message: 'Manager user does not exist',
        });
      }
    }

    const hostel = await prisma.hostel.create({
      data: {
        name,
        code,
        managerName,
        managerPhone,
        address,
        city,
        state,
        pincode,
        gstNumber,
        licenseNumber,
        status: 'ACTIVE',
        openingDate: openingDate ? new Date(openingDate) : null,
        createdBy: req.user.id,
        managedBy,
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        manager: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Hostel created successfully',
      hostel,
    });
  } catch (error) {
    console.error('Create hostel error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create hostel',
    });
  }
});

// Get hostel by ID
router.get('/:id', requireMinRole('MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;

    const hostel = await prisma.hostel.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        orders: {
          include: {
            items: true,
          },
          orderBy: { orderDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!hostel) {
      return res.status(404).json({
        error: 'Hostel not found',
        message: 'Hostel with the specified ID does not exist',
      });
    }

    res.json({
      message: 'Hostel retrieved successfully',
      hostel,
    });
  } catch (error) {
    console.error('Get hostel error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve hostel',
    });
  }
});

// Update hostel
router.put('/:id', requireMinRole('ADMIN'), [
  body('name').optional().trim().isLength({ min: 1 }),
  body('managerName').optional().trim().isLength({ min: 1 }),
  body('managerPhone').optional().isMobilePhone(),
  body('address').optional().trim().isLength({ min: 1 }),
  body('city').optional().trim().isLength({ min: 1 }),
  body('state').optional().trim().isLength({ min: 1 }),
  body('pincode').optional().trim().isLength({ min: 6, max: 6 }),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE']),
  body('managedBy').optional().isString(),
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
    const updateData = req.body;

    // Check if manager exists (if provided)
    if (updateData.managedBy) {
      const manager = await prisma.user.findUnique({
        where: { id: updateData.managedBy },
      });

      if (!manager) {
        return res.status(400).json({
          error: 'Invalid manager',
          message: 'Manager user does not exist',
        });
      }
    }

    const hostel = await prisma.hostel.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        manager: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.json({
      message: 'Hostel updated successfully',
      hostel,
    });
  } catch (error) {
    console.error('Update hostel error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update hostel',
    });
  }
});

// Delete hostel
router.delete('/:id', requireMinRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.hostel.delete({
      where: { id },
    });

    res.json({
      message: 'Hostel deleted successfully',
    });
  } catch (error) {
    console.error('Delete hostel error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete hostel',
    });
  }
});

// Create hostel order
router.post('/:hostelId/orders', requireMinRole('COUNTER_OPERATOR'), [
  body('items').isArray({ min: 1 }),
  body('items.*.packetSize').isInt({ min: 1 }),
  body('items.*.quantity').isInt({ min: 1 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        details: errors.array(),
      });
    }

    const { hostelId } = req.params;
    const { items, notes } = req.body;

    // Calculate totals
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPackets = items.reduce((sum, item) => sum + item.quantity, 0);

    const order = await prisma.hostelOrder.create({
      data: {
        hostelId,
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
        hostel: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Hostel order created successfully',
      order,
    });
  } catch (error) {
    console.error('Create hostel order error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create hostel order',
    });
  }
});

// Get hostel orders
router.get('/:hostelId/orders', requireMinRole('COUNTER_OPERATOR'), [
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

    const { hostelId } = req.params;
    const { date, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let where = { hostelId };
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      where.orderDate = {
        gte: startDate,
        lt: endDate,
      };
    }

    const [orders, total] = await Promise.all([
      prisma.hostelOrder.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          items: true,
          hostel: {
            select: {
              name: true,
              code: true,
            },
          },
        },
        orderBy: { orderDate: 'desc' },
      }),
      prisma.hostelOrder.count({ where }),
    ]);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get hostel orders error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve hostel orders',
    });
  }
});

module.exports = router;
