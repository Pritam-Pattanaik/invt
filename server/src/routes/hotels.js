const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { requireMinRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all hotels
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

    const [hotels, total] = await Promise.all([
      prisma.hotel.findMany({
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
      prisma.hotel.count({ where }),
    ]);

    res.json({
      hotels,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get hotels error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve hotels',
    });
  }
});

// Create hotel
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

    const hotel = await prisma.hotel.create({
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
      message: 'Hotel created successfully',
      hotel,
    });
  } catch (error) {
    console.error('Create hotel error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create hotel',
    });
  }
});

// Get hotel by ID
router.get('/:id', requireMinRole('MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;

    const hotel = await prisma.hotel.findUnique({
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

    if (!hotel) {
      return res.status(404).json({
        error: 'Hotel not found',
        message: 'Hotel with the specified ID does not exist',
      });
    }

    res.json({
      message: 'Hotel retrieved successfully',
      hotel,
    });
  } catch (error) {
    console.error('Get hotel error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve hotel',
    });
  }
});

// Update hotel
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

    const hotel = await prisma.hotel.update({
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
      message: 'Hotel updated successfully',
      hotel,
    });
  } catch (error) {
    console.error('Update hotel error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update hotel',
    });
  }
});

// Delete hotel
router.delete('/:id', requireMinRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.hotel.delete({
      where: { id },
    });

    res.json({
      message: 'Hotel deleted successfully',
    });
  } catch (error) {
    console.error('Delete hotel error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete hotel',
    });
  }
});

// Create hotel order
router.post('/:hotelId/orders', requireMinRole('COUNTER_OPERATOR'), [
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

    const { hotelId } = req.params;
    const { items, notes } = req.body;

    // Calculate totals
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPackets = items.reduce((sum, item) => sum + item.quantity, 0);

    const order = await prisma.hotelOrder.create({
      data: {
        hotelId,
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
        hotel: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Hotel order created successfully',
      order,
    });
  } catch (error) {
    console.error('Create hotel order error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create hotel order',
    });
  }
});

// Get hotel orders
router.get('/:hotelId/orders', requireMinRole('COUNTER_OPERATOR'), [
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

    const { hotelId } = req.params;
    const { date, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let where = { hotelId };
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
      prisma.hotelOrder.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          items: true,
          hotel: {
            select: {
              name: true,
              code: true,
            },
          },
        },
        orderBy: { orderDate: 'desc' },
      }),
      prisma.hotelOrder.count({ where }),
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
    console.error('Get hotel orders error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve hotel orders',
    });
  }
});

module.exports = router;
