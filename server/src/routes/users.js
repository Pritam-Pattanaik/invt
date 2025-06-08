const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult, query } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { requireMinRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all users (Admin and above)
router.get('/', requireMinRole('ADMIN'), [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FRANCHISE_MANAGER', 'COUNTER_OPERATOR']),
  query('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
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
    const { role, status, search } = req.query;

    // Build where clause
    const where = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      message: 'Users retrieved successfully',
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve users',
    });
  }
});

// Get user by ID
router.get('/:id', requireMinRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        createdFranchises: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
          },
        },
        managedFranchises: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User with the specified ID does not exist',
      });
    }

    res.json({
      message: 'User retrieved successfully',
      user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve user',
    });
  }
});

// Update user
router.put('/:id', requireMinRole('ADMIN'), [
  body('firstName').optional().trim().isLength({ min: 1 }),
  body('lastName').optional().trim().isLength({ min: 1 }),
  body('phone').optional().isMobilePhone(),
  body('role').optional().isIn(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FRANCHISE_MANAGER', 'COUNTER_OPERATOR']),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  body('password').optional().isLength({ min: 6 }),
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
    const { firstName, lastName, phone, role, status, password } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User with the specified ID does not exist',
      });
    }

    // Prepare update data
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update user',
    });
  }
});

// Delete user (Soft delete by setting status to INACTIVE)
router.delete('/:id', requireMinRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User with the specified ID does not exist',
      });
    }

    // Prevent deleting super admin
    if (existingUser.role === 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'Operation not allowed',
        message: 'Cannot delete super admin user',
      });
    }

    // Soft delete by setting status to INACTIVE
    await prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    res.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete user',
    });
  }
});

// Get user statistics (Admin and above)
router.get('/stats/overview', requireMinRole('ADMIN'), async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      usersByRole,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const roleStats = usersByRole.reduce((acc, item) => {
      acc[item.role] = item._count.role;
      return acc;
    }, {});

    res.json({
      message: 'User statistics retrieved successfully',
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        roleDistribution: roleStats,
        recentUsers,
      },
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve user statistics',
    });
  }
});

module.exports = router;
