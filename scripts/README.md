# Database Cleanup Scripts

This directory contains scripts to clean up mock/test data from your Roti Factory ERP database.

## 🧹 Available Scripts

### 1. Interactive Cleanup (Recommended)
```bash
npm run db:cleanup-safe
```

**Features:**
- ✅ Shows current database contents before cleanup
- ✅ Requires double confirmation before proceeding
- ✅ Safe and user-friendly
- ✅ Shows summary of deleted records
- ✅ Preserves user accounts

### 2. Automatic Cleanup
```bash
npm run db:cleanup
```

**Features:**
- ⚡ Fast automatic cleanup
- ⚠️ 5-second warning before execution
- 🔄 Can be cancelled with Ctrl+C
- 📊 Shows summary after completion

## 🗑️ What Gets Deleted

The cleanup scripts will remove ALL of the following data:

### Sales & Orders
- All orders and order items
- All POS transactions and items
- All customer records

### Products & Inventory
- All products and raw materials
- All inventory items and transactions
- All recipes and recipe items
- All franchise inventory records

### Manufacturing
- All production batches
- All quality check records

### Business Operations
- All franchises and counters
- All expenses and accounts

## ✅ What Gets Preserved

- **User accounts** - All user logins remain intact
- **System configuration** - Database structure and settings

## 🚀 Usage Examples

### Check what's in your database first:
```bash
npm run db:cleanup-safe
# Choose to view data only, then cancel
```

### Clean everything safely:
```bash
npm run db:cleanup-safe
# Follow the prompts and confirmations
```

### Quick cleanup (if you're sure):
```bash
npm run db:cleanup
# Wait 5 seconds or press Ctrl+C to cancel
```

## ⚠️ Important Notes

1. **Backup First**: Always backup your database before running cleanup
2. **Users Preserved**: Your login accounts will remain intact
3. **Irreversible**: Once deleted, data cannot be recovered
4. **Fresh Start**: Perfect for starting with clean, real data

## 🔄 After Cleanup

After running the cleanup, you can:

1. **Start fresh** with real business data
2. **Re-seed** with new sample data: `npm run db:seed`
3. **Begin production** use with clean database

## 🛠️ Technical Details

- Uses Prisma transactions for data integrity
- Respects foreign key constraints
- Deletes in correct order to avoid conflicts
- Provides detailed logging and error handling

## 📞 Support

If you encounter any issues:
1. Check the console output for specific error messages
2. Ensure your database connection is working
3. Verify you have proper permissions
4. Contact support if problems persist
