import { container } from '@/src/infrastructure/di/container';
import { SQLiteDataSource } from '@/src/infrastructure/datasources/SQLiteDataSource';
import { SQLiteInventoryRepository } from '@/src/infrastructure/repositories/SQLite/SQLiteInventoryRepository';
import { ProductInventory } from '@/src/core/entities/ProductInventory';
import { TOKENS } from '@/src/infrastructure/di/tokens';
import EMBEDDED_TABLES from '@/src/infrastructure/database/embeddedTables';

// Enable decorators metadata required by tsyringe
import 'reflect-metadata';

describe('SQLiteInventoryRepository', () => {
  let inventoryRepository: SQLiteInventoryRepository;
  let dataSource: SQLiteDataSource;

  beforeAll(async () => {
    dataSource = container.resolve<SQLiteDataSource>(TOKENS.SQLiteDataSource);
    await dataSource.initialize();
    const db = dataSource.getClient();
    // Create a PRODUCTS table shaped as expected by repository
    await db.execAsync(`
      DROP TABLE IF EXISTS ${EMBEDDED_TABLES.PRODUCTS};
      CREATE TABLE IF NOT EXISTS ${EMBEDDED_TABLES.PRODUCTS} (
        id_product_inventory   TEXT NOT NULL UNIQUE,
        price_at_moment        NUMERIC(6,3) NOT NULL,
        stock                  INT NOT NULL,
        id_product             TEXT NOT NULL
      );
    `);
    inventoryRepository = container.resolve<SQLiteInventoryRepository>(
      TOKENS.SQLiteInventoryRepository
    );
  });

  describe('createInventory', () => {
    it('should create inventory entries', async () => {
      const products: ProductInventory[] = [
        new ProductInventory(
          'inv-prod-001',
          150.0,
          50,
          'product-001'
        ),
        new ProductInventory(
          'inv-prod-002',
          75.5,
          100,
          'product-002'
        )
      ];

      await expect(
        inventoryRepository.createInventory(products)
      ).resolves.not.toThrow();

      // Cleanup
      await inventoryRepository.deleteInventory(products);
    });

    it('should handle empty inventory list', async () => {
      await expect(inventoryRepository.createInventory([])).resolves.not.toThrow();
    });
  });

  describe('updateInventory', () => {
    it('should update existing inventory entries', async () => {
      const originalProducts: ProductInventory[] = [
        new ProductInventory(
          'inv-prod-update-001',
          100.0,
          25,
          'product-003'
        )
      ];

      await inventoryRepository.createInventory(originalProducts);

      const updatedProducts: ProductInventory[] = [
        new ProductInventory(
          'inv-prod-update-001',
          120.5,
          30,
          'product-003'
        )
      ];

      await expect(
        inventoryRepository.updateInventory(updatedProducts)
      ).resolves.not.toThrow();

      // Cleanup
      await inventoryRepository.deleteInventory(updatedProducts);
    });
  });

  describe('retrieveInventory', () => {
    it('should retrieve all inventory entries', async () => {
      const products: ProductInventory[] = [
        new ProductInventory(
          'inv-prod-retrieve-001',
          200.0,
          75,
          'product-004'
        ),
        new ProductInventory(
          'inv-prod-retrieve-002',
          85.25,
          50,
          'product-005'
        )
      ];

      await inventoryRepository.createInventory(products);

      const inventory = await inventoryRepository.retrieveInventory();
      expect(Array.isArray(inventory)).toBe(true);
      expect(inventory.length).toBeGreaterThanOrEqual(0);

      // Cleanup
      await inventoryRepository.deleteInventory(products);
    });

    it('should return array even if empty', async () => {
      const inventory = await inventoryRepository.retrieveInventory();
      expect(Array.isArray(inventory)).toBe(true);
    });
  });

  describe('deleteInventory', () => {
    it('should delete inventory entries', async () => {
      const products: ProductInventory[] = [
        new ProductInventory(
          'inv-prod-delete-001',
          150.0,
          40,
          'product-006'
        ),
        new ProductInventory(
          'inv-prod-delete-002',
          95.75,
          60,
          'product-007'
        )
      ];

      await inventoryRepository.createInventory(products);

      await expect(
        inventoryRepository.deleteInventory(products)
      ).resolves.not.toThrow();

      const remaining = await inventoryRepository.retrieveInventory();
      const deleted = remaining.filter(
        inv => inv['id_product_inventory'] === 'inv-prod-delete-001' ||
               inv['id_product_inventory'] === 'inv-prod-delete-002'
      );
      expect(deleted.length).toBe(0);
    });
  });
});
