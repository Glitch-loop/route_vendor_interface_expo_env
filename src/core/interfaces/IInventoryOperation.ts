import { InventoryOperation } from '../entities/InventoryOperation';

export abstract class IInventoryOperation {
  abstract createInventoryOperation(inventory_operation: InventoryOperation): void;
  abstract updateInventoryOperation(inventory_operation: InventoryOperation): void;
  abstract retrieveInventoryOperations(): InventoryOperation[];
  abstract listInventoryOperations(): InventoryOperation[];
  abstract deleteInventoryOperations(inventory_operations: InventoryOperation[]): void;
}