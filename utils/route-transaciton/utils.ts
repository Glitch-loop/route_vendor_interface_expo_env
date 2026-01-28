// Dto
import RouteTransactionDescriptionDTO from "@/src/application/dto/RouteTransactionDescriptionDTO";
import ProductInventoryDTO from "@/src/application/dto/ProductInventoryDTO";

// UI
import Toast from "react-native-toast-message";

// Enums
import PAYMENT_METHODS from "@/src/core/enums/PaymentMethod";

// Date
import { time_posix_format } from "@/utils/date/momentFormat";

export function retrievePriceFromProductInventory(
  id_product_inventory:string, 
  productInventory: Map<string, ProductInventoryDTO>):number {
    // productInventory Map<id_product_inventory, ProductInventoryDTO>
    let price:number = 0;

    if (productInventory.has(id_product_inventory)) {
        const foundProduct = productInventory.get(id_product_inventory);
        if (foundProduct) {
            price = foundProduct.price_at_moment;
        } else {
            price = 0;
        }
    } else {
        price = 0;
    }

    return price;
  }

export function getProductDevolutionBalance(
  productDevolution: RouteTransactionDescriptionDTO[], 
  productReposition: RouteTransactionDescriptionDTO[], 
  productInventory: Map<string, ProductInventoryDTO>):number {
    // productInventory Map<id_product_inventory, ProductInventoryDTO>
    const totalProductDevolution = productDevolution.reduce((acc,item) => {
        const { id_product_inventory, amount } = item;
        const price = retrievePriceFromProductInventory(id_product_inventory, productInventory);
        return acc + price * amount;
    }, 0);

  const totalProductReposition = productReposition.reduce((acc, item) =>{
        const { id_product_inventory, amount } = item;
        const price = retrievePriceFromProductInventory(id_product_inventory, productInventory);
        return acc + price * amount;
    }, 0);

  return totalProductDevolution - totalProductReposition;
}

export function getProductDevolutionBalanceWithoutNegativeNumber(
    productDevolution: RouteTransactionDescriptionDTO[], 
    productReposition: RouteTransactionDescriptionDTO[], 
    productInventory: Map<string, ProductInventoryDTO>) {
    // productInventory Map<id_product_inventory, ProductInventoryDTO>
  let total = getProductDevolutionBalance(productDevolution, productReposition, productInventory);
  if (total < 0) {
    return total * -1;
  } else {
    return total;
  }
}

export function getMessageForProductDevolutionOperation(
    productDevolution:RouteTransactionDescriptionDTO[], 
    productReposition:RouteTransactionDescriptionDTO[], 
    productInventory: Map<string, ProductInventoryDTO>) {
    // productInventory Map<id_product_inventory, ProductInventoryDTO>
  let total = getProductDevolutionBalance(productDevolution, productReposition, productInventory);
  if (total < 0) {
    return 'Balance de la devolución de producto (por cobrar): ';
  } else {
    return 'Balance de la devolución de producto (a pagar): ';
  }
}

export function getGreatTotal(
  productsDevolution:RouteTransactionDescriptionDTO[],
  productsReposition:RouteTransactionDescriptionDTO[],
  salesProduct:RouteTransactionDescriptionDTO[],
  productInventory: Map<string, ProductInventoryDTO>
):number {
  let subtotalProductDevolution = getProductDevolutionBalance(productsDevolution, [], productInventory);
  let subtotalProductReposition = getProductDevolutionBalance(productsReposition, [], productInventory);
  let subtotalSaleProduct = getProductDevolutionBalance(salesProduct, [], productInventory);
  return subtotalSaleProduct + subtotalProductReposition - subtotalProductDevolution;
}

