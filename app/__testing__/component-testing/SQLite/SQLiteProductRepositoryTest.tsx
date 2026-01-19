// Libraries
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

// DI container
import { container } from '@/src/infrastructure/di/container';

// Tokens
import { TOKENS } from '@/src/infrastructure/di/tokens';

// Interfaces
import { ProductRepository } from '@/src/core/interfaces/ProductRepository';

// Entities
import { Product } from '@/src/core/entities/Product';

export default function SQLiteProductRepositoryTest() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string, isError: boolean = false) => {
    const prefix = isError ? '❌' : '✅';
    setResults(prev => [...prev, `${prefix} ${message}`]);
  };

  const clearResults = () => setResults([]);

  const testInsertProduct = async () => {
    clearResults();
    setLoading(true);
    
    try {
      addResult('Starting Product Insert Test...');
      
      const productRepo = container.resolve<ProductRepository>(TOKENS.SQLiteProductRepository);
      
      const testProducts: Product[] = [
        new Product(
          'product-test-001',
          'Coca Cola 600ml',
          '7501055300006',
          '600',
          'ml',
          0.5,
          15.50,
          1,
          1
        ),
        new Product(
          'product-test-002',
          'Sabritas Original',
          '7501055300013',
          '45',
          'g',
          0.3,
          12.00,
          1,
          2
        ),
        new Product(
          'product-test-003',
          'Agua Ciel 1L',
          '7501055300020',
          '1000',
          'ml',
          0.4,
          10.00,
          1,
          3
        )
      ];

      for (const product of testProducts) {
        await productRepo.insertProduct(product);
      }
      
      addResult(`Inserted ${testProducts.length} products successfully`);

      // Verify by listing
      const allProducts = await productRepo.retrieveAllProducts();
      addResult(`Total products in DB: ${allProducts.length}`);
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const testRetrieveAllProducts = async () => {
    clearResults();
    setLoading(true);
    
    try {
      addResult('Starting Product Retrieval Test...');
      
      const productRepo = container.resolve<ProductRepository>(TOKENS.SQLiteProductRepository);
      const products = await productRepo.retrieveAllProducts();
      
      addResult(`Found ${products.length} products`);
      products.forEach((product, idx) => {
        addResult(`  ${idx + 1}. ${product.product_name} - $${product.price} (${product.id_product})`);
      });
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const testUpdateProduct = async () => {
    clearResults();
    setLoading(true);
    
    try {
      addResult('Starting Product Update Test...');
      
      const productRepo = container.resolve<ProductRepository>(TOKENS.SQLiteProductRepository);
      const products = await productRepo.retrieveAllProducts();
      
      if (products.length === 0) {
        addResult('No products found to update. Insert some first.', true);
        setLoading(false);
        return;
      }

      const productToUpdate = products[0];
      const updatedProduct = new Product(
        productToUpdate.id_product,
        'UPDATED - ' + productToUpdate.product_name,
        productToUpdate.barcode,
        productToUpdate.weight,
        productToUpdate.unit,
        1.5, // Updated commission
        25.99, // Updated price
        1,
        productToUpdate.order_to_show
      );

      await productRepo.updateProduct(updatedProduct);
      addResult(`Updated product: ${updatedProduct.id_product}`);

      // Verify
      const allProducts = await productRepo.retrieveAllProducts();
      const updated = allProducts.find(p => p.id_product === updatedProduct.id_product);
      if (updated) {
        addResult(`Verified: ${updated.product_name} - Price: $${updated.price} - Commission: ${updated.comission}`);
      }
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const testDeleteProduct = async () => {
    clearResults();
    setLoading(true);
    
    try {
      addResult('Starting Product Delete Test...');
      
      const productRepo = container.resolve<ProductRepository>(TOKENS.SQLiteProductRepository);
      const products = await productRepo.retrieveAllProducts();
      
      if (products.length === 0) {
        addResult('No products found to delete.', true);
        setLoading(false);
        return;
      }

      const productToDelete = products[0];
      await productRepo.deleteProduct(productToDelete);
      addResult(`Deleted product: ${productToDelete.product_name} (${productToDelete.id_product})`);

      // Verify
      const remainingProducts = await productRepo.retrieveAllProducts();
      addResult(`Remaining products: ${remainingProducts.length}`);
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const testProductValidation = async () => {
    clearResults();
    setLoading(true);
    
    try {
      addResult('Starting Product Validation Test...');
      
      const productRepo = container.resolve<ProductRepository>(TOKENS.SQLiteProductRepository);
      
      // Test with nullable fields
      const productWithNulls = new Product(
        'product-test-nulls',
        'Test Product With Nulls',
        null,
        null,
        null,
        0,
        9.99,
        1,
        99
      );

      await productRepo.insertProduct(productWithNulls);
      addResult('Successfully inserted product with null fields');

      // Retrieve and verify
      const allProducts = await productRepo.retrieveAllProducts();
      const retrieved = allProducts.find(p => p.id_product === 'product-test-nulls');
      
      if (retrieved) {
        addResult(`Retrieved: ${retrieved.product_name}`);
        addResult(`  Barcode: ${retrieved.barcode === null ? 'null' : retrieved.barcode}`);
        addResult(`  Weight: ${retrieved.weight === null ? 'null' : retrieved.weight}`);
        addResult(`  Unit: ${retrieved.unit === null ? 'null' : retrieved.unit}`);
      }
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const testBulkOperations = async () => {
    clearResults();
    setLoading(true);
    
    try {
      addResult('Starting Bulk Operations Test...');
      
      const productRepo = container.resolve<ProductRepository>(TOKENS.SQLiteProductRepository);
      
      // Insert multiple products
      const bulkProducts: Product[] = [];
      for (let i = 1; i <= 10; i++) {
        bulkProducts.push(new Product(
          `bulk-product-${i}`,
          `Bulk Product ${i}`,
          `750105530${String(i).padStart(4, '0')}`,
          '100',
          'g',
          0.25,
          10 + i,
          1,
          100 + i
        ));
      }

      const startTime = Date.now();
      for (const product of bulkProducts) {
        await productRepo.insertProduct(product);
      }
      const endTime = Date.now();
      
      addResult(`Inserted ${bulkProducts.length} products in ${endTime - startTime}ms`);

      // Verify
      const allProducts = await productRepo.retrieveAllProducts();
      const bulkCount = allProducts.filter(p => p.id_product.startsWith('bulk-product-')).length;
      addResult(`Verified: ${bulkCount} bulk products in database`);
      
    } catch (error: any) {
      addResult(`Error: ${error.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>SQLite Product Repository Test</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testInsertProduct}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Insert Products</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testRetrieveAllProducts}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Retrieve All Products</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testUpdateProduct}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Update Product</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testDeleteProduct}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Delete Product</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testProductValidation}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Product Validation</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testBulkOperations}
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
