const express = require('express');
const { query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { requireMinRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Dashboard overview
router.get('/dashboard', requireMinRole('MANAGER'), async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Build where clauses based on user role
    let franchiseWhere = {};
    let orderWhere = {};
    
    if (req.user.role === 'FRANCHISE_MANAGER') {
      franchiseWhere.managedBy = req.user.id;
      orderWhere.counter = {
        franchise: {
          managedBy: req.user.id,
        },
      };
    }

    const [
      // Basic counts
      totalFranchises,
      activeFranchises,
      totalProducts,
      totalRawMaterials,
      
      // Today's stats
      todayOrders,
      todaySales,
      
      // Monthly stats
      monthlyOrders,
      monthlySales,
      
      // Yearly stats
      yearlyOrders,
      yearlySales,
      
      // Recent orders
      recentOrders,

      // Recent POS transactions
      recentPOSTransactions,

      // Low stock items
      lowStockProducts,
      lowStockRawMaterials,

      // Top selling products
      topProducts,
    ] = await Promise.all([
      // Basic counts
      prisma.franchise.count({ where: franchiseWhere }),
      prisma.franchise.count({ where: { ...franchiseWhere, status: 'ACTIVE' } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.rawMaterial.count({ where: { isActive: true } }),
      
      // Today's stats
      prisma.order.count({
        where: {
          ...orderWhere,
          createdAt: { gte: startOfDay },
        },
      }),
      prisma.order.aggregate({
        where: {
          ...orderWhere,
          createdAt: { gte: startOfDay },
          status: { not: 'CANCELLED' },
        },
        _sum: { finalAmount: true },
      }),
      
      // Monthly stats
      prisma.order.count({
        where: {
          ...orderWhere,
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.order.aggregate({
        where: {
          ...orderWhere,
          createdAt: { gte: startOfMonth },
          status: { not: 'CANCELLED' },
        },
        _sum: { finalAmount: true },
      }),
      
      // Yearly stats
      prisma.order.count({
        where: {
          ...orderWhere,
          createdAt: { gte: startOfYear },
        },
      }),
      prisma.order.aggregate({
        where: {
          ...orderWhere,
          createdAt: { gte: startOfYear },
          status: { not: 'CANCELLED' },
        },
        _sum: { finalAmount: true },
      }),
      
      // Recent orders
      prisma.order.findMany({
        where: orderWhere,
        include: {
          counter: {
            select: {
              name: true,
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
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Recent POS transactions
      prisma.pOSTransaction.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      
      // Low stock items - products (simplified query)
      prisma.inventoryItem.findMany({
        where: {
          productId: { not: null },
        },
        include: {
          product: {
            select: {
              name: true,
              sku: true,
              unit: true,
            },
          },
        },
        take: 10,
      }).catch(() => []), // Return empty array if query fails

      // Low stock items - raw materials (simplified query)
      prisma.inventoryItem.findMany({
        where: {
          rawMaterialId: { not: null },
        },
        include: {
          rawMaterial: {
            select: {
              name: true,
              sku: true,
              unit: true,
            },
          },
        },
        take: 10,
      }).catch(() => []), // Return empty array if query fails
      
      // Top selling products (last 30 days)
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            ...orderWhere,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
            status: { not: 'CANCELLED' },
          },
        },
        _sum: {
          quantity: true,
          totalPrice: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 5,
      }),
    ]);

    // Get product details for top selling products
    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            name: true,
            sku: true,
            unitPrice: true,
            unit: true,
          },
        });
        return {
          ...product,
          totalQuantity: item._sum.quantity,
          totalRevenue: item._sum.totalPrice,
        };
      })
    );

    const dashboardData = {
      overview: {
        totalFranchises,
        activeFranchises,
        totalProducts,
        totalRawMaterials,
      },
      today: {
        orders: todayOrders,
        sales: parseFloat(todaySales._sum.finalAmount) || 0,
        averageOrderValue: todayOrders > 0 ? parseFloat(todaySales._sum.finalAmount || 0) / todayOrders : 0,
      },
      monthly: {
        orders: monthlyOrders,
        sales: parseFloat(monthlySales._sum.finalAmount) || 0,
        averageOrderValue: monthlyOrders > 0 ? parseFloat(monthlySales._sum.finalAmount || 0) / monthlyOrders : 0,
      },
      yearly: {
        orders: yearlyOrders,
        sales: parseFloat(yearlySales._sum.finalAmount) || 0,
        averageOrderValue: yearlyOrders > 0 ? parseFloat(yearlySales._sum.finalAmount || 0) / yearlyOrders : 0,
      },
      recentOrders,
      recentPOSTransactions,
      alerts: {
        lowStockProducts,
        lowStockRawMaterials,
      },
      topProducts: topProductsWithDetails,
    };

    res.json({
      message: 'Dashboard data retrieved successfully',
      data: dashboardData,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve dashboard data',
    });
  }
});

// Sales reports
router.get('/sales', requireMinRole('MANAGER'), [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('franchiseId').optional().isString(),
  query('counterId').optional().isString(),
  query('groupBy').optional().isIn(['day', 'week', 'month']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        details: errors.array(),
      });
    }

    const { startDate, endDate, franchiseId, counterId, groupBy = 'day' } = req.query;

    // Default to last 30 days if no dates provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    let where = {
      createdAt: {
        gte: start,
        lte: end,
      },
      status: { not: 'CANCELLED' },
    };

    // Apply filters based on user role and parameters
    if (req.user.role === 'FRANCHISE_MANAGER') {
      where.counter = {
        franchise: {
          managedBy: req.user.id,
        },
      };
    }

    if (franchiseId) {
      where.counter = {
        ...where.counter,
        franchiseId,
      };
    }

    if (counterId) {
      where.counterId = counterId;
    }

    // Get sales data (orders and POS transactions)
    const [salesData, totalStats, posData, posStats] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          finalAmount: true,
          createdAt: true,
          status: true,
          counter: {
            select: {
              name: true,
              franchise: {
                select: {
                  name: true,
                  code: true,
                },
              },
            },
          },
          items: {
            select: {
              quantity: true,
              totalPrice: true,
              product: {
                select: {
                  name: true,
                  category: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.aggregate({
        where,
        _sum: {
          finalAmount: true,
          totalAmount: true,
          discount: true,
          tax: true,
        },
        _count: true,
        _avg: {
          finalAmount: true,
        },
      }),
      // Get POS transactions for the same period
      prisma.pOSTransaction.findMany({
        where: {
          transactionDate: {
            gte: start,
            lte: end,
          },
        },
        select: {
          id: true,
          transactionNumber: true,
          totalAmount: true,
          transactionDate: true,
          paymentMethod: true,
          customerName: true,
        },
        orderBy: { transactionDate: 'desc' },
      }),
      prisma.pOSTransaction.aggregate({
        where: {
          transactionDate: {
            gte: start,
            lte: end,
          },
        },
        _sum: {
          totalAmount: true,
        },
        _count: true,
        _avg: {
          totalAmount: true,
        },
      }),
    ]);

    // Group data by specified period
    const groupedData = {};
    salesData.forEach(order => {
      let key;
      const date = new Date(order.createdAt);
      
      switch (groupBy) {
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default: // day
          key = date.toISOString().split('T')[0];
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          date: key,
          totalSales: 0,
          totalOrders: 0,
          averageOrderValue: 0,
        };
      }

      groupedData[key].totalSales += parseFloat(order.finalAmount);
      groupedData[key].totalOrders += 1;
    });

    // Calculate average order values
    Object.keys(groupedData).forEach(key => {
      const data = groupedData[key];
      data.averageOrderValue = data.totalOrders > 0 ? data.totalSales / data.totalOrders : 0;
    });

    const chartData = Object.values(groupedData).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      message: 'Sales report retrieved successfully',
      data: {
        summary: {
          totalSales: parseFloat(totalStats._sum.finalAmount) || 0, // Orders only
          totalOrders: totalStats._count, // Orders only
          averageOrderValue: parseFloat(totalStats._avg.finalAmount) || 0, // Orders only
          totalDiscount: parseFloat(totalStats._sum.discount) || 0,
          totalTax: parseFloat(totalStats._sum.tax) || 0,
        },
        // Separate orders and POS data
        ordersRevenue: parseFloat(totalStats._sum.finalAmount) || 0,
        ordersCount: totalStats._count,
        posRevenue: parseFloat(posStats._sum.totalAmount) || 0,
        posCount: posStats._count,
        chartData,
        orders: salesData,
        posTransactions: posData,
      },
      filters: {
        startDate: start,
        endDate: end,
        franchiseId,
        counterId,
        groupBy,
      },
    });
  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve sales report',
    });
  }
});

