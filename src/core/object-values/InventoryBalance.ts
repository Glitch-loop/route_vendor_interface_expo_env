
export class InventoryBalance {
  constructor(
    public readonly id_inventory_balance: string,
    public readonly quantity: string,
    public readonly min_quantity: number,
    public readonly max_quantity: number,
    public readonly created_at: string,
    public readonly id_inventory: string,
    public readonly id_product: string,
  ) {}
}