const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { requireMinRole, requireFranchiseAccess } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all franchises
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

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status, search } = req.query;

    // Build where clause based on user role
    let where = {};
    
    // Franchise managers can only see their assigned franchises
    if (req.user.role === 'FRANCHISE_MANAGER') {
      where.managedBy = req.user.id;
    }

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { ownerName: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [franchises, total] = await Promise.all([
      prisma.franchise.findMany({
        where,
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
          counters: {
            select: {
              id: true,
              name: true,
              location: true,
              isActive: true,
            },
          },
          _count: {
            select: {
              sales: true,
              royaltyPayments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.franchise.count({ where }),
    ]);

    res.json({
      message: 'Franchises retrieved successfully',
      data: franchises,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get franchises error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve franchises',
    });
  }
});

// Create franchise
router.post('/', requireMinRole('ADMIN'), [
  body('name').trim().isLength({ min: 1 }),
  body('code').trim().isLength({ min: 1 }),
  body('ownerName').trim().isLength({ min: 1 }),
  body('ownerEmail').isEmail().normalizeEmail(),
  body('ownerPhone').isMobilePhone(),
  body('address').trim().isLength({ min: 1 }),
  body('city').trim().isLength({ min: 1 }),
  body('state').trim().isLength({ min: 1 }),
  body('pincode').trim().isLength({ min: 6, max: 6 }),
  body('royaltyRate').isDecimal({ decimal_digits: '0,2' }),
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
      ownerName,
      ownerEmail,
      ownerPhone,
      address,
      city,
      state,
      pincode,
      gstNumber,
      licenseNumber,
      royaltyRate,
      managedBy,
      openingDate,
    } = req.body;

    // Check if manager exists (if provided)
    if (managedBy) {
      const manager = await prisma.user.findUnique({
        where: { id: managedBy },
      });

      if (!manager || manager.role !== 'FRANCHISE_MANAGER') {
        return res.status(400).json({
          error: 'Invalid manager',
          message: 'Manager must be a user with FRANCHISE_MANAGER role',
        });
      }
    }

    const franchise = await prisma.franchise.create({
      data: {
        name,
        code,
        ownerName,
        ownerEmail,
        ownerPhone,
        address,
        city,
        state,
        pincode,
        gstNumber,
        licenseNumber,
        royaltyRate: parseFloat(royaltyRate),
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
      message: 'Franchise created successfully',
      franchise,
    });
  } catch (error) {
    console.error('Create franchise error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create franchise',
    });
  }
});

// Get franchise by ID
router.get('/:id', requireMinRole('MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;

    // Build where clause based on user role
    let where = { id };
    if (req.user.role === 'FRANCHISE_MANAGER') {
      where.managedBy = req.user.id;
    }

    const franchise = await prisma.franchise.findFirst({
      where,
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
        counters: {
          include: {
            _count: {
              select: {
                orders: true,
                sales: true,
              },
            },
          },
        },
        inventory: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                unitPrice: true,
                unit: true,
              },
            },
          },
        },
        sales: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        royaltyPayments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!franchise) {
      return res.status(404).json({
        error: 'Franchise not found',
        message: 'Franchise with the specified ID does not exist or you do not have access',
      });
    }

    res.json({
      message: 'Franchise retrieved successfully',
      franchise,
    });
  } catch (error) {
    console.error('Get franchise error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve franchise',
    });
  }
});

// Update franchise
router.put('/:id', requireMinRole('ADMIN'), [
  body('name').optional().trim().isLength({ min: 1 }),
  body('ownerName').optional().trim().isLength({ min: 1 }),
  body('ownerEmail').optional().isEmail().normalizeEmail(),
  body('ownerPhone').optional().isMobilePhone(),
  body('address').optional().trim().isLength({ min: 1 }),
  body('city').optional().trim().isLength({ min: 1 }),
  body('state').optional().trim().isLength({ min: 1 }),
  body('pincode').optional().trim().isLength({ min: 6, max: 6 }),
  body('royaltyRate').optional().isDecimal({ decimal_digits: '0,2' }),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
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
    const updateData = { ...req.body };

    // Convert royaltyRate to float if provided
    if (updateData.royaltyRate) {
      updateData.royaltyRate = parseFloat(updateData.royaltyRate);
    }

    // Check if manager exists (if provided)
    if (updateData.managedBy) {
      const manager = await prisma.user.findUnique({
        where: { id: updateData.managedBy },
      });

      if (!manager || manager.role !== 'FRANCHISE_MANAGER') {
        return res.status(400).json({
          error: 'Invalid manager',
          message: 'Manager must be a user with FRANCHISE_MANAGER role',
        });
      }
    }

    const franchise = await prisma.franchise.update({
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
      message: 'Franchise updated successfully',
      franchise,
    });
  } catch (error) {
    console.error('Update franchise error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update franchise',
    });
  }
});

// Get franchise statistics
router.get('/:id/stats', requireMinRole('MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check access
    let where = { id };
    if (req.user.role === 'FRANCHISE_MANAGER') {
      where.managedBy = req.user.id;
    }

    const franchise = await prisma.franchise.findFirst({ where });
    if (!franchise) {
      return res.status(404).json({
        error: 'Franchise not found',
        message: 'Franchise not found or access denied',
      });
    }

    const [
      totalSales,
      totalOrders,
      monthlyStats,
      inventoryStats,
    ] = await Promise.all([
      prisma.sale.aggregate({
        where: { franchiseId: id },
        _sum: { totalSales: true },
        _count: true,
      }),
      prisma.order.count({
        where: {
          counter: {
            franchiseId: id,
          },
        },
      }),
      prisma.sale.groupBy({
        by: ['date'],
        where: {
          franchiseId: id,
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1),
          },
        },
        _sum: {
          totalSales: true,
          totalOrders: true,
        },
        orderBy: { date: 'asc' },
      }),
      prisma.franchiseInventory.findMany({
        where: { franchiseId: id },
        include: {
          product: {
            select: {
              name: true,
              unitPrice: true,
            },
          },
        },
      }),
    ]);

    const stats = {
      totalSales: totalSales._sum.totalSales || 0,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? (totalSales._sum.totalSales || 0) / totalOrders : 0,
      monthlyTrends: monthlyStats,
      inventoryValue: inventoryStats.reduce((sum, item) => {
        return sum + (item.currentStock * parseFloat(item.product.unitPrice));
      }, 0),
      lowStockItems: inventoryStats.filter(item => item.currentStock <= item.minStock).length,
    };

    res.json({
      message: 'Franchise statistics retrieved successfully',
      stats,
    });
  } catch (error) {
    console.error('Get franchise stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve franchise statistics',
    });
  }
});

module.exports = router;
