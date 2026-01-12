export class Product {
  constructor(
    public readonly id_product: string,
    public readonly product_name: string,
    public readonly barcode: string | null,
    public readonly weight: string | null,
    public readonly unit: string | null,
    public readonly comission: number,
    public readonly price: number,
    public readonly product_status: number,
    public readonly order_to_show: number
  ) {}
}