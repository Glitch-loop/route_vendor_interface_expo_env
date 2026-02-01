// Dto
import RouteTransactionDescriptionDTO from "@/src/application/dto/RouteTransactionDescriptionDTO";
import ProductInventoryDTO from "@/src/application/dto/ProductInventoryDTO";
import ProductDTO from "@/src/application/dto/ProductDTO";
import RouteTransactionDTO from "@/src/application/dto/RouteTransactionDTO";
import StoreDTO from "@/src/application/dto/StoreDTO";

// UI
import Toast from "react-native-toast-message";

// Utils
import PAYMENT_METHODS from "@/src/core/enums/PaymentMethod";
import { format_date_to_UI_format, time_posix_format } from "@/utils/date/momentFormat";
import { ROUTE_TRANSACTION_STATE } from "@/src/core/enums/RouteTransactionState";
import { capitalizeFirstLetter } from "../string/utils";

// Related to route transaction workflow
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

// Related to ticket service
/*
  This function helps to determine if it is needed to break the "line to write" depending on the
  lenght of the text and the anchor of the printer.

  The anchor of the printer that is currently being used is 58mm, this measure allows us to write a
  line of lenght 32 characteres.

  The parameter of indentation is of type of number and depending of the input is the number of 
  "blank spaces" that it will be let in the ticket.
*/
export function getTicketLine(lineToWrite:string, enterAtTheEnd:boolean = true, indent:number = 0) {
  const anchorPrint:number = 32;
  let text:string = '';
  let writtenLine:string = '';
  let filteredLineToWrite:string = '';
  let indentation = 0;

  // Validation for indentation
  if (indent < 0) {
    indentation = 0;
  } else if  (indent > 32) {
    indentation = 25; // Maximum allowed indentantion
  } else {
    indentation = indent;
  }

  // Filtering tabulators and enters
  for (let i = 0; i < lineToWrite.length; i++) {
    if (lineToWrite[i] === '\n') {
      continue;
    } else if (lineToWrite[i] === '\t') {
      continue;
    } else {
      filteredLineToWrite += lineToWrite[i];
    }
  }

  const wordsToFilter:string[] = filteredLineToWrite.split(' ');

  // Filtering blank spaces or empty strings.
  const words = wordsToFilter.filter((word:string) => {return word !== '';});
  for(let i = 0; i < words.length; i++) {
    const totalLineLength = indentation + writtenLine.length + words[i].length;
    if (i === words.length - 1) { // Last iteration
      if (totalLineLength < anchorPrint) {
        /*anchorPrint + 1: The addition represents the space between words.*/
        text = text + ' '.repeat(indentation) + writtenLine + words[i];
      } else {
        text = text + '\n' + ' '.repeat(indentation) + writtenLine + '\n' + ' '.repeat(indentation) + words[i];
      }
    } else {
      if (totalLineLength + 1 < anchorPrint) {
        /*anchorPrint + 1: It represents a 'space' between words.*/
        writtenLine = writtenLine + words[i] + ' ';
      } else {
        text = text  + ' '.repeat(indentation) + writtenLine + '\n';
        writtenLine = words[i] + ' ';
      }
    }
  }

  if (enterAtTheEnd) {
    text = text + '\n';
  } else {
    /* Do nothing*/
  }

  return text;
}

