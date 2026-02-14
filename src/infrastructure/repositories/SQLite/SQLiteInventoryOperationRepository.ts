// Libraries
import { injectable, inject } from 'tsyringe';
import { SQLiteDatabase } from 'expo-sqlite';

// Interfaces
import { InventoryOperationRepository } from '@/src/core/interfaces/InventoryOperationRepository';

// Entities
import { InventoryOperation } from '@/src/core/entities/InventoryOperation';

// Object values
import { InventoryOperationDescription } from '@/src/core/object-values/InventoryOperationDescription';

// DataSources
import { SQLiteDataSource } from '@/src/infrastructure/datasources/SQLiteDataSource';

// Models
import InventoryOperationModel from '@/src/infrastructure/persitence/model/InventoryOperationModel';
import InventoryOperationDescriptionModel from '@/src/infrastructure/persitence/model/InventoryOperationDescriptionModel';

// Utils
import EMBEDDED_TABLES from "@/src/infrastructure/database/embeddedTables";
import { TOKENS } from '@/src/infrastructure/di/tokens';
import { SyncInventoryOperationRepository } from '@/src/infrastructure/persitence/interface/local-database/SyncInventoryOperationRepository';

@injectable()
export class SQLiteInventoryOperationRepository implements InventoryOperationRepository, SyncInventoryOperationRepository {
    constructor(@inject(TOKENS.SQLiteDataSource) private readonly dataSource: SQLiteDataSource) { }

    async createInventoryOperation(inventory_operation: InventoryOperation): Promise<void> {
        const {
            id_inventory_operation,
            sign_confirmation,
            date,
            state,
            audit,
            id_inventory_operation_type,
            id_work_day,
        } = inventory_operation;

        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = await this.dataSource.getClient();
            await db.withExclusiveTransactionAsync(async (tx) => {
                // Insert InventoryOperation
                await tx.runAsync(`
                    INSERT INTO ${EMBEDDED_TABLES.INVENTORY_OPERATIONS} 
                        (id_inventory_operation, 
                        sign_confirmation, 
                        date, 
                        state, 
                        audit, 
                        id_inventory_operation_type, 
                        id_work_day) 
                        VALUES (?, ?, ?, ?, ?, ?, ?);
                `, [
                    id_inventory_operation,
                    sign_confirmation,
                    date.toISOString(),
                    state,
                    audit,
                    id_inventory_operation_type,
                    id_work_day,
                ]);

                // Insert InventoryOperationDescriptions
                for (const desc of inventory_operation.inventory_operation_descriptions) {
                    console.log("Inserting description: ");
                    await tx.runAsync(`
                        INSERT INTO ${EMBEDDED_TABLES.PRODUCT_OPERATION_DESCRIPTIONS}
                            (id_inventory_operation_description,
                            price_at_moment, 
                            amount, 
                            created_at, 
                            id_inventory_operation, 
                            id_product)
                            VALUES (?, ?, ?, ?, ?, ?);
                    `, [
                        desc.id_inventory_operation_description,
                        desc.price_at_moment,
                        desc.amount,
                        desc.created_at.toISOString(),
                        desc.id_inventory_operation,
                        desc.id_product
                    ]);
                }
            });
            
        } catch(error) {
            console.error('Error in createInventoryOperation:', error);
            throw new Error('Failed to create inventory operation: ' + error);
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
            
        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = await this.dataSource.getClient();
            await db.withExclusiveTransactionAsync(async (tx) => {
                await tx.runAsync(`
                    UPDATE ${EMBEDDED_TABLES.INVENTORY_OPERATIONS}  SET 
                    sign_confirmation = ?, 
                    date = ?, 
                    audit = ?,
                    state = ?, 
                    id_inventory_operation_type = ?, 
                    id_work_day = ?,
                    is_synced = ?,
                    updated_at = ?
                    WHERE id_inventory_operation = ?;`, 
                [
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

                // Update InventoryOperationDescriptions
                // For simplicity, delete all and re-insert
                await tx.runAsync(`
                    DELETE FROM ${EMBEDDED_TABLES.PRODUCT_OPERATION_DESCRIPTIONS} WHERE id_inventory_operation = ?;
                `, [id_inventory_operation]);

                for (const desc of inventoryOperation.inventory_operation_descriptions) {
                    await tx.runAsync(`
                        INSERT INTO ${EMBEDDED_TABLES.PRODUCT_OPERATION_DESCRIPTIONS}
                            (id_inventory_operation_description, price_at_moment, amount, created_at, id_inventory_operation, id_product)
                            VALUES (?, ?, ?, ?, ?, ?);
                    `, [
                        desc.id_inventory_operation_description,
                        desc.price_at_moment,
                        desc.amount,
                        desc.created_at.toISOString(),
                        desc.id_inventory_operation,
                        desc.id_product
                    ]);
                }
            });
        } catch(error) {
            throw new Error('Failed to update inventory operation: ' + error);
        }
    }

    async listInventoryOperations(): Promise<InventoryOperation[]> {
        const inventoryOperationsTemp:InventoryOperation[] = [];
        const inventoryOperations:InventoryOperation[] = [];

        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = await this.dataSource.getClient();

            const statement = await db.prepareAsync(`SELECT * FROM ${EMBEDDED_TABLES.INVENTORY_OPERATIONS};`);
            const result = statement.executeSync<InventoryOperation>();
            
            // Retrieve inventory operations
            for(let row of result) {
                const inventoryOperation = new InventoryOperation(
                    row.id_inventory_operation,
                    row.sign_confirmation,
                    new Date(row.date),
                    row.state,
                    row.audit,
                    row.id_inventory_operation_type,
                    row.id_work_day,
                    [] // Descriptions will be filled later
                )
                inventoryOperationsTemp.push(inventoryOperation);
            }
            

            // Retrieve descriptions for each inventory operation and fill them in the corresponding operation
            for (const operation of inventoryOperationsTemp) {
                const inventoryOperation = new InventoryOperation(
                    operation.id_inventory_operation,
                    operation.sign_confirmation,
                    new Date(operation.date),
                    operation.state,
                    operation.audit,
                    operation.id_inventory_operation_type,
                    operation.id_work_day,
                    await this.retrieveInventoryOperationDescription([operation])
                )
                inventoryOperations.push(inventoryOperation);
            }


            return inventoryOperations;
        } catch (error) {
            throw new Error('Failed to list inventory operations: ' + error);
        }
    }

