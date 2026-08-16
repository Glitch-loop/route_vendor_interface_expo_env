// Libraries
import { SQLiteDatabase } from 'expo-sqlite';

// Interfaces
import { RouteTransactionRepository } from '@/src/core/interfaces/RouteTransactionRepository';
import { SyncRouteTransactionRepository } from '@/src/infrastructure/persitence/interface/local-database/SyncRouteTransactionRepository';

// Entities
import { RouteTransaction } from '@/src/core/entities/RouteTransaction';

// Value Objects
import { RouteTransactionDescription } from '@/src/core/object-values/RouteTransactionDescription';

// Database
import EMBEDDED_TABLES from '@/src/infrastructure/database/embeddedTables';

// Models
import RouteTransactionLocalModel from '@/src/infrastructure/persitence/model/local-models/RouteTransactionLocalModel';
import RouteTransactionDescriptionLocalModel from '@/src/infrastructure/persitence/model/local-models/RouteTransactionDescriptionLocalModel';
import { SQLiteDataSource } from '@/src/infrastructure/datasources/SQLiteDataSource';
import { inject, injectable } from 'tsyringe';
import { TOKENS } from '@/src/infrastructure/di/tokens';

@injectable()
export class SQLiteRouteTransactionRepository implements RouteTransactionRepository, SyncRouteTransactionRepository {
  private readonly db: SQLiteDatabase;
  
  constructor(db: SQLiteDatabase);
  constructor(dataSource: SQLiteDataSource);
  constructor(@inject(TOKENS.SQLiteDataSource) dbOrDataSource?: SQLiteDatabase | SQLiteDataSource) {
    if (!dbOrDataSource) {
      throw new Error(
        'SQLiteDayOperationRepository requires a Database or DataSource instance.'
      );
    }

    if (
      'getClient' in dbOrDataSource &&
      typeof dbOrDataSource.getClient === 'function'
    ) {
      this.db = dbOrDataSource.getClient();
    } else {
      this.db = dbOrDataSource as SQLiteDatabase;
    }
  }

