const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default users
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@rotifactory.com' },
    update: {},
    create: {
      email: 'superadmin@rotifactory.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+91-9999999999',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      isActive: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@rotifactory.com' },
    update: {},
    create: {
      email: 'admin@rotifactory.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+91-9999999998',
      role: 'ADMIN',
      status: 'ACTIVE',
      isActive: true,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@rotifactory.com' },
    update: {},
    create: {
      email: 'manager@rotifactory.com',
      password: hashedPassword,
      firstName: 'Production',
      lastName: 'Manager',
      phone: '+91-9999999997',
      role: 'MANAGER',
      status: 'ACTIVE',
      isActive: true,
    },
  });

  const franchiseManager = await prisma.user.upsert({
    where: { email: 'franchise@rotifactory.com' },
    update: {},
    create: {
      email: 'franchise@rotifactory.com',
      password: hashedPassword,
      firstName: 'Franchise',
      lastName: 'Manager',
      phone: '+91-9999999996',
      role: 'FRANCHISE_MANAGER',
      status: 'ACTIVE',
      isActive: true,
    },
  });

  const counterOperator = await prisma.user.upsert({
    where: { email: 'counter@rotifactory.com' },
    update: {},
    create: {
      email: 'counter@rotifactory.com',
      password: hashedPassword,
      firstName: 'Counter',
      lastName: 'Operator',
      phone: '+91-9999999995',
      role: 'COUNTER_OPERATOR',
      status: 'ACTIVE',
      isActive: true,
    },
  });

  console.log('✅ Users created');

  // Create raw materials
  const rawMaterials = [
    {
      name: 'Wheat Flour',
      description: 'Premium quality wheat flour for roti making',
      sku: 'RM001',
      unit: 'kg',
      costPrice: 45.00,
      supplier: 'Grain Suppliers Ltd',
      minStock: 100,
      maxStock: 1000,
    },
    {
      name: 'Salt',
      description: 'Refined salt for seasoning',
      sku: 'RM002',
      unit: 'kg',
      costPrice: 25.00,
      supplier: 'Salt Works Co',
      minStock: 20,
      maxStock: 200,
    },
    {
      name: 'Cooking Oil',
      description: 'Sunflower oil for cooking',
      sku: 'RM003',
      unit: 'liters',
      costPrice: 120.00,
      supplier: 'Oil Mills Pvt Ltd',
      minStock: 50,
      maxStock: 500,
    },
    {
      name: 'Turmeric Powder',
      description: 'Pure turmeric powder for flavoring',
      sku: 'RM004',
      unit: 'kg',
      costPrice: 180.00,
      supplier: 'Spice Traders',
      minStock: 10,
      maxStock: 100,
    },
    {
      name: 'Red Chili Powder',
      description: 'Hot red chili powder',
      sku: 'RM005',
      unit: 'kg',
      costPrice: 200.00,
      supplier: 'Spice Traders',
      minStock: 10,
      maxStock: 100,
    },
  ];

  for (const material of rawMaterials) {
    await prisma.rawMaterial.upsert({
      where: { sku: material.sku },
      update: {},
      create: material,
    });
  }

  console.log('✅ Raw materials created');

  // Create products
  const products = [
    {
      name: 'Plain Roti',
      description: 'Traditional plain wheat roti',
      sku: 'PROD001',
      category: 'Basic Roti',
      unitPrice: 8.00,
      costPrice: 5.00,
      unit: 'pieces',
    },
    {
      name: 'Butter Roti',
      description: 'Soft roti with butter coating',
      sku: 'PROD002',
      category: 'Premium Roti',
      unitPrice: 12.00,
      costPrice: 7.50,
      unit: 'pieces',
    },
    {
      name: 'Masala Roti',
      description: 'Spiced roti with herbs and spices',
      sku: 'PROD003',
      category: 'Specialty Roti',
      unitPrice: 15.00,
      costPrice: 9.00,
      unit: 'pieces',
    },
    {
      name: 'Wheat Roti',
      description: '100% whole wheat roti',
      sku: 'PROD004',
      category: 'Healthy Roti',
      unitPrice: 10.00,
      costPrice: 6.00,
      unit: 'pieces',
    },
    {
      name: 'Tandoor Roti',
      description: 'Clay oven baked roti',
      sku: 'PROD005',
      category: 'Premium Roti',
      unitPrice: 18.00,
      costPrice: 11.00,
      unit: 'pieces',
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
  }

  console.log('✅ Products created');

  // Create sample customers
  const customers = [
    {
      name: 'Rajesh Kumar',
      email: 'rajesh@example.com',
      phone: '+91-9876543210',
      address: '123 Main Street, Delhi',
      loyaltyPoints: 150,
      totalSpent: 2500.00,
    },
    {
      name: 'Priya Sharma',
      email: 'priya@example.com',
      phone: '+91-9876543211',
      address: '456 Park Avenue, Mumbai',
      loyaltyPoints: 200,
      totalSpent: 3200.00,
    },
    {
      name: 'Amit Singh',
      phone: '+91-9876543212',
      address: '789 Garden Road, Bangalore',
      loyaltyPoints: 75,
      totalSpent: 1200.00,
    },
  ];

  for (const customer of customers) {
    await prisma.customer.create({
      data: customer,
    });
  }

  console.log('✅ Customers created');

  // Create sample hotels
  const hotel1 = await prisma.hotel.create({
    data: {
      name: 'Grand Plaza Hotel',
      address: '100 Commercial Complex, Connaught Place',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      contactPerson: 'Suresh Gupta',
      contactPhone: '+91-9876543213',
      contactEmail: 'suresh@grandplaza.com',
      isActive: true,
      createdById: admin.id,
    },
  });

  const hostel1 = await prisma.hostel.create({
    data: {
      name: 'Student Hostel - Central',
      address: '45 University Road, Delhi',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110007',
      contactPerson: 'Rajesh Kumar',
      contactPhone: '+91-9876543214',
      contactEmail: 'rajesh@studenthostel.com',
      isActive: true,
      createdById: admin.id,
    },
  });

  console.log('✅ Hotels and hostels created');

  // Create sample counters
  const existingCounters = await prisma.counter.findMany();

  if (existingCounters.length === 0) {
    const counter1 = await prisma.counter.create({
      data: {
        name: 'Counter 1 - Main Factory',
        location: 'Ground Floor - Main Entrance',
        managerName: 'Amit Sharma',
        managerPhone: '+91-9876543215',
        isActive: true,
      },
    });

    const counter2 = await prisma.counter.create({
      data: {
        name: 'Counter 2 - Food Court',
        location: 'First Floor - Food Court',
        managerName: 'Priya Singh',
        managerPhone: '+91-9876543216',
        isActive: true,
      },
    });

    console.log('✅ Counters created');
  }

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Default Login Credentials:');
  console.log('Super Admin: superadmin@rotifactory.com / admin123');
  console.log('Admin: admin@rotifactory.com / admin123');
  console.log('Manager: manager@rotifactory.com / admin123');
  console.log('Franchise Manager: franchise@rotifactory.com / admin123');
  console.log('Counter Operator: counter@rotifactory.com / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
