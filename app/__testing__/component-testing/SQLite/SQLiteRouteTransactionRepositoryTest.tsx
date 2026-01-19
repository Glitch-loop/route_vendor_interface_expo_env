// Libraries
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

// DI container
import { container } from '@/src/infrastructure/di/container';

// Tokens
import { TOKENS } from '@/src/infrastructure/di/tokens';

// Interfaces
import { RouteTransactionRepository } from '@/src/core/interfaces/RouteTransactionRepository';

// Entities & Value Objects
import { RouteTransaction } from '@/src/core/entities/RouteTransaction';
import { Store } from '@/src/core/entities/Store';
import { PaymentMethod } from '@/src/core/object-values/PaymentMethod';
import { RouteTransactionDescription } from '@/src/core/object-values/RouteTransactionDescription';

// Enums
import { RouteTransactionState } from '@/src/core/enums/RouteTransactionState';
import { RouteTransactionOperation } from '@/src/core/enums/RouteTransactionOperation';
import PAYMENT_METHODS from '@/src/core/enums/PaymentMethod';

export default function SQLiteRouteTransactionRepositoryTest() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string, isError: boolean = false) => {
    const prefix = isError ? '❌' : '✅';
    setResults(prev => [...prev, `${prefix} ${message}`]);
  };

  const clearResults = () => setResults([]);

  const testListRouteTransactions = async () => {
    clearResults();
    setLoading(true);
    
    try {
      addResult('Starting List Route Transactions Test...');
      const routeTxRepo = container.resolve<RouteTransactionRepository>(TOKENS.SQLiteRouteTransactionRepository);
      const transactions = await routeTxRepo.listRouteTransactions();
      addResult(`Found ${transactions.length} route transactions`);
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const testListDescriptions = async () => {
    clearResults();
    setLoading(true);
    
    try {
      addResult('Starting List Transaction Descriptions Test...');
      const routeTxRepo = container.resolve<RouteTransactionRepository>(TOKENS.SQLiteRouteTransactionRepository);
      const descriptions = await routeTxRepo.listRouteTransactionDescriptions();
      addResult(`Found ${descriptions.length} route transaction descriptions`);
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const testInsertRouteTransaction = async () => {
    clearResults();
    setLoading(true);

    try {
      addResult('Starting Insert Route Transaction Test...');
      const routeTxRepo = container.resolve<RouteTransactionRepository>(TOKENS.SQLiteRouteTransactionRepository);

      // Use dummy IDs instead of existing DB dependencies
      const store: Store = new Store(
        'dummy-store-id',
        'Dummy Street',
        '0',
        'Dummy Colony',
        '00000',
        null,
        'Dummy Store',
        'Dummy Owner',
        '0000000000',
        '0',
        '0',
        'dummy-creator',
        new Date().toISOString(),
        'test',
        1
      );

      const paymentMethod: PaymentMethod = new PaymentMethod(PAYMENT_METHODS.CASH, 'Cash');

      const txId = `rtx-${Date.now()}`;
      const descriptions: RouteTransactionDescription[] = [
        new RouteTransactionDescription(
          `rtx-desc-${Date.now()}-1`,
          12.5,
          0.5,
          new Date(),
          RouteTransactionOperation.SALES,
          'dummy-product-1',
          txId
        ),
        new RouteTransactionDescription(
          `rtx-desc-${Date.now()}-2`,
          20.0,
          0.75,
          new Date(),
          RouteTransactionOperation.PRODUCT_REPOSITION,
          'dummy-product-2',
          txId
        )
      ];

      const tx = new RouteTransaction(
        txId,
        new Date().toISOString(),
        RouteTransactionState.ACTIVE,
        100,
        'workday-test-001',
        store.id_store,
        paymentMethod,
        descriptions
      );

      await routeTxRepo.insertRouteTransaction(tx);
      addResult(`Inserted route transaction ${txId}`);

      const retrieved = await routeTxRepo.retrieveRouteTransactionById([txId]);
      addResult(`Retrieved ${retrieved.length} route transaction(s) by ID`);
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const testUpdateRouteTransaction = async () => {
    clearResults();
    setLoading(true);

    try {
      addResult('Starting Update Route Transaction Test...');
      const routeTxRepo = container.resolve<RouteTransactionRepository>(TOKENS.SQLiteRouteTransactionRepository);

      const list = await routeTxRepo.listRouteTransactions();
      if (list.length === 0) {
        addResult('No transactions found. Insert one first.', true);
        setLoading(false);
        return;
      }

      const original = list[0];
      const updated = new RouteTransaction(
        original.id_route_transaction,
        new Date().toISOString(),
        RouteTransactionState.CANCELLED,
        original.cash_received,
        original.id_work_day,
        original.id_store,
        original.payment_method,
        original.transaction_description
      );

      await routeTxRepo.updateRouteTransaction(updated);
      addResult(`Updated transaction ${updated.id_route_transaction}`);

      const retrieved = await routeTxRepo.retrieveRouteTransactionById([updated.id_route_transaction]);
      addResult(`Post-update retrieve count: ${retrieved.length}`);
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const testDeleteRouteTransactions = async () => {
    clearResults();
    setLoading(true);

    try {
      addResult('Starting Delete Route Transactions Test...');
      const routeTxRepo = container.resolve<RouteTransactionRepository>(TOKENS.SQLiteRouteTransactionRepository);

      const list = await routeTxRepo.listRouteTransactions();
      if (list.length === 0) {
        addResult('No transactions to delete.', true);
        setLoading(false);
        return;
      }

      const toDelete = list.slice(0, Math.min(2, list.length));
      await routeTxRepo.deleteRouteTransactions(toDelete);
      addResult(`Deleted ${toDelete.length} transaction(s)`);

      const remaining = await routeTxRepo.listRouteTransactions();
      addResult(`Remaining transactions: ${remaining.length}`);
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const testListByStore = async () => {
    clearResults();
    setLoading(true);

    try {
      addResult('Starting List Transactions By Store Test...');
      const routeTxRepo = container.resolve<RouteTransactionRepository>(TOKENS.SQLiteRouteTransactionRepository);

      // Use a dummy Store object to filter
      const store = new Store(
        'dummy-store-id',
        'Dummy Street',
        '0',
        'Dummy Colony',
        '00000',
        null,
        'Dummy Store',
        'Dummy Owner',
        '0000000000',
        '0',
        '0',
        'dummy-creator',
        new Date().toISOString(),
        'test',
        1
      );
      const byStore = await routeTxRepo.listRouteTransactionByStore(store);
      addResult(`Found ${byStore.length} transaction(s) for store ${store.id_store}`);
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const testRetrieveById = async () => {
    clearResults();
    setLoading(true);

    try {
      addResult('Starting Retrieve Transactions By ID Test...');
      const routeTxRepo = container.resolve<RouteTransactionRepository>(TOKENS.SQLiteRouteTransactionRepository);

      const list = await routeTxRepo.listRouteTransactions();
      if (list.length === 0) {
        addResult('No transactions available. Insert one first.', true);
        setLoading(false);
        return;
      }

      const ids = list.slice(0, Math.min(3, list.length)).map(t => t.id_route_transaction);
      const retrieved = await routeTxRepo.retrieveRouteTransactionById(ids);
      addResult(`Requested ${ids.length} IDs, retrieved ${retrieved.length}`);
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>SQLite Route Transaction Repository Test</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testInsertRouteTransaction}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Insert Transaction</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testListRouteTransactions}
          disabled={loading}
        >
          <Text style={styles.buttonText}>List Transactions</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testListDescriptions}
          disabled={loading}
        >
          <Text style={styles.buttonText}>List Descriptions</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testUpdateRouteTransaction}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Update Transaction</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testDeleteRouteTransactions}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Delete Transactions</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testListByStore}
          disabled={loading}
        >
          <Text style={styles.buttonText}>List By Store</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testRetrieveById}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Retrieve By ID</Text>
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
