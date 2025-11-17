const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupDatabase() {
  console.log('🧹 Starting database cleanup...');
  console.log('⚠️  This will delete ALL mock/test data from the database!');
  
  try {
    // Start a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      
      // 1. Delete POS Transaction Items (child records first)
      console.log('🗑️  Deleting POS transaction items...');
      const deletedPOSItems = await tx.pOSTransactionItem?.deleteMany({}) || { count: 0 };
      console.log(`   ✅ Deleted ${deletedPOSItems.count} POS transaction items`);

      // 2. Delete POS Transactions
      console.log('🗑️  Deleting POS transactions...');
      const deletedPOSTransactions = await tx.pOSTransaction?.deleteMany({}) || { count: 0 };
      console.log(`   ✅ Deleted ${deletedPOSTransactions.count} POS transactions`);

      // 3. Delete Order Items (child records first)
      console.log('🗑️  Deleting order items...');
      const deletedOrderItems = await tx.orderItem?.deleteMany({}) || { count: 0 };
      console.log(`   ✅ Deleted ${deletedOrderItems.count} order items`);

      // 4. Delete Orders
      console.log('🗑️  Deleting orders...');
      const deletedOrders = await tx.order?.deleteMany({}) || { count: 0 };
      console.log(`   ✅ Deleted ${deletedOrders.count} orders`);

      // 5. Delete Customers (only if they have no orders)
      console.log('🗑️  Deleting customers...');
      const deletedCustomers = await tx.customer?.deleteMany({}) || { count: 0 };
      console.log(`   ✅ Deleted ${deletedCustomers.count} customers`);

      // 6. Delete Production Batches
      console.log('🗑️  Deleting production batches...');
      const deletedProductionBatches = await tx.productionBatch.deleteMany({});
      console.log(`   ✅ Deleted ${deletedProductionBatches.count} production batches`);

      // 7. Delete Quality Checks
      console.log('🗑️  Deleting quality checks...');
      const deletedQualityChecks = await tx.qualityCheck.deleteMany({});
      console.log(`   ✅ Deleted ${deletedQualityChecks.count} quality checks`);

      // 8. Delete Inventory Transactions
      console.log('🗑️  Deleting inventory transactions...');
      const deletedInventoryTransactions = await tx.inventoryTransaction.deleteMany({});
      console.log(`   ✅ Deleted ${deletedInventoryTransactions.count} inventory transactions`);

      // 9. Delete Inventory Items
      console.log('🗑️  Deleting inventory items...');
      const deletedInventoryItems = await tx.inventoryItem.deleteMany({});
      console.log(`   ✅ Deleted ${deletedInventoryItems.count} inventory items`);

      // 10. Delete Hotel Orders and Items
      console.log('🗑️  Deleting hotel order items...');
      const deletedHotelOrderItems = await tx.hotelOrderItem.deleteMany({});
      console.log(`   ✅ Deleted ${deletedHotelOrderItems.count} hotel order items`);

      console.log('🗑️  Deleting hotel orders...');
      const deletedHotelOrders = await tx.hotelOrder.deleteMany({});
      console.log(`   ✅ Deleted ${deletedHotelOrders.count} hotel orders`);

      // 10a. Delete Hostel Orders and Items
      console.log('🗑️  Deleting hostel order items...');
      const deletedHostelOrderItems = await tx.hostelOrderItem.deleteMany({});
      console.log(`   ✅ Deleted ${deletedHostelOrderItems.count} hostel order items`);

      console.log('🗑️  Deleting hostel orders...');
      const deletedHostelOrders = await tx.hostelOrder.deleteMany({});
      console.log(`   ✅ Deleted ${deletedHostelOrders.count} hostel orders`);

      // 11. Delete Recipe Items (child records first)
      console.log('🗑️  Deleting recipe items...');
      const deletedRecipeItems = await tx.recipeItem.deleteMany({});
      console.log(`   ✅ Deleted ${deletedRecipeItems.count} recipe items`);

      // 12. Delete Recipes
      console.log('🗑️  Deleting recipes...');
      const deletedRecipes = await tx.recipe.deleteMany({});
      console.log(`   ✅ Deleted ${deletedRecipes.count} recipes`);

      // 13. Delete Products
      console.log('🗑️  Deleting products...');
      const deletedProducts = await tx.product.deleteMany({});
      console.log(`   ✅ Deleted ${deletedProducts.count} products`);

      // 14. Delete Raw Materials
      console.log('🗑️  Deleting raw materials...');
      const deletedRawMaterials = await tx.rawMaterial.deleteMany({});
      console.log(`   ✅ Deleted ${deletedRawMaterials.count} raw materials`);

      // 15. Delete Counters
      console.log('🗑️  Deleting counters...');
      const deletedCounters = await tx.counter.deleteMany({});
      console.log(`   ✅ Deleted ${deletedCounters.count} counters`);

      // 16. Delete Hotels
      console.log('🗑️  Deleting hotels...');
      const deletedHotels = await tx.hotel.deleteMany({});
      console.log(`   ✅ Deleted ${deletedHotels.count} hotels`);

      // 16a. Delete Hostels
      console.log('🗑️  Deleting hostels...');
      const deletedHostels = await tx.hostel.deleteMany({});
      console.log(`   ✅ Deleted ${deletedHostels.count} hostels`);

      // 17. Delete Expenses
      console.log('🗑️  Deleting expenses...');
      const deletedExpenses = await tx.expense.deleteMany({});
      console.log(`   ✅ Deleted ${deletedExpenses.count} expenses`);

      // 18. Delete Accounts
      console.log('🗑️  Deleting accounts...');
      const deletedAccounts = await tx.account.deleteMany({});
      console.log(`   ✅ Deleted ${deletedAccounts.count} accounts`);

      console.log('\n🎉 Database cleanup completed successfully!');
      console.log('\n📊 Summary:');
      console.log(`   • POS Transaction Items: ${deletedPOSItems.count}`);
      console.log(`   • POS Transactions: ${deletedPOSTransactions.count}`);
      console.log(`   • Order Items: ${deletedOrderItems.count}`);
      console.log(`   • Orders: ${deletedOrders.count}`);
      console.log(`   • Customers: ${deletedCustomers.count}`);
      console.log(`   • Production Batches: ${deletedProductionBatches.count}`);
      console.log(`   • Quality Checks: ${deletedQualityChecks.count}`);
      console.log(`   • Inventory Transactions: ${deletedInventoryTransactions.count}`);
      console.log(`   • Inventory Items: ${deletedInventoryItems.count}`);
      console.log(`   • Hotel Order Items: ${deletedHotelOrderItems.count}`);
      console.log(`   • Hotel Orders: ${deletedHotelOrders.count}`);
      console.log(`   • Hostel Order Items: ${deletedHostelOrderItems.count}`);
      console.log(`   • Hostel Orders: ${deletedHostelOrders.count}`);
      console.log(`   • Recipe Items: ${deletedRecipeItems.count}`);
      console.log(`   • Recipes: ${deletedRecipes.count}`);
      console.log(`   • Products: ${deletedProducts.count}`);
      console.log(`   • Raw Materials: ${deletedRawMaterials.count}`);
      console.log(`   • Counters: ${deletedCounters.count}`);
      console.log(`   • Hotels: ${deletedHotels.count}`);
      console.log(`   • Hostels: ${deletedHostels.count}`);
      console.log(`   • Expenses: ${deletedExpenses.count}`);
      console.log(`   • Accounts: ${deletedAccounts.count}`);

    });

  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    throw error;
  }
}

