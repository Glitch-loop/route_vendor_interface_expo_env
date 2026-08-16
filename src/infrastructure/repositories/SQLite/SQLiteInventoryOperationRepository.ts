// Libraries
import { SQLiteDatabase } from 'expo-sqlite';

// Interfaces
import { InventoryOperationRepository } from '@/src/core/interfaces/InventoryOperationRepository';
import { SyncInventoryOperationRepository } from '@/src/infrastructure/persitence/interface/local-database/SyncInventoryOperationRepository';

// Entities
import { InventoryOperation } from '@/src/core/entities/InventoryOperation';

// Object values
import { InventoryOperationDescription } from '@/src/core/object-values/InventoryOperationDescription';

// Models
import InventoryOperationLocalModel from '@/src/infrastructure/persitence/model/local-models/InventoryOperationLocalModel';
import InventoryOperationDescriptionLocalModel from '@/src/infrastructure/persitence/model/local-models/InventoryOperationDescriptionLocalModel';

// Utils
import EMBEDDED_TABLES from "@/src/infrastructure/database/embeddedTables";
import { SQLiteDataSource } from '@/src/infrastructure/datasources/SQLiteDataSource';
import { TOKENS } from '@/src/infrastructure/di/tokens';
import { inject, injectable } from 'tsyringe';

