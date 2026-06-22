
export default class ProductPriceDTO {
  constructor(
    public readonly id_product_price: string,
    public readonly price: number,
    public readonly created_at: string,
    public readonly id_client: string|undefined,
    public readonly id_location: string|undefined,
    public readonly id_route_day: string|undefined
  ) { }
}