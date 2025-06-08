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

// GET /api/finance/accounts - Get all accounts
router.get('/accounts', async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { name: 'asc' }
    });

    // Calculate totals by type
    const summary = {
      assets: accounts.filter(a => a.type === 'ASSET').reduce((sum, a) => sum + a.balance, 0),
      liabilities: accounts.filter(a => a.type === 'LIABILITY').reduce((sum, a) => sum + a.balance, 0),
      equity: accounts.filter(a => a.type === 'EQUITY').reduce((sum, a) => sum + a.balance, 0),
      revenue: accounts.filter(a => a.type === 'REVENUE').reduce((sum, a) => sum + a.balance, 0),
      expenses: accounts.filter(a => a.type === 'EXPENSE').reduce((sum, a) => sum + a.balance, 0)
    };

    res.json({ accounts, summary });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// POST /api/finance/accounts - Create new account
router.post('/accounts', [
  body('name').notEmpty().trim(),
  body('type').isIn(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  body('balance').isFloat({ min: 0 }),
  body('description').optional().trim(),
], handleValidationErrors, async (req, res) => {
  try {
    const { name, type, balance, description } = req.body;

    const account = await prisma.account.create({
      data: {
        name,
        type,
        balance,
        description: description || null,
        isActive: true
      }
    });

    res.status(201).json(account);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// GET /api/finance/expenses - Get all expenses
router.get('/expenses', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
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
      where.date = {};
      if (req.query.startDate) where.date.gte = new Date(req.query.startDate);
      if (req.query.endDate) where.date.lte = new Date(req.query.endDate);
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.expense.count({ where })
    ]);

    res.json({
      expenses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST /api/finance/expenses - Create new expense
router.post('/expenses', [
  body('title').notEmpty().trim(),
  body('amount').isFloat({ min: 0 }),
  body('category').notEmpty().trim(),
  body('description').optional().trim(),
  body('date').isISO8601(),
  body('paymentMethod').isIn(['CASH', 'BANK', 'CARD', 'UPI']),
], handleValidationErrors, async (req, res) => {
  try {
    const { title, amount, category, description, date, paymentMethod } = req.body;

    const expense = await prisma.expense.create({
      data: {
        title,
        amount,
        category,
        description: description || null,
        date: new Date(date),
        paymentMethod,
        status: 'PENDING'
      }
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// PUT /api/finance/expenses/:id - Update expense
router.put('/expenses/:id', [
  param('id').isUUID(),
  body('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED']),
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {};

    if (req.body.status) updateData.status = req.body.status;

    const expense = await prisma.expense.update({
      where: { id },
      data: updateData
    });

    res.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// GET /api/finance/profit-loss - Get P&L statement
router.get('/profit-loss', [
  query('period').optional().isIn(['current-month', 'last-month', 'current-quarter', 'current-year', 'custom']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
], handleValidationErrors, async (req, res) => {
  try {
    const { period = 'current-month', startDate, endDate } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'current-month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { gte: monthStart };
        break;
      case 'last-month':
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { gte: lastMonthStart, lt: lastMonthEnd };
        break;
      case 'current-quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        dateFilter = { gte: quarterStart };
        break;
      case 'current-year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        dateFilter = { gte: yearStart };
        break;
      case 'custom':
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) dateFilter.lte = new Date(endDate);
        break;
    }

    // Get revenue from orders and POS
    const [orders, posTransactions, expenses] = await Promise.all([
      prisma.order.findMany({
        where: { orderDate: dateFilter, status: { not: 'CANCELLED' } }
      }),
      prisma.pOSTransaction.findMany({
        where: { transactionDate: dateFilter }
      }),
      prisma.expense.findMany({
        where: { date: dateFilter, status: 'APPROVED' }
      })
    ]);

    const salesRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const posRevenue = posTransactions.reduce((sum, transaction) => sum + transaction.totalAmount, 0);
    const totalRevenue = salesRevenue + posRevenue;

    // Categorize expenses
    const expensesByCategory = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const grossProfit = totalRevenue;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const profitLoss = {
      period: period === 'custom' ? `${startDate} to ${endDate}` : period,
      revenue: {
        sales: salesRevenue,
        pos: posRevenue,
        otherIncome: 0,
        total: totalRevenue
      },
      expenses: {
        ...expensesByCategory,
        total: totalExpenses
      },
      grossProfit,
      netProfit,
      profitMargin,
      generatedAt: new Date().toISOString()
    };

    res.json(profitLoss);
  } catch (error) {
    console.error('Error generating P&L statement:', error);
    res.status(500).json({ error: 'Failed to generate P&L statement' });
  }
});

// GET /api/finance/tax-records - Get tax records
router.get('/tax-records', async (req, res) => {
  try {
    const taxRecords = await prisma.taxRecord.findMany({
      orderBy: { dueDate: 'desc' }
    });

    res.json(taxRecords);
  } catch (error) {
    console.error('Error fetching tax records:', error);
    res.status(500).json({ error: 'Failed to fetch tax records' });
  }
});

// POST /api/finance/tax-records - Create tax record
router.post('/tax-records', [
  body('taxType').isIn(['GST', 'INCOME_TAX', 'TDS', 'PROFESSIONAL_TAX']),
  body('period').notEmpty().trim(),
  body('amount').isFloat({ min: 0 }),
  body('dueDate').isISO8601(),
  body('description').optional().trim(),
], handleValidationErrors, async (req, res) => {
  try {
    const { taxType, period, amount, dueDate, description } = req.body;

    const taxRecord = await prisma.taxRecord.create({
      data: {
        taxType,
        period,
        amount,
        dueDate: new Date(dueDate),
        description: description || null,
        status: 'PENDING'
      }
    });

    res.status(201).json(taxRecord);
  } catch (error) {
    console.error('Error creating tax record:', error);
    res.status(500).json({ error: 'Failed to create tax record' });
  }
});

// PUT /api/finance/tax-records/:id - Update tax record
router.put('/tax-records/:id', [
  param('id').isUUID(),
  body('status').optional().isIn(['PENDING', 'FILED', 'PAID']),
  body('filedDate').optional().isISO8601(),
  body('paidDate').optional().isISO8601(),
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {};

    if (req.body.status) updateData.status = req.body.status;
    if (req.body.filedDate) updateData.filedDate = new Date(req.body.filedDate);
    if (req.body.paidDate) updateData.paidDate = new Date(req.body.paidDate);

    const taxRecord = await prisma.taxRecord.update({
      where: { id },
      data: updateData
    });

    res.json(taxRecord);
  } catch (error) {
    console.error('Error updating tax record:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Tax record not found' });
    }
    res.status(500).json({ error: 'Failed to update tax record' });
  }
});

module.exports = router;
