// Entities
import { InventoryOperation } from "@/src/core/entities/InventoryOperation";
import { DayOperation } from "@/src/core/entities/DayOperation";
import { RouteTransaction } from "@/src/core/entities/RouteTransaction";

// Enums
import { ShiftDayOperations } from "@/src/core/enums/ShiftDayOperations";

export class OperationDayAggregate {
    private dayOperations: DayOperation[] | null;
    private routeTransactions: RouteTransaction[] | null;

    constructor(dayOperations: DayOperation[] | null, routeTransactions: RouteTransaction[] | null) {
        this.dayOperations = dayOperations;
        this.routeTransactions = routeTransactions;
    }

    registerAttendTodaysClient(idDayOperation: string, idClient: string, createdAt: Date): void {
        /*
            Business rule:
                - Since this is a registration for attending today's client (route day), the way of how this is added to the 
                day operation list is by pushing the client at the end of the array of day operations.
                - Aggregate takes as done that the clients comes in the order on which they are going to be attended.
        */
        if (!this.dayOperations) this.dayOperations = [];

        const newDayOperation = new DayOperation(
            idDayOperation,
            idClient,
            ShiftDayOperations.ROUTE_CLIENT_ATTENTION,
            createdAt
        );

        this.dayOperations.push(newDayOperation);
    }
    
    registerClientAttentionOutOfRoute(idDayOperation: string, idClient: string, createdAt: Date): void {
        /*
            Business rule:
            About "Client attention out-of-route" operation:
                - This type of operations is registered when the route vendor attends a client that is not part of his route for the day.
                - Since this is a registration for attending an out-of-route client, the way of how this is added to the day operation list
                is by pushing next to the current operation.
        */
        const newDayOperation = new DayOperation(
            idDayOperation,
            idClient,
            ShiftDayOperations.ATTENTION_OUT_OF_ROUTE,
            createdAt
        );

        this.insertOperationDayNextToCurrentOperation(newDayOperation);
    }
    
    registerCreateNewClient(idDayOperation: string, idClient: string, createdAt: Date): void {
        /*
            Business rule:
            About "Create new client" operation:
                - This operations is registered when the route vendor gets a new client.
                - The way of how this is added to the day operation list is by pushing next to the current operation.
        */
        const newDayOperation = new DayOperation(
            idDayOperation,
            idClient,
            ShiftDayOperations.NEW_CLIENT_REGISTRATION,
            createdAt
        );

        this.insertOperationDayNextToCurrentOperation(newDayOperation);
     }
    
    registerAttendClientPetition(): void { 
        /*TODO: First, Implement the manager application before this*/
    }
    
    registerRouteTransaction(idDayOperation: string, idRouteTransaction: string, createdAt: Date): void {
        const newDayOperation = new DayOperation(
            idDayOperation,
            idRouteTransaction,
            ShiftDayOperations.ROUTE_TRANSACTION,
            createdAt
        );

        this.insertOperationDayNextToCurrentOperation(newDayOperation);
    }
    
    registerCancelRouteTransaction(): void { /* Decide if implement */ }
    
    registerInventoryOperation(idDayOperation: string, idInventoryOperation: string, createdAt: Date): void { 
        const newDayOperation = new DayOperation(
            idDayOperation,
            idInventoryOperation,
            ShiftDayOperations.INVENTORY_OPERATION,
            createdAt
        );

        this.insertOperationDayNextToCurrentOperation(newDayOperation);
    }
    
    registerCancelInventoryOperation(): void { /* Decide if implement */ }

    getDayOperations(): DayOperation[] | null {
        return this.dayOperations;
    }

    private insertOperationDayNextToCurrentOperation(newDayOperation: DayOperation): void {
        if (!this.dayOperations) {
            // That means there is no current operation, so we just add the new one.
            this.dayOperations = [];
            this.dayOperations.push(newDayOperation);
        } else {
            // There is at least one operation registered, so we need to insert the new operation next to the current one.
            const indexCurrentOperation:number = this.determineIndexCurrentOperation();
            
            if (indexCurrentOperation === -1 || indexCurrentOperation === 0) {
                this.dayOperations.unshift(newDayOperation);
            } else {
                this.dayOperations.splice(indexCurrentOperation + 1, 0, newDayOperation);
            }
        }
    }

    private determineIndexCurrentOperation(): number {
        /*
            Business rule:
                - The unique operation days that can be considered as "current operation" are:
                    - ROUTE_CLIENT_ATTENTION
                - "ROUTE_CLIENT_ATTENTION" refers to the clients that are part of the route for the day.
                - The statement on which we can identify the current operation is:
                    - Day operation with type "ROUTE_CLIENT_ATTENTION".
                    - First "ROUTE_CLIENT_ATTENTION" with no "ROUTE_TRANSACTION" associated.
        */
        let indexCurrentOperationDay:number = -1

        if (!this.dayOperations) { indexCurrentOperationDay = -1; } // No operations registered. 
        else {
            // Convert array to map.
            const routeTransactionsMap: Map<string, RouteTransaction> = new Map<string, RouteTransaction>();
    
            if (this.routeTransactions) {
                this.routeTransactions.forEach((routeTransaction: RouteTransaction) => {
                    routeTransactionsMap.set(routeTransaction.id_store, routeTransaction);
                });
            }
    
            // Traverse day operations to determine which "ROUTE_CLIENT_ATTENTION" operation is the current one.
            for (let i = 0; i < this.dayOperations.length; i++) {
                const dayOperation: DayOperation = this.dayOperations[i];
    
                if (dayOperation.operation_type === ShiftDayOperations.ROUTE_CLIENT_ATTENTION) {
                    // Check if there is a route transaction associated to this client (store).
                    if (!routeTransactionsMap.has(dayOperation.id_item)) {
                        // No route transaction associated, so this is the current operation.
                        indexCurrentOperationDay = i;
                    }
                }
            }

            // If after traversing all day operations, no current operation is found, that means the last operation is the current one.
            if (indexCurrentOperationDay === -1) {
                if (this.dayOperations.length > 0) indexCurrentOperationDay = this.dayOperations.length - 1;
                else indexCurrentOperationDay = 0;
            }
        }

        return indexCurrentOperationDay;
    }
}