@injectable()
export class SQLiteInventoryOperationRepository 
  implements InventoryOperationRepository, SyncInventoryOperationRepository {
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

  async createInventoryOperation(inventory_operation: InventoryOperation): Promise<void> {
    const {
      id_inventory_operation,
      sign_confirmation,
      date,
      id_user,
      state,
      audit,
      id_inventory_operation_type,
      id_work_day,
    } = inventory_operation;

    const opStatement = await this.db.prepareAsync(`
      INSERT INTO ${EMBEDDED_TABLES.INVENTORY_OPERATIONS} 
        (id_inventory_operation, 
        sign_confirmation, 
        date, 
        id_user,
        state, 
        audit, 
        id_inventory_operation_type, 
        id_work_day) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `);

    const descStatement = await this.db.prepareAsync(`
      INSERT INTO ${EMBEDDED_TABLES.PRODUCT_OPERATION_DESCRIPTIONS}
        (id_inventory_operation_description,
        price_at_moment, 
        cost_at_moment, 
        amount, 
        created_at, 
        id_inventory_operation, 
        id_product)
        VALUES (?, ?, ?, ?, ?, ?, ?);
    `);

    try {
      await opStatement.executeAsync([
        id_inventory_operation,
        sign_confirmation,
        date.toISOString(),
        id_user,
        state,
        audit,
        id_inventory_operation_type,
        id_work_day,
      ]);

      for (const desc of inventory_operation.inventory_operation_descriptions) {
        await descStatement.executeAsync([
          desc.id_inventory_operation_description,
          desc.price_at_moment,
          desc.cost_at_moment,
          desc.amount,
          desc.created_at.toISOString(),
          desc.id_inventory_operation,
          desc.id_product,
        ]);
      }
    } catch (error) {
      throw new Error('Failed to create inventory operation: ' + error);
    } finally {
      await opStatement.finalizeAsync();
      await descStatement.finalizeAsync();
    }
  }

  async updateInventoryOperation(inventoryOperation: InventoryOperation): Promise<void> {
    const {
      id_inventory_operation,
      sign_confirmation,
      date,
      audit,
      state,
      id_inventory_operation_type,
      id_work_day,
    } = inventoryOperation;

    const updateOpStmt = await this.db.prepareAsync(`
      UPDATE ${EMBEDDED_TABLES.INVENTORY_OPERATIONS} SET 
        sign_confirmation = ?, 
        date = ?, 
        audit = ?,
        state = ?, 
        id_inventory_operation_type = ?, 
        id_work_day = ?,
        is_synced = ?,
        updated_at = ?
      WHERE id_inventory_operation = ?;
    `);

    const deleteDescStmt = await this.db.prepareAsync(`
      DELETE FROM ${EMBEDDED_TABLES.PRODUCT_OPERATION_DESCRIPTIONS} WHERE id_inventory_operation = ?;
    `);

    const insertDescStmt = await this.db.prepareAsync(`
      INSERT INTO ${EMBEDDED_TABLES.PRODUCT_OPERATION_DESCRIPTIONS}
        (id_inventory_operation_description, 
        price_at_moment, 
        cost_at_moment, 
        amount, 
        created_at, 
        id_inventory_operation, 
        id_product)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `);

    try {
      await updateOpStmt.executeAsync([
        sign_confirmation,
        date.toISOString(),
        audit,
        state,
        id_inventory_operation_type,
        id_work_day,
        0, // Mark as not synced
        new Date().toISOString(),
        id_inventory_operation,
      ]);

      await deleteDescStmt.executeAsync([id_inventory_operation]);

      for (const desc of inventoryOperation.inventory_operation_descriptions) {
        await insertDescStmt.executeAsync([
          desc.id_inventory_operation_description,
          desc.price_at_moment,
          desc.cost_at_moment,
          desc.amount,
          desc.created_at.toISOString(),
          desc.id_inventory_operation,
          desc.id_product,
        ]);
      }
    } catch (error) {
      throw new Error('Failed to update inventory operation: ' + error);
    } finally {
      await updateOpStmt.finalizeAsync();
      await deleteDescStmt.finalizeAsync();
      await insertDescStmt.finalizeAsync();
    }
  }

  async listInventoryOperations(): Promise<InventoryOperation[]> {
    const statement = await this.db.prepareAsync(
      `SELECT * FROM ${EMBEDDED_TABLES.INVENTORY_OPERATIONS};`
    );

    try {
      const result = await statement.executeAsync<InventoryOperationLocalModel>();
      const rows = await result.getAllAsync();

      const operations: InventoryOperation[] = [];

      for (const row of rows) {
        const descriptions = await this.retrieveInventoryOperationDescription([row.id_inventory_operation]);

        operations.push(
          new InventoryOperation(
            row.id_inventory_operation,
            row.sign_confirmation,
            new Date(row.date),
            row.id_user,
            row.state,
            row.audit,
            row.id_inventory_operation_type,
            row.id_work_day,
            descriptions
          )
        );
      }

      return operations;
    } catch (error) {
      throw new Error('Failed to list inventory operations: ' + error);
    } finally {
      await statement.finalizeAsync();
    }
  }

  async retrieveInventoryOperations(id_inventory_operation: string[]): Promise<InventoryOperation[]> {
    if (!id_inventory_operation || id_inventory_operation.length === 0) return [];

    const placeholders = id_inventory_operation.map(() => '?').join(', ');
    const statement = await this.db.prepareAsync(
      `SELECT * FROM ${EMBEDDED_TABLES.INVENTORY_OPERATIONS} WHERE id_inventory_operation IN (${placeholders});`
    );

    try {
      const result = await statement.executeAsync<InventoryOperationLocalModel>(id_inventory_operation);
      const rows = await result.getAllAsync();

      const operations: InventoryOperation[] = [];

      for (const row of rows) {
        const descriptions = await this.retrieveInventoryOperationDescription([row.id_inventory_operation]);

        operations.push(
          new InventoryOperation(
            row.id_inventory_operation,
            row.sign_confirmation,
            new Date(row.date),
            row.id_user,
            row.state,
            row.audit,
            row.id_inventory_operation_type,
            row.id_work_day,
            descriptions
          )
        );
      }

      return operations;
    } catch (error) {
      throw new Error('Failed to retrieve inventory operations: ' + error);
    } finally {
      await statement.finalizeAsync();
    }
  }

  async retrieveInventoryOperationDescription(inventoryOperationsIds: string[]): Promise<InventoryOperationDescription[]> {
    if (!inventoryOperationsIds || inventoryOperationsIds.length === 0) return [];

    const placeholders = inventoryOperationsIds.map(() => '?').join(', ');
    const statement = await this.db.prepareAsync(`
      SELECT * 
      FROM ${EMBEDDED_TABLES.PRODUCT_OPERATION_DESCRIPTIONS} 
      WHERE id_inventory_operation IN (${placeholders});
    `);

    try {
      const result = await statement.executeAsync<InventoryOperationDescriptionLocalModel>(inventoryOperationsIds);
      const rows = await result.getAllAsync();

      return rows.map(
        (row) =>
          new InventoryOperationDescription(
            row.id_inventory_operation_description,
            row.price_at_moment,
            row.cost_at_moment,
            row.amount,
            new Date(row.created_at),
            row.id_inventory_operation,
            row.id_product
          )
      );
    } catch (error) {
      throw new Error('Failed to retrieve inventory operation descriptions: ' + error);
    } finally {
      await statement.finalizeAsync();
    }
  }

  async deleteInventoryOperations(inventory_operations: InventoryOperation[]): Promise<void> {
    if (!inventory_operations || inventory_operations.length === 0) return;

    const deleteDescStmt = await this.db.prepareAsync(
      `DELETE FROM ${EMBEDDED_TABLES.PRODUCT_OPERATION_DESCRIPTIONS} WHERE id_inventory_operation = ?;`
    );
    const deleteOpStmt = await this.db.prepareAsync(
      `DELETE FROM ${EMBEDDED_TABLES.INVENTORY_OPERATIONS} WHERE id_inventory_operation = ?;`
    );

    try {
      for (const operation of inventory_operations) {
        await deleteDescStmt.executeAsync([operation.id_inventory_operation]);
        await deleteOpStmt.executeAsync([operation.id_inventory_operation]);
      }
    } catch (error) {
      throw new Error('Failed to delete inventory operations: ' + error);
    } finally {
      await deleteDescStmt.finalizeAsync();
      await deleteOpStmt.finalizeAsync();
    }
  }

  async listPendingInventoryOperationToSync(): Promise<InventoryOperationLocalModel[]> {
    const stmt = await this.db.prepareAsync(
      `SELECT * FROM ${EMBEDDED_TABLES.INVENTORY_OPERATIONS} WHERE is_synced = 0 OR is_deleted = 1;`
    );

    try {
      const result = await stmt.executeAsync<InventoryOperationLocalModel>();
      const rows = await result.getAllAsync();

      const inventoryOperationMap = new Map<string, InventoryOperationLocalModel>();
      const idInventoryOperation = new Set<string>();

      for (const row of rows) {
        inventoryOperationMap.set(row.id_inventory_operation, {
          ...row,
          inventory_operation_descriptions: [],
        });
        idInventoryOperation.add(row.id_inventory_operation);
      }

      if (idInventoryOperation.size > 0) {
        const descriptions = await this.retrieveInventoryOperationDescription(
          Array.from(idInventoryOperation)
        );

        for (const invOpDesc of descriptions) {
          const target = inventoryOperationMap.get(invOpDesc.id_inventory_operation);
          if (target) {
            target.inventory_operation_descriptions.push({
              id_inventory_operation_description: invOpDesc.id_inventory_operation_description,
              price_at_moment: invOpDesc.price_at_moment,
              cost_at_moment: invOpDesc.cost_at_moment,
              amount: invOpDesc.amount,
              created_at: invOpDesc.created_at.toISOString(),
              id_inventory_operation: invOpDesc.id_inventory_operation,
              id_product: invOpDesc.id_product,
            } as InventoryOperationDescriptionLocalModel);
          }
        }
      }

      return Array.from(inventoryOperationMap.values());
    } catch (error) {
      throw new Error('Failed to list pending inventory operations to sync: ' + error);
    } finally {
      await stmt.finalizeAsync();
    }
  }

  async listPendingInventoryOperationDescriptionToSync(): Promise<InventoryOperationDescriptionLocalModel[]> {
    const stmt = await this.db.prepareAsync(
      `SELECT * FROM ${EMBEDDED_TABLES.PRODUCT_OPERATION_DESCRIPTIONS} WHERE is_synced = 0 OR is_deleted = 1;`
    );

    try {
      const result = await stmt.executeAsync<InventoryOperationDescriptionLocalModel>();
      return await result.getAllAsync();
    } catch (error) {
      throw new Error('Failed to list pending inventory operation descriptions to sync: ' + error);
    } finally {
      await stmt.finalizeAsync();
    }
  }

  async markInventoryOperationsAsSynced(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;

    const placeholders = ids.map(() => '?').join(',');
    const statement = await this.db.prepareAsync(
      `UPDATE ${EMBEDDED_TABLES.INVENTORY_OPERATIONS} SET is_synced = 1 WHERE id_inventory_operation IN (${placeholders});`
    );

    try {
      await statement.executeAsync(ids);
    } catch (error) {
      throw new Error('Failed to mark inventory operations as synced: ' + error);
    } finally {
      await statement.finalizeAsync();
    }
  }

  async markInventoryOperationDescriptionsAsSynced(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;

    const placeholders = ids.map(() => '?').join(',');
    const statement = await this.db.prepareAsync(
      `UPDATE ${EMBEDDED_TABLES.PRODUCT_OPERATION_DESCRIPTIONS} SET is_synced = 1 WHERE id_inventory_operation_description IN (${placeholders});`
    );

    try {
      await statement.executeAsync(ids);
    } catch (error) {
      throw new Error('Failed to mark inventory operation descriptions as synced: ' + error);
    } finally {
      await statement.finalizeAsync();
    }
  }
}