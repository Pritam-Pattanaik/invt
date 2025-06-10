const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { requireMinRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Products Routes

// Get all products
router.get('/products', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isString(),
  query('search').optional().isString(),
  query('isActive').optional().isBoolean(),
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
    const { category, search, isActive } = req.query;

    // Build where clause
    const where = {};
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          inventoryItems: {
            select: {
              currentStock: true,
              availableStock: true,
              reorderPoint: true,
            },
          },
          _count: {
            select: {
              recipes: true,
              productionBatches: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      message: 'Products retrieved successfully',
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve products',
    });
  }
});

// Create product
router.post('/products', requireMinRole('MANAGER'), [
  body('name').trim().isLength({ min: 1 }),
  body('sku').trim().isLength({ min: 1 }),
  body('category').trim().isLength({ min: 1 }),
  body('unitPrice').isDecimal({ decimal_digits: '0,2' }),
  body('costPrice').isDecimal({ decimal_digits: '0,2' }),
  body('unit').trim().isLength({ min: 1 }),
  body('description').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        details: errors.array(),
      });
    }

    const { name, description, sku, category, unitPrice, costPrice, unit } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        description,
        sku,
        category,
        unitPrice: parseFloat(unitPrice),
        costPrice: parseFloat(costPrice),
        unit,
        isActive: true,
      },
    });

    // Create initial inventory item
    await prisma.inventoryItem.create({
      data: {
        productId: product.id,
        currentStock: 0,
        availableStock: 0,
        reorderPoint: 10,
      },
    });

    res.status(201).json({
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create product',
    });
  }
});

// Update product
router.put('/products/:id', requireMinRole('MANAGER'), [
  body('name').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('category').optional().trim().isLength({ min: 1 }),
  body('unitPrice').optional().isDecimal({ decimal_digits: '0,2' }),
  body('costPrice').optional().isDecimal({ decimal_digits: '0,2' }),
  body('unit').optional().trim().isLength({ min: 1 }),
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
    const updateData = {};

    // Only include fields that are provided
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.category) updateData.category = req.body.category;
    if (req.body.unitPrice) updateData.unitPrice = parseFloat(req.body.unitPrice);
    if (req.body.costPrice) updateData.costPrice = parseFloat(req.body.costPrice);
    if (req.body.unit) updateData.unit = req.body.unit;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        inventoryItems: {
          select: {
            currentStock: true,
            availableStock: true,
            reorderPoint: true,
          },
        },
      },
    });

    res.json({
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    console.error('Update product error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Product not found',
      });
    }
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update product',
    });
  }
});

// Delete product
router.delete('/products/:id', requireMinRole('MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists and has any dependencies
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        orderItems: true,
        recipes: true,
        productionBatches: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
      });
    }

    // Check if product has any dependencies
    if (product.orderItems.length > 0 || product.recipes.length > 0 || product.productionBatches.length > 0) {
      // Soft delete - mark as inactive instead of hard delete
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });

      return res.json({
        message: 'Product deactivated successfully (has existing dependencies)',
        data: updatedProduct,
      });
    }

    // Hard delete if no dependencies
    await prisma.product.delete({
      where: { id },
    });

    res.json({
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete product',
    });
  }
});

// Raw Materials Routes

// Get all raw materials
router.get('/raw-materials', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { search } = req.query;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { supplier: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [rawMaterials, total] = await Promise.all([
      prisma.rawMaterial.findMany({
        where,
        include: {
          inventoryItems: {
            select: {
              currentStock: true,
              availableStock: true,
              reorderPoint: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.rawMaterial.count({ where }),
    ]);

    res.json({
      message: 'Raw materials retrieved successfully',
      data: rawMaterials,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get raw materials error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve raw materials',
    });
  }
});

// Create raw material
router.post('/raw-materials', requireMinRole('MANAGER'), [
  body('name').trim().isLength({ min: 1 }),
  body('sku').trim().isLength({ min: 1 }),
  body('unit').trim().isLength({ min: 1 }),
  body('costPrice').isDecimal({ decimal_digits: '0,2' }),
  body('supplier').optional().trim(),
  body('minStock').optional().isInt({ min: 0 }),
  body('maxStock').optional().isInt({ min: 1 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        details: errors.array(),
      });
    }

    const { name, description, sku, unit, costPrice, supplier, minStock, maxStock } = req.body;

    const rawMaterial = await prisma.rawMaterial.create({
      data: {
        name,
        description,
        sku,
        unit,
        costPrice: parseFloat(costPrice),
        supplier,
        minStock: minStock || 0,
        maxStock: maxStock || 1000,
        isActive: true,
      },
    });

    // Create initial inventory item
    await prisma.inventoryItem.create({
      data: {
        rawMaterialId: rawMaterial.id,
        currentStock: 0,
        availableStock: 0,
        reorderPoint: minStock || 10,
      },
    });

    res.status(201).json({
      message: 'Raw material created successfully',
      rawMaterial,
    });
  } catch (error) {
    console.error('Create raw material error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create raw material',
    });
  }
});

// Inventory Routes

// Get inventory overview
router.get('/inventory', [
  query('type').optional().isIn(['products', 'raw-materials', 'all']),
  query('lowStock').optional().isBoolean(),
], async (req, res) => {
  try {
    const { type = 'all', lowStock } = req.query;

    let where = {};
    if (lowStock === 'true') {
      where.availableStock = { lte: prisma.raw('reorder_point') };
    }

    const inventoryItems = await prisma.inventoryItem.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            category: true,
            unit: true,
            unitPrice: true,
          },
        },
        rawMaterial: {
          select: {
            id: true,
            name: true,
            sku: true,
            unit: true,
            costPrice: true,
            supplier: true,
          },
        },
      },
      orderBy: { lastUpdated: 'desc' },
    });

    // Filter by type
    let filteredItems = inventoryItems;
    if (type === 'products') {
      filteredItems = inventoryItems.filter(item => item.product);
    } else if (type === 'raw-materials') {
      filteredItems = inventoryItems.filter(item => item.rawMaterial);
    }

    // Calculate statistics
    const stats = {
      totalItems: filteredItems.length,
      lowStockItems: filteredItems.filter(item => item.availableStock <= item.reorderPoint).length,
      outOfStockItems: filteredItems.filter(item => item.availableStock === 0).length,
      totalValue: filteredItems.reduce((sum, item) => {
        const price = item.product?.unitPrice || item.rawMaterial?.costPrice || 0;
        return sum + (item.currentStock * parseFloat(price));
      }, 0),
    };

    res.json({
      message: 'Inventory retrieved successfully',
      data: filteredItems,
      stats,
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve inventory',
    });
  }
});

module.exports = router;
