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

// GET /api/hr/employees - Get all employees
router.get('/employees', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('department').optional().trim(),
  query('status').optional().isIn(['ACTIVE', 'INACTIVE', 'ON_LEAVE']),
], handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const where = {};
    
    if (req.query.department) {
      where.department = req.query.department;
    }
    
    if (req.query.status) {
      where.status = req.query.status;
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.employee.count({ where })
    ]);

    // Calculate statistics
    const stats = {
      total: await prisma.employee.count(),
      active: await prisma.employee.count({ where: { status: 'ACTIVE' } }),
      onLeave: await prisma.employee.count({ where: { status: 'ON_LEAVE' } }),
      departments: await prisma.employee.groupBy({
        by: ['department'],
        _count: { department: true }
      })
    };

    res.json({
      employees,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// POST /api/hr/employees - Create new employee
router.post('/employees', [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('phone').notEmpty().trim(),
  body('position').notEmpty().trim(),
  body('department').notEmpty().trim(),
  body('salary').isFloat({ min: 0 }),
  body('joinDate').isISO8601(),
  body('address').optional().trim(),
  body('emergencyContact').optional().trim(),
], handleValidationErrors, async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone, position, department,
      salary, joinDate, address, emergencyContact
    } = req.body;

    // Generate employee ID
    const employeeCount = await prisma.employee.count();
    const employeeId = `EMP${String(employeeCount + 1).padStart(3, '0')}`;

    const employee = await prisma.employee.create({
      data: {
        employeeId,
        firstName,
        lastName,
        email,
        phone,
        position,
        department,
        salary,
        joinDate: new Date(joinDate),
        address: address || null,
        emergencyContact: emergencyContact || null,
        status: 'ACTIVE'
      }
    });

    res.status(201).json(employee);
  } catch (error) {
    console.error('Error creating employee:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// PUT /api/hr/employees/:id - Update employee
router.put('/employees/:id', [
  param('id').isUUID(),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'ON_LEAVE']),
  body('salary').optional().isFloat({ min: 0 }),
  body('position').optional().trim(),
  body('department').optional().trim(),
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {};

    if (req.body.status) updateData.status = req.body.status;
    if (req.body.salary) updateData.salary = req.body.salary;
    if (req.body.position) updateData.position = req.body.position;
    if (req.body.department) updateData.department = req.body.department;

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData
    });

    res.json(employee);
  } catch (error) {
    console.error('Error updating employee:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// GET /api/hr/attendance - Get attendance records
router.get('/attendance', [
  query('date').optional().isISO8601(),
  query('employeeId').optional().isUUID(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
], handleValidationErrors, async (req, res) => {
  try {
    const where = {};
    
    if (req.query.date) {
      const date = new Date(req.query.date);
      where.date = {
        gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
      };
    } else if (req.query.startDate || req.query.endDate) {
      where.date = {};
      if (req.query.startDate) where.date.gte = new Date(req.query.startDate);
      if (req.query.endDate) where.date.lte = new Date(req.query.endDate);
    }
    
    if (req.query.employeeId) {
      where.employeeId = req.query.employeeId;
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        employee: true
      },
      orderBy: { date: 'desc' }
    });

    // Calculate summary
    const summary = {
      present: attendance.filter(a => a.status === 'PRESENT').length,
      absent: attendance.filter(a => a.status === 'ABSENT').length,
      late: attendance.filter(a => a.status === 'LATE').length,
      leave: attendance.filter(a => a.status === 'LEAVE').length,
      totalWorkingHours: attendance.reduce((sum, a) => sum + (a.workingHours || 0), 0),
      totalOvertimeHours: attendance.reduce((sum, a) => sum + (a.overtime || 0), 0)
    };

    res.json({ attendance, summary });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// POST /api/hr/attendance - Mark attendance
router.post('/attendance', [
  body('employeeId').isUUID(),
  body('date').isISO8601(),
  body('checkIn').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('checkOut').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('status').isIn(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'LEAVE']),
  body('notes').optional().trim(),
], handleValidationErrors, async (req, res) => {
  try {
    const { employeeId, date, checkIn, checkOut, status, notes } = req.body;

    // Calculate working hours if both check-in and check-out are provided
    let workingHours = null;
    let overtime = null;

    if (checkIn && checkOut) {
      const checkInTime = new Date(`1970-01-01T${checkIn}:00`);
      const checkOutTime = new Date(`1970-01-01T${checkOut}:00`);
      const diffMs = checkOutTime - checkInTime;
      workingHours = diffMs / (1000 * 60 * 60); // Convert to hours

      // Calculate overtime (assuming 8 hours is standard)
      if (workingHours > 8) {
        overtime = workingHours - 8;
      }
    }

    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        date: new Date(date),
        checkIn: checkIn || null,
        checkOut: checkOut || null,
        status,
        workingHours,
        overtime,
        notes: notes || null
      },
      include: {
        employee: true
      }
    });

    res.status(201).json(attendance);
  } catch (error) {
    console.error('Error marking attendance:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Attendance already marked for this date' });
    }
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// GET /api/hr/payroll - Get payroll records
router.get('/payroll', [
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2020, max: 2030 }),
  query('employeeId').optional().isUUID(),
], handleValidationErrors, async (req, res) => {
  try {
    const where = {};
    
    if (req.query.month) where.month = parseInt(req.query.month);
    if (req.query.year) where.year = parseInt(req.query.year);
    if (req.query.employeeId) where.employeeId = req.query.employeeId;

    const payroll = await prisma.payroll.findMany({
      where,
      include: {
        employee: true
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });

    // Calculate summary
    const summary = {
      totalPayroll: payroll.reduce((sum, p) => sum + p.netSalary, 0),
      processed: payroll.filter(p => p.status === 'PROCESSED').length,
      pending: payroll.filter(p => p.status === 'PENDING').length,
      paid: payroll.filter(p => p.status === 'PAID').length
    };

    res.json({ payroll, summary });
  } catch (error) {
    console.error('Error fetching payroll:', error);
    res.status(500).json({ error: 'Failed to fetch payroll' });
  }
});

