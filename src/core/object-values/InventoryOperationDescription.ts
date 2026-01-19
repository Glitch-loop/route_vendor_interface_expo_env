export class InventoryOperationDescription {
  constructor(
    public readonly id_inventory_operation_description: string,
    public readonly price_at_moment: number,
    public readonly amount: number,
    public readonly created_at: Date,
    public readonly id_inventory_operation: string,
    public readonly id_product: string
  ) {}
}