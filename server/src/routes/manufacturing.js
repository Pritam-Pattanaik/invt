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

    console.log(`[GET PRODUCTS] Query parameters:`, { category, isActive, search });
    console.log(`[GET PRODUCTS] Where clause:`, where);

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

    console.log(`[GET PRODUCTS] Found ${products.length} products out of ${total} total`);
    console.log(`[GET PRODUCTS] Products summary:`, products.map(p => ({
      id: p.id,
      name: p.name,
      isActive: p.isActive
    })));

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
    console.log(`[CREATE PRODUCT] Creating new product in database:`, { name, sku, category });

    // Check if SKU already exists
    const existingProduct = await prisma.product.findUnique({
      where: { sku }
    });

    if (existingProduct) {
      console.log(`[CREATE PRODUCT] SKU already exists: ${sku}`);
      return res.status(400).json({
        error: 'SKU already exists',
        message: 'A product with this SKU already exists',
      });
    }

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

    console.log(`[CREATE PRODUCT] Product created in database:`, {
      id: product.id,
      name: product.name,
      sku: product.sku,
      isActive: product.isActive
    });

    // Create initial inventory item
    const inventoryItem = await prisma.inventoryItem.create({
      data: {
        productId: product.id,
        currentStock: 0,
        availableStock: 0,
        reorderPoint: 10,
      },
    });

    console.log(`[CREATE PRODUCT] Inventory item created:`, {
      id: inventoryItem.id,
      productId: inventoryItem.productId
    });

    res.status(201).json({
      message: 'Product created successfully in database',
      data: product,
    });
  } catch (error) {
    console.error('[CREATE PRODUCT] Error creating product in database:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create product in database',
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
    console.log(`[UPDATE PRODUCT] Updating product in database with ID: ${id}`);
    console.log(`[UPDATE PRODUCT] Update data:`, req.body);

    const updateData = {};

    // Only include fields that are provided
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.category) updateData.category = req.body.category;
    if (req.body.unitPrice) updateData.unitPrice = parseFloat(req.body.unitPrice);
    if (req.body.costPrice) updateData.costPrice = parseFloat(req.body.costPrice);
    if (req.body.unit) updateData.unit = req.body.unit;

    console.log(`[UPDATE PRODUCT] Processed update data:`, updateData);

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

    console.log(`[UPDATE PRODUCT] Product updated in database:`, {
      id: product.id,
      name: product.name,
      isActive: product.isActive,
      updatedAt: product.updatedAt
    });

    res.json({
      message: 'Product updated successfully in database',
      data: product,
    });
  } catch (error) {
    console.error('[UPDATE PRODUCT] Error updating product in database:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Product not found in database',
      });
    }
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update product in database',
    });
  }
});

// Delete product
router.delete('/products/:id', requireMinRole('MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[DELETE PRODUCT] Starting deletion process for product ID: ${id}`);

    // Check if product exists and has any dependencies
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        orderItems: true,
        recipes: true,
        productionBatches: true,
      },
    });

    console.log(`[DELETE PRODUCT] Product found:`, {
      id: product?.id,
      name: product?.name,
      isActive: product?.isActive,
      orderItemsCount: product?.orderItems?.length || 0,
      recipesCount: product?.recipes?.length || 0,
      productionBatchesCount: product?.productionBatches?.length || 0
    });

    if (!product) {
      console.log(`[DELETE PRODUCT] Product not found with ID: ${id}`);
      return res.status(404).json({
        error: 'Product not found',
      });
    }

    // Check for dependencies
    const criticalDependencies = {
      orderItems: product.orderItems.length,
      recipes: product.recipes.length,
      productionBatches: product.productionBatches.length
    };

    console.log(`[DELETE PRODUCT] Dependencies found:`, criticalDependencies);

    // For now, let's be more permissive and allow hard deletion in most cases
    // Only soft delete if there are many dependencies (indicating heavy usage)
    const totalDependencies = criticalDependencies.orderItems + criticalDependencies.recipes + criticalDependencies.productionBatches;
    const shouldSoftDelete = totalDependencies > 10; // Only soft delete if heavily used

    console.log(`[DELETE PRODUCT] Total dependencies: ${totalDependencies}, Should soft delete: ${shouldSoftDelete}`);

    if (shouldSoftDelete) {
      // Soft delete - mark as inactive instead of hard delete
      console.log(`[DELETE PRODUCT] Performing soft delete (marking as inactive) - heavily used product`);
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });

      console.log(`[DELETE PRODUCT] Soft delete completed:`, {
        id: updatedProduct.id,
        name: updatedProduct.name,
        isActive: updatedProduct.isActive
      });

      return res.json({
        message: 'Product deactivated successfully (heavily used product with many dependencies)',
        data: updatedProduct,
      });
    }

    // Hard delete for most cases
    console.log(`[DELETE PRODUCT] Performing hard delete (removing from database)`);

    try {
      // First, delete related inventory items
      const deletedInventoryItems = await prisma.inventoryItem.deleteMany({
        where: { productId: id }
      });
      console.log(`[DELETE PRODUCT] Deleted ${deletedInventoryItems.count} inventory items`);

      // Then delete the product
      await prisma.product.delete({
        where: { id },
      });

      console.log(`[DELETE PRODUCT] Hard delete completed for product ID: ${id}`);

      res.json({
        message: 'Product deleted successfully',
      });
    } catch (deleteError) {
      console.error(`[DELETE PRODUCT] Hard delete failed, falling back to soft delete:`, deleteError);

      // Fallback to soft delete if hard delete fails due to constraints
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });

      console.log(`[DELETE PRODUCT] Fallback soft delete completed:`, {
        id: updatedProduct.id,
        name: updatedProduct.name,
        isActive: updatedProduct.isActive
      });

      return res.json({
        message: 'Product deactivated successfully (could not delete due to database constraints)',
        data: updatedProduct,
      });
    }
  } catch (error) {
    console.error('[DELETE PRODUCT] Error during deletion:', error);
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

// Reactivate soft-deleted product
router.put('/products/:id/reactivate', requireMinRole('MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[REACTIVATE PRODUCT] Reactivating product ID: ${id}`);

    const product = await prisma.product.update({
      where: { id },
      data: { isActive: true },
    });

    console.log(`[REACTIVATE PRODUCT] Product reactivated:`, {
      id: product.id,
      name: product.name,
      isActive: product.isActive
    });

    res.json({
      message: 'Product reactivated successfully',
      data: product,
    });
  } catch (error) {
    console.error('[REACTIVATE PRODUCT] Error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Product not found',
      });
    }
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to reactivate product',
    });
  }
});

