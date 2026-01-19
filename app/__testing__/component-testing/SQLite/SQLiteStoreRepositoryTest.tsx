import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { container } from '@/src/infrastructure/di/container';
import { TOKENS } from '@/src/infrastructure/di/tokens';
import { StoreRepository } from '@/src/core/interfaces/StoreRepository';
import { Store } from '@/src/core/entities/Store';

export default function SQLiteStoreRepositoryTest() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string, isError: boolean = false) => {
    const prefix = isError ? '❌' : '✅';
    setResults(prev => [...prev, `${prefix} ${message}`]);
  };

  const clearResults = () => setResults([]);

  const testInsertStores = async () => {
    clearResults();
    setLoading(true);
    
    try {
      addResult('Starting Store Insert Test...');
      
      const storeRepo = container.resolve<StoreRepository>(TOKENS.SQLiteStoreRepository);
      
      const testStores: Store[] = [
        new Store(
          'store-test-001',
          'Test Street 123',
          '10',
          'Test Colony',
          '12345',
          'Near the park',
          'Test Store',
          'John Doe',
          '5551234567',
          '19.4326',
          '-99.1332',
          'creator-001',
          new Date().toISOString(),
          'test-context',
          1
        ),
        new Store(
          'store-test-002',
          'Another Street 456',
          '20',
          'Another Colony',
          '67890',
          'Next to the mall',
          'Another Store',
          'Jane Smith',
          '5559876543',
          '19.4326',
          '-99.1332',
          'creator-001',
          new Date().toISOString(),
          'test-context',
          1
        )
      ];

      await storeRepo.insertStores(testStores);
      addResult(`Inserted ${testStores.length} stores successfully`);

      // Verify by listing
      const allStores = await storeRepo.listStores();
      addResult(`Total stores in DB: ${allStores.length}`);
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const testListStores = async () => {
    clearResults();
    setLoading(true);
    
    try {
      addResult('Starting Store List Test...');
      
      const storeRepo = container.resolve<StoreRepository>(TOKENS.SQLiteStoreRepository);
      const stores = await storeRepo.listStores();
      
      addResult(`Found ${stores.length} stores`);
      stores.forEach((store, idx) => {
        addResult(`  ${idx + 1}. ${store.store_name} (${store.id_store})`);
      });
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const testUpdateStore = async () => {
    clearResults();
    setLoading(true);
    
    try {
      addResult('Starting Store Update Test...');
      
      const storeRepo = container.resolve<StoreRepository>(TOKENS.SQLiteStoreRepository);
      const stores = await storeRepo.listStores();
      
      if (stores.length === 0) {
        addResult('No stores found to update. Insert some first.', true);
        setLoading(false);
        return;
      }

      const storeToUpdate = stores[0];
      const updatedStore = new Store(
        storeToUpdate.id_store,
        storeToUpdate.street,
        storeToUpdate.ext_number,
        storeToUpdate.colony,
        storeToUpdate.postal_code,
        storeToUpdate.address_reference,
        'UPDATED Store Name',
        storeToUpdate.owner_name,
        storeToUpdate.cellphone,
        storeToUpdate.latitude,
        storeToUpdate.longitude,
        storeToUpdate.id_creator,
        storeToUpdate.creation_date,
        storeToUpdate.creation_context,
        2 // Changed status
      );

      await storeRepo.updateStore(updatedStore);
      addResult(`Updated store: ${updatedStore.id_store}`);

      // Verify
      const allStores = await storeRepo.listStores();
      const updated = allStores.find(s => s.id_store === updatedStore.id_store);
      if (updated) {
        addResult(`Verified: ${updated.store_name} (status: ${updated.status_store})`);
      }
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const testDeleteStores = async () => {
    clearResults();
    setLoading(true);
    
    try {
      addResult('Starting Store Delete Test...');
      
      const storeRepo = container.resolve<StoreRepository>(TOKENS.SQLiteStoreRepository);
      const stores = await storeRepo.listStores();
      
      if (stores.length === 0) {
        addResult('No stores found to delete.', true);
        setLoading(false);
        return;
      }

      const storesToDelete = stores.slice(0, 2);
      await storeRepo.deleteStores(storesToDelete);
      addResult(`Deleted ${storesToDelete.length} stores`);

      // Verify
      const remainingStores = await storeRepo.listStores();
      addResult(`Remaining stores: ${remainingStores.length}`);
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>SQLite Store Repository Test</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testInsertStores}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Insert Stores</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testListStores}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test List Stores</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testUpdateStore}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Update Store</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testDeleteStores}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Delete Stores</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {results.map((result, index) => (
          <Text key={index} style={styles.resultText}>{result}</Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    minHeight: 200,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});