export function getTicketSale(
    productInventory: Map<string, ProductInventoryDTO&ProductDTO>,
    productsDevolution:RouteTransactionDescriptionDTO[],
    productsReposition:RouteTransactionDescriptionDTO[],
    productsSale: RouteTransactionDescriptionDTO[],
    routeTransacion?:RouteTransactionDTO,
    storeTransaction?:StoreDTO
) {
  // Variable to keep the text of the ticket .
  let ticket = '\n';

  // Getting Subtotals of each concept
  let subtotalProductDevolution = getProductDevolutionBalance(productsDevolution,[], productInventory);
  let subtotalProductReposition = getProductDevolutionBalance(productsReposition,[], productInventory);
  let subtotalSaleProduct = getProductDevolutionBalance(productsSale,[], productInventory);
  let productDevolutionBalance = '$0';
  let greatTotal = '$0';
  let cashReceived = '$0';
  let greatTotalNumber = subtotalSaleProduct + subtotalProductReposition - subtotalProductDevolution;

  /*
    Variables for setting the format of the ticket.
    Note: The anchor of the printer that is used for the application is 58mm equivalent to 32
    characters
  */

  let showTotalPosition:number = 26; // 32 - 26 = $99999 (maximum possible number to print)

  // Variables for header information
  let vendor:string = 'No disponible';
  let status:string = 'No disponible';
  let storeName:string = 'No disponible';
  let routeTransactionDate:string = 'No disponible';
  let paymentMethodName:string = 'No disponible';

  // Formating totals of ticket.
  if (subtotalProductReposition - subtotalProductDevolution < 0) {
    productDevolutionBalance = '-$' + ((subtotalProductReposition - subtotalProductDevolution) * -1).toString();
  } else {
    productDevolutionBalance = '$' + (subtotalProductReposition - subtotalProductDevolution).toString();
  }

  if (subtotalSaleProduct + subtotalProductReposition - subtotalProductDevolution < 0) {
    greatTotal = '-$' + ((subtotalSaleProduct + subtotalProductReposition - subtotalProductDevolution) * -1).toString();
  } else {
    greatTotal = '$' + (subtotalSaleProduct + subtotalProductReposition - subtotalProductDevolution).toString();
  }


  // If there is information about the transaction, store and vendor, add it to the ticket
  if (routeTransacion !== undefined) {
    const { state, date, payment_method } = routeTransacion;
    if (state === ROUTE_TRANSACTION_STATE.ACTIVE) {
      status = 'Completada';
    } else {
      status = 'Cancelada';
    }

    routeTransactionDate = format_date_to_UI_format(date);

    if (routeTransacion.cash_received < 0) {
      cashReceived = '$' + (routeTransacion.cash_received * -1).toString();
    } else {
      cashReceived = '$' + (routeTransacion.cash_received).toString();
    }

    paymentMethodName = getNamePaymentMethodById(payment_method);

  }

  if (storeTransaction !== undefined) {
    const { store_name } = storeTransaction;
    storeName = store_name !== null ? store_name : 'No disponible'; 
  }

  // if (vendorTransaction !== undefined) {
  //   vendor = vendorTransaction.name;
  // }

  // Header of the ticket
  ticket += getTicketLine('Ferdis', true, 13);
  ticket += getTicketLine(`Fecha: ${routeTransactionDate}`, true);
  ticket += getTicketLine(`Vendedor: ${vendor}`, true);
  ticket += getTicketLine(`Estatus: ${status}`, true);
  ticket += getTicketLine(`Cliente: ${storeName}`, true);
  ticket += getTicketLine('', true);

  // Body of the ticket
  // Writing devolution products section
  ticket += getTicketLine('Devolucion de producto', true, 5);
  ticket += getTicketLine('Cantidad Producto Precio Total',true);
  ticket += getListSectionTicket(productInventory, productsDevolution, 'No hubo movmimentos en la seccion de mermas');
  if (productsDevolution.length > 0) {
    ticket += getTicketLine(`Valor total de devolucion: $${subtotalProductDevolution}`,true);
  }
  ticket += getTicketLine('', true);

  // Writing reposition product section
  ticket += getTicketLine('Reposicion de producto', true, 5);
  ticket += getTicketLine('Cantidad Producto Precio Total',true);
  ticket += getListSectionTicket(productInventory, productsReposition, 'No hubo movmimentos en la seccion de reposiciones');
  if (productsReposition.length > 0) {
    ticket += getTicketLine(`Valor total de reposicion: $${subtotalProductReposition}`,true);
  }
  ticket += getTicketLine('', true);

  // Writing product of the sale section
  ticket += getTicketLine('Venta', true, 13);
  ticket += getTicketLine('Cantidad Producto Precio Total',true);
  ticket += getListSectionTicket(productInventory, productsSale, 'No hubo movmimentos en la seccion de ventas');
  if (productsSale.length > 0) {
    ticket += getTicketLine('Total venta:', false); // 12-lenght characters string
    ticket += getTicketLine(`$${subtotalSaleProduct}`,true, (showTotalPosition - 12));
  } else {
    ticket += getTicketLine('',true);
  }

  // Summarizing Section
  ticket += getTicketLine('--------------------------------',true);

  ticket += getTicketLine('Valor concepto devolucion:', false); // 26-lenght characters string
  ticket += getTicketLine(`-$${subtotalProductDevolution}`,true, (showTotalPosition - 26));

  ticket += getTicketLine('Valor concepto reposicion:',false); // 26-lenght characters string
  ticket += getTicketLine(`$${subtotalProductReposition}`,true, (showTotalPosition - 26));

  ticket += getTicketLine('Balance devolucion de productos:',false);
  ticket += getTicketLine(`${productDevolutionBalance}`, true, (showTotalPosition - 10));

  ticket += getTicketLine('Venta total:',false); // 11-lenght characters string
  ticket += getTicketLine(`$${subtotalSaleProduct}`,true, (showTotalPosition - 12));

  ticket += getTicketLine('Gran total:',false); // 11-lenght characters string
  ticket += getTicketLine(`${greatTotal}`,true, (showTotalPosition - 11));

  if (routeTransacion !== undefined) {
    ticket += getTicketLine(`Metodo de pago (${paymentMethodName}):`,false);
    ticket += getTicketLine(`${cashReceived}`,true, (showTotalPosition - 32));
    ticket += getTicketLine('Cambio:',false);
    ticket += getTicketLine(`$${calculateChange(greatTotalNumber, routeTransacion.cash_received)}`,true, (showTotalPosition - 7));
  }

  // Finishing ticket
  ticket += '\n\n';

  return ticket;
}

