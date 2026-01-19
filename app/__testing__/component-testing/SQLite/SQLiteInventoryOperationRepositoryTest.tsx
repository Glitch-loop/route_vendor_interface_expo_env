
// Libraries
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

// DI container
import { container } from '@/src/infrastructure/di/container';

// Tokens
import { TOKENS } from '@/src/infrastructure/di/tokens';

// Interfaces
import { InventoryOperationRepository } from '@/src/core/interfaces/InventoryOperationRepository';

// Entities
import { InventoryOperation } from '@/src/core/entities/InventoryOperation';

// Object values
import { InventoryOperationDescription } from '@/src/core/object-values/InventoryOperationDescription';

export default function SQLiteInventoryOperationRepositoryTest() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string, isError: boolean = false) => {
    const prefix = isError ? '❌' : '✅';
    setResults(prev => [...prev, `${prefix} ${message}`]);
  };

  const clearResults = () => setResults([]);

  const testListInventoryOperations = async () => {
    clearResults();
    setLoading(true);
    
    try {
      addResult('Starting Inventory Operation List Test...');
      const invOpRepo = container.resolve<InventoryOperationRepository>(TOKENS.SQLiteInventoryOperationRepository);
      const operations = await invOpRepo.listInventoryOperations();
      addResult(`Found ${operations.length} inventory operations`);
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const testRetrieveInventoryOperations = async () => {
    clearResults();
    setLoading(true);
    
    try {
      addResult('Starting Retrieve Inventory Operations Test...');
      const invOpRepo = container.resolve<InventoryOperationRepository>(TOKENS.SQLiteInventoryOperationRepository);
      const allOps = await invOpRepo.listInventoryOperations();
      
      if (allOps.length === 0) {
        addResult('No inventory operations found', true);
        setLoading(false);
        return;
      }

      const ids = allOps.slice(0, 2).map(op => op.id_inventory_operation);
      const operations = await invOpRepo.retrieveInventoryOperations(ids);
      addResult(`Retrieved ${operations.length} inventory operations by ID`);
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const testRetrieveDescriptions = async () => {
    clearResults();
    setLoading(true);
    
    try {
      addResult('Starting Retrieve Descriptions Test...');
      const invOpRepo = container.resolve<InventoryOperationRepository>(TOKENS.SQLiteInventoryOperationRepository);
      const allOps = await invOpRepo.listInventoryOperations();
      
      if (allOps.length === 0) {
        addResult('No inventory operations found', true);
        setLoading(false);
        return;
      }

      const descriptions = await invOpRepo.retrieveInventoryOperationDescription(allOps.slice(0, 2));
      addResult(`Retrieved ${descriptions.length} inventory operation descriptions`);
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const testCreateInventoryOperation = async () => {
    clearResults();
    setLoading(true);
    
    try {
      addResult('Starting Create Inventory Operation Test...');
      const invOpRepo = container.resolve<InventoryOperationRepository>(TOKENS.SQLiteInventoryOperationRepository);
      
      // Create test inventory operation with descriptions
      const testDescriptions: InventoryOperationDescription[] = [
        new InventoryOperationDescription(
          'desc-test-001',
          25.50,
          10,
          new Date(),
          'invop-test-001',
          'product-001'
        ),
        new InventoryOperationDescription(
          'desc-test-002',
          15.75,
          5,
          new Date(),
          'invop-test-001',
          'product-002'
        )
      ];

      const testOperation = new InventoryOperation(
        'invop-test-001',
        'signature-test',
        new Date(),
        1,
        0,
        'type-001',
        'workday-001',
        testDescriptions
      );

      await invOpRepo.createInventoryOperation(testOperation);
      addResult(`Created inventory operation: ${testOperation.id_inventory_operation}`);
      addResult(`With ${testDescriptions.length} product descriptions`);

      // Verify by listing
      const allOps = await invOpRepo.listInventoryOperations();
      addResult(`Total inventory operations in DB: ${allOps.length}`);
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const testUpdateInventoryOperation = async () => {
    clearResults();
    setLoading(true);
    
    try {
      addResult('Starting Update Inventory Operation Test...');
      const invOpRepo = container.resolve<InventoryOperationRepository>(TOKENS.SQLiteInventoryOperationRepository);
      const operations = await invOpRepo.listInventoryOperations();
      
      if (operations.length === 0) {
        addResult('No inventory operations found to update. Create some first.', true);
        setLoading(false);
        return;
      }

      const opToUpdate = operations[0];
      
      // Create updated descriptions
      const updatedDescriptions: InventoryOperationDescription[] = [
        new InventoryOperationDescription(
          'desc-updated-001',
          30.00,
          15,
          new Date(),
          opToUpdate.id_inventory_operation,
          'product-updated-001'
        )
      ];

      const updatedOp = new InventoryOperation(
        opToUpdate.id_inventory_operation,
        'updated-signature',
        new Date(),
        2,
        1,
        opToUpdate.id_inventory_operation_type,
        opToUpdate.id_work_day,
        updatedDescriptions
      );

      await invOpRepo.updateInventoryOperation(updatedOp);
      addResult(`Updated inventory operation: ${updatedOp.id_inventory_operation}`);
      addResult(`State changed to: ${updatedOp.state}`);

      // Verify
      const descriptions = await invOpRepo.retrieveInventoryOperationDescription([updatedOp]);
      addResult(`Verified: Operation now has ${descriptions.length} description(s)`);
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>SQLite Inventory Operation Repository Test</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testCreateInventoryOperation}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Create Operation</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testUpdateInventoryOperation}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Update Operation</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testListInventoryOperations}
          disabled={loading}
        >
          <Text style={styles.buttonText}>List Operations</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testRetrieveInventoryOperations}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Retrieve by ID</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testRetrieveDescriptions}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Retrieve Descriptions</Text>
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
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  buttonContainer: { marginBottom: 20 },
  button: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, marginBottom: 10 },
  buttonDisabled: { backgroundColor: '#ccc' },
  clearButton: { backgroundColor: '#FF3B30' },
  buttonText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '600' },
  resultsContainer: { backgroundColor: '#fff', padding: 16, borderRadius: 8, minHeight: 200 },
  resultsTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  resultText: { fontSize: 14, marginBottom: 4, fontFamily: 'monospace' },
});
