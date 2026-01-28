import { ICurrency } from "@/interfaces/interfaces";
import InventoryOperationDescriptionDTO from "@/src/application/dto/InventoryOperationDescriptionDTO";
import ProductDTO from "@/src/application/dto/ProductDTO";
import ProductInventoryDTO from "@/src/application/dto/ProductInventoryDTO";

export function getTotalAmountFromCashInventory(cashInventory:ICurrency[]):number {
  return cashInventory.reduce((acc, currentCurrency) =>
    { if (currentCurrency.amount === undefined || currentCurrency.amount === null) {return acc;} else {return acc + currentCurrency.amount * currentCurrency.value;}}, 0);
}

export function determineIfExistsOperationDescriptionMovement(operationMovements:InventoryOperationDescriptionDTO[]) {
  let isAtLeastOneMovement:boolean = false;

  operationMovements.forEach((inventory: InventoryOperationDescriptionDTO) => {
    const { amount } = inventory;
    if(amount > 0) isAtLeastOneMovement = true;
  });

  return isAtLeastOneMovement;
}

export function createMapProductInventoryWithProduct(productsInventory: ProductInventoryDTO[], products: ProductDTO[]): Map<string, ProductInventoryDTO&ProductDTO> {
  const productInventoryMap: Map<string, ProductInventoryDTO&ProductDTO> = new Map<string, ProductInventoryDTO&ProductDTO>();
  for (const currentProductInventory of productsInventory) {
    const { id_product_inventory, price_at_moment, stock, id_product } = currentProductInventory;
    
    const productFound:ProductDTO|undefined = products.find(prod => prod.id_product === id_product);
    
    if (productFound === undefined) continue;
    const {
      product_name,
      barcode,
      weight,
      unit,
      comission,
      price,
      product_status,
      order_to_show

    } = productFound;

    productInventoryMap.set(
      id_product_inventory, {
        id_product_inventory: id_product_inventory,
        price_at_moment: price_at_moment,
        stock: stock,
        id_product: id_product,
        product_name: product_name,
        barcode: barcode,
        weight: weight,
        unit: unit,
        comission: comission,
        price: price,
        product_status: product_status,
        order_to_show: order_to_show,
      }
    )
  }
  return productInventoryMap;
}
