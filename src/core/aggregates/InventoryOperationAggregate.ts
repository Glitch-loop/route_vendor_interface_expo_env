// Object Values
import { InventoryOperationDescription } from "@/src/core/object-values/InventoryOperationDescription";

// Entities
import { InventoryOperation } from "@/src/core/entities/InventoryOperation";

// Utils
import { INVENTORY_OPREATION_STATE } from "@/src/core/enums/InventoryOperationState";

export class InventoryOperationAggregate {
    private _inventoryOperation: InventoryOperation | null;
    
    constructor(
        public readonly inventoryOperation: InventoryOperation | null
    ) {
        this._inventoryOperation = inventoryOperation;
    }
    
    createInventoryOperation(
        id_inventory_operation: string, 
        signConfirmation: string, 
        creationDate: Date, 
        audit: number, 
        id_inventory_operation_type: string,
        id_work_day: string
    ): void {

        this._inventoryOperation = new InventoryOperation(
            id_inventory_operation,
            signConfirmation,
            creationDate,
            INVENTORY_OPREATION_STATE.COMPLETED,
            audit,
            id_inventory_operation_type,
            id_work_day,
            new Array<InventoryOperationDescription>()
        );
   }

    addInventoryOperationDescription(
        id_inventory_operation_description: string,
        price_at_moment: number,
        amount: number,
        created_at: Date,
        id_product: string
    ): void {
        if (!this._inventoryOperation) throw new Error("First, you need to create an inventory operation before adding descriptions.");

        const { id_inventory_operation, inventory_operation_descriptions } = this._inventoryOperation;
        
        const index:number = inventory_operation_descriptions.findIndex(desc => desc.id_product === id_product && desc.price_at_moment === price_at_moment);

        if (index !== -1) throw new Error("The product you are trying to add already exists in the inventory operation descriptions.");

        const inventory_operation_description = new InventoryOperationDescription(
            id_inventory_operation_description,
            price_at_moment,
            amount,
            created_at, 
            id_inventory_operation,
            id_product,   
        );
        
        this._inventoryOperation.inventory_operation_descriptions.push(inventory_operation_description);

    }

    cancelInventoryOperation(): void {
        if (!this._inventoryOperation) throw new Error("No inventory operation available.");

        const state = 0; // Active

        this._inventoryOperation = new InventoryOperation(
            this._inventoryOperation.id_inventory_operation,
            this._inventoryOperation.sign_confirmation,
            this._inventoryOperation.date,
            INVENTORY_OPREATION_STATE.CANCELLED,
            this._inventoryOperation.audit,
            this._inventoryOperation.id_inventory_operation_type,
            this._inventoryOperation.id_work_day,
            this._inventoryOperation.inventory_operation_descriptions
        );
    }

    getInventoryOperation(): InventoryOperation {
        if (!this._inventoryOperation) throw new Error("No inventory operation available.");
        return this._inventoryOperation;
    }
}  