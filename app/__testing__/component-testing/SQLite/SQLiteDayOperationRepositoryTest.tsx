// Libraries
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

// DI container
import { container } from '@/src/infrastructure/di/container';

// Tokens
import { TOKENS } from '@/src/infrastructure/di/tokens';

// Interfaces
import { DayOperationRepository } from '@/src/core/interfaces/DayOperationRepository';

// Entities
import { DayOperation } from '@/src/core/entities/DayOperation';

// Enums
import { ShiftDayOperations } from '@/src/core/enums/ShiftDayOperations';

export default function SQLiteDayOperationRepositoryTest() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string, isError: boolean = false) => {
    const prefix = isError ? '❌' : '✅';
    setResults(prev => [...prev, `${prefix} ${message}`]);
  };

  const clearResults = () => setResults([]);

  const testInsertDayOperations = async () => {
    clearResults();
    setLoading(true);
    
    try {
      addResult('Starting Day Operation Insert Test...');
      
      const dayOpRepo = container.resolve<DayOperationRepository>(TOKENS.SQLiteDayOperationRepository);
      
      const testOperations: DayOperation[] = [
        new DayOperation(
          'dayop-test-001',
          'item-001',
          ShiftDayOperations.ATTEND_CLIENT_PETITION,
          new Date()
        ),
        new DayOperation(
          'dayop-test-002',
          'item-002',
          ShiftDayOperations.ATTENTION_OUT_OF_ROUTE,
          new Date()
        )
      ];

      await dayOpRepo.insertDayOperations(testOperations);
      addResult(`Inserted ${testOperations.length} day operations successfully`);

      // Verify by listing
      const allOperations = await dayOpRepo.listDayOperations();
      addResult(`Total day operations in DB: ${allOperations.length}`);
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const testListDayOperations = async () => {
    clearResults();
    setLoading(true);
    
    try {
      addResult('Starting Day Operation List Test...');
      
      const dayOpRepo = container.resolve<DayOperationRepository>(TOKENS.SQLiteDayOperationRepository);
      const operations = await dayOpRepo.listDayOperations();
      
      addResult(`Found ${operations.length} day operations`);
      operations.forEach((op, idx) => {
        addResult(`  ${idx + 1}. ${op.operation_type} - Item: ${op.id_item}`);
      });
      
    } catch (error: any) {
      addResult(`Error: $x{error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const testUpdateDayOperation = async () => {
    clearResults();
    setLoading(true);
    
    try {
      addResult('Starting Day Operation Update Test...');
      
      const dayOpRepo = container.resolve<DayOperationRepository>(TOKENS.SQLiteDayOperationRepository);
      const operations = await dayOpRepo.listDayOperations();
      
      if (operations.length === 0) {
        addResult('No day operations found to update. Insert some first.', true);
        setLoading(false);
        return;
      }

      const opToUpdate = operations[0];
      const updatedOp = new DayOperation(
        opToUpdate.id_day_operation,
        'updated-item-id',
        ShiftDayOperations.NEW_CLIENT_REGISTRATION,
        new Date()
      );

      await dayOpRepo.updateDayOperation(updatedOp);
      addResult(`Updated day operation: ${updatedOp.id_day_operation}`);

      // Verify
      const allOperations = await dayOpRepo.listDayOperations();
      const updated = allOperations.find(op => op.id_day_operation === updatedOp.id_day_operation);
      if (updated) {
        addResult(`Verified: ${updated.operation_type} - Item: ${updated.id_item}`);
      }
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const testDeleteDayOperations = async () => {
    clearResults();
    setLoading(true);
    
    try {
      addResult('Starting Day Operation Delete Test...');
      
      const dayOpRepo = container.resolve<DayOperationRepository>(TOKENS.SQLiteDayOperationRepository);
      const operations = await dayOpRepo.listDayOperations();
      
      if (operations.length === 0) {
        addResult('No day operations found to delete.', true);
        setLoading(false);
        return;
      }

      const opsToDelete = operations.slice(0, 2);
      await dayOpRepo.deleteDayOperatons(opsToDelete);
      addResult(`Deleted ${opsToDelete.length} day operations`);

      // Verify
      const remainingOps = await dayOpRepo.listDayOperations();
      addResult(`Remaining day operations: ${remainingOps.length}`);
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>SQLite Day Operation Repository Test</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testInsertDayOperations}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Insert Operations</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testListDayOperations}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test List Operations</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testUpdateDayOperation}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Update Operation</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testDeleteDayOperations}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Delete Operations</Text>
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