export function productCommitedValidation(
    productInventory: Map<string, ProductInventoryDTO>,
    productsToCommit: RouteTransactionDescriptionDTO[],
    productSharingInventory: RouteTransactionDescriptionDTO[],
    isProductReposition:boolean
):RouteTransactionDescriptionDTO[] {
    let isNewAmountAllowed:boolean = true;
    let errorCaption:string|undefined = undefined;

    const reviewedProducts:RouteTransactionDescriptionDTO[] = [];

    const productSharingInventoryMap:Map<string, RouteTransactionDescriptionDTO> = new Map();

    productSharingInventory.forEach((productShared:RouteTransactionDescriptionDTO) => {
      productSharingInventoryMap.set(productShared.id_product_inventory, productShared);
    });

    // Using 'product to commit' as reference for the validation
    for (const productToCommit of productsToCommit) {
        const idProductInventoryToEvaluate = productToCommit.id_product_inventory;
        const amountToCommit = productToCommit.amount;
        let amountInStockOfCurrentProduct: number = 0;
        let amountShared: number|undefined = undefined;

        // Find the current stock for the product to commit
        if (productInventory.has(idProductInventoryToEvaluate)) {
            const productInventoryFound = productInventory.get(idProductInventoryToEvaluate)!;
            amountInStockOfCurrentProduct = productInventoryFound.stock;
        } else {
            errorCaption = 'Actualmente no tienes el suficiente stock para el producto, stock: 0'
        };
        

        if (amountInStockOfCurrentProduct === 0) { /* There is not product in stock */
            isNewAmountAllowed = false;
            errorCaption = 'Actualmente no tienes el suficiente stock para el producto, stock: 0';
            // Product is not added because there is no stock available.
            continue; // No need to continue with the other validations
        }
        
        // Find if the product is being shared with another type of operation
        if (productSharingInventoryMap.has(idProductInventoryToEvaluate)) {
            const productSharingFound = productSharingInventoryMap.get(idProductInventoryToEvaluate)!;
            amountShared = productSharingFound.amount;
        } else errorCaption = 'El inventario de productos ha cambiado, por favor cierra y abre de nuevo la aplicación.';

        if (amountShared !== undefined) { // The product is being shared between two operations
            if ((amountShared + amountToCommit) <= amountInStockOfCurrentProduct) { /* Product enough to supply both movements */
                reviewedProducts.push({
                ...productToCommit,
                amount: amountToCommit,
                });
            } else { /* There is not product enough to fullfill both movements */
                isNewAmountAllowed = false; // Not possible amount.
    
                // Determine what is the problem with the stock.
                if (amountInStockOfCurrentProduct - amountShared > 0) {
                    // There is not enough product to fullfill the current movement. So, it will add the information with the maximum amount possible.
                    errorCaption = `No hay suficiente stock para completar la reposición y venta. Stock: ${amountInStockOfCurrentProduct}`;
                    reviewedProducts.push({
                        ...productToCommit,
                        amount: amountInStockOfCurrentProduct - amountShared,
                    });
                } else { /* All the stock is already being used by shared inventory*/
                    // Prouct is not being added because there is no stock available.
                    if(isProductReposition) errorCaption = `Actualmente la totalidad del stock esta siendo usado para la venta. Stock: ${amountInStockOfCurrentProduct}`;
                    else errorCaption = `Actualmente la totalidad del stock esta siendo usado para la reposición de producto. Stock: ${amountInStockOfCurrentProduct}`;
                }
            }
        } else { /* It means that only one concept (product reposition or sale) is outflowing product. */
            if (amountToCommit <= amountInStockOfCurrentProduct) { 
                // There is enough product to commit the requested amount
                reviewedProducts.push({
                ...productToCommit,
                amount: amountToCommit,
                });
            } else {
                isNewAmountAllowed = false;
                if(amountInStockOfCurrentProduct > 0) {
                // There is not enough product to fullfill the requeriment, but at least there is some stock
                reviewedProducts.push({
                    ...productToCommit,
                    amount: amountInStockOfCurrentProduct,
                });
                errorCaption = `Estas excediendo el stock actual del producto, stock: ${amountInStockOfCurrentProduct}`;
                } else errorCaption = 'Actualmente no tienes stock para el producto, stock: 0'; // Product is not being added because there is no stock available.
            
                // isNewAmountAllowed = false; // There is not product enough to fullfill the requeriment.
                // if (isProductReposition) {
                //   errorCaption = 'Estas intentando reponer mas producto del que tienes en el inventario.';
                // } else {
                //   errorCaption = 'Estas intentando vender mas producto del que tienes en el inventario.';
                // }
            }
        }
    }

    // Prepare the final list of valid products to commit
    // reviewedProducts.forEach((:RouteTransactionDescriptionDTO) => {
    //     const { id_product } = productToCommit;

    //     const productCommittedFound:RouteTransactionDescriptionDTO|undefined = affectedProducts
    //         .find((currentProductCommitted:RouteTransactionDescriptionDTO) => { return id_product === currentProductCommitted.id_product; });
    //     if(productCommittedFound !== undefined) productsReadyToCommit.push(productCommittedFound)
        
    // });


    if (isNewAmountAllowed === false && errorCaption !== undefined) {
        // There was an error during the validation
        Toast.show({
            type: 'error',
            text1: 'Error en la cantidad de productos',
            text2: errorCaption
        });
    }

    return reviewedProducts;
}

export function calculateChange(total:number, received:number){
  let difference:number = 0;
  if (total < 0) {
    /*
      It means that the vendor has to give money to the client, this probably
      becuase of a product devolution.
    */
    if (total + received < 0) {
      difference = 0;
    } else {
      difference = (total + received);
    }
  } else {
    /* Do nothing; It is a normal selling (vendor has to receive money)*/
    if (total - received < 0) {
      difference = (total - received) * -1;
    } else {
      difference = 0;
    }
  }
  return difference;
}

