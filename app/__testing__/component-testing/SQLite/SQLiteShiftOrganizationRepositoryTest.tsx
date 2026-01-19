// Libraries
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

// DI container
import { container } from '@/src/infrastructure/di/container';

// Tokens
import { TOKENS } from '@/src/infrastructure/di/tokens';

// Interfaces
import { ShiftOrganizationRepository } from '@/src/core/interfaces/ShiftOrganizationRepository';

// Entities
import { WorkDayInformation } from '@/src/core/entities/WorkDayInformation';

export default function SQLiteShiftOrganizationRepositoryTest() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string, isError: boolean = false) => {
    const prefix = isError ? '❌' : '✅';
    setResults(prev => [...prev, `${prefix} ${message}`]);
  };

  const clearResults = () => setResults([]);

  const buildDummyWorkDay = (suffix: string): WorkDayInformation => {
    const now = new Date();
    return new WorkDayInformation(
      `workday-${suffix}`,
      now,
      null,
      100,
      null,
      `route-${suffix}`,
      `Route ${suffix}`,
      `Dummy description ${suffix}`,
      'ACTIVE',
      `day-${suffix}`,
      `route-day-${suffix}`,
    );
  };

  const testInsertWorkDay = async () => {
    clearResults();
    setLoading(true);
    try {
      addResult('Starting Insert Work Day Test...');
      const repo = container.resolve<ShiftOrganizationRepository>(TOKENS.SQLiteShiftOrganizationRepository);
      const workDay = buildDummyWorkDay(Date.now().toString());
      await repo.insertWorkDay(workDay);
      addResult(`Inserted work day ${workDay.id_work_day}`);
      const all = await repo.listWorkDays();
      addResult(`Work days in DB: ${all.length}`);
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

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

  const testUpdateWorkDay = async () => {
    clearResults();
    setLoading(true);
    try {
      addResult('Starting Update Work Day Test...');
      const repo = container.resolve<ShiftOrganizationRepository>(TOKENS.SQLiteShiftOrganizationRepository);
      const all = await repo.listWorkDays();
      if (all.length === 0) {
        addResult('No work days found. Insert one first.', true);
        setLoading(false);
        return;
      }
      const target = all[0];
      const updated = new WorkDayInformation(
        target.id_work_day,
        target.start_date,
        new Date(),
        target.start_petty_cash,
        150,
        target.id_route,
        target.route_name + ' (updated)',
        target.description + ' updated',
        target.route_status,
        target.id_day,
        target.id_route_day,
      );
      await repo.updateWorkDay(updated);
      addResult(`Updated work day ${updated.id_work_day}`);
      const allAfter = await repo.listWorkDays();
      addResult(`Work days after update: ${allAfter.length}`);
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const testDeleteWorkDay = async () => {
    clearResults();
    setLoading(true);
    try {
      addResult('Starting Delete Work Day Test...');
      const repo = container.resolve<ShiftOrganizationRepository>(TOKENS.SQLiteShiftOrganizationRepository);
      const all = await repo.listWorkDays();
      if (all.length === 0) {
        addResult('No work days to delete.', true);
        setLoading(false);
        return;
      }
      const toDelete = all[0];
      await repo.deleteWorkDay(toDelete);
      addResult(`Deleted work day ${toDelete.id_work_day}`);
      const remaining = await repo.listWorkDays();
      addResult(`Remaining work days: ${remaining.length}`);
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
          onPress={testInsertWorkDay}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Insert Work Day</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testListWorkDays}
          disabled={loading}
        >
          <Text style={styles.buttonText}>List Work Days</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testUpdateWorkDay}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Update Work Day</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testDeleteWorkDay}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Delete Work Day</Text>
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
