// Environment Variables Checker for Production Deployment

console.log('=== Environment Variables Check ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? '✅ Set' : '❌ Missing');
console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN || 'Using default: 7d');
console.log('JWT_REFRESH_EXPIRES_IN:', process.env.JWT_REFRESH_EXPIRES_IN || 'Using default: 30d');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set');

console.log('\n=== Required Environment Variables for Vercel ===');
console.log('DATABASE_URL=postgresql://neondb_owner:npg_NsG3bmhO6lHV@ep-weathered-hall-a1pj359g-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');
console.log('JWT_SECRET=your-super-secret-jwt-key-change-this-in-production');
console.log('JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production');
console.log('JWT_EXPIRES_IN=7d');
console.log('JWT_REFRESH_EXPIRES_IN=30d');
console.log('NODE_ENV=production');
console.log('FRONTEND_URL=https://your-vercel-app.vercel.app');

// Test database connection
async function testDatabaseConnection() {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    console.log('\n=== Database Connection Test ===');
    await prisma.$connect();
    
    // Test basic queries
    const userCount = await prisma.user.count();
    const orderCount = await prisma.order.count();
    const posCount = await prisma.pOSTransaction.count();
    
    console.log('✅ Database connected successfully');
    console.log('Users:', userCount);
    console.log('Orders:', orderCount);
    console.log('POS Transactions:', posCount);
    
    await prisma.$disconnect();
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  }
}

if (require.main === module) {
  testDatabaseConnection();
}