export function getNamePaymentMethodById(id_payment_method:string):string {
  console.log("Name payment method: ", id_payment_method)
  let name_payment_method:string = '';
    switch (id_payment_method) {
        case PAYMENT_METHODS.CASH:
            name_payment_method = 'Efectivo';
            break;
        case PAYMENT_METHODS.TRANSFER:
            name_payment_method = 'Transferencia';
            break;
        case PAYMENT_METHODS.CREDIT_CARD:
            name_payment_method = 'Tarjeta de crédito';
            break;
        case PAYMENT_METHODS.DEBIT_CARD:
            name_payment_method = 'Tarjeta de débito';
            break;
    }
    return name_payment_method;
}

export function getTransactionIdentifier(transactionIdentifier:string) {
  let finalTransactionIdentifier = '';
  if (transactionIdentifier === undefined) {
    finalTransactionIdentifier = time_posix_format().toString() + time_posix_format().toString().slice(0,3);
  } else {
    if (transactionIdentifier.length > 5) {
      finalTransactionIdentifier = time_posix_format().toString() + transactionIdentifier.slice(0,3);
    } else {
      finalTransactionIdentifier = time_posix_format().toString() + time_posix_format().toString().slice(0,3);
    }
  }

  return finalTransactionIdentifier;
}

/*
    TODO: Verify if this function will be used in the future
  Function that validates if it is a "valid reposition".
  
  In the context of the function, the reposition is defined as all the products that conforms the proposal 
  of reposition to repose a product devolution.

  For resolving a product devolution (repose those product considered as spoiled products), all the combinations will be
  possible, having as limit the first substraction that gives a favorable balance for the vendor.
*/
// export function validatingIfRepositionIsValid(productToCommit: IProductInventory[], productDevolution: IProductInventory[], productReposition: IProductInventory[]):boolean {
//   let result:boolean = false;   
//   let lastModification:IProductInventory = {
//     id_product: '',
//     product_name: '',
//     barcode: null,
//     weight: null,
//     unit: null,
//     comission: 0,
//     price: 0,
//     product_status: 0,
//     order_to_show: 0,
//     amount: 0,
//   }

//   // let totalItemsOfProductsToCommit:number = productToCommit.reduce((acc, item) => { return acc + item.amount;}, 0);
//   // let totalItemsOfProductDevolution:number = productDevolution.reduce((acc, item) => { return acc + item.amount;}, 0);
//   // let totalItemsOfProductReposition:number = productReposition.reduce((acc, item) => { return acc + item.amount; }, 0);
    
//   // const totalItemsForReposition:number = totalItemsOfProductReposition + totalItemsOfProductsToCommit;


//   // if (totalItemsForReposition > totalItemsOfProductDevolution) {
//   //   result = false
//   // } else {
//   //   result = true
//   // }

//   return true;
  
//   /* 
//    Date: 03-23-25
//     Becuase of business rules, this validation was desactivated.
//     Although the validation is not valid right now, it is possible that in the future this validation will be re-activated.
//   */
//   let totalValueOfProductsToCommit:number = productToCommit.reduce((acc, item) => { return acc + item.amount * item.price;}, 0);
//   let totalValueOfProductDevolution:number = productDevolution.reduce((acc, item) => { return acc + item.amount * item.price;}, 0);
//   let totalValueOfProductReposition:number = productReposition.reduce((acc, item) => { return acc + item.amount * item.price; }, 0);

//   productToCommit.forEach((currentProductToCommit:IProductInventory) => {
//     let productRepositionFound:IProductInventory|undefined = productReposition.find((currentProductReposition:IProductInventory) => {
//       return currentProductToCommit.id_product === currentProductReposition.id_product;
//     });

//     if (productRepositionFound !== undefined) {
//       if (productRepositionFound.amount !== currentProductToCommit.amount) {
//         /* The last movement will differ from what is stored in the states */
//         lastModification = currentProductToCommit;
//       } else {
//         /* It means, this product exists in the reposition but it isn't the last movement*/
//       }
//     } else {
//       /* That means that the current product isn't still in the state but it is intended to be in*/
//        lastModification = currentProductToCommit;
//     }
//   })


//   let balance:number = totalValueOfProductDevolution - totalValueOfProductsToCommit;

//   if (balance >= 0) {
//     result = true
//   } else {
//     if (balance + lastModification.price >= 0 && balance % lastModification!.price !== 0) {
//       result = true
//     } else {
//       result = false
//     }
//   }

//   if (totalValueOfProductsToCommit < totalValueOfProductReposition) {
//     result = true
//   }

//   return result;
// }


