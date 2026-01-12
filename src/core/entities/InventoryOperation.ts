import { InventoryOperationDescription } from '../object-values/InventoryOperationDescription';

export class InventoryOperation {
  constructor(
    public readonly id_inventory_operation: string,
    public readonly sign_confirmation: string,
    public readonly date: string,
    public readonly state: number,
    public readonly audit: number,
    public readonly id_inventory_operation_type: string,
    public readonly id_work_day: string,
    public readonly inventoryOperationDescription: Map<string, InventoryOperationDescription>
  ) {}

  get_monetary_value_of_inventory_operation(): number {
    let total = 0;
    this.inventoryOperationDescription.forEach((description) => {
      total += description.price_at_moment * description.amount;
    });
    return total;
  }

  get_inventory_operation_description(id_product: string): InventoryOperationDescription | undefined {
    return this.inventoryOperationDescription.get(id_product);
  }
}