export function getListSectionTicket(productInventory: Map<string, ProductInventoryDTO&ProductDTO>, routeTransactionMovement:RouteTransactionDescriptionDTO[], messageNoMovements?:string|undefined) {
  let sectionTicket = '';
  if (routeTransactionMovement.length > 0) {
    routeTransactionMovement.forEach(movement => {
      const { id_product_inventory, amount, price_at_moment } = movement;


      if (!productInventory.has(id_product_inventory)) return;

      const productInfo = productInventory.get(id_product_inventory)!;

      const { product_name } = productInfo

      let amountMovement:   string = `${amount}`;
      let productName:  string = `${capitalizeFirstLetter(product_name)}`;
      let price:  string = `$${ price_at_moment }`;
      let total:  string = `$${amount * price_at_moment}`;

      /*
        At least for sale ticket section, the indentation is calculated according with the headers of the list 
        on which are displayed.
        The issue is that what is going to be displayed before will affect into the indentation. So that means
        that the words that will be displayed must be subtracted to the next word indentation.
      */

      // First section
      sectionTicket = sectionTicket + getTicketLine(amountMovement, false); // Cantidad
      sectionTicket = sectionTicket + getTicketLine(productName, true, (9 - amountMovement.length)); // Producto

      // Second section
      sectionTicket = sectionTicket + getTicketLine(price, false, 18); // Price
      sectionTicket = sectionTicket + getTicketLine(total, true, (8 - price.length)); // Total
    });
  } else {
    if (messageNoMovements !== undefined) {
      sectionTicket += getTicketLine(messageNoMovements,true, 0);
    } else {
      sectionTicket += getTicketLine('No hubieron movimientos en este concepto',true, 0);
    }
  }

  return sectionTicket;
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


