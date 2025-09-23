import { Product } from '../object_values/Product';

export class ProductInventory {
  constructor(
    private amount: number,
    private product: Product
  ) {}

  get_value_of_product(): number {
    return this.amount * this.product.price;
  }

  get_amount_of_product(): number {
    return this.amount;
  }

  get_price_of_product(): number {
    return this.product.price;
  }

  set_amount_of_product(amount: number): void {
    this.amount = amount;
  }
}