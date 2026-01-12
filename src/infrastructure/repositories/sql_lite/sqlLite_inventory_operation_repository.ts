// Database
import { createSQLiteConnection } from './SQLite';
import EMBEDDED_TABLES from '@/utils/embeddedTables';

// Interfaces
import { IInventoryOperation } from '@/src/core/interfaces/InventoryOperationRepository';

// Entities
import { InventoryOperation } from '@/src/core/entities/InventoryOperation';

// Object values
import { InventoryOperationDescription } from '@/src/core/object-values/InventoryOperationDescription';

export class sqlLite_inventory_operation_repository implements IInventoryOperation {
    async createInventoryOperation(inventory_operation: InventoryOperation): Promise<void> {
          try {
            const {
                id_inventory_operation,
                sign_confirmation,
                date,
                state,
                audit,
                id_inventory_operation_type,
                id_work_day,
            } = inventory_operation;

            const sqlite = await createSQLiteConnection();

            await sqlite.withExclusiveTransactionAsync(async (tx) => {
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
                date,
                state,
                audit,
                id_inventory_operation_type,
                id_work_day,
                ]);
            });

            sqlite.closeSync();
        } catch(error) {
            throw new Error('Failed to create inventory operation.');
        }
    }
    
    async updateInventoryOperation(inventoryOperation: InventoryOperation): Promise<void> {
        try {
            const {
                id_inventory_operation,
                sign_confirmation,
                date,
                audit,
                state,
                id_inventory_operation_type,
                id_work_day,
                } = inventoryOperation;

            const sqlite = await createSQLiteConnection();

            await sqlite.withExclusiveTransactionAsync(async (tx) => {
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
                date,
                audit,
                state,
                id_inventory_operation_type,
                id_work_day,
                id_inventory_operation,
                ]);
            });
            sqlite.closeSync();
        } catch(error) {
            throw new Error('Failed to update inventory operation.');
        }
    }

    async listInventoryOperations(): Promise<InventoryOperation[]> {
        try {
            const inventoryOperations:InventoryOperation[] = [];

            const sqlite = await createSQLiteConnection();
            const statement = await sqlite.prepareAsync(`SELECT * FROM ${EMBEDDED_TABLES.INVENTORY_OPERATIONS};`);
            const result = statement.executeSync<InventoryOperation>();
            
            sqlite.closeSync();

            for(let row of result) {
                inventoryOperations.push(row);
            }
            
            // const inventoryOperationDescriptions:InventoryOperationDescription[] = await this.getInventoryOperationDescription(inventoryOperations);
            

            return inventoryOperations;
        } catch (error) {
            return []
        }
    }

    async retrieveInventoryOperations(id_inventory_operation: string[]): Promise<InventoryOperation[]> {
        try {
            const inventoryOperations: InventoryOperation[] = [];

            const sqlite = await createSQLiteConnection();
            const statement = await sqlite.prepareAsync(`SELECT * FROM ${EMBEDDED_TABLES.INVENTORY_OPERATIONS} WHERE id_inventory_operation IN(${id_inventory_operation.map(id => `'${id}'`).join(', ')});`);
            const result = statement.executeSync<InventoryOperation>();

            for (let row of result) {
                inventoryOperations.push(row);
            }

            sqlite.closeSync();
            
            // const inventoryOperationDescriptions:InventoryOperationDescription[] = await this.getInventoryOperationDescription(inventoryOperations);    

            return inventoryOperations;
        } catch (error) {
            return [];
        }
    }

    // private mergeInventoryOperationWithDescriptions(inventoryOperations: InventoryOperation[], inventoryOperationDescriptions: InventoryOperationDescription[]): InventoryOperation[] {
    //     const inventoryOperationsWithDescriptions:InventoryOperation[] = inventoryOperations.map(inventoryOperation => {
    //         const descriptions = inventoryOperationDescriptions.filter(description => description.id_inventory_operation === inventoryOperation.id_inventory_operation);
    //         const mapDescriptions = new Map<string, InventoryOperationDescription>();

    //         descriptions.forEach(description => {
    //             mapDescriptions.set(description.id_product, description);
    //         });

    //         return {
    //             ...inventoryOperation,
    //             descriptions: mapDescriptions
    //         };
    //     });

    //     return inventoryOperationsWithDescriptions;
    // }

    async retrieveInventoryOperationDescription(inventoryOperations:InventoryOperation[]):Promise<InventoryOperationDescription[]> {
        try {
            const inventoryOperationsDescriptions:InventoryOperationDescription[] = [];

            const sqlite = await createSQLiteConnection();
            const statement = await sqlite.prepareAsync(`SELECT * 
                FROM ${EMBEDDED_TABLES.PRODUCT_OPERATION_DESCRIPTIONS} 
                WHERE id_inventory_operation IN(${inventoryOperations.map(op => `'${op.id_inventory_operation}'`).join(', ')});`);
            
            const result = statement.executeSync<InventoryOperationDescription>();

            for(let row of result) {
                inventoryOperationsDescriptions.push(row);
            }

            sqlite.closeSync();

            return inventoryOperationsDescriptions;

        } catch(error) {
            return []
        }
    }
 
    async deleteInventoryOperations(inventory_operations: InventoryOperation[]): Promise<void> {
        try {
            const sqlite = await createSQLiteConnection();
            await sqlite.withExclusiveTransactionAsync(async (tx) => {
                for (const operation of inventory_operations) {
                    await tx.runAsync(`DELETE FROM ${EMBEDDED_TABLES.PRODUCT_OPERATION_DESCRIPTIONS} WHERE id_inventory_operation = ?;`, [operation.id_inventory_operation]);
                    await tx.runAsync(`DELETE FROM ${EMBEDDED_TABLES.INVENTORY_OPERATIONS} WHERE id_inventory_operation = ?;`, [operation.id_inventory_operation]);
                }
            });

            sqlite.closeSync();

        } catch(error) {
            throw new Error('Failed to delete inventory operations.');
        }
    }
}
