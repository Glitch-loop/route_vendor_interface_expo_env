import { ProductPrice } from "@/src/core/object-values/ProductPrice";

export class Product {
  private readonly basePrice: ProductPrice;

  constructor(
    public readonly id_product: string,
    public readonly product_name: string,
    public readonly cost: number,
    public readonly product_status: number,
    public readonly quantity_presentation: number,
    public readonly order_to_show: number,
    public readonly id_measurement_unit: string | null,
    public readonly price: ProductPrice[],
    public readonly barcode: string | null,
  ) {
    this.basePrice = this.determineBasePrice();
  }

    /**
     * 
     * @param idLocation 
     * @param idRouteDay 
     * @param idClient 
     * @return `number`
     * 
     * Function that retrieve the price of the product.
     * If all params are undefined, then it will retrieve by default the 
     * base price.
     * If the user uses the params looking for a price, considering the following
     * priority order:
     * 1. id location.
     * 2. id client.
     * 3. id route day.
     * 
     * If it was not able to find a product with the IDs then it will be returned
     * the `base product`.
     * 
     * Design note:
     * The reason why it is possible to pass all the ids at once was to let the class
     * decide which price is the correct one for that particular scenario, otherwise, 
     * the UI should call this function at least three times to retrieve the price 
     * for each case and once known the prices it should decide what is the correct 
     * one for the use case.
     */
    getPrice(idLocation?: string, idRouteDay?: string,  idClient?: string): number {
      //Params are organized from more to less used.
      let price = -1;
      let locationPrice = -1;
      let routePrice = -1;
      let clientPrice = -1;
  
      if (idLocation === undefined && idRouteDay === undefined && idClient === undefined) {
        price = this.basePrice.price
      } else {
        for (const currentProductPrice of this.price) {
          if(idLocation !== undefined && currentProductPrice.id_location === idLocation) 
            locationPrice = currentProductPrice.price;
          if(idRouteDay !== undefined && currentProductPrice.id_route_day === idRouteDay) 
            routePrice = currentProductPrice.price;
          if(idClient !== undefined && currentProductPrice.id_client === idClient) 
            clientPrice = currentProductPrice.price;
        }
    
        if (locationPrice !== -1) price = locationPrice;
        if (clientPrice !== -1 && price === -1) price = clientPrice;
        if (routePrice !== -1 && price === -1) price = routePrice;
        if (price === -1) price = this.basePrice.price;
      }
  
      return price
    }
  
    
    private determineBasePrice(): ProductPrice {
      /*
        The base produce price is the price by default when the product has not
        an special price.
      */
      for (const currentPrice of this.price) {
        if (currentPrice.id_client === null
        && currentPrice.id_location === null
        && currentPrice.id_route_day === null) {
          return currentPrice;
        }
      }
      
      throw new Error(`Product (${this.product_name}) doesn't have base price.`);
    }
}