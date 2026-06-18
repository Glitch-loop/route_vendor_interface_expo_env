export class ProductInventory {
  constructor(
    private readonly id_product_inventory: string,
    private readonly stock: number,
    private readonly id_product: string,
  ) {}

  get_stock_of_product(): number {
    return this.stock;
  }

  get_id_product_inventory(): string {
    return this.id_product_inventory;
  }

  get_id_product(): string {
    return this.id_product;
  }
}