  async insertRouteTransaction(
    route_transaction: RouteTransaction,
    is_synced: boolean
  ): Promise<void> {
    const {
      id_route_transaction,
      date,
      state,
      cash_received,
      latitude,
      longitude,
      id_work_day,
      created_by,
      id_store,
      payment_method,
      transaction_description,
    } = route_transaction;

    const insertQuery = is_synced
      ? `INSERT INTO ${EMBEDDED_TABLES.ROUTE_TRANSACTIONS} (
          id_route_transaction, date, state, cash_received, latitude, longitude,
          id_work_day, created_by, id_payment_method, id_store, is_synced, is_deleted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0);`
      : `INSERT INTO ${EMBEDDED_TABLES.ROUTE_TRANSACTIONS} (
          id_route_transaction, date, state, cash_received, latitude, longitude,
          id_work_day, created_by, id_payment_method, id_store
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;

    try {
      const stmtMain = await this.db.prepareAsync(insertQuery);
      try {
        await stmtMain.executeAsync([
          id_route_transaction,
          date.toISOString(),
          state,
          cash_received,
          latitude,
          longitude,
          id_work_day,
          created_by,
          payment_method,
          id_store,
        ]);
      } finally {
        await stmtMain.finalizeAsync();
      }

      if (transaction_description && transaction_description.length > 0) {
        const stmtDesc = await this.db.prepareAsync(
          `INSERT INTO ${EMBEDDED_TABLES.ROUTE_TRANSACTION_DESCRIPTIONS} (
            id_route_transaction_description, price_at_moment, cost_at_moment,
            amount, created_at, id_product_inventory, id_transaction_operation_type,
            id_product, id_route_transaction
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`
        );
        try {
          for (const description of transaction_description) {
            await stmtDesc.executeAsync([
              description.id_route_transaction_description,
              description.price_at_moment,
              description.cost_at_moment,
              description.amount,
              description.created_at.toISOString(),
              description.id_product_inventory,
              description.id_transaction_operation_type,
              description.id_product,
              description.id_route_transaction,
            ]);
          }
        } finally {
          await stmtDesc.finalizeAsync();
        }
      }
    } catch (error) {
      throw new Error('Failed to insert route transaction', { cause: error });
    }
  }

  async updateRouteTransaction(route_transaction: RouteTransaction): Promise<void> {
    const { id_route_transaction, date, state, id_work_day, id_store, payment_method } =
      route_transaction;

    try {
      const stmt = await this.db.prepareAsync(
        `UPDATE ${EMBEDDED_TABLES.ROUTE_TRANSACTIONS} SET  
          date = ?, state = ?, id_work_day = ?, id_payment_method = ?, 
          id_store = ?, is_synced = 0, updated_at = ?
         WHERE id_route_transaction = ?;`
      );
      try {
        await stmt.executeAsync([
          date.toISOString(),
          state,
          id_work_day,
          payment_method,
          id_store,
          new Date().toISOString(),
          id_route_transaction,
        ]);
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      throw new Error('Failed to update route transaction', { cause: error });
    }
  }

  async deleteRouteTransactions(route_transactions: RouteTransaction[]): Promise<void> {
    if (!route_transactions || route_transactions.length === 0) return;

    const ids = route_transactions.map((rt) => rt.id_route_transaction);
    const placeholders = ids.map(() => '?').join(',');

    try {
      const stmtDesc = await this.db.prepareAsync(
        `DELETE FROM ${EMBEDDED_TABLES.ROUTE_TRANSACTION_DESCRIPTIONS} WHERE id_route_transaction IN (${placeholders});`
      );
      try {
        await stmtDesc.executeAsync(ids);
      } finally {
        await stmtDesc.finalizeAsync();
      }

      const stmtMain = await this.db.prepareAsync(
        `DELETE FROM ${EMBEDDED_TABLES.ROUTE_TRANSACTIONS} WHERE id_route_transaction IN (${placeholders});`
      );
      try {
        await stmtMain.executeAsync(ids);
      } finally {
        await stmtMain.finalizeAsync();
      }
    } catch (error) {
      throw new Error('Failed to delete route transactions', { cause: error });
    }
  }

  async listRouteTransactions(id_work_day?: string[]): Promise<RouteTransaction[]> {
    try {
      let query = `SELECT * FROM ${EMBEDDED_TABLES.ROUTE_TRANSACTIONS}`;
      let params: string[] = [];

      if (id_work_day && id_work_day.length > 0) {
        const placeholders = id_work_day.map(() => '?').join(',');
        query += ` WHERE id_work_day IN (${placeholders})`;
        params = id_work_day;
      }

      const stmt = await this.db.prepareAsync(query);
      let rows: any[];
      try {
        const result = await stmt.executeAsync<any>(params);
        rows = await result.getAllAsync();
      } finally {
        await stmt.finalizeAsync();
      }

      const transactions: RouteTransaction[] = [];
      for (const transaction of rows) {
        const descriptions = await this.retrieveRouteTransactionDescriptionsByIds([
          transaction.id_route_transaction,
        ]);

        transactions.push(
          new RouteTransaction(
            transaction.id_route_transaction,
            new Date(transaction.date),
            transaction.state,
            transaction.cash_received,
            transaction.id_work_day,
            transaction.id_store,
            transaction.latitude,
            transaction.longitude,
            transaction.created_by,
            transaction.id_payment_method,
            descriptions
          )
        );
      }
      return transactions;
    } catch (error) {
      throw new Error('Failed to list route transactions', { cause: error });
    }
  }

  async listRouteTransactionByStore(id_store: string): Promise<RouteTransaction[]> {
    try {
      const stmt = await this.db.prepareAsync(
        `SELECT * FROM ${EMBEDDED_TABLES.ROUTE_TRANSACTIONS} WHERE id_store = ?;`
      );

      let rows: any[];
      try {
        const result = await stmt.executeAsync<any>([id_store]);
        rows = await result.getAllAsync();
      } finally {
        await stmt.finalizeAsync();
      }

      const transactions: RouteTransaction[] = [];
      for (const transaction of rows) {
        const descriptions = await this.retrieveRouteTransactionDescriptionsByIds([
          transaction.id_route_transaction,
        ]);

        transactions.push(
          new RouteTransaction(
            transaction.id_route_transaction,
            new Date(transaction.date),
            transaction.state,
            transaction.cash_received,
            transaction.id_work_day,
            transaction.id_store,
            transaction.latitude,
            transaction.longitude,
            transaction.created_by,
            transaction.id_payment_method,
            descriptions
          )
        );
      }
      return transactions;
    } catch (error) {
      throw new Error('Failed to list route transactions by store', { cause: error });
    }
  }

  async retrieveRouteTransactionById(
    id_route_transactions: string[]
  ): Promise<RouteTransaction[]> {
    if (!id_route_transactions || id_route_transactions.length === 0) return [];

    try {
      const placeholders = id_route_transactions.map(() => '?').join(',');
      const stmt = await this.db.prepareAsync(
        `SELECT * FROM ${EMBEDDED_TABLES.ROUTE_TRANSACTIONS} WHERE id_route_transaction IN (${placeholders});`
      );

      let resultTransactions: any[];
      try {
        const result = await stmt.executeAsync<any>(id_route_transactions);
        resultTransactions = await result.getAllAsync();
      } finally {
        await stmt.finalizeAsync();
      }

      const descriptionsList = await this.retrieveRouteTransactionDescriptionsByIds(
        id_route_transactions
      );

      const descriptionsMap = new Map<string, RouteTransactionDescription[]>();
      for (const desc of descriptionsList) {
        const list = descriptionsMap.get(desc.id_route_transaction) || [];
        list.push(desc);
        descriptionsMap.set(desc.id_route_transaction, list);
      }

      return resultTransactions.map(
        (t) =>
          new RouteTransaction(
            t.id_route_transaction,
            new Date(t.date),
            t.state,
            t.cash_received,
            t.id_work_day,
            t.id_store,
            t.latitude,
            t.longitude,
            t.created_by,
            t.id_payment_method,
            descriptionsMap.get(t.id_route_transaction) || []
          )
      );
    } catch (error) {
      throw new Error('Failed to retrieve route transactions by ID', { cause: error });
    }
  }

  async listRouteTransactionDescriptions(): Promise<RouteTransactionDescription[]> {
    try {
      const stmt = await this.db.prepareAsync(
        `SELECT * FROM ${EMBEDDED_TABLES.ROUTE_TRANSACTION_DESCRIPTIONS};`
      );

      let rows: any[];
      try {
        const result = await stmt.executeAsync<any>();
        rows = await result.getAllAsync();
      } finally {
        await stmt.finalizeAsync();
      }

      return rows.map(
        (d) =>
          new RouteTransactionDescription(
            d.id_route_transaction_description,
            d.price_at_moment,
            d.cost_at_moment,
            d.amount,
            new Date(d.created_at),
            d.id_product_inventory,
            d.id_transaction_operation_type,
            d.id_product,
            d.id_route_transaction
          )
      );
    } catch (error) {
      throw new Error('Failed to list route transaction descriptions', { cause: error });
    }
  }

  async retrieveRouteTransactionDescriptionsByIds(
    ids_route_transaction: string[]
  ): Promise<RouteTransactionDescription[]> {
    if (!ids_route_transaction || ids_route_transaction.length === 0) return [];

    try {
      const placeholders = ids_route_transaction.map(() => '?').join(',');
      const stmt = await this.db.prepareAsync(
        `SELECT * FROM ${EMBEDDED_TABLES.ROUTE_TRANSACTION_DESCRIPTIONS} WHERE id_route_transaction IN (${placeholders});`
      );

      let rows: any[];
      try {
        const result = await stmt.executeAsync<any>(ids_route_transaction);
        rows = await result.getAllAsync();
      } finally {
        await stmt.finalizeAsync();
      }

      return rows.map(
        (description) =>
          new RouteTransactionDescription(
            description.id_route_transaction_description,
            description.price_at_moment,
            description.cost_at_moment,
            description.amount,
            new Date(description.created_at),
            description.id_product_inventory,
            description.id_transaction_operation_type,
            description.id_product,
            description.id_route_transaction
          )
      );
    } catch (error) {
      throw new Error('Failed to retrieve route transaction descriptions by IDs', {
        cause: error,
      });
    }
  }

  async listPendingRouteTransactionToSync(): Promise<RouteTransactionLocalModel[]> {
    try {
      const stmt = await this.db.prepareAsync(
        `SELECT * FROM ${EMBEDDED_TABLES.ROUTE_TRANSACTIONS} WHERE is_synced = 0 OR is_deleted = 1;`
      );

      let rows: any[];
      try {
        const result = await stmt.executeAsync<any>();
        rows = await result.getAllAsync();
      } finally {
        await stmt.finalizeAsync();
      }

      const routeTransactionMap = new Map<string, RouteTransactionLocalModel>();
      const idRouteTransactions: string[] = [];

      for (const row of rows) {
        const model: RouteTransactionLocalModel = {
          ...row,
          transaction_descriptions: [],
        };
        routeTransactionMap.set(model.id_route_transaction, model);
        idRouteTransactions.push(model.id_route_transaction);
      }

      const descriptions = await this.retrieveRouteTransactionDescriptionsByIds(
        idRouteTransactions
      );

      for (const desc of descriptions) {
        const transaction = routeTransactionMap.get(desc.id_route_transaction);
        if (transaction) {
          transaction.transaction_descriptions.push({
            id_route_transaction_description: desc.id_route_transaction_description,
            price_at_moment: desc.price_at_moment,
            cost_at_moment: desc.cost_at_moment,
            amount: desc.amount,
            created_at: desc.created_at,
            id_product_inventory: desc.id_product_inventory,
            id_transaction_operation_type: desc.id_transaction_operation_type,
            id_product: desc.id_product,
            id_route_transaction: desc.id_route_transaction,
          } as unknown as RouteTransactionDescriptionLocalModel);
        }
      }

      return Array.from(routeTransactionMap.values());
    } catch (error) {
      throw new Error('Failed to list pending route transactions to sync', {
        cause: error,
      });
    }
  }

  async listPendingRouteTransactionDescriptionToSync(): Promise<
    RouteTransactionDescriptionLocalModel[]
  > {
    try {
      const stmt = await this.db.prepareAsync(
        `SELECT * FROM ${EMBEDDED_TABLES.ROUTE_TRANSACTION_DESCRIPTIONS} WHERE is_synced = 0 OR is_deleted = 1;`
      );

      let rows: any[];
      try {
        const result = await stmt.executeAsync<any>();
        rows = await result.getAllAsync();
      } finally {
        await stmt.finalizeAsync();
      }

      return rows.map((row) => ({
        ...row,
        created_at: row.created_at ? new Date(row.created_at) : row.created_at,
      })) as RouteTransactionDescriptionLocalModel[];
    } catch (error) {
      throw new Error('Failed to list pending route transaction descriptions to sync', {
        cause: error,
      });
    }
  }

  async markRouteTransactionsAsSynced(
    routeTransactionSynced: RouteTransactionLocalModel[]
  ): Promise<void> {
    if (!routeTransactionSynced || routeTransactionSynced.length === 0) return;

    const ids: string[] = routeTransactionSynced.map((t) => t.id_route_transaction);
    const idsDesc: string[] = routeTransactionSynced.flatMap((t) =>
      t.transaction_descriptions.map((d) => d.id_route_transaction_description)
    );

    try {
      const placeholders = ids.map(() => '?').join(',');
      const stmt = await this.db.prepareAsync(
        `UPDATE ${EMBEDDED_TABLES.ROUTE_TRANSACTIONS} SET is_synced = 1 WHERE id_route_transaction IN (${placeholders});`
      );
      try {
        await stmt.executeAsync(ids);
      } finally {
        await stmt.finalizeAsync();
      }

      await this.markRouteTransactionDescriptionsAsSynced(idsDesc);
    } catch (error) {
      throw new Error('Failed to mark route transactions as synced', { cause: error });
    }
  }

  async markRouteTransactionDescriptionsAsSynced(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;

    try {
      const placeholders = ids.map(() => '?').join(',');
      const stmt = await this.db.prepareAsync(
        `UPDATE ${EMBEDDED_TABLES.ROUTE_TRANSACTION_DESCRIPTIONS} SET is_synced = 1 WHERE id_route_transaction_description IN (${placeholders});`
      );
      try {
        await stmt.executeAsync(ids);
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      throw new Error('Failed to mark route transaction descriptions as synced', {
        cause: error,
      });
    }
  }
}