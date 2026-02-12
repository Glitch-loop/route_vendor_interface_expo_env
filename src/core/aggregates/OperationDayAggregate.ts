// Entities
import { DayOperation } from "@/src/core/entities/DayOperation";
import { RouteTransaction } from "@/src/core/entities/RouteTransaction";

// Enums
import { DAY_OPERATIONS } from "@/src/core/enums/DayOperations";

export class OperationDayAggregate {
    private dayOperations: DayOperation[] | null;
    private initialDayOperations: DayOperation[] | null;

    constructor(dayOperations: DayOperation[] | null) {

        if (dayOperations === null) {
            this.dayOperations = null;
            this.initialDayOperations = null;
        } else {
            this.dayOperations = [ ...dayOperations ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            this.initialDayOperations = [ ...dayOperations ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        }
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
            DAY_OPERATIONS.route_client_attention,
            createdAt,
            null
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
            DAY_OPERATIONS.attention_out_of_route,
            createdAt,
            null
        );

        if (this.dayOperations === null) {
            throw new Error("Error registering client attention out-of-route. There are no operations registered for the day.");
        } else {
            const isclientAttention = this.dayOperations.some((dayOp) => {
                const { id_item, operation_type} = dayOp;
                return idClient === id_item && operation_type === DAY_OPERATIONS.route_client_attention;
            });
            const isAttendClientPetition = this.dayOperations.some((dayOp) => {
                const { id_item, operation_type} = dayOp;
                return idClient === id_item && operation_type === DAY_OPERATIONS.attend_client_petition
            });
            const isNewClientRegistration = this.dayOperations.some((dayOp) => {
                const { id_item, operation_type} = dayOp;
                return idClient === id_item && operation_type === DAY_OPERATIONS.new_client_registration;
            });
            const isClientRegisteredAsAttentionOutOfRoute = this.dayOperations.some((dayOp) => {
                const { id_item, operation_type} = dayOp;
                return idClient === id_item && operation_type === DAY_OPERATIONS.attention_out_of_route;
            });

            if (isclientAttention) throw new Error("The client is part of today's route, so it cannot be registered as out-of-route attention.");
            else if (isAttendClientPetition) throw new Error("The client was registered as attend client petition, so it cannot be registered as out-of-route attention.");
            else if (isNewClientRegistration) throw new Error("The client was registered as new client registration, so it cannot be registered as out-of-route attention.");
            else if (isClientRegisteredAsAttentionOutOfRoute) throw new Error("This client was already registered as attended out-of-route, so it cannot be registered again as out-of-route attention.");
            else this.insertOperationDayNextToCurrentOperation(newDayOperation);
        }
    
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
            DAY_OPERATIONS.new_client_registration,
            createdAt,
            null
        );

        this.insertOperationDayNextToCurrentOperation(newDayOperation);
     }
    
    registerAttendClientPetition(): void { 
        /*TODO: First, Implement the manager application before this*/
    }
    
    registerRouteTransaction(idDayOperation: string, idRouteTransaction: string, createdAt: Date, idDayOperationDependent: string): void {
        const newDayOperation = new DayOperation(
            idDayOperation,
            idRouteTransaction,
            DAY_OPERATIONS.route_transaction,
            createdAt,
            idDayOperationDependent // This is the id of the day operation that represents a store or client on which is going to be registered the route transaction.
        );

        this.insertOperationDayNextToCurrentOperation(newDayOperation);
    }
    
    registerCancelRouteTransaction(idDayOperation: string, idRouteTransaction: string, createdAt: Date): void { 
        const newDayOperation = new DayOperation(
            idDayOperation,
            idRouteTransaction,
            DAY_OPERATIONS.cancel_route_transaction,
            createdAt,
            null
        );

        this.insertOperationDayNextToCurrentOperation(newDayOperation);
     }
    
    registerStartShiftInventory(idDayOperation: string, idInventoryOperation: string, createdAt: Date): void {
        const newDayOperation = new DayOperation(
            idDayOperation,
            idInventoryOperation,
            DAY_OPERATIONS.start_shift_inventory,
            createdAt,
            null
        );

        this.insertOperationDayNextToCurrentOperation(newDayOperation);
    }

