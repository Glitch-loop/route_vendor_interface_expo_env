import { InventoryBalance } from "@/src/core/object-values/InventoryBalance";

export class Inventory {
  constructor(
    public readonly id_inventory: string,
    public readonly inventory_context: number,
    public readonly inventory_name: string,
    public readonly is_active: number,
    public readonly stock_validation: number,
    public readonly updated_at: string,
    public readonly created_at: string,
    public readonly created_by: string,
    public readonly assigned_facility: string,
    public readonly assigned_to: string,
    public readonly inventory_balance: InventoryBalance[],
  ) {}
}