async function verifyCleanup() {
  console.log('\n🔍 Verifying cleanup...');
  
  try {
    const counts = {
      users: await prisma.user.count(),
      products: await prisma.product.count(),
      rawMaterials: await prisma.rawMaterial.count(),
      customers: await prisma.customer.count(),
      orders: await prisma.order.count(),
      orderItems: await prisma.orderItem.count(),
      posTransactions: await prisma.pOSTransaction.count(),
      posTransactionItems: await prisma.pOSTransactionItem.count(),
      hotels: await prisma.hotel.count(),
      hostels: await prisma.hostel.count(),
      counters: await prisma.counter.count(),
      inventoryItems: await prisma.inventoryItem.count(),
      recipes: await prisma.recipe.count(),
      productionBatches: await prisma.productionBatch.count(),
      expenses: await prisma.expense.count(),
      accounts: await prisma.account.count(),
    };

    console.log('\n📈 Current database state:');
    Object.entries(counts).forEach(([table, count]) => {
      const status = count === 0 ? '✅' : (table === 'users' ? '👤' : '⚠️');
      console.log(`   ${status} ${table}: ${count}`);
    });

    console.log('\n💡 Note: Users are preserved for system access');
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

async function main() {
  try {
    await cleanupDatabase();
    await verifyCleanup();
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  console.log('⚠️  WARNING: This will delete ALL mock/test data from the database!');
  console.log('⚠️  Users will be preserved for system access.');
  console.log('⚠️  Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
  
  setTimeout(() => {
    main();
  }, 5000);
}

module.exports = { cleanupDatabase, verifyCleanup };
