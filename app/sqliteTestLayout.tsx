import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { container } from '@/src/infrastructure/di/container';
import { SQLiteDataSource } from '@/src/infrastructure/datasources/SQLiteDataSource';
import { SQLiteStoreRepository } from '@/src/infrastructure/repositories/SQLite/SQLiteStoreRepository';
import { Store } from '@/src/core/entities/Store';

export default function SQLiteTestScreen() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const log = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : '📝';
    setLogs(prev => [...prev, `${prefix} ${message}`]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setLogs([]);
    
    try {
      log('Starting SQLite tests...', 'info');
      
      // Initialize SQLite
      const sqliteDataSource = container.resolve(SQLiteDataSource);
      await sqliteDataSource.initialize();
      log('SQLite initialized', 'success');

      // Get database client
      const db = sqliteDataSource.getClient();
      log('Database client retrieved', 'success');

      // Test 1: Create test table
      log('Test 1: Creating test table...');
      await db.execAsync(`
        DROP TABLE IF EXISTS test_table;
        CREATE TABLE IF NOT EXISTS test_table (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
      `);
      log('Test table created', 'success');

      // Test 2: Insert data
      log('Test 2: Inserting test data...');
      const now = new Date().toISOString();
      await db.runAsync('INSERT INTO test_table (name, created_at) VALUES (?, ?)', ['Test 1', now]);
      await db.runAsync('INSERT INTO test_table (name, created_at) VALUES (?, ?)', ['Test 2', now]);
      log('Data inserted', 'success');

      // Test 3: Query data
      log('Test 3: Querying data...');
      const result = await db.getAllAsync('SELECT * FROM test_table');
      log(`Query successful - Found ${result.length} records`, 'success');
      log(`Query successful - Records ${JSON.stringify(result)} records`, 'success');

      // Test 4: Test Store Repository
      log('Test 4: Testing Store Repository...');
      const storeRepo = container.resolve(SQLiteStoreRepository);
      
      const testStores: Store[] = [
        new Store(
          'device-test-1',
          'Test Street',
          '123',
          'Test Colony',
          '12345',
          'Test reference',
          'Device Test Store',
          'Test Owner',
          '+5215551234567',
          '19.432608',
          '−99.133209',
          'test-vendor-id',
          now,
          'device-test',
          '1',
          0
        )
      ];

      await storeRepo.insertStores(testStores);
      log('Store inserted', 'success');

      const stores = await storeRepo.listStores();
      log(`Found ${stores.length} stores in database`, 'success');

      // Cleanup
      await storeRepo.deleteStores(testStores);
      await db.execAsync('DROP TABLE IF EXISTS test_table;');
      log('Cleanup complete', 'success');

      log('🎉 All tests passed!', 'success');
    } catch (error: any) {
      log(`Test failed: ${error?.message ?? error}`, 'error');
      console.error(error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SQLite Test Suite</Text>
      
      <TouchableOpacity 
        style={[styles.button, isRunning && styles.buttonDisabled]}
        onPress={runTests}
        disabled={isRunning}
      >
        <Text style={styles.buttonText}>
          {isRunning ? 'Running Tests...' : 'Run SQLite Tests'}
        </Text>
      </TouchableOpacity>

      <ScrollView style={styles.logContainer}>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 40,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});
