// Libraries
import { injectable, inject } from "tsyringe";

// Interfaces
import { DayOperationRepository } from "@/src/core/interfaces/DayOperationRepository";
import { InventoryOperationRepository } from "@/src/core/interfaces/InventoryOperationRepository";

// Use cases
import { TOKENS } from "@/src/infrastructure/di/tokens";

// Utils
import DAY_OPERATIONS from "@/src/core/enums/DayOperations";

/*
    There are 4 types of inventories:
        - Start shift inventory
        - Re-stock inventory
        - Product devolution inventory
        - Final shift inventory

    How to determine if an inventory is "cancelable"?
    
    - Start shift inventory
        1. There is not route transactions after this operation.
        2.  There is not inventory operations after this operation.

    - Re-stock inventory
        1. It is the last inventory operation.
        2. There is not a route transaction after this operation.

    - Product devolution
        * This operation cannot be never cancelled.

    - Final inventory
        * This operation can be always cancelled.
*/

// TODO: What happen if the first route transaction is cancelled? Should be possible to cancel previous inventory operations?
@injectable()
export default class DetermineIfInventoryOperationCancelableUseCase {
    constructor(
        @inject(TOKENS.SQLiteDayOperationRepository) private readonly localDayOperationRepo: DayOperationRepository,
        @inject(TOKENS.SQLiteInventoryOperationRepository) private readonly localInventoryOperationRepo: InventoryOperationRepository
    ) { }

    async execute(id_inventory_operation: string): Promise<boolean> {
        let isCancelable: boolean = false
        const [inventoryOperation] = await this.localInventoryOperationRepo.retrieveInventoryOperations([id_inventory_operation]);
        if (!inventoryOperation) return false;
        
        const { id_inventory_operation_type, state } = inventoryOperation;

        if (state === 0) return false;

        const dayOperations = await this.localDayOperationRepo.listDayOperations();

        const index: number = dayOperations.findIndex( dayOp => dayOp.id_item === id_inventory_operation );

        if (index === -1) return false;

        
        if (id_inventory_operation_type === DAY_OPERATIONS.product_devolution) {
            isCancelable = false;
        } else if (id_inventory_operation_type === DAY_OPERATIONS.end_shift_inventory) { 
            isCancelable = true;
        } else if (
            // id_inventory_operation_type === DAY_OPERATIONS.start_shift_inventory ||  // At least for this release, start shift inventory will not be cancelable, because of the complexity to implement the logic to determine if there are route transactions or inventory operations after this operation.
            id_inventory_operation_type === DAY_OPERATIONS.restock_inventory) {
            if (index === dayOperations.length -1 ) {
                isCancelable = true;
            } else {
                for (let i = index + 1; i < dayOperations.length; i++) {
                    const currentDayOperation = dayOperations[i];
                    const currentDayOperationType = currentDayOperation.operation_type;
                    
                    // If there an inventory operation before, then the inventory operation cannot be cancelled. 
                    if (currentDayOperationType === DAY_OPERATIONS.route_transaction ||
                        currentDayOperationType === DAY_OPERATIONS.restock_inventory ||
                        currentDayOperationType === DAY_OPERATIONS.start_shift_inventory ||
                        currentDayOperationType === DAY_OPERATIONS.product_devolution_inventory ||
                        currentDayOperationType === DAY_OPERATIONS.end_shift_inventory) {
                        isCancelable = false;
                        break;
                    } else {
                        isCancelable = true;
                    }
                }
            }

        } else {
            isCancelable = false;   
        }
        return isCancelable;
    }
}