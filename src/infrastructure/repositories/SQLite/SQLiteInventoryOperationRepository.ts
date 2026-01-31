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

// Utils
import EMBEDDED_TABLES from "@/src/infrastructure/database/embeddedTables";
import { TOKENS } from '@/src/infrastructure/di/tokens';

@injectable()
export class SQLiteInventoryOperationRepository implements InventoryOperationRepository {
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
                    id_work_day = ?
                    WHERE id_inventory_operation = ?;`, 
                [
                    sign_confirmation,
                    date.toISOString(),
                    audit,
                    state,
                    id_inventory_operation_type,
                    id_work_day,
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
        const inventoryOperations:InventoryOperation[] = [];

        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = await this.dataSource.getClient();

            const statement = await db.prepareAsync(`SELECT * FROM ${EMBEDDED_TABLES.INVENTORY_OPERATIONS};`);
            const result = statement.executeSync<InventoryOperation>();
            
            for(let row of result) {
                const newInventoryOperation = new InventoryOperation(
                    row.id_inventory_operation,
                    row.sign_confirmation,
                    new Date(row.date),
                    row.state,
                    row.audit,
                    row.id_inventory_operation_type,
                    row.id_work_day,
                    await this.retrieveInventoryOperationDescription(inventoryOperations) // Descriptions will be filled later
                )
                inventoryOperations.push(newInventoryOperation);
            }
            
            return inventoryOperations;
        } catch (error) {
            throw new Error('Failed to list inventory operations: ' + error);
        }
    }

    async retrieveInventoryOperations(id_inventory_operation: string[]): Promise<InventoryOperation[]> {
        const inventoryOperations: InventoryOperation[] = [];
        
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
                    await this.retrieveInventoryOperationDescription(inventoryOperations) // Descriptions will be filled later
                )

                inventoryOperations.push(newInventoryOperation);
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
                inventoryOperationsDescriptions.push(row);
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
}
