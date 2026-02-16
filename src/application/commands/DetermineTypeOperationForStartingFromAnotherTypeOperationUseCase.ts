import DAY_OPERATIONS from "@/src/core/enums/DayOperations";
import { DayOperationRepository } from "@/src/core/interfaces/DayOperationRepository";
import { InventoryOperationRepository } from "@/src/core/interfaces/InventoryOperationRepository";
import { TOKENS } from "@/src/infrastructure/di/tokens";
import { injectable, inject } from "tsyringe";

/*
    This use case determine which operation the user can start when he is starting from another inventory operation.

    For example:
        - If the user is starting from a "start shift inventory", the only possible next operation is "re-stock inventory" or "final shift inventory".
        - If the user is starting from a "re-stock inventory", the possible next operations are: "re-stock inventory" or "final shift inventory".

    There are 4 types of inventories:
        - Start shift inventory
        - Re-stock inventory
        - Product devolution inventory
        - Final shift inventory

    How to determine which operation can be started from another operation?

    - Start shift inventory
        * A start shift inventory can be started only if there is not another type of inventory operation or route transactions.
        * The start shift inventory which the current is starting must be cancelled.

    - Re-stock inventory
        * There is not an final shift inventory after this operation.


    - Product devolution
        * Not applicable.

    - Final inventory
        * If there is at least one final shift inventory, then the following started operation can be only a final shift inventory.
*/


@injectable()
export default class DetermineTypeOperationForStartingFromAnotherTypeOperationUseCase {
    constructor(
        @inject(TOKENS.SQLiteDayOperationRepository) private readonly localDayOperationRepo: DayOperationRepository,
        @inject(TOKENS.SQLiteInventoryOperationRepository) private readonly localInventoryOperationRepo: InventoryOperationRepository
    ) { }

    // TODO: Test all scenarios
    async execute(): Promise<DAY_OPERATIONS> {        
        let typeOperationToStart: DAY_OPERATIONS = DAY_OPERATIONS.start_shift_inventory;
        const dayOperations = await this.localDayOperationRepo.listDayOperations();
        const startShiftInventoryIds:string[]  =  [];
        const endShiftOrProductDevolutionInventoryIds:string[]  =  [];

        for (const dayOp of dayOperations) {
            const { operation_type, id_item } = dayOp;
            if (operation_type === DAY_OPERATIONS.end_shift_inventory 
            || operation_type === DAY_OPERATIONS.product_devolution_inventory) {
                endShiftOrProductDevolutionInventoryIds.push(id_item);
                typeOperationToStart = DAY_OPERATIONS.end_shift_inventory;
            } else if (
                operation_type === DAY_OPERATIONS.restock_inventory
                || operation_type === DAY_OPERATIONS.route_transaction) {
                typeOperationToStart = DAY_OPERATIONS.restock_inventory;
            }

            if (operation_type === DAY_OPERATIONS.start_shift_inventory) {
                startShiftInventoryIds.push( id_item );
            }
        }

        // Verify if there is a product devolution before end shift inventory.
        if (typeOperationToStart === DAY_OPERATIONS.end_shift_inventory && startShiftInventoryIds.length > 0) { 
            const inventoryOperations = await this.localInventoryOperationRepo.retrieveInventoryOperations(endShiftOrProductDevolutionInventoryIds);
            
            const isProductDevolutionActive:boolean = inventoryOperations.some(invOp => {
                const { id_inventory_operation_type, state } = invOp;
                if (id_inventory_operation_type === DAY_OPERATIONS.product_devolution_inventory && state === 1) return true;
                 else return false;
            });

            if(isProductDevolutionActive) {
                typeOperationToStart = DAY_OPERATIONS.end_shift_inventory;
            } else {
                typeOperationToStart = DAY_OPERATIONS.product_devolution_inventory;
            }
        }

        // Verify if the others start shift inventories are cancelled.
        if (typeOperationToStart === DAY_OPERATIONS.start_shift_inventory && startShiftInventoryIds.length > 0) { 
            const inventoryOperations = await this.localInventoryOperationRepo.retrieveInventoryOperations(startShiftInventoryIds);

            for (const invOp of inventoryOperations) {
                const { state } = invOp;

                if (state !== 0) {
                    typeOperationToStart = DAY_OPERATIONS.restock_inventory;
                    break;
                }
            }
        }

        return typeOperationToStart;
    }
}