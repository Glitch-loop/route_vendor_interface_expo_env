// Libraries
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

// DI container
import { container } from '@/src/infrastructure/di/container';

// Tokens
import { TOKENS } from '@/src/infrastructure/di/tokens';

// Interfaces
import { ProductInventoryRepository } from '@/src/core/interfaces/ProductInventoryRepository';

export default function SQLiteProductInventoryRepositoryTest() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string, isError: boolean = false) => {
    const prefix = isError ? '❌' : '✅';
    setResults(prev => [...prev, `${prefix} ${message}`]);
  };

  const clearResults = () => setResults([]);

  const testRetrieveInventory = async () => {
    clearResults();
    setLoading(true);
    
    try {
      addResult('Starting Retrieve Inventory Test...');
      const prodInvRepo = container.resolve<ProductInventoryRepository>(TOKENS.SQLiteProductInventoryRepository);
      const inventory = await prodInvRepo.retrieveInventory();
      addResult(`Retrieved ${inventory.length} product inventory items`);
      
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
          onPress={testRetrieveInventory}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Retrieve Inventory</Text>
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
