import { container } from '@/src/infrastructure/di/container';
import { SQLiteDataSource } from '@/src/infrastructure/datasources/SQLiteDataSource';
import { SQLiteInventoryOperationRepository } from '@/src/infrastructure/repositories/SQLite/SQLiteInventoryOperationRepository';
import { InventoryOperation } from '@/src/core/entities/InventoryOperation';
import { InventoryOperationDescription } from '@/src/core/object-values/InventoryOperationDescription';
import { TOKENS } from '@/src/infrastructure/di/tokens';
import EMBEDDED_TABLES from '@/src/infrastructure/database/embeddedTables';

// Enable decorators metadata required by tsyringe
import 'reflect-metadata';


describe('SQLiteInventoryOperationRepository', () => {
  let inventoryOperationRepository: SQLiteInventoryOperationRepository;
  let dataSource: SQLiteDataSource;

  beforeAll(async () => {
    dataSource = container.resolve<SQLiteDataSource>(TOKENS.SQLiteDataSource);
    await dataSource.initialize();
    const db = dataSource.getClient();
    await db.execAsync(`
      DROP TABLE IF EXISTS ${EMBEDDED_TABLES.INVENTORY_OPERATIONS};
      CREATE TABLE IF NOT EXISTS ${EMBEDDED_TABLES.INVENTORY_OPERATIONS} (
        id_inventory_operation      TEXT NOT NULL UNIQUE,
        sign_confirmation           TEXT NOT NULL,
        date                        DATETIME NOT NULL,
        state                       INT NOT NULL,
        audit                       INT NOT NULL,
        id_inventory_operation_type TEXT NOT NULL,
        id_work_day                 TEXT NOT NULL
      );
      DROP TABLE IF EXISTS ${EMBEDDED_TABLES.PRODUCT_OPERATION_DESCRIPTIONS};
      CREATE TABLE IF NOT EXISTS ${EMBEDDED_TABLES.PRODUCT_OPERATION_DESCRIPTIONS} (
        id_product_description  TEXT NOT NULL UNIQUE,
        price_at_moment         NUMERIC(6,3) NOT NULL,
        amount                  INT NOT NULL,
        created_at              DATETIME NOT NULL,
        id_inventory_operation  TEXT NOT NULL,
        id_product              TEXT NOT NULL
      );
    `);
    inventoryOperationRepository = container.resolve<SQLiteInventoryOperationRepository>(
      TOKENS.SQLiteInventoryOperationRepository
    );
  });

  describe('createInventoryOperation', () => {
    it('should create an inventory operation with descriptions', async () => {
      const descriptions: InventoryOperationDescription[] = [
        new InventoryOperationDescription(
          'desc-inv-001',
          100.0,
          2,
          new Date(),
          'inv-op-001',
          'product-001'
        ),
        new InventoryOperationDescription(
          'desc-inv-002',
          50.0,
          1,
          new Date(),
          'inv-op-001',
          'product-002'
        )
      ];

      const inventoryOperation = new InventoryOperation(
        'inv-op-001',
        'sign-001',
        new Date(),
        0,
        0,
        'type-001',
        'work-day-001',
        descriptions
      );

      await expect(
        inventoryOperationRepository.createInventoryOperation(inventoryOperation)
      ).resolves.not.toThrow();

      // Cleanup
      await inventoryOperationRepository.deleteInventoryOperations([inventoryOperation]);
    });
  });

  describe('updateInventoryOperation', () => {
    it('should update an existing inventory operation', async () => {
      const descriptions: InventoryOperationDescription[] = [
        new InventoryOperationDescription(
          'desc-inv-update-001',
          75.0,
          1,
          new Date(),
          'inv-op-update-001',
          'product-003'
        )
      ];

      const inventoryOperation = new InventoryOperation(
        'inv-op-update-001',
        'sign-002',
        new Date(),
        0,
        0,
        'type-002',
        'work-day-002',
        descriptions
      );

      await inventoryOperationRepository.createInventoryOperation(inventoryOperation);

      const updatedOperation = new InventoryOperation(
        'inv-op-update-001',
        'sign-002-updated',
        new Date(),
        1,
        0,
        'type-002',
        'work-day-002',
        descriptions
      );

      await expect(
        inventoryOperationRepository.updateInventoryOperation(updatedOperation)
      ).resolves.not.toThrow();

      // Cleanup
      await inventoryOperationRepository.deleteInventoryOperations([updatedOperation]);
    });
  });

  describe('retrieveInventoryOperation', () => {
    it('should retrieve inventory operations by ID', async () => {
      const descriptions: InventoryOperationDescription[] = [
        new InventoryOperationDescription(
          'desc-inv-retrieve-001',
          150.0,
          3,
          new Date(),
          'inv-op-retrieve-001',
          'product-004'
        )
      ];

      const inventoryOperation = new InventoryOperation(
        'inv-op-retrieve-001',
        'sign-003',
        new Date(),
        0,
        0,
        'type-003',
        'work-day-003',
        descriptions
      );

      await inventoryOperationRepository.createInventoryOperation(inventoryOperation);

      const retrieved = await inventoryOperationRepository.retrieveInventoryOperations(['inv-op-retrieve-001']);
      expect(Array.isArray(retrieved)).toBe(true);
      expect(retrieved.length).toBeGreaterThan(0);

      await inventoryOperationRepository.deleteInventoryOperations([inventoryOperation]);
    });
  });

  describe('listInventoryOperations', () => {
    it('should list all inventory operations', async () => {
      const operations = await inventoryOperationRepository.listInventoryOperations();
      expect(Array.isArray(operations)).toBe(true);
    });
  });

  describe('deleteInventoryOperations', () => {
    it('should delete inventory operations', async () => {
      const descriptions: InventoryOperationDescription[] = [
        new InventoryOperationDescription(
          'desc-inv-delete-001',
          200.0,
          2,
          new Date(),
          'inv-op-delete-001',
          'product-005'
        )
      ];

      const inventoryOperation = new InventoryOperation(
        'inv-op-delete-001',
        'sign-004',
        new Date(),
        0,
        0,
        'type-004',
        'work-day-004',
        descriptions
      );

      await inventoryOperationRepository.createInventoryOperation(inventoryOperation);

      await expect(
        inventoryOperationRepository.deleteInventoryOperations([inventoryOperation])
      ).resolves.not.toThrow();

      const remaining = await inventoryOperationRepository.retrieveInventoryOperations(['inv-op-delete-001']);
      expect(remaining.length).toBe(0);
    });
  });
});
