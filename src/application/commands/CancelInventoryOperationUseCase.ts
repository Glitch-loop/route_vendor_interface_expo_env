// Libraries
import { inject, injectable } from 'tsyringe';

// Interfaces
import { DayOperationRepository } from '@/src/core/interfaces/DayOperationRepository';
import { InventoryOperationRepository } from '@/src/core/interfaces/InventoryOperationRepository';
import { ProductInventoryRepository } from '@/src/core/interfaces/ProductInventoryRepository';
import { IDService } from '@/src/core/interfaces/IDService';
import { DateService } from '@/src/core/interfaces/DateService';

// Entities
import { DayOperation } from '@/src/core/entities/DayOperation';
import { InventoryOperation } from '@/src/core/entities/InventoryOperation';
import { ProductInventory } from '@/src/core/entities/ProductInventory';

// Aggregates
import { InventoryOperationAggregate } from '@/src/core/aggregates/InventoryOperationAggregate';
import { OperationDayAggregate } from '@/src/core/aggregates/OperationDayAggregate';
import { ProductInventoryAggregate } from '@/src/core/aggregates/ProductInventoryAggregate';

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';
import { DAY_OPERATIONS } from '@/src/core/enums/DayOperations';

@injectable()
export default class CancelInventoryOperationUseCase {
  constructor(
    // Repositories
    @inject(TOKENS.SQLiteDayOperationRepository) private readonly localDayOperationRepo: DayOperationRepository,
    @inject(TOKENS.SQLiteInventoryOperationRepository) private readonly localInventoryOperationRepo: InventoryOperationRepository,
    @inject(TOKENS.SQLiteProductInventoryRepository) private readonly localProductInventoryRepo: ProductInventoryRepository,

    // Services
    @inject(TOKENS.IDService) private readonly idService: IDService,
    @inject(TOKENS.DateService) private readonly dateService: DateService,
  ) {}

  // TODO: Add synchronization with central database when online.
  async execute(id_inventory_operation: string): Promise<void> {
    // Load required state
    const [inventoryOperation] = await this.localInventoryOperationRepo.retrieveInventoryOperations([id_inventory_operation]);
    console.log("Inventory operation to cancel: ", inventoryOperation)
    if (!inventoryOperation) throw new Error('The inventory operation to cancel does not exist.');

    const { inventory_operation_descriptions, id_inventory_operation_type, state } = inventoryOperation;

    if (state === 0) throw new Error('The inventory operation is already cancelled.');

    const dayOperations: DayOperation[] = await this.localDayOperationRepo.listDayOperations();
    const currentInventory: ProductInventory[] = await this.localProductInventoryRepo.retrieveInventory();

    // Build aggregates
    const inventoryAgg = new InventoryOperationAggregate(inventoryOperation);
    const dayAgg = new OperationDayAggregate(dayOperations);
    const inventoryAggProducts = new ProductInventoryAggregate(currentInventory);

    console.log('Cancelling inventory operation:', id_inventory_operation);
    // Mark operation as cancelled
    inventoryAgg.cancelInventoryOperation();
    const cancelledOperation: InventoryOperation = inventoryAgg.getInventoryOperation();
    
    console.log('Reverting stock effects if needed...');
    // Revert stock effects for restock inventory
    if (id_inventory_operation_type === DAY_OPERATIONS.restock_inventory) {
      console.log(inventory_operation_descriptions)  
      for (const desc of inventory_operation_descriptions) {
        const found = currentInventory.find((pi) => pi.get_id_product() === desc.id_product);
        console.log('Reverting stock for product:', desc.id_product);
        if (!found) throw new Error('Unexpected error: Product inventory not found for cancellation.');
        inventoryAggProducts.decreaseStock(found.get_id_product_inventory(), desc.amount);
      }
    }

    // Register day operation for cancellation
    dayAgg.registerCancelInventoryOperation(
      this.idService.generateID(),
      id_inventory_operation,
      new Date(this.dateService.getCurrentTimestamp()),
    );

    console.log('Persist information');
    // Persist changes
    const modifiedInventory: ProductInventory[] = inventoryAggProducts.getModifiedProductInventory();
    const updatedProducts: ProductInventory[] = modifiedInventory;
    const newDayOps: DayOperation[] | null = dayAgg.getNewDayOperations();

    console.log("Update inventory operation: ", cancelledOperation)
    await this.localInventoryOperationRepo.updateInventoryOperation(cancelledOperation);
    console.log("Update product")
    if (updatedProducts.length > 0) await this.localProductInventoryRepo.updateInventory(updatedProducts);
    console.log("Update day ops")
    if (newDayOps && newDayOps.length > 0) await this.localDayOperationRepo.insertDayOperations(newDayOps);
  }
}
