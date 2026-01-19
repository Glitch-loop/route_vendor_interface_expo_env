// Libraries
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

// DI container
import { container } from '@/src/infrastructure/di/container';

// Tokens
import { TOKENS } from '@/src/infrastructure/di/tokens';

// Interfaces
import { ProductInventoryRepository } from '@/src/core/interfaces/ProductInventoryRepository';

// Entities
import { ProductInventory } from '@/src/core/entities/ProductInventory';

export default function SQLiteProductInventoryRepositoryTest() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string, isError: boolean = false) => {
    const prefix = isError ? '❌' : '✅';
    setResults(prev => [...prev, `${prefix} ${message}`]);
  };

  const clearResults = () => setResults([]);

  const testCreateInventory = async () => {
    clearResults();
    setLoading(true);
    
    try {
      addResult('Starting Create Inventory Test...');
      
      const prodInvRepo = container.resolve<ProductInventoryRepository>(TOKENS.SQLiteProductInventoryRepository);
      
      const testInventory: ProductInventory[] = [
        new ProductInventory(
          'inv-001',
          15.50,
          100,
          'product-test-001'
        ),
        new ProductInventory(
          'inv-002',
          12.00,
          50,
          'product-test-002'
        ),
        new ProductInventory(
          'inv-003',
          10.00,
          200,
          'product-test-003'
        )
      ];

      await prodInvRepo.createInventory(testInventory);
      addResult(`Created ${testInventory.length} inventory items successfully`);

      // Verify by retrieving
      const allInventory = await prodInvRepo.retrieveInventory();
      addResult(`Total inventory items in DB: ${allInventory.length}`);
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const testRetrieveInventory = async () => {
    clearResults();
    setLoading(true);
    
    try {
      addResult('Starting Retrieve Inventory Test...');
      const prodInvRepo = container.resolve<ProductInventoryRepository>(TOKENS.SQLiteProductInventoryRepository);
      const inventory = await prodInvRepo.retrieveInventory();
      
      addResult(`Retrieved ${inventory.length} product inventory items`);
      
      inventory.forEach((item, idx) => {
        const value = item.get_value_of_product();
        addResult(`  ${idx + 1}. Stock: ${item.get_stock_of_product()}, Price: $${item.get_price_of_product().toFixed(2)}, Value: $${value.toFixed(2)}`);
      });
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const testUpdateInventory = async () => {
    clearResults();
    setLoading(true);
    
    try {
      addResult('Starting Update Inventory Test...');
      
      const prodInvRepo = container.resolve<ProductInventoryRepository>(TOKENS.SQLiteProductInventoryRepository);
      const inventory = await prodInvRepo.retrieveInventory();
      
      if (inventory.length === 0) {
        addResult('No inventory items found to update. Create some first.', true);
        setLoading(false);
        return;
      }

      // Update first item with new stock and price
      const itemToUpdate = inventory[0];
      const updatedInventory = [
        new ProductInventory(
          (itemToUpdate as any).id_product_inventory,
          25.99, // Updated price
          150,   // Updated stock
          (itemToUpdate as any).id_product
        )
      ];

      await prodInvRepo.updateInventory(updatedInventory);
      addResult(`Updated inventory item successfully`);

      // Verify
      const allInventory = await prodInvRepo.retrieveInventory();
      const updated = allInventory.find(i => (i as any).id_product_inventory === (itemToUpdate as any).id_product_inventory);
      if (updated) {
        addResult(`Verified: Stock=${updated.get_stock_of_product()}, Price=$${updated.get_price_of_product()}, Value=$${updated.get_value_of_product()}`);
      }
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const testDeleteInventory = async () => {
    clearResults();
    setLoading(true);
    
    try {
      addResult('Starting Delete Inventory Test...');
      
      const prodInvRepo = container.resolve<ProductInventoryRepository>(TOKENS.SQLiteProductInventoryRepository);
      const inventory = await prodInvRepo.retrieveInventory();
      
      if (inventory.length === 0) {
        addResult('No inventory items found to delete.', true);
        setLoading(false);
        return;
      }

      const itemsToDelete = inventory.slice(0, 2);
      await prodInvRepo.deleteInventory(itemsToDelete);
      addResult(`Deleted ${itemsToDelete.length} inventory items`);

      // Verify
      const remainingInventory = await prodInvRepo.retrieveInventory();
      addResult(`Remaining inventory items: ${remainingInventory.length}`);
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const testInventoryCalculations = async () => {
    clearResults();
    setLoading(true);
    
    try {
      addResult('Starting Inventory Calculations Test...');
      
      const prodInvRepo = container.resolve<ProductInventoryRepository>(TOKENS.SQLiteProductInventoryRepository);
      
      // Create test inventory with known values
      const testInventory: ProductInventory[] = [
        new ProductInventory('calc-001', 10.00, 5, 'prod-calc-001'),   // Value: 50.00
        new ProductInventory('calc-002', 20.50, 10, 'prod-calc-002'),  // Value: 205.00
        new ProductInventory('calc-003', 15.75, 8, 'prod-calc-003'),   // Value: 126.00
      ];

      await prodInvRepo.createInventory(testInventory);
      addResult('Created test inventory for calculations');

      // Calculate total inventory value
      const inventory = await prodInvRepo.retrieveInventory();
      let totalValue = 0;
      let totalItems = 0;

      inventory.forEach(item => {
        const value = item.get_value_of_product();
        const stock = item.get_stock_of_product();
        const price = item.get_price_of_product();
        
        totalValue += value;
        totalItems += stock;
        
        addResult(`  Stock: ${stock}, Price: $${price.toFixed(2)} → Value: $${value.toFixed(2)}`);
      });

      addResult(`Total Inventory Value: $${totalValue.toFixed(2)}`);
      addResult(`Total Items in Stock: ${totalItems}`);
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const testBulkInventoryOperations = async () => {
    clearResults();
    setLoading(true);
    
    try {
      addResult('Starting Bulk Inventory Operations Test...');
      
      const prodInvRepo = container.resolve<ProductInventoryRepository>(TOKENS.SQLiteProductInventoryRepository);
      
      // Create bulk inventory
      const bulkInventory: ProductInventory[] = [];
      for (let i = 1; i <= 15; i++) {
        bulkInventory.push(new ProductInventory(
          `bulk-inv-${i}`,
          10 + (i * 0.5),
          50 + (i * 5),
          `bulk-prod-${i}`
        ));
      }

      const startTime = Date.now();
      await prodInvRepo.createInventory(bulkInventory);
      const endTime = Date.now();
      
      addResult(`Created ${bulkInventory.length} inventory items in ${endTime - startTime}ms`);

      // Verify
      const allInventory = await prodInvRepo.retrieveInventory();
      const bulkCount = allInventory.filter(i => (i as any).id_product_inventory?.startsWith('bulk-inv-')).length;
      addResult(`Verified: ${bulkCount} bulk inventory items in database`);
      
      // Calculate total value of bulk items
      let totalBulkValue = 0;
      allInventory
        .filter(i => (i as any).id_product_inventory?.startsWith('bulk-inv-'))
        .forEach(i => totalBulkValue += i.get_value_of_product());
      
      addResult(`Total value of bulk inventory: $${totalBulkValue.toFixed(2)}`);
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>SQLite Product Inventory Repository Test</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testCreateInventory}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Create Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testRetrieveInventory}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Retrieve Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testUpdateInventory}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Update Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testDeleteInventory}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Delete Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testInventoryCalculations}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Inventory Calculations</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testBulkInventoryOperations}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Bulk Operations</Text>
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
        {loading && <Text style={styles.loadingText}>Running test...</Text>}
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
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});