    async retrieveInventoryOperations(id_inventory_operation: string[]): Promise<InventoryOperation[]> {
        const inventoryOperations: InventoryOperation[] = [];
        const inventoryOperationsTemp:InventoryOperation[] = [];

        try {
            await this.dataSource.initialize();
            const db:SQLiteDatabase = this.dataSource.getClient();

            const statement = await db.prepareAsync(`SELECT * FROM ${EMBEDDED_TABLES.INVENTORY_OPERATIONS} WHERE id_inventory_operation IN(${id_inventory_operation.map(id => `'${id}'`).join(', ')});`);
            const result = statement.executeSync<InventoryOperation>();

            for (let row of result) {
                const newInventoryOperation = new InventoryOperation(
                    row.id_inventory_operation,
                    row.sign_confirmation,
                    new Date(row.date),
                    row.state,
                    row.audit,
                    row.id_inventory_operation_type,
                    row.id_work_day,
                    [] // Descriptions will be filled later
                )

                inventoryOperationsTemp.push(newInventoryOperation);

            }
            
            for (const operation of inventoryOperationsTemp) {
                const inventoryOperation = new InventoryOperation(
                    operation.id_inventory_operation,
                    operation.sign_confirmation,
                    new Date(operation.date),
                    operation.state,
                    operation.audit,
                    operation.id_inventory_operation_type,
                    operation.id_work_day,
                    await this.retrieveInventoryOperationDescription([operation])
                )
                inventoryOperations.push(inventoryOperation);
            }

            return inventoryOperations;
        } catch (error) {
            throw new Error('Failed to retrieve inventory operations: ' + error);
        }
    }

