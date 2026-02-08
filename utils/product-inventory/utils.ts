import InventoryOperationDTO from "@/src/application/dto/InventoryOperationDTO";
import InventoryOperationDescriptionDTO from "@/src/application/dto/InventoryOperationDescriptionDTO";
import RouteTransactionDTO from "@/src/application/dto/RouteTransactionDTO";
import RouteTransactionDescriptionDTO from "@/src/application/dto/RouteTransactionDescriptionDTO";
import { InventoryOperation } from "@/src/core/entities/InventoryOperation";
import DAY_OPERATIONS from "@/src/core/enums/DayOperations";
import { ROUTE_TRANSACTION_STATE } from "@/src/core/enums/RouteTransactionState";


export function getRouteTransactionDescriptionsOfActiveTransactionsByTypeOfOperations(routeTransactions: RouteTransactionDTO[], idRouteTransactionDescription: DAY_OPERATIONS): RouteTransactionDescriptionDTO[] {
    const routeTransactionDescription: RouteTransactionDescriptionDTO[] = [];
    
    for (const routeTransaction of routeTransactions) {
        const { transaction_description, state } = routeTransaction;

        if (state === ROUTE_TRANSACTION_STATE.ACTIVE) {
            for (const description of transaction_description) {
                const { id_transaction_operation_type } = description;
                if (id_transaction_operation_type === idRouteTransactionDescription) {
                    routeTransactionDescription.push(description);
                }
            }
        }
    }

    return routeTransactionDescription;
}

export function getInventoryOperationDescriptionsOfActiveInventoryOperationsByTypeOfOperations(inventoryOperations: InventoryOperationDTO[], idInventoryOperationDescription: DAY_OPERATIONS): InventoryOperationDescriptionDTO[][] {
    const inventoryOperationDescriptions: InventoryOperationDescriptionDTO[][] = [];

    const inventoryOperationOrderedByDate = inventoryOperations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (const inventoryOperation of inventoryOperationOrderedByDate) {
        const inventoryOperationDescriptionOfCurrentOperation: InventoryOperationDescriptionDTO[] = [];
        const { inventory_operation_descriptions, state, id_inventory_operation_type } = inventoryOperation;
        if (state === 1 && id_inventory_operation_type === idInventoryOperationDescription) {
            console.log("Number of descriptions in db: ", inventory_operation_descriptions.length)
            console.log("This is a type")
            for (const description of inventory_operation_descriptions) {
                inventoryOperationDescriptionOfCurrentOperation.push(description);
            }
            console.log("Number of descriptions: ", inventoryOperationDescriptionOfCurrentOperation.length)
            inventoryOperationDescriptions.push(inventoryOperationDescriptionOfCurrentOperation);
        }
    }
    // console.log("final of function: ", inventoryOperationDescriptions)
    return inventoryOperationDescriptions;
}