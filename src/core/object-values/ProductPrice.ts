export class ProductPrice {
  constructor(
    public readonly id_product_price: string,
    public readonly price: number,
    public readonly created_at: Date,
    public readonly id_client: string,
    public readonly id_location: string,
    public readonly id_route_day: string
  ) {}
}

