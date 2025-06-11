const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function showCurrentData() {
  console.log('\n📊 Current Database Contents:');
  console.log('================================');
  
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
      franchises: await prisma.franchise.count(),
      counters: await prisma.counter.count(),
      inventoryItems: await prisma.inventoryItem.count(),
      recipes: await prisma.recipe.count(),
      productionBatches: await prisma.productionBatch.count(),
      expenses: await prisma.expense.count(),
      accounts: await prisma.account.count(),
    };

    Object.entries(counts).forEach(([table, count]) => {
      const icon = count > 0 ? '📦' : '📭';
      console.log(`   ${icon} ${table.padEnd(20)}: ${count}`);
    });

    console.log('\n💡 Note: Users will be preserved for system access');
    
    return counts;
  } catch (error) {
    console.error('❌ Error fetching data:', error);
    return null;
  }
}

async function confirmCleanup() {
  console.log('\n⚠️  WARNING: DATABASE CLEANUP');
  console.log('================================');
  console.log('This operation will DELETE ALL of the following data:');
  console.log('• All orders and order items');
  console.log('• All POS transactions');
  console.log('• All customers');
  console.log('• All products and raw materials');
  console.log('• All franchises and counters');
  console.log('• All inventory data');
  console.log('• All production data');
  console.log('• All financial records');
  console.log('\n✅ The following will be PRESERVED:');
  console.log('• User accounts (for system access)');
  
  const answer1 = await askQuestion('\nDo you want to proceed? Type "yes" to continue: ');
  if (answer1.toLowerCase() !== 'yes') {
    console.log('❌ Operation cancelled.');
    return false;
  }

  const answer2 = await askQuestion('\nAre you absolutely sure? Type "DELETE ALL DATA" to confirm: ');
  if (answer2 !== 'DELETE ALL DATA') {
    console.log('❌ Operation cancelled.');
    return false;
  }

  return true;
}

async function cleanupDatabase() {
  console.log('\n🧹 Starting database cleanup...');
  
  try {
    // Start a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      
      // Delete in correct order to respect foreign key constraints
      const operations = [
        { name: 'POS Transaction Items', fn: () => tx.pOSTransactionItem?.deleteMany({}) },
        { name: 'POS Transactions', fn: () => tx.pOSTransaction?.deleteMany({}) },
        { name: 'Order Items', fn: () => tx.orderItem?.deleteMany({}) },
        { name: 'Orders', fn: () => tx.order?.deleteMany({}) },
        { name: 'Customers', fn: () => tx.customer?.deleteMany({}) },
        { name: 'Production Batches', fn: () => tx.productionBatch?.deleteMany({}) },
        { name: 'Quality Checks', fn: () => tx.qualityCheck?.deleteMany({}) },
        { name: 'Inventory Transactions', fn: () => tx.inventoryTransaction?.deleteMany({}) },
        { name: 'Inventory Items', fn: () => tx.inventoryItem?.deleteMany({}) },
        { name: 'Franchise Inventory', fn: () => tx.franchiseInventory?.deleteMany({}) },
        { name: 'Products', fn: () => tx.product?.deleteMany({}) },
        { name: 'Raw Materials', fn: () => tx.rawMaterial?.deleteMany({}) },
        { name: 'Counters', fn: () => tx.counter?.deleteMany({}) },
        { name: 'Franchises', fn: () => tx.franchise?.deleteMany({}) },
        { name: 'Expenses', fn: () => tx.expense?.deleteMany({}) },
        { name: 'Accounts', fn: () => tx.account?.deleteMany({}) },
      ];

      const results = {};
      
      for (const operation of operations) {
        console.log(`🗑️  Deleting ${operation.name}...`);
        try {
          const result = await operation.fn();
          if (result) {
            results[operation.name] = result.count;
            console.log(`   ✅ Deleted ${result.count} records`);
          } else {
            results[operation.name] = 0;
            console.log(`   ⚠️  Table not found, skipping`);
          }
        } catch (error) {
          results[operation.name] = 0;
          console.log(`   ⚠️  Error deleting ${operation.name}: ${error.message}`);
        }
      }

      console.log('\n🎉 Database cleanup completed successfully!');
      console.log('\n📊 Summary:');
      Object.entries(results).forEach(([name, count]) => {
        console.log(`   • ${name}: ${count}`);
      });

      return results;
    });

  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🗄️  ROTI FACTORY ERP - DATABASE CLEANUP TOOL');
    console.log('==============================================');
    
    // Show current data
    const currentData = await showCurrentData();
    if (!currentData) {
      console.log('❌ Could not fetch current data. Exiting.');
      return;
    }

    // Check if there's any data to clean
    const totalRecords = Object.entries(currentData)
      .filter(([key]) => key !== 'users')
      .reduce((sum, [, count]) => sum + count, 0);

    if (totalRecords === 0) {
      console.log('\n✅ Database is already clean! No mock data found.');
      return;
    }

    // Get confirmation
    const confirmed = await confirmCleanup();
    if (!confirmed) {
      return;
    }

    // Perform cleanup
    await cleanupDatabase();
    
    // Show final state
    console.log('\n🔍 Final verification...');
    await showCurrentData();
    
    console.log('\n✅ Database cleanup completed successfully!');
    console.log('💡 You can now start fresh with your ERP system.');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Run the cleanup
main();
