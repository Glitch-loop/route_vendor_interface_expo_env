import { container } from '@/src/infrastructure/di/container';
import { SQLiteDataSource } from '@/src/infrastructure/datasources/SQLiteDataSource';
import { SQLiteRouteTransactionRepository } from '@/src/infrastructure/repositories/SQLite/SQLiteRouteTransaction';
import { RouteTransaction } from '@/src/core/entities/RouteTransaction';
import { PaymentMethod } from '@/src/core/object-values/PaymentMethod';
import { RouteTransactionDescription } from '@/src/core/object-values/RouteTransactionDescription';
import { RouteTransactionState } from '@/src/core/enums/RouteTransactionState';
import { RouteTransactionOperation } from '@/src/core/enums/RouteTransactionOperation';
import { TOKENS } from '@/src/infrastructure/di/tokens';
import EMBEDDED_TABLES from '@/src/infrastructure/database/embeddedTables';

// Enable decorators metadata required by tsyringe
import 'reflect-metadata';


describe('SQLiteRouteTransactionRepository', () => {
  let routeTransactionRepository: SQLiteRouteTransactionRepository;
  let dataSource: SQLiteDataSource;

  beforeAll(async () => {
    dataSource = container.resolve<SQLiteDataSource>(TOKENS.SQLiteDataSource);
    await dataSource.initialize();
    const db = dataSource.getClient();
    await db.execAsync(`
      DROP TABLE IF EXISTS ${EMBEDDED_TABLES.ROUTE_TRANSACTIONS};
      CREATE TABLE IF NOT EXISTS ${EMBEDDED_TABLES.ROUTE_TRANSACTIONS} (
        id_route_transaction    TEXT NOT NULL UNIQUE,
        date                    TEXT NOT NULL,
        state                   INT NOT NULL,
        cash_received           INT NOT NULL,
        id_work_day             TEXT NOT NULL,
        id_payment_method       TEXT NOT NULL,
        id_store                TEXT NOT NULL
      );
      DROP TABLE IF EXISTS ${EMBEDDED_TABLES.ROUTE_TRANSACTION_DESCRIPTIONS};
      CREATE TABLE IF NOT EXISTS ${EMBEDDED_TABLES.ROUTE_TRANSACTION_DESCRIPTIONS} (
        id_route_transaction_operation_description  TEXT NOT NULL UNIQUE,
        price_at_moment                             NUMERIC(6,3) NOT NULL,
        amount                                      INT NOT NULL,
        created_at                                  DATETIME NOT NULL,
        id_route_transaction_operation              TEXT NOT NULL,
        id_product                                  TEXT NOT NULL,
        id_route_transaction                        TEXT NOT NULL
      );
    `);
    routeTransactionRepository = container.resolve<SQLiteRouteTransactionRepository>(
      TOKENS.SQLiteRouteTransactionRepository
    );
  });

  describe('insertRouteTransaction', () => {
    it('should insert a route transaction with descriptions', async () => {
      const paymentMethod = new PaymentMethod('pm-001', 'Cash');
      
      const descriptions: RouteTransactionDescription[] = [
        new RouteTransactionDescription(
          'desc-001',
          100.5,
          5.0,
          2,
          RouteTransactionOperation.SALES,
          'product-001',
          'txn-001'
        ),
        new RouteTransactionDescription(
          'desc-002',
          50.25,
          2.5,
          1,
          RouteTransactionOperation.PRODUCT_REPOSITION,
          'product-002',
          'txn-001'
        )
      ];

      const transaction = new RouteTransaction(
        'txn-001',
        new Date().toISOString(),
        RouteTransactionState.ACTIVE,
        250.0,
        'work-day-001',
        'store-001',
        paymentMethod,
        descriptions
      );

      await expect(
        routeTransactionRepository.insertRouteTransaction(transaction)
      ).resolves.not.toThrow();

      // Cleanup
      await routeTransactionRepository.deleteRouteTransactions([transaction]);
    });
  });

  describe('updateRouteTransaction', () => {
    it('should update an existing route transaction', async () => {
      const paymentMethod = new PaymentMethod('pm-002', 'Card');
      
      const descriptions: RouteTransactionDescription[] = [
        new RouteTransactionDescription(
          'desc-update-001',
          75.0,
          4.0,
          1,
          RouteTransactionOperation.SALES,
          'product-003',
          'txn-update-001'
        )
      ];

      const transaction = new RouteTransaction(
        'txn-update-001',
        new Date().toISOString(),
        RouteTransactionState.ACTIVE,
        75.0,
        'work-day-002',
        'store-002',
        paymentMethod,
        descriptions
      );

      // Insert
      await routeTransactionRepository.insertRouteTransaction(transaction);

      // Update
      const updatedTransaction = new RouteTransaction(
        'txn-update-001',
        new Date().toISOString(),
        RouteTransactionState.ACTIVE,
        100.0,
        'work-day-002',
        'store-002',
        paymentMethod,
        descriptions
      );

      await expect(
        routeTransactionRepository.updateRouteTransaction(updatedTransaction)
      ).resolves.not.toThrow();

      // Cleanup
      await routeTransactionRepository.deleteRouteTransactions([updatedTransaction]);
    });
  });

  describe('retrieveRouteTransactionById', () => {
    it('should retrieve route transactions by ID', async () => {
      const paymentMethod = new PaymentMethod('pm-003', 'Check');
      
      const descriptions: RouteTransactionDescription[] = [
        new RouteTransactionDescription(
          'desc-retrieve-001',
          150.0,
          7.5,
          3,
          RouteTransactionOperation.PRODUCT_DEVOLUTION,
          'product-004',
          'txn-retrieve-001'
        )
      ];

      const transaction = new RouteTransaction(
        'txn-retrieve-001',
        new Date().toISOString(),
        RouteTransactionState.ACTIVE,
        450.0,
        'work-day-003',
        'store-003',
        paymentMethod,
        descriptions
      );

      await routeTransactionRepository.insertRouteTransaction(transaction);

      const retrieved = await routeTransactionRepository.retrieveRouteTransactionById(['txn-retrieve-001']);
      expect(Array.isArray(retrieved)).toBe(true);
      expect(retrieved.length).toBeGreaterThan(0);

      await routeTransactionRepository.deleteRouteTransactions([transaction]);
    });
  });

  describe('listRouteTransactions', () => {
    it('should list all route transactions', async () => {
      const transactions = await routeTransactionRepository.listRouteTransactions();
      expect(Array.isArray(transactions)).toBe(true);
    });
  });

  describe('deleteRouteTransactions', () => {
    it('should delete route transactions', async () => {
      const paymentMethod = new PaymentMethod('pm-004', 'Transfer');
      
      const descriptions: RouteTransactionDescription[] = [
        new RouteTransactionDescription(
          'desc-delete-001',
          200.0,
          10.0,
          2,
          RouteTransactionOperation.SALES,
          'product-005',
          'txn-delete-001'
        )
      ];

      const transaction = new RouteTransaction(
        'txn-delete-001',
        new Date().toISOString(),
        RouteTransactionState.ACTIVE,
        400.0,
        'work-day-004',
        'store-004',
        paymentMethod,
        descriptions
      );

      await routeTransactionRepository.insertRouteTransaction(transaction);
      
      await expect(
        routeTransactionRepository.deleteRouteTransactions([transaction])
      ).resolves.not.toThrow();

      const remaining = await routeTransactionRepository.retrieveRouteTransactionById(['txn-delete-001']);
      expect(remaining.length).toBe(0);
    });
  });
});
