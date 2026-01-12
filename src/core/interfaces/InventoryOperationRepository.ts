// Entities
import { InventoryOperation } from '../entities/InventoryOperation';

// Object values
import { InventoryOperationDescription } from '../object-values/InventoryOperationDescription';

export abstract class InventoryOperationRepository {
  abstract createInventoryOperation(inventory_operation: InventoryOperation): void;
  abstract updateInventoryOperation(inventory_operation: InventoryOperation): void;
  abstract listInventoryOperations(): Promise<InventoryOperation[]>; 
  abstract retrieveInventoryOperations(id_inventory_operation: string[]): Promise<InventoryOperation[]>;
  abstract retrieveInventoryOperationDescription(inventoryOperations:InventoryOperation[]): Promise<InventoryOperationDescription[]>;
  abstract deleteInventoryOperations(inventory_operations: InventoryOperation[]): void;
}