    registerRestockInventory(idDayOperation: string, idInventoryOperation: string, createdAt: Date): void {
        const newDayOperation = new DayOperation(
            idDayOperation,
            idInventoryOperation,
            DAY_OPERATIONS.restock_inventory,
            createdAt,
            null
        );

        this.insertOperationDayNextToCurrentOperation(newDayOperation);
    }

    registerProductDevolutionInventory(idDayOperation: string, idInventoryOperation: string, createdAt: Date): void {
        const newDayOperation = new DayOperation(
            idDayOperation,
            idInventoryOperation,
            DAY_OPERATIONS.product_devolution_inventory,
            createdAt,
            null
        );

        this.insertOperationDayNextToCurrentOperation(newDayOperation);
    }

    registerEndShiftInventory(idDayOperation: string, idInventoryOperation: string, createdAt: Date): void {
        const newDayOperation = new DayOperation(
            idDayOperation,
            idInventoryOperation,
            DAY_OPERATIONS.end_shift_inventory,
            createdAt,
            null
        );

        this.insertOperationDayNextToCurrentOperation(newDayOperation);
    }

    registerConsultInventory(idDayOperation: string, idInventoryOperation: string, createdAt: Date): void {
        const newDayOperation = new DayOperation(
            idDayOperation,
            idInventoryOperation,
            DAY_OPERATIONS.consult_inventory,
            createdAt,
            null
        );

        this.insertOperationDayNextToCurrentOperation(newDayOperation);
    }
    
    registerCancelInventoryOperation(idDayOperation: string, idInventoryOperation: string, createdAt: Date): void { 
        const newDayOperation = new DayOperation(
            idDayOperation,
            idInventoryOperation,
            DAY_OPERATIONS.cancel_inventory_operation,
            createdAt,
            null
        );

        this.insertOperationDayNextToCurrentOperation(newDayOperation);   
    }

    getDayOperations(): DayOperation[] | null {
        return this.dayOperations;
    }

    getNewDayOperations(): DayOperation[] | null {
        if (this.dayOperations === null && this.initialDayOperations === null) {
            return null;
        } else {
            return this.dayOperations!.filter(dayOperation => {
                if (this.initialDayOperations === null) return true;
                return !this.initialDayOperations.find(initialOp => initialOp.id_day_operation === dayOperation.id_day_operation);
            });
        }

    }

    determineCurrentOperation(): DayOperation | null {
        const indexCurrentOperation:number = this.determineIndexCurrentOperation();

        if (indexCurrentOperation === -1 || this.dayOperations === null) return null;

        return this.dayOperations[indexCurrentOperation];
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
                    - First "ROUTE_CLIENT_ATTENTION" with no dependent operations.
        */
        let indexCurrentOperationDay:number = -1

        if (!this.dayOperations) { indexCurrentOperationDay = -1; } // No operations registered. 
        else {
            const dayOperationOrdered = this.dayOperations.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

            // Build a map of dependent operations: key = id_day_operation (the operation being depended on), value = array of operations that depend on it
            const dependentOperations: Map<string, string[]> = new Map<string, string[]>();
            
            for (const dayOperation of dayOperationOrdered) {
                if (dayOperation.id_dependency !== null && dayOperation.id_dependency !== '') {
                    // This operation depends on another operation
                    const dependents = dependentOperations.get(dayOperation.id_dependency) || [];
                    dependents.push(dayOperation.id_day_operation); // It has the id of the store....
                    dependentOperations.set(dayOperation.id_dependency, dependents);
                }
            }

            // Traverse day operations to determine which "ROUTE_CLIENT_ATTENTION" operation is the current one.
            for (let i = 0; i < dayOperationOrdered.length; i++) {
                const dayOperation: DayOperation = dayOperationOrdered[i];
                const { id_item, id_day_operation } = dayOperation;
                
                if (dayOperation.operation_type === DAY_OPERATIONS.route_client_attention) {
                    // Check if there are any operations that depend on this operation.
                    if (!dependentOperations.has(id_day_operation)) {
                        // No dependent operations, so this is the current operation.
                        indexCurrentOperationDay = i;
                        break;
                    }
                }
            }

            // If after traversing all day operations, no current operation is found, that means the last operation is the current one.
            if (indexCurrentOperationDay === -1) {
                if (dayOperationOrdered.length > 0) indexCurrentOperationDay = dayOperationOrdered.length - 1;
                else indexCurrentOperationDay = 0;
            }
        }

        return indexCurrentOperationDay;
    }
}