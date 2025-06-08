const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult, param } = require('express-validator');
const bcrypt = require('bcryptjs');

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

// GET /api/settings/general - Get general settings
router.get('/general', async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();
    
    // Convert array to object for easier access
    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    res.json(settingsObj);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings/general - Update general settings
router.put('/general', [
  body('companyName').optional().trim(),
  body('companyAddress').optional().trim(),
  body('companyPhone').optional().trim(),
  body('companyEmail').optional().isEmail(),
  body('currency').optional().trim(),
  body('timezone').optional().trim(),
  body('dateFormat').optional().trim(),
  body('language').optional().trim(),
  body('emailNotifications').optional().isBoolean(),
  body('smsNotifications').optional().isBoolean(),
  body('autoBackup').optional().isBoolean(),
  body('backupFrequency').optional().isIn(['DAILY', 'WEEKLY', 'MONTHLY']),
], handleValidationErrors, async (req, res) => {
  try {
    const updates = [];
    
    for (const [key, value] of Object.entries(req.body)) {
      updates.push(
        prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) }
        })
      );
    }

    await Promise.all(updates);

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// GET /api/settings/users - Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate statistics
    const stats = {
      total: users.length,
      active: users.filter(u => u.isActive).length,
      admins: users.filter(u => ['SUPER_ADMIN', 'ADMIN'].includes(u.role)).length,
      online: users.filter(u => u.lastLogin && new Date(u.lastLogin) > new Date(Date.now() - 3600000)).length
    };

    res.json({ users, stats });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/settings/users - Create new user
router.post('/users', [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('role').isIn(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FRANCHISE_MANAGER', 'COUNTER_OPERATOR']),
  body('password').isLength({ min: 6 }),
], handleValidationErrors, async (req, res) => {
  try {
    const { firstName, lastName, email, role, password } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        role,
        password: hashedPassword,
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/settings/users/:id - Update user
router.put('/users/:id', [
  param('id').isUUID(),
  body('isActive').optional().isBoolean(),
  body('role').optional().isIn(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FRANCHISE_MANAGER', 'COUNTER_OPERATOR']),
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {};

    if (typeof req.body.isActive === 'boolean') updateData.isActive = req.body.isActive;
    if (req.body.role) updateData.role = req.body.role;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// GET /api/settings/permissions - Get role permissions
router.get('/permissions', async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { name: 'asc' }]
    });

    const rolePermissions = await prisma.rolePermission.findMany({
      include: {
        permission: true
      }
    });

    // Group permissions by role
    const permissionsByRole = rolePermissions.reduce((acc, rp) => {
      if (!acc[rp.role]) acc[rp.role] = [];
      acc[rp.role].push(rp.permission);
      return acc;
    }, {});

    res.json({ permissions, rolePermissions: permissionsByRole });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

// PUT /api/settings/permissions/:role - Update role permissions
router.put('/permissions/:role', [
  param('role').isIn(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FRANCHISE_MANAGER', 'COUNTER_OPERATOR']),
  body('permissionIds').isArray(),
  body('permissionIds.*').isUUID(),
], handleValidationErrors, async (req, res) => {
  try {
    const { role } = req.params;
    const { permissionIds } = req.body;

    // Delete existing permissions for this role
    await prisma.rolePermission.deleteMany({
      where: { role }
    });

    // Create new permissions
    if (permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map(permissionId => ({
          role,
          permissionId
        }))
      });
    }

    res.json({ message: 'Permissions updated successfully' });
  } catch (error) {
    console.error('Error updating permissions:', error);
    res.status(500).json({ error: 'Failed to update permissions' });
  }
});

// GET /api/settings/backup - Get backup records
router.get('/backup', async (req, res) => {
  try {
    const backups = await prisma.backup.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Calculate statistics
    const stats = {
      total: backups.length,
      successful: backups.filter(b => b.status === 'SUCCESS').length,
      failed: backups.filter(b => b.status === 'FAILED').length,
      totalSize: backups.reduce((sum, b) => {
        const size = parseFloat(b.size.split(' ')[0]);
        return sum + (isNaN(size) ? 0 : size);
      }, 0)
    };

    res.json({ backups, stats });
  } catch (error) {
    console.error('Error fetching backups:', error);
    res.status(500).json({ error: 'Failed to fetch backups' });
  }
});

// POST /api/settings/backup - Create backup
router.post('/backup', [
  body('type').optional().isIn(['MANUAL', 'AUTOMATIC']),
], handleValidationErrors, async (req, res) => {
  try {
    const { type = 'MANUAL' } = req.body;

    // Generate backup filename
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `backup_${timestamp}_${type.toLowerCase()}.sql`;

    // Simulate backup creation (in real implementation, you would create actual backup)
    const backup = await prisma.backup.create({
      data: {
        fileName,
        size: `${(Math.random() * 5 + 1).toFixed(1)} MB`, // Random size for demo
        type,
        status: 'SUCCESS'
      }
    });

    res.status(201).json(backup);
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// DELETE /api/settings/backup/:id - Delete backup
router.delete('/backup/:id', [
  param('id').isUUID(),
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.backup.delete({
      where: { id }
    });

    res.json({ message: 'Backup deleted successfully' });
  } catch (error) {
    console.error('Error deleting backup:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Backup not found' });
    }
    res.status(500).json({ error: 'Failed to delete backup' });
  }
});

module.exports = router;
