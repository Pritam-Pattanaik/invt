const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult, param, query } = require('express-validator');

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

// GET /api/sales/products - Get products for sales
router.get('/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        sku: true,
        unitPrice: true,
        unit: true,
        category: true,
        description: true
      },
      orderBy: { name: 'asc' }
    });

    // Transform data to match frontend expectations
    const transformedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.unitPrice,
      unit: product.unit,
      category: product.category,
      stock: 0 // Default stock value since we don't have inventory tracking yet
    }));

    res.json({
      message: 'Products retrieved successfully',
      data: transformedProducts
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/sales/orders - Get all orders
router.get('/orders', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('deliveryDate').optional().isISO8601(),
], handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const where = {};
    
    if (req.query.status) {
      where.status = req.query.status;
    }
    
    if (req.query.startDate || req.query.endDate) {
      where.orderDate = {};
      if (req.query.startDate) where.orderDate.gte = new Date(req.query.startDate);
      if (req.query.endDate) where.orderDate.lte = new Date(req.query.endDate);
    }

    // Filter by delivery date if provided
    if (req.query.deliveryDate) {
      const deliveryDate = new Date(req.query.deliveryDate);
      // Set time to start of day
      deliveryDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(deliveryDate);
      nextDay.setDate(nextDay.getDate() + 1);

      where.deliveryDate = {
        gte: deliveryDate,
        lt: nextDay
      };
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: true,
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      message: 'Orders retrieved successfully',
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// POST /api/sales/orders - Create new order
router.post('/orders', [
  body('customerName').notEmpty().trim(),
  body('customerPhone').notEmpty().trim(),
  body('customerAddress').optional().trim(),
  body('orderDate').isISO8601(),
  body('deliveryDate').isISO8601(),
  body('items').isArray({ min: 1 }),
  body('items.*.productId').notEmpty(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('items.*.price').isFloat({ min: 0 }),
], handleValidationErrors, async (req, res) => {
  try {
    const { customerName, customerPhone, customerAddress, orderDate, deliveryDate, items } = req.body;

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: { phone: customerPhone }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: customerName,
          phone: customerPhone,
          address: customerAddress || '',
          email: `${customerPhone}@temp.com` // Temporary email
        }
      });
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    // Generate order number
    const orderCount = await prisma.order.count();
    const orderNumber = `ORD-${String(orderCount + 1).padStart(6, '0')}`;

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        orderDate: new Date(orderDate),
        deliveryDate: new Date(deliveryDate),
        totalAmount,
        finalAmount: totalAmount, // Add finalAmount field (same as totalAmount for now)
        status: 'PENDING',
        paymentStatus: 'PENDING',
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.quantity * item.price
          }))
        }
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// PUT /api/sales/orders/:id - Update order
router.put('/orders/:id', [
  param('id').isUUID(),
  body('status').optional().isIn(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']),
  body('paymentStatus').optional().isIn(['PENDING', 'PAID', 'PARTIAL']),
  body('customerName').optional().trim(),
  body('customerPhone').optional().trim(),
  body('customerAddress').optional().trim(),
  body('orderDate').optional().isISO8601(),
  body('deliveryDate').optional().isISO8601(),
  body('items').optional().isArray(),
  body('items.*.productId').optional().notEmpty(),
  body('items.*.quantity').optional().isInt({ min: 1 }),
  body('items.*.price').optional().isFloat({ min: 0 }),
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      paymentStatus,
      customerName,
      customerPhone,
      customerAddress,
      orderDate,
      deliveryDate,
      items
    } = req.body;

    // Start a transaction for complex updates
    const result = await prisma.$transaction(async (tx) => {
      // Get the current order
      const currentOrder = await tx.order.findUnique({
        where: { id },
        include: { customer: true, items: true }
      });

      if (!currentOrder) {
        throw new Error('Order not found');
      }

      let updateData = {};
      let customerId = currentOrder.customerId;

      // Update customer information if provided
      if (customerName || customerPhone || customerAddress) {
        if (customerPhone && customerPhone !== currentOrder.customer?.phone) {
          // Find or create customer with new phone
          let customer = await tx.customer.findFirst({
            where: { phone: customerPhone }
          });

          if (!customer) {
            customer = await tx.customer.create({
              data: {
                name: customerName || currentOrder.customer?.name || 'Unknown Customer',
                phone: customerPhone,
                address: customerAddress || currentOrder.customer?.address || ''
              }
            });
          } else if (customerName || customerAddress) {
            // Update existing customer
            customer = await tx.customer.update({
              where: { id: customer.id },
              data: {
                ...(customerName && { name: customerName }),
                ...(customerAddress && { address: customerAddress })
              }
            });
          }
          customerId = customer.id;
        } else if (currentOrder.customerId) {
          // Update current customer
          await tx.customer.update({
            where: { id: currentOrder.customerId },
            data: {
              ...(customerName && { name: customerName }),
              ...(customerAddress && { address: customerAddress })
            }
          });
        }
      }

      // Prepare order update data
      if (status) updateData.status = status;
      if (paymentStatus) updateData.paymentStatus = paymentStatus;
      if (orderDate) updateData.orderDate = new Date(orderDate);
      if (deliveryDate) updateData.deliveryDate = new Date(deliveryDate);
      if (customerId !== currentOrder.customerId) updateData.customerId = customerId;

      // Update items if provided
      if (items && Array.isArray(items)) {
        // Delete existing items
        await tx.orderItem.deleteMany({
          where: { orderId: id }
        });

        // Calculate new total
        const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        updateData.totalAmount = totalAmount;
        updateData.finalAmount = totalAmount;

        // Create new items
        await tx.orderItem.createMany({
          data: items.map(item => ({
            orderId: id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.quantity * item.price
          }))
        });
      }

      // Update the order
      const updatedOrder = await tx.order.update({
        where: { id },
        data: updateData,
        include: {
          customer: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });

      return updatedOrder;
    });

    res.json({
      message: 'Order updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error updating order:', error);
    if (error.message === 'Order not found' || error.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// DELETE /api/sales/orders/:id - Delete order
router.delete('/orders/:id', [
  param('id').isUUID(),
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    // Delete order items first (cascade should handle this, but being explicit)
    await prisma.orderItem.deleteMany({
      where: { orderId: id }
    });

    // Delete the order
    await prisma.order.delete({
      where: { id }
    });

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// GET /api/sales/pos - Get POS transactions
router.get('/pos', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('date').optional().isISO8601(),
], handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = {};

    // Handle specific date filter (for today's transactions)
    if (req.query.date) {
      const date = new Date(req.query.date);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      where.transactionDate = {
        gte: startOfDay,
        lt: endOfDay
      };
    } else if (req.query.startDate || req.query.endDate) {
      where.transactionDate = {};
      if (req.query.startDate) where.transactionDate.gte = new Date(req.query.startDate);
      if (req.query.endDate) where.transactionDate.lte = new Date(req.query.endDate);
    }

    const [transactions, total] = await Promise.all([
      prisma.pOSTransaction.findMany({
        where,
        include: {
          transactionItems: {
            include: {
              product: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.pOSTransaction.count({ where })
    ]);

    res.json({
      message: 'POS transactions retrieved successfully',
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching POS transactions:', error);
    res.status(500).json({ error: 'Failed to fetch POS transactions' });
  }
});

// POST /api/sales/pos - Create POS transaction
router.post('/pos', [
  body('customerName').optional().trim(),
  body('transactionDate').optional().isISO8601(),
  body('items').isArray({ min: 1 }),
  body('items.*.productId').notEmpty(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('items.*.price').isFloat({ min: 0 }),
  body('paymentMethod').isIn(['CASH', 'CARD', 'UPI']),
  body('cashierName').notEmpty().trim(),
], handleValidationErrors, async (req, res) => {
  try {
    const { customerName, transactionDate, items, paymentMethod, cashierName } = req.body;

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    // Generate transaction number
    const transactionCount = await prisma.pOSTransaction.count();
    const transactionNumber = `POS-${String(transactionCount + 1).padStart(6, '0')}`;

    // Create POS transaction
    const transaction = await prisma.pOSTransaction.create({
      data: {
        transactionNumber,
        customerName: customerName || null,
        totalAmount,
        paymentMethod,
        transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
        cashierName,
        transactionItems: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.quantity * item.price
          }))
        }
      },
      include: {
        transactionItems: {
          include: {
            product: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'POS transaction created successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Error creating POS transaction:', error);
    res.status(500).json({ error: 'Failed to create POS transaction' });
  }
});

// PUT /api/sales/pos/:id - Update POS transaction
router.put('/pos/:id', [
  param('id').isUUID(),
  body('customerName').optional().trim(),
  body('transactionDate').optional().isISO8601(),
  body('items').optional().isArray({ min: 1 }),
  body('items.*.productId').optional().notEmpty(),
  body('items.*.quantity').optional().isInt({ min: 1 }),
  body('items.*.price').optional().isFloat({ min: 0 }),
  body('paymentMethod').optional().isIn(['CASH', 'CARD', 'UPI']),
  body('cashierName').optional().trim(),
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { customerName, transactionDate, items, paymentMethod, cashierName } = req.body;

    // Start a transaction for complex updates
    const result = await prisma.$transaction(async (tx) => {
      // Get the current transaction
      const currentTransaction = await tx.pOSTransaction.findUnique({
        where: { id },
        include: { transactionItems: true }
      });

      if (!currentTransaction) {
        throw new Error('POS transaction not found');
      }

      let updateData = {};

      // Update basic fields if provided
      if (customerName !== undefined) updateData.customerName = customerName || null;
      if (transactionDate) updateData.transactionDate = new Date(transactionDate);
      if (paymentMethod) updateData.paymentMethod = paymentMethod;
      if (cashierName) updateData.cashierName = cashierName;

      // Update items if provided
      if (items && items.length > 0) {
        // Calculate new total amount
        const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        updateData.totalAmount = totalAmount;

        // Delete existing transaction items
        await tx.pOSTransactionItem.deleteMany({
          where: { transactionId: id }
        });

        // Create new transaction items
        await tx.pOSTransactionItem.createMany({
          data: items.map(item => ({
            transactionId: id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.quantity * item.price
          }))
        });
      }

      // Update the transaction
      const updatedTransaction = await tx.pOSTransaction.update({
        where: { id },
        data: updateData,
        include: {
          transactionItems: {
            include: {
              product: true
            }
          }
        }
      });

      return updatedTransaction;
    });

    res.json({
      message: 'POS transaction updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error updating POS transaction:', error);
    if (error.message === 'POS transaction not found' || error.code === 'P2025') {
      return res.status(404).json({ error: 'POS transaction not found' });
    }
    res.status(500).json({ error: 'Failed to update POS transaction' });
  }
});

// DELETE /api/sales/pos/:id - Delete POS transaction
router.delete('/pos/:id', [
  param('id').isUUID(),
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    // Delete transaction items first (cascade should handle this, but being explicit)
    await prisma.pOSTransactionItem.deleteMany({
      where: { transactionId: id }
    });

    // Delete the transaction
    await prisma.pOSTransaction.delete({
      where: { id }
    });

    res.json({ message: 'POS transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting POS transaction:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'POS transaction not found' });
    }
    res.status(500).json({ error: 'Failed to delete POS transaction' });
  }
});

// GET /api/sales/reports - Get sales reports
router.get('/reports', [
  query('period').optional().isIn(['today', 'yesterday', 'this-week', 'this-month', 'last-month', 'custom']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
], handleValidationErrors, async (req, res) => {
  try {
    const { period = 'today', startDate, endDate } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFilter = { gte: today };
        break;
      case 'yesterday':
        const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFilter = { gte: yesterday, lt: yesterdayEnd };
        break;
      case 'this-week':
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        dateFilter = { gte: weekStart };
        break;
      case 'this-month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { gte: monthStart };
        break;
      case 'last-month':
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { gte: lastMonthStart, lt: lastMonthEnd };
        break;
      case 'custom':
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) dateFilter.lte = new Date(endDate);
        break;
    }

    // Get orders data
    const orders = await prisma.order.findMany({
      where: { orderDate: dateFilter },
      include: { orderItems: true }
    });

    // Get POS data
    const posTransactions = await prisma.pOSTransaction.findMany({
      where: { transactionDate: dateFilter },
      include: { transactionItems: true }
    });

    // Calculate metrics
    const ordersRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const posRevenue = posTransactions.reduce((sum, transaction) => sum + transaction.totalAmount, 0);
    const totalRevenue = ordersRevenue + posRevenue;

    const report = {
      period: period === 'custom' ? `${startDate} to ${endDate}` : period,
      orders: {
        totalOrders: orders.length,
        totalRevenue: ordersRevenue,
        averageOrderValue: orders.length > 0 ? ordersRevenue / orders.length : 0
      },
      pos: {
        totalTransactions: posTransactions.length,
        totalRevenue: posRevenue,
        averageTransactionValue: posTransactions.length > 0 ? posRevenue / posTransactions.length : 0
      },
      totalRevenue,
      generatedAt: new Date().toISOString()
    };

    res.json(report);
  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).json({ error: 'Failed to generate sales report' });
  }
});

module.exports = router;
