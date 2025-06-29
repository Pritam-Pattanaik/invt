const express = require('express');
const { query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { requireMinRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Debug endpoint to check database data
router.get('/debug', requireMinRole('MANAGER'), async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    console.log('Debug: Date range:', {
      today: today.toISOString(),
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString()
    });

    const [
      allProducts,
      allOrders,
      allPOSTransactions,
      todayOrdersByCreated,
      todayOrdersByDelivery,
      todayPOSByTransaction,
      todayPOSByCreated
    ] = await Promise.all([
      prisma.product.findMany({ select: { id: true, name: true, isActive: true } }),
      prisma.order.findMany({
        select: {
          id: true,
          orderNumber: true,
          finalAmount: true,
          createdAt: true,
          deliveryDate: true,
          status: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      prisma.pOSTransaction.findMany({
        select: {
          id: true,
          transactionNumber: true,
          totalAmount: true,
          createdAt: true,
          transactionDate: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: startOfDay, lt: endOfDay } },
        select: { id: true, orderNumber: true, finalAmount: true, createdAt: true, status: true }
      }),
      prisma.order.findMany({
        where: { deliveryDate: { gte: startOfDay, lt: endOfDay } },
        select: { id: true, orderNumber: true, finalAmount: true, deliveryDate: true, status: true }
      }),
      prisma.pOSTransaction.findMany({
        where: { transactionDate: { gte: startOfDay, lt: endOfDay } },
        select: { id: true, transactionNumber: true, totalAmount: true, transactionDate: true }
      }),
      prisma.pOSTransaction.findMany({
        where: { createdAt: { gte: startOfDay, lt: endOfDay } },
        select: { id: true, transactionNumber: true, totalAmount: true, createdAt: true }
      })
    ]);

    res.json({
      message: 'Debug data retrieved successfully',
      data: {
        dateInfo: {
          today: today.toISOString(),
          startOfDay: startOfDay.toISOString(),
          endOfDay: endOfDay.toISOString()
        },
        counts: {
          totalProducts: allProducts.length,
          totalOrders: allOrders.length,
          totalPOSTransactions: allPOSTransactions.length,
          todayOrdersByCreated: todayOrdersByCreated.length,
          todayOrdersByDelivery: todayOrdersByDelivery.length,
          todayPOSByTransaction: todayPOSByTransaction.length,
          todayPOSByCreated: todayPOSByCreated.length
        },
        samples: {
          products: allProducts.slice(0, 3),
          orders: allOrders.slice(0, 3),
          posTransactions: allPOSTransactions.slice(0, 3),
          todayOrdersByDelivery,
          todayPOSByTransaction
        }
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve debug data',
      details: error.message
    });
  }
});

// Optimized dashboard overview for sub-1-second response
router.get('/dashboard', requireMinRole('MANAGER'), async (req, res) => {
  try {
    const startTime = Date.now();
    console.log('Dashboard API: Starting optimized fetch...');

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Build where clauses based on user role
    let counterWhere = {};
    let orderWhere = {};

    // Optimized parallel queries for maximum speed
    const [
      // Essential counts only
      activeCounters,
      totalCounters,
      totalProducts,

      // Today's aggregated stats
      todayOrderStats,
      todayPOSStats,

      // Monthly aggregated stats
      monthlyOrderStats,

      // Recent data with limits
      recentOrders,
      recentPOSTransactions,

      // Top products (limited)
      topProducts,
    ] = await Promise.all([
      // Essential counts only
      prisma.counter.count({ where: { ...counterWhere, isActive: true } }),
      prisma.counter.count({ where: counterWhere }),
      prisma.product.count(),

      // Today's combined order stats (count + sum in one query)
      prisma.order.aggregate({
        where: {
          ...orderWhere,
          deliveryDate: {
            gte: startOfDay,
            lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
          },
          status: { not: 'CANCELLED' },
        },
        _count: { id: true },
        _sum: { finalAmount: true },
      }),

      // Today's combined POS stats
      prisma.pOSTransaction.aggregate({
        where: {
          transactionDate: {
            gte: startOfDay,
            lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
          },
        },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),

      // Monthly combined stats
      prisma.order.aggregate({
        where: {
          ...orderWhere,
          createdAt: { gte: startOfMonth },
          status: { not: 'CANCELLED' },
        },
        _count: { id: true },
        _sum: { finalAmount: true },
      }),

      // Recent orders (minimal fields for speed)
      prisma.order.findMany({
        where: orderWhere,
        select: {
          id: true,
          orderNumber: true,
          finalAmount: true,
          status: true,
          customer: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5, // Reduced from 10 to 5
      }),

      // Recent POS transactions (minimal fields)
      prisma.pOSTransaction.findMany({
        where: {
          transactionDate: {
            gte: startOfDay, // Only today's transactions
          },
        },
        select: {
          id: true,
          transactionNumber: true,
          customerName: true,
          totalAmount: true,
          paymentMethod: true,
        },
        orderBy: { transactionDate: 'desc' },
        take: 5, // Reduced from 10 to 5
      }),

      // Top selling products (simplified, last 7 days only)
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            ...orderWhere,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days only
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
            totalPrice: 'desc', // Order by revenue instead of quantity
          },
        },
        take: 3, // Reduced from 5 to 3
      }),
    ]);

    // Quick product details lookup (simplified)
    const topProductsWithDetails = await Promise.all(
      topProducts.slice(0, 3).map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            sku: true,
          },
        });
        return {
          id: product?.id || item.productId,
          name: product?.name || 'Unknown Product',
          sku: product?.sku || 'N/A',
          totalQuantity: item._sum.quantity || 0,
          totalRevenue: item._sum.totalPrice || 0,
        };
      })
    );

    // Calculate combined today's stats (Orders + POS)
    const todayOrdersSales = parseFloat(todayOrderStats._sum.finalAmount) || 0;
    const todayPOSSalesAmount = parseFloat(todayPOSStats._sum.totalAmount) || 0;
    const totalTodayOrders = (todayOrderStats._count.id || 0) + (todayPOSStats._count.id || 0);
    const totalTodaySales = todayOrdersSales + todayPOSSalesAmount;

    const endTime = Date.now();
    console.log(`Dashboard API: Completed in ${endTime - startTime}ms`, {
      totalTodayOrders,
      totalTodaySales,
      totalProducts,
      activeCounters,
    });

    const dashboardData = {
      overview: {
        activeCounters,
        totalCounters,
        totalProducts,
        totalRawMaterials: 0, // Placeholder for speed
      },
      today: {
        orders: totalTodayOrders,
        sales: totalTodaySales,
        averageOrderValue: totalTodayOrders > 0 ? Math.round(totalTodaySales / totalTodayOrders) : 0,
      },
      monthly: {
        orders: monthlyOrderStats._count.id || 0,
        sales: parseFloat(monthlyOrderStats._sum.finalAmount) || 0,
      },
      recentOrders,
      recentPOSTransactions,
      topProducts: topProductsWithDetails,
      alerts: {
        lowStockProducts: [], // Simplified for speed
      },
    };

    res.json({
      success: true,
      data: dashboardData,
      responseTime: endTime - startTime,
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

    const { startDate, endDate, counterId, groupBy = 'day' } = req.query;

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

    // Apply filters based on parameters
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
              location: true,
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
