import { Product } from '../object-values/Product';

export class ProductInventory {
  constructor(
    private readonly id_product_inventory: string,
    private readonly price_at_moment: number,
    private readonly stock: number,
    private readonly id_product: string,
  ) {}

  get_value_of_product(): number {
    return this.stock * this.price_at_moment;
  }

  get_stock_of_product(): number {
    return this.stock;
  }

  get_price_of_product(): number {
    return this.price_at_moment;
  }
}