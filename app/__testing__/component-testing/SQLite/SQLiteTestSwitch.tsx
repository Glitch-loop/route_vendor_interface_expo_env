// Libraries
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

// Test Components
import SQLiteStoreRepositoryTest from './SQLiteStoreRepositoryTest';
import SQLiteDayOperationRepositoryTest from './SQLiteDayOperationRepositoryTest';
import SQLiteInventoryOperationRepositoryTest from './SQLiteInventoryOperationRepositoryTest';
import SQLiteProductInventoryRepositoryTest from './SQLiteProductInventoryRepositoryTest';
import SQLiteRouteTransactionRepositoryTest from './SQLiteRouteTransactionRepositoryTest';
import SQLiteShiftOrganizationRepositoryTest from './SQLiteShiftOrganizationRepositoryTest';

type TestType = 'menu' | 'store' | 'dayOperation' | 'inventoryOperation' | 'productInventory' | 'routeTransaction' | 'shiftOrganization';

interface TestOption {
  id: TestType;
  label: string;
  description: string;
}

const testOptions: TestOption[] = [
  { id: 'store', label: '🏪 Store Repository', description: 'Test Store CRUD operations' },
  { id: 'dayOperation', label: '📋 Day Operation Repository', description: 'Test Day Operation CRUD operations' },
  { id: 'inventoryOperation', label: '📦 Inventory Operation Repository', description: 'Test Inventory Operation operations' },
  { id: 'productInventory', label: '🛍️ Product Inventory Repository', description: 'Test Product Inventory operations' },
  { id: 'routeTransaction', label: '💳 Route Transaction Repository', description: 'Test Route Transaction operations' },
  { id: 'shiftOrganization', label: '⏰ Shift Organization Repository', description: 'Test Work Day and Day Operation operations' },
];

export default function SQLiteTestSwitch() {
  const [currentTest, setCurrentTest] = useState<TestType>('menu');

  const renderTestComponent = () => {
    switch (currentTest) {
      case 'store':
        return <SQLiteStoreRepositoryTest />;
      case 'dayOperation':
        return <SQLiteDayOperationRepositoryTest />;
      case 'inventoryOperation':
        return <SQLiteInventoryOperationRepositoryTest />;
      case 'productInventory':
        return <SQLiteProductInventoryRepositoryTest />;
      case 'routeTransaction':
        return <SQLiteRouteTransactionRepositoryTest />;
      case 'shiftOrganization':
        return <SQLiteShiftOrganizationRepositoryTest />;
      case 'menu':
      default:
        return renderMenu();
    }
  };

  const renderMenu = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SQLite Repository Tests</Text>
        <Text style={styles.subtitle}>Select a repository to test</Text>
      </View>

      <View style={styles.menuContainer}>
        {testOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.menuItem}
            onPress={() => setCurrentTest(option.id)}
          >
            <Text style={styles.menuItemLabel}>{option.label}</Text>
            <Text style={styles.menuItemDescription}>{option.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>ℹ️ About These Tests</Text>
        <Text style={styles.infoText}>
          These components test SQLite repository implementations using the dependency injection container. 
          Each test can:
        </Text>
        <Text style={styles.infoBullet}>• List and retrieve data</Text>
        <Text style={styles.infoBullet}>• Create and update records</Text>
        <Text style={styles.infoBullet}>• Delete operations</Text>
        <Text style={styles.infoBullet}>• Display real-time results with ✅/❌ indicators</Text>
      </View>
    </ScrollView>
  );

  const renderHeader = () => {
    if (currentTest === 'menu') return null;

    return (
      <View style={styles.testHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentTest('menu')}
        >
          <Text style={styles.backButtonText}>← Back to Menu</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {renderHeader()}
      {renderTestComponent()}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  menuContainer: {
    marginBottom: 24,
  },
  menuItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItemLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#666',
  },
  infoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1976d2',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  infoBullet: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    marginBottom: 4,
    lineHeight: 20,
  },
  testHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});