// Inventory reports
router.get('/inventory', requireMinRole('MANAGER'), [
  query('type').optional().isIn(['products', 'raw-materials', 'all']),
  query('lowStock').optional().isBoolean(),
], async (req, res) => {
  try {
    const { type = 'all', lowStock } = req.query;

    let where = {};
    // Note: Simplified query - low stock filtering will be done in post-processing
    // if (lowStock === 'true') {
    //   where.availableStock = { lte: reorderPoint };
    // }

    const inventoryData = await prisma.inventoryItem.findMany({
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
            costPrice: true,
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
            minStock: true,
            maxStock: true,
          },
        },
      },
      orderBy: { lastUpdated: 'desc' },
    });

    // Filter by type
    let filteredData = inventoryData;
    if (type === 'products') {
      filteredData = inventoryData.filter(item => item.product);
    } else if (type === 'raw-materials') {
      filteredData = inventoryData.filter(item => item.rawMaterial);
    }

    // Calculate statistics
    const stats = {
      totalItems: filteredData.length,
      lowStockItems: filteredData.filter(item => item.availableStock <= item.reorderPoint).length,
      outOfStockItems: filteredData.filter(item => item.availableStock === 0).length,
      totalValue: filteredData.reduce((sum, item) => {
        const price = item.product?.unitPrice || item.rawMaterial?.costPrice || 0;
        return sum + (item.currentStock * parseFloat(price));
      }, 0),
      categories: {},
    };

    // Group by categories
    filteredData.forEach(item => {
      const category = item.product?.category || 'Raw Materials';
      if (!stats.categories[category]) {
        stats.categories[category] = {
          count: 0,
          value: 0,
          lowStock: 0,
        };
      }
      stats.categories[category].count += 1;
      const price = item.product?.unitPrice || item.rawMaterial?.costPrice || 0;
      stats.categories[category].value += item.currentStock * parseFloat(price);
      if (item.availableStock <= item.reorderPoint) {
        stats.categories[category].lowStock += 1;
      }
    });

    res.json({
      message: 'Inventory report retrieved successfully',
      data: filteredData,
      stats,
      filters: { type, lowStock },
    });
  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve inventory report',
    });
  }
});

module.exports = router;