// Force delete product (admin only)
router.delete('/products/:id/force', requireMinRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[FORCE DELETE PRODUCT] Force deleting product ID: ${id}`);

    // Delete related inventory items first
    const deletedInventoryItems = await prisma.inventoryItem.deleteMany({
      where: { productId: id }
    });
    console.log(`[FORCE DELETE PRODUCT] Deleted ${deletedInventoryItems.count} inventory items`);

    // Force delete the product
    await prisma.product.delete({
      where: { id },
    });

    console.log(`[FORCE DELETE PRODUCT] Force delete completed for product ID: ${id}`);

    res.json({
      message: 'Product force deleted successfully',
    });
  } catch (error) {
    console.error('[FORCE DELETE PRODUCT] Error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Product not found',
      });
    }
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to force delete product',
    });
  }
});

// Test endpoint to verify database operations
router.get('/test-db', async (req, res) => {
  try {
    console.log('[TEST DB] Testing database connection and operations...');

    // Test 1: Count all products
    const totalProducts = await prisma.product.count();
    console.log(`[TEST DB] Total products in database: ${totalProducts}`);

    // Test 2: Count active products
    const activeProducts = await prisma.product.count({ where: { isActive: true } });
    console.log(`[TEST DB] Active products in database: ${activeProducts}`);

    // Test 3: Count inactive products
    const inactiveProducts = await prisma.product.count({ where: { isActive: false } });
    console.log(`[TEST DB] Inactive products in database: ${inactiveProducts}`);

    // Test 4: Get all products with their status
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('[TEST DB] All products with status:', allProducts);

    res.json({
      message: 'Database test completed',
      data: {
        totalProducts,
        activeProducts,
        inactiveProducts,
        allProducts
      }
    });
  } catch (error) {
    console.error('[TEST DB] Database test error:', error);
    res.status(500).json({
      error: 'Database test failed',
      message: error.message
    });
  }
});

// Cleanup inactive products (admin only)
router.delete('/products/cleanup-inactive', requireMinRole('ADMIN'), async (req, res) => {
  try {
    console.log('[CLEANUP] Starting cleanup of inactive products...');

    // Get all inactive products
    const inactiveProducts = await prisma.product.findMany({
      where: { isActive: false },
      select: { id: true, name: true }
    });

    console.log(`[CLEANUP] Found ${inactiveProducts.length} inactive products to delete`);

    let deletedCount = 0;
    const errors = [];

    for (const product of inactiveProducts) {
      try {
        // Delete related inventory items
        await prisma.inventoryItem.deleteMany({
          where: { productId: product.id }
        });

        // Delete the product
        await prisma.product.delete({
          where: { id: product.id }
        });

        deletedCount++;
        console.log(`[CLEANUP] Deleted product: ${product.name} (${product.id})`);
      } catch (error) {
        console.error(`[CLEANUP] Failed to delete product ${product.name}:`, error);
        errors.push({ productId: product.id, productName: product.name, error: error.message });
      }
    }

    console.log(`[CLEANUP] Cleanup completed. Deleted: ${deletedCount}, Errors: ${errors.length}`);

    res.json({
      message: 'Inactive products cleanup completed',
      data: {
        totalInactive: inactiveProducts.length,
        deleted: deletedCount,
        errors: errors
      }
    });
  } catch (error) {
    console.error('[CLEANUP] Cleanup error:', error);
    res.status(500).json({
      error: 'Cleanup failed',
      message: error.message
    });
  }
});

module.exports = router;