// POST /api/hr/payroll - Process payroll
router.post('/payroll', [
  body('employeeId').isUUID(),
  body('month').isInt({ min: 1, max: 12 }),
  body('year').isInt({ min: 2020, max: 2030 }),
  body('basicSalary').isFloat({ min: 0 }),
  body('allowances').optional().isFloat({ min: 0 }),
  body('overtime').optional().isFloat({ min: 0 }),
  body('deductions').optional().isFloat({ min: 0 }),
], handleValidationErrors, async (req, res) => {
  try {
    const { employeeId, month, year, basicSalary, allowances = 0, overtime = 0, deductions = 0 } = req.body;

    const netSalary = basicSalary + allowances + overtime - deductions;

    const payroll = await prisma.payroll.create({
      data: {
        employeeId,
        month,
        year,
        basicSalary,
        allowances,
        overtime,
        deductions,
        netSalary,
        status: 'PROCESSED'
      },
      include: {
        employee: true
      }
    });

    res.status(201).json(payroll);
  } catch (error) {
    console.error('Error processing payroll:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Payroll already processed for this employee and period' });
    }
    res.status(500).json({ error: 'Failed to process payroll' });
  }
});

// GET /api/hr/training - Get training programs
router.get('/training', async (req, res) => {
  try {
    const programs = await prisma.trainingProgram.findMany({
      include: {
        enrollments: {
          include: {
            employee: true
          }
        }
      },
      orderBy: { startDate: 'desc' }
    });

    res.json(programs);
  } catch (error) {
    console.error('Error fetching training programs:', error);
    res.status(500).json({ error: 'Failed to fetch training programs' });
  }
});

// POST /api/hr/training - Create training program
router.post('/training', [
  body('title').notEmpty().trim(),
  body('description').optional().trim(),
  body('instructor').notEmpty().trim(),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('duration').isInt({ min: 1 }),
  body('maxParticipants').isInt({ min: 1 }),
  body('location').notEmpty().trim(),
  body('cost').isFloat({ min: 0 }),
], handleValidationErrors, async (req, res) => {
  try {
    const {
      title, description, instructor, startDate, endDate,
      duration, maxParticipants, location, cost
    } = req.body;

    const program = await prisma.trainingProgram.create({
      data: {
        title,
        description: description || null,
        instructor,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        duration,
        maxParticipants,
        location,
        cost,
        status: 'UPCOMING'
      }
    });

    res.status(201).json(program);
  } catch (error) {
    console.error('Error creating training program:', error);
    res.status(500).json({ error: 'Failed to create training program' });
  }
});

module.exports = router;
