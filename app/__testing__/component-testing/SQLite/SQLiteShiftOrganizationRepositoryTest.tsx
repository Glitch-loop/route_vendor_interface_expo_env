import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { container } from '@/src/infrastructure/di/container';
import { TOKENS } from '@/src/infrastructure/di/tokens';
import { ShiftOrganizationRepository } from '@/src/core/interfaces/ShiftOrganizationRepository';

export default function SQLiteShiftOrganizationRepositoryTest() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string, isError: boolean = false) => {
    const prefix = isError ? '❌' : '✅';
    setResults(prev => [...prev, `${prefix} ${message}`]);
  };

  const clearResults = () => setResults([]);

  const testListWorkDays = async () => {
    clearResults();
    setLoading(true);
    
    try {
      addResult('Starting List Work Days Test...');
      const shiftOrgRepo = container.resolve<ShiftOrganizationRepository>(TOKENS.SQLiteShiftOrganizationRepository);
      const workDays = await shiftOrgRepo.listWorkDays();
      addResult(`Found ${workDays.length} work days`);
      
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
      addResult('Starting List Day Operations Test...');
      const shiftOrgRepo = container.resolve<ShiftOrganizationRepository>(TOKENS.SQLiteShiftOrganizationRepository);
      const dayOps = await shiftOrgRepo.listDayOperations();
      addResult(`Found ${dayOps.length} day operations`);
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>SQLite Shift Organization Repository Test</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testListWorkDays}
          disabled={loading}
        >
          <Text style={styles.buttonText}>List Work Days</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testListDayOperations}
          disabled={loading}
        >
          <Text style={styles.buttonText}>List Day Operations</Text>
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
