/*
  Note about ProductClass (06-19-26)

  This class was created to handle the recurrent usage between
  ProductDTO and ProductInventoryDTO in several parts of the UI;
  In inventory operations, consulting of transactions, process 
  of selling, etc.
  
  In the same way, this design enhance the cohesion having the rules
  about product but also the inventory product ones, lastly, with this
  class it is intended to handled in a cleaner way the new prices scheme
  on which the product has the same base price but also it may have particular
  prices assigned to the route day, id location or id client.
*/


import ProductDTO from "@/src/application/dto/ProductDTO"
import ProductPriceDTO from "@/src/application/dto/ProductPriceDTO"
import ProductInventoryDTO from "@/src/application/dto/ProductInventoryDTO"


export default class ProductClass {
  public readonly product: ProductDTO;
  // private readonly productInventory: ProductInventory[];
  private readonly basePrice: ProductPriceDTO;
  // private readonly lastConsuledPrice: ProductPriceDTO|null;


  constructor(_product: ProductDTO) {
    this.product = _product;
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

    const { product_price } = this.product;
    if (idLocation === undefined && idRouteDay === undefined && idClient === undefined) {
      price = this.basePrice.price
    } else {
      for (const currentProductPrice of product_price) {
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

  
  private determineBasePrice(): ProductPriceDTO {
    /*
      Note 1 (06-21-26): The base produce price is the price by default when the product has not
      an special price.

      Note 2 (06-21-26): Since the UI neeeds the ids as undefined, it's compared as undefined to find the
      base price.
    */
    
    const { product_price } = this.product;
    for (const price of product_price) {
      if ((price.id_client === null || price.id_client === undefined)
      && (price.id_location === null || price.id_location === undefined)
      && (price.id_route_day === null || price.id_route_day === undefined)) {
        return price;
      }
    }

    throw new Error("Product doesn't have base price.")
  }
}