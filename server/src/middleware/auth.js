const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'User not found',
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'User account is not active',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token',
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Token expired',
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication failed',
    });
  }
};

// Check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Authentication required',
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Insufficient permissions',
        required: allowedRoles,
        current: userRole,
      });
    }

    next();
  };
};

// Role hierarchy for permission checking
const roleHierarchy = {
  SUPER_ADMIN: 5,
  ADMIN: 4,
  MANAGER: 3,
  FRANCHISE_MANAGER: 2,
  COUNTER_OPERATOR: 1,
};

// Check if user has minimum role level
const requireMinRole = (minRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Authentication required',
      });
    }

    const userRoleLevel = roleHierarchy[req.user.role] || 0;
    const minRoleLevel = roleHierarchy[minRole] || 0;

    if (userRoleLevel < minRoleLevel) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Insufficient permissions',
        required: `Minimum role: ${minRole}`,
        current: req.user.role,
      });
    }

    next();
  };
};

// Check if user can access franchise data
const requireFranchiseAccess = async (req, res, next) => {
  try {
    const franchiseId = req.params.franchiseId || req.body.franchiseId || req.query.franchiseId;
    
    if (!franchiseId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Franchise ID is required',
      });
    }

    const userRole = req.user.role;
    
    // Super admin and admin can access all franchises
    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
      return next();
    }

    // Franchise managers can only access their assigned franchises
    if (userRole === 'FRANCHISE_MANAGER') {
      const franchise = await prisma.franchise.findFirst({
        where: {
          id: franchiseId,
          managedBy: req.user.id,
        },
      });

      if (!franchise) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only access franchises you manage',
        });
      }
    }

    // Counter operators can only access counters in their franchise
    if (userRole === 'COUNTER_OPERATOR') {
      const counter = await prisma.counter.findFirst({
        where: {
          franchise: {
            id: franchiseId,
            counters: {
              some: {
                // This would need additional logic to link operators to specific counters
                isActive: true,
              },
            },
          },
        },
      });

      if (!counter) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only access your assigned franchise',
        });
      }
    }

    next();
  } catch (error) {
    console.error('Franchise access check error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Access check failed',
    });
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireMinRole,
  requireFranchiseAccess,
  roleHierarchy,
};