    async retrieveInventoryOperationDescription(inventoryOperations:InventoryOperation[]):Promise<InventoryOperationDescription[]> {
        try {
            await this.dataSource.initialize();
            const inventoryOperationsDescriptions:InventoryOperationDescription[] = [];
            
            const db:SQLiteDatabase = this.dataSource.getClient();
            const statement = await db.prepareAsync(`SELECT * 
                FROM ${EMBEDDED_TABLES.PRODUCT_OPERATION_DESCRIPTIONS} 
                WHERE id_inventory_operation IN(${inventoryOperations.map(op => `'${op.id_inventory_operation}'`).join(', ')});`);
            
            const result = statement.executeSync<InventoryOperationDescription>();

            for(let row of result) {
                const description = new InventoryOperationDescription(
                    row.id_inventory_operation_description,
                    row.price_at_moment,
                    row.amount,
                    new Date(row.created_at),
                    row.id_inventory_operation,
                    row.id_product
                )
                inventoryOperationsDescriptions.push(description);
            }

            return inventoryOperationsDescriptions;

        } catch(error) {
            throw new Error('Failed to retrieve inventory operation descriptions: ' + error);
        }
    }
 
    async deleteInventoryOperations(inventory_operations: InventoryOperation[]): Promise<void> {
        try {
            await this.dataSource.initialize();
            const db:SQLiteDatabase = this.dataSource.getClient();

            await db.withExclusiveTransactionAsync(async (tx) => {
                for (const operation of inventory_operations) {
                    await tx.runAsync(`DELETE FROM ${EMBEDDED_TABLES.PRODUCT_OPERATION_DESCRIPTIONS} WHERE id_inventory_operation = ?;`, [operation.id_inventory_operation]);
                    await tx.runAsync(`DELETE FROM ${EMBEDDED_TABLES.INVENTORY_OPERATIONS} WHERE id_inventory_operation = ?;`, [operation.id_inventory_operation]);
                }
            });

        } catch(error) {
            throw new Error('Failed to delete inventory operations: ' + error);
        }
    }

    async listPendingInventoryOperationToSync(): Promise<InventoryOperationModel[]> {
        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = await this.dataSource.getClient();
            const pending: InventoryOperationModel[] = [];
            const stmt = await db.prepareAsync(`SELECT * FROM ${EMBEDDED_TABLES.INVENTORY_OPERATIONS} WHERE is_synced = 0 OR is_deleted = 1;`);
            const rows = stmt.executeSync<any>();
            for (const row of rows) {
                pending.push(row as InventoryOperationModel);
            }
            return pending;
        } catch (error) {
            throw new Error('Failed to list pending inventory operations to sync: ' + error);
        }
    }

    async listPendingInventoryOperationDescriptionToSync(): Promise<InventoryOperationDescriptionModel[]> {
        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = await this.dataSource.getClient();
            const pending: InventoryOperationDescriptionModel[] = [];
            const stmt = await db.prepareAsync(`SELECT * FROM ${EMBEDDED_TABLES.PRODUCT_OPERATION_DESCRIPTIONS} WHERE is_synced = 0 OR is_deleted = 1;`);
            const rows = stmt.executeSync<any>();
            for (const row of rows) {
                pending.push(row as InventoryOperationDescriptionModel);
            }
            return pending;
        } catch (error) {
            throw new Error('Failed to list pending inventory operation descriptions to sync: ' + error);
        }
    }

    async markInventoryOperationsAsSynced(ids: string[]): Promise<void> {
        if (!ids || ids.length === 0) return;
        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = await this.dataSource.getClient();
            await db.withExclusiveTransactionAsync(async (tx) => {
                const placeholders = ids.map(() => '?').join(',');
                await tx.runAsync(
                    `UPDATE ${EMBEDDED_TABLES.INVENTORY_OPERATIONS} SET is_synced = 1 WHERE id_inventory_operation IN (${placeholders});`,
                    ids
                );
            });
        } catch (error) {
            throw new Error('Failed to mark inventory operations as synced: ' + error);
        }
    }

    async markInventoryOperationDescriptionsAsSynced(ids: string[]): Promise<void> {
        if (!ids || ids.length === 0) return;
        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = await this.dataSource.getClient();
            await db.withExclusiveTransactionAsync(async (tx) => {
                const placeholders = ids.map(() => '?').join(',');
                await tx.runAsync(
                    `UPDATE ${EMBEDDED_TABLES.PRODUCT_OPERATION_DESCRIPTIONS} SET is_synced = 1 WHERE id_inventory_operation_description IN (${placeholders});`,
                    ids
                );
            });
        } catch (error) {
            throw new Error('Failed to mark inventory operation descriptions as synced: ' + error);
        }
    }
}
