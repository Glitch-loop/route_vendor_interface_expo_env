// Load environment variables
import 'dotenv/config';

// Enable decorators metadata required by tsyringe
import 'reflect-metadata';

import { container } from '../../../src/infrastructure/di/container';
import { SQLiteStoreRepository } from '../../../src/infrastructure/repositories/sql_lite/sqlLite_store_repository';
import { SQLiteDataSource } from '../../../src/infrastructure/datasources/SQLiteDataSource';
import { Store } from '../../../src/core/entities/Store';

async function testSQLiteStoreRepository() {
  console.log('🧪 Testing SQLite Store Repository...\n');

  try {
    // Initialize SQLite
    const sqliteDataSource = container.resolve(SQLiteDataSource);
    await sqliteDataSource.initialize();
    console.log('✅ SQLite initialized\n');

    // Resolve repository
    const storeRepo = container.resolve(SQLiteStoreRepository);
    console.log('✅ SQLiteStoreRepository resolved\n');

    // Test 1: Insert stores
    console.log('📝 Test 1: Inserting stores...');
    const now = new Date().toISOString();
    const testStores: Store[] = [
      new Store(
        'test-store-1',
        'Main Street',
        '123',
        'Downtown',
        '12345',
        'Near the park',
        'Test Store 1',
        'John Doe',
        '+5215551234567',
        '19.432608',
        '−99.133209',
        'test-vendor-id',
        now,
        'test-context',
        '1',
        0
      ),
      new Store(
        'test-store-2',
        'Second Avenue',
        '456',
        'Uptown',
        '54321',
        'Next to the mall',
        'Test Store 2',
        'Jane Smith',
        '+5215559876543',
        '19.442608',
        '−99.143209',
        'test-vendor-id',
        now,
        'test-context',
        '1',
        0
      )
    ];

    await storeRepo.insertStores(testStores);
    console.log('✅ Stores inserted successfully\n');

    // Test 2: List all stores
    console.log('📝 Test 2: Listing all stores...');
    const allStores = await storeRepo.listStores();
    console.log(`✅ Found ${allStores.length} stores`);
    console.log('📊 Stores:', JSON.stringify(allStores, null, 2));
    console.log();

    // Test 3: Retrieve specific stores
    console.log('📝 Test 3: Retrieving specific stores...');
    const specificStores = await storeRepo.retrieveStore(['test-store-1']);
    console.log(`✅ Retrieved ${specificStores.length} store(s)`);
    console.log('📊 Store:', JSON.stringify(specificStores, null, 2));
    console.log();

    // Test 4: Update store
    console.log('📝 Test 4: Updating store...');
    const storeToUpdate = new Store(
      'test-store-1',
      'Updated Street',
      '999',
      'Updated Colony',
      '99999',
      'Updated reference',
      'Updated Store Name',
      'Updated Owner',
      '+5215559999999',
      '19.999999',
      '−99.999999',
      'test-vendor-id',
      now,
      'test-context-updated',
      '2',
      1
    );
    await storeRepo.updateStore(storeToUpdate);
    console.log('✅ Store updated successfully');
    
    const updatedStore = await storeRepo.retrieveStore(['test-store-1']);
    console.log('📊 Updated store:', JSON.stringify(updatedStore, null, 2));
    console.log();

    // Test 5: Delete stores
    console.log('📝 Test 5: Deleting stores...');
    await storeRepo.deleteStores(testStores);
    console.log('✅ Stores deleted successfully');
    
    const afterDelete = await storeRepo.listStores();
    console.log(`📈 Stores remaining: ${afterDelete.length}\n`);

    console.log('🎉 All Store Repository tests passed!');
  } catch (error: any) {
    console.error('❌ Test failed:', error?.message ?? error);
    console.error(error);
  }
}

// Run test
testSQLiteStoreRepository();
