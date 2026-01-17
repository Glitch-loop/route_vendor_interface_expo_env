import { container } from '@/src/infrastructure/di/container';
import { SQLiteDataSource } from '@/src/infrastructure/datasources/SQLiteDataSource';
import { SQLiteStoreRepository } from '@/src/infrastructure/repositories/SQLite/SQLiteStoreRepository';
import { Store } from '@/src/core/entities/Store';
import { TOKENS } from '@/src/infrastructure/di/tokens';
import EMBEDDED_TABLES from '@/src/infrastructure/database/embeddedTables';

// Enable decorators metadata required by tsyringe
import 'reflect-metadata';

describe('SQLiteStoreRepository', () => {
  let storeRepository: SQLiteStoreRepository;
  let dataSource: SQLiteDataSource;

  beforeAll(async () => {
    dataSource = container.resolve<SQLiteDataSource>(TOKENS.SQLiteDataSource);
    await dataSource.initialize();
    const db = dataSource.getClient();
    // Minimal schema for Stores used by repository
    await db.execAsync(`
      DROP TABLE IF EXISTS ${EMBEDDED_TABLES.STORES};
      CREATE TABLE IF NOT EXISTS ${EMBEDDED_TABLES.STORES} (
        id_store          TEXT NOT NULL UNIQUE,
        street            TEXT NOT NULL,
        ext_number        TEXT NOT NULL,
        colony            TEXT NOT NULL,
        postal_code       TEXT NOT NULL,
        address_reference TEXT NULL,
        store_name        TEXT NOT NULL,
        owner_name        TEXT,
        cellphone         TEXT,
        latitude          TEXT,
        longitude         TEXT,
        id_creator        TEXT,
        creation_date     TEXT,
        creation_context  TEXT,
        status_store      INT
      );
    `);
    storeRepository = container.resolve<SQLiteStoreRepository>(TOKENS.SQLiteStoreRepository);
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  describe('insertStores', () => {
    it('should insert stores successfully', async () => {
      const testStores: Store[] = [
        new Store(
          'store-test-001',
          'Main Street',
          '123',
          'Downtown',
          '12345',
          'Near City Hall',
          'Test Store 1',
          'John Doe',
          '+5215551234567',
          '19.432608',
          '-99.133209',
          'vendor-001',
          new Date().toISOString(),
          'test-context',
          1
        ),
        new Store(
          'store-test-002',
          'Oak Avenue',
          '456',
          'Suburb',
          '67890',
          'Near Park',
          'Test Store 2',
          'Jane Smith',
          '+5215559876543',
          '19.500000',
          '-99.200000',
          'vendor-002',
          new Date().toISOString(),
          'test-context',
          1
        )
      ];

      await expect(storeRepository.insertStores(testStores)).resolves.not.toThrow();

      // Verify insertion by retrieving
      const retrievedStores = await storeRepository.listStores();
      expect(retrievedStores.length).toBeGreaterThanOrEqual(2);

      // Cleanup
      await storeRepository.deleteStores(testStores);
    });

    it('should handle empty store list', async () => {
      await expect(storeRepository.insertStores([])).resolves.not.toThrow();
    });
  });

  describe('updateStore', () => {
    it('should update an existing store', async () => {
      const originalStore = new Store(
        'store-update-test',
        'Old Street',
        '111',
        'Old Town',
        '11111',
        'Old Location',
        'Original Store Name',
        'Original Owner',
        '+5215551111111',
        '19.000000',
        '-99.000000',
        'vendor-003',
        new Date().toISOString(),
        'test-context',
        1
      );

      // Insert original
      await storeRepository.insertStores([originalStore]);

      // Update
      const updatedStore = new Store(
        'store-update-test',
        'New Street',
        '222',
        'New Town',
        '22222',
        'New Location',
        'Updated Store Name',
        'Updated Owner',
        '+5215552222222',
        '19.500000',
        '-99.500000',
        'vendor-003',
        new Date().toISOString(),
        'test-context',
        2
      );

      await expect(storeRepository.updateStore(updatedStore)).resolves.not.toThrow();

      // Cleanup
      await storeRepository.deleteStores([updatedStore]);
    });
  });

  describe('retrieveStore', () => {
    it('should retrieve stores by ID list', async () => {
      const testStore = new Store(
        'store-retrieve-test',
        'Retrieve Street',
        '333',
        'Retrieve Town',
        '33333',
        'Retrieve Location',
        'Retrieve Test Store',
        'Retrieve Owner',
        '+5215553333333',
        '19.333333',
        '-99.333333',
        'vendor-004',
        new Date().toISOString(),
        'test-context',
        1
      );

      await storeRepository.insertStores([testStore]);

      const retrieved = await storeRepository.retrieveStore(['store-retrieve-test']);
      expect(retrieved).toBeDefined();
      expect(retrieved.length).toBeGreaterThan(0);

      await storeRepository.deleteStores([testStore]);
    });

    it('should return empty array for non-existent IDs', async () => {
      const result = await storeRepository.retrieveStore(['non-existent-id']);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('listStores', () => {
    it('should list all stores', async () => {
      const stores = await storeRepository.listStores();
      expect(Array.isArray(stores)).toBe(true);
    });
  });

  describe('deleteStores', () => {
    it('should delete stores successfully', async () => {
      const testStore = new Store(
        'store-delete-test',
        'Delete Street',
        '444',
        'Delete Town',
        '44444',
        'Delete Location',
        'Delete Test Store',
        'Delete Owner',
        '+5215554444444',
        '19.444444',
        '-99.444444',
        'vendor-005',
        new Date().toISOString(),
        'test-context',
        1
      );

      await storeRepository.insertStores([testStore]);
      await expect(storeRepository.deleteStores([testStore])).resolves.not.toThrow();

      const remaining = await storeRepository.retrieveStore(['store-delete-test']);
      expect(remaining.length).toBe(0);
    });
  });
});
