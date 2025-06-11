const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllOrders() {
  console.log('🗑️  Deleting all orders from database...');
  
  try {
    // Start a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      
      // 1. Delete Order Items first (child records)
      console.log('🗑️  Deleting order items...');
      const deletedOrderItems = await tx.orderItem.deleteMany({});
      console.log(`   ✅ Deleted ${deletedOrderItems.count} order items`);

      // 2. Delete Orders
      console.log('🗑️  Deleting orders...');
      const deletedOrders = await tx.order.deleteMany({});
      console.log(`   ✅ Deleted ${deletedOrders.count} orders`);

      console.log('\n🎉 Order deletion completed successfully!');
      console.log('\n📊 Summary:');
      console.log(`   • Order Items: ${deletedOrderItems.count}`);
      console.log(`   • Orders: ${deletedOrders.count}`);

      return { orderItems: deletedOrderItems.count, orders: deletedOrders.count };
    });

  } catch (error) {
    console.error('❌ Error during order deletion:', error);
    throw error;
  }
}

async function verifyDeletion() {
  console.log('\n🔍 Verifying deletion...');
  
  try {
    const counts = {
      orders: await prisma.order.count(),
      orderItems: await prisma.orderItem.count(),
    };

    console.log('\n📈 Current order counts:');
    Object.entries(counts).forEach(([table, count]) => {
      const status = count === 0 ? '✅' : '⚠️';
      console.log(`   ${status} ${table}: ${count}`);
    });

    if (counts.orders === 0 && counts.orderItems === 0) {
      console.log('\n✅ All orders successfully deleted!');
    } else {
      console.log('\n⚠️  Some orders may still remain');
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

async function showCurrentOrders() {
  console.log('\n📊 Current Orders in Database:');
  console.log('==============================');
  
  try {
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        deliveryDate: true,
        finalAmount: true,
        status: true,
        createdAt: true,
        customer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20, // Show up to 20 orders
    });

    if (orders.length === 0) {
      console.log('   📭 No orders found in database');
      return 0;
    }

    console.log(`   📦 Found ${orders.length} orders:`);
    orders.forEach((order, index) => {
      const deliveryDate = order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'No date';
      const customerName = order.customer?.name || 'No customer';
      console.log(`   ${index + 1}. ${order.orderNumber} - ${customerName} - ₹${order.finalAmount} - ${deliveryDate} - ${order.status}`);
    });

    return orders.length;
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    return 0;
  }
}

async function main() {
  try {
    console.log('🗄️  ROTI FACTORY ERP - DELETE ORDERS TOOL');
    console.log('==========================================');
    
    // Show current orders
    const orderCount = await showCurrentOrders();
    
    if (orderCount === 0) {
      console.log('\n✅ No orders found! Database is already clean.');
      return;
    }

    console.log(`\n⚠️  WARNING: This will delete ALL ${orderCount} orders from the database!`);
    console.log('⚠️  This action cannot be undone!');
    console.log('⚠️  Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    // Wait 5 seconds before proceeding
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Perform deletion
    await deleteAllOrders();
    
    // Verify deletion
    await verifyDeletion();
    
    console.log('\n✅ Order deletion completed successfully!');
    console.log('💡 You can now create fresh orders with current dates.');
    
  } catch (error) {
    console.error('❌ Order deletion failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the deletion
main();
