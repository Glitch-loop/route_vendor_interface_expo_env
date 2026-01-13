// Load environment variables
import 'dotenv/config';

// Enable decorators metadata required by tsyringe
import 'reflect-metadata';

import { container } from '../../../src/infrastructure/di/container';
import { SQLiteDataSource } from '../../../src/infrastructure/datasources/SQLiteDataSource';

async function testSQLiteConnection() {
  console.log('🧪 Testing SQLite Database Connection...\n');

  try {
    // Resolve SQLite DataSource from container
    const sqliteDataSource = container.resolve(SQLiteDataSource);
    console.log('✅ SQLiteDataSource resolved from container');

    // Ensure initialization
    await sqliteDataSource.initialize();
    console.log('✅ SQLite database initialized');

    // Get client
    const db = sqliteDataSource.getClient();
    console.log('✅ Database client retrieved\n');

    // Test 1: Create a test table
    console.log('📝 Test 1: Creating test table...');
    await db.execAsync(`
      DROP TABLE IF EXISTS test_table;
      CREATE TABLE IF NOT EXISTS test_table (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    console.log('✅ Test table created\n');

    // Test 2: Insert data
    console.log('📝 Test 2: Inserting test data...');
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO test_table (name, created_at) VALUES (?, ?)',
      ['Test Store 1', now]
    );
    await db.runAsync(
      'INSERT INTO test_table (name, created_at) VALUES (?, ?)',
      ['Test Store 2', now]
    );
    console.log('✅ Data inserted\n');

    // Test 3: Query data
    console.log('📝 Test 3: Querying data...');
    const result = await db.getAllAsync('SELECT * FROM test_table');
    console.log('✅ Query successful!');
    console.log('📊 Results:', JSON.stringify(result, null, 2));
    console.log(`\n📈 Total records: ${result.length}\n`);

    // Test 4: Update data
    console.log('📝 Test 4: Updating data...');
    await db.runAsync(
      'UPDATE test_table SET name = ? WHERE id = ?',
      ['Updated Store', 1]
    );
    const updatedResult = await db.getAllAsync('SELECT * FROM test_table WHERE id = 1');
    console.log('✅ Update successful!');
    console.log('📊 Updated record:', JSON.stringify(updatedResult, null, 2));
    console.log();

    // Test 5: Delete data
    console.log('📝 Test 5: Deleting data...');
    await db.runAsync('DELETE FROM test_table WHERE id = ?', [2]);
    const afterDelete = await db.getAllAsync('SELECT * FROM test_table');
    console.log('✅ Delete successful!');
    console.log(`📈 Records after delete: ${afterDelete.length}\n`);

    // Cleanup
    console.log('🧹 Cleaning up test table...');
    await db.execAsync('DROP TABLE IF EXISTS test_table;');
    console.log('✅ Cleanup complete\n');

    console.log('🎉 All SQLite tests passed!');
  } catch (error: any) {
    console.error('❌ SQLite test failed:', error?.message ?? error);
    console.error(error);
  }
}

// Run test
testSQLiteConnection();
