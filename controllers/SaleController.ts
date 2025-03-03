// Embedded database
import {
  insertDayOperations,
  insertProducts,
  insertStores,
  insertWorkDay,
  insertDayOperation,
  insertInventoryOperation,
  insertInventoryOperationDescription,
  getInventoryOperation,
  getInventoryOperationDescription,
  getProducts,
  getAllInventoryOperations,
  getRouteTransactionByStore,
  getRouteTransactionOperations,
  getRouteTransactionOperationDescriptions,
  updateProducts,
  updateWorkDay,
  deleteAllDayOperations,
  deleteAllWorkDayInformation,
  deleteAllProducts,
  deleteAllStores,
  deleteAllInventoryOperations,
  deleteAllInventoryOperationsDescriptions,
  deleteAllRouteTransactions,
  deleteAllRouteTransactionOperations,
  deleteAllRouteTransactionOperationDescriptions,
  deleteInventoryOperationDescriptionsById,
  deleteInventoryOperationsById,
  insertSyncQueueRecord,
  insertSyncQueueRecords,
  deleteSyncQueueRecord,
  deleteSyncQueueRecords,
  insertRouteTransactionOperation,
  insertRouteTransactionOperationDescription,

} from '../queries/SQLite/sqlLiteQueries';

// Interfaces
import { 
  IProductInventory,
  IResponse,
  IRouteTransaction, 
  IRouteTransactionOperation, 
  IRouteTransactionOperationDescription, 
  IStore,
  ISyncRecord
} from '@/interfaces/interfaces';
import { apiResponseStatus } from '@/utils/apiResponse';

// Utils
import { avoidingUndefinedItem, generateUUIDv4 } from '@/utils/generalFunctions';
import { createSyncItem, createSyncItems } from '@/utils/syncFunctions';


export async function cleanAllRouteTransactionsFromDatabase() {
  // Deleting all route transactions.
  await deleteAllRouteTransactionOperationDescriptions();
  await deleteAllRouteTransactionOperations();
  await deleteAllRouteTransactions();
}

// Related to concept creation
export function createRouteTransactionOperation(
  routeTransaction:IRouteTransaction,
  typeOfOperation:string):IRouteTransactionOperation {
  const { id_route_transaction } = routeTransaction;

  const routeTransactionOperation:IRouteTransactionOperation = {
    id_route_transaction_operation: generateUUIDv4(),
    id_route_transaction: id_route_transaction,
    id_route_transaction_operation_type: typeOfOperation,
  };

  return routeTransactionOperation;
}

export function createRouteTransactionOperationDescription(
  routeTransactionOperation:IRouteTransactionOperation,
  movementInTransaction: IProductInventory[]
):IRouteTransactionOperationDescription[] {
  const routeTransactionOperationDescriptions:IRouteTransactionOperationDescription[] = [];

  const { id_route_transaction_operation } = routeTransactionOperation;

  movementInTransaction.forEach((product) => {
    const {
      price,
      amount,
      id_product,
      comission
    } = product;
    if(amount > 0) {
      routeTransactionOperationDescriptions.push({
        id_route_transaction_operation_description: generateUUIDv4(),
        price_at_moment: price,
        comission_at_moment: comission,
        amount: amount,
        id_route_transaction_operation: id_route_transaction_operation,
        id_product: id_product,
      });
    } else {
      /* It means the product doesn't have any amount in the sale */
    }
  });

  return routeTransactionOperationDescriptions;
}

/*
  Function to extract the information from dynamic path.
*/
export function getInitialInventoryParametersFromRoute(params:any, inventoryName:string) {
  try {
    
    let parsedInformation:any = {};
    if (params === undefined) {
      return [];
    } else {
    
      if (typeof params === 'string') {
        parsedInformation = JSON.parse(params);

      } else if (typeof params === 'object') {
        parsedInformation = params;
      } else {
        parsedInformation = {};
      }

      return avoidingUndefinedItem(parsedInformation[inventoryName], []);
    }
  } catch (error) {
    return [];
  }
}

/*
  Function that validates if it is a "valid reposition".
  
  In the context of the function, the reposition is defined as all the products that conforms the proposal 
  of reposition to repose a product devolution.

  For resolving a product devolution (repose those product considered as spoiled products), all the combinations will be
  possible, having as limit the first substraction that gives a favorable balance for the vendor.
*/
export function validatingIfRepositionIsValid(productToCommit: IProductInventory[], productDevolution: IProductInventory[], productReposition: IProductInventory[]):boolean {
  let result:boolean = false;   
  let lastModification:IProductInventory = {
    id_product: '',
    product_name: '',
    barcode: null,
    weight: null,
    unit: null,
    comission: 0,
    price: 0,
    product_status: 0,
    order_to_show: 0,
    amount: 0,
  }

  let totalValueOfProductsToCommit:number = productToCommit.reduce((acc, item) => { return acc + item.amount * item.price;}, 0);
  let totalValueOfProductDevolution:number = productDevolution.reduce((acc, item) => { return acc + item.amount * item.price;}, 0);
  let totalValueOfProductReposition:number = productReposition.reduce((acc, item) => { return acc + item.amount * item.price; }, 0);

  productToCommit.forEach((currentProductToCommit:IProductInventory) => {
    let productRepositionFound:IProductInventory|undefined = productReposition.find((currentProductReposition:IProductInventory) => {
      return currentProductToCommit.id_product === currentProductReposition.id_product;
    });

    if (productRepositionFound !== undefined) {
      if (productRepositionFound.amount !== currentProductToCommit.amount) {
        /* The last movement will differ from what is stored in the states */
        lastModification = currentProductToCommit;
      } else {
        /* It means, this product exists in the reposition but it isn't the last movement*/
      }
    } else {
      /* That means that the current product isn't still in the state but it is intended to be in*/
       lastModification = currentProductToCommit;
    }
  })


  let balance:number = totalValueOfProductDevolution - totalValueOfProductsToCommit;

  if (balance >= 0) {
    result = true
  } else {
    if (balance + lastModification.price >= 0 && balance % lastModification!.price !== 0) {
      result = true
    } else {
      result = false
    }
  }

  if (totalValueOfProductsToCommit < totalValueOfProductReposition) {
    result = true
  }

  return result;
}

export async function insertionSyncRecordTransactionOperationAndOperationDescriptions(
  routeTransactionOperation:IRouteTransactionOperation,
  routeTransactionOperationDescription:IRouteTransactionOperationDescription[]
) {
  try {
    let resultInsertion:boolean = true;
    if (routeTransactionOperationDescription[0] !== undefined) {
      /* There was a movement in concept of devolution. */
      let resultInsertionOperation:IResponse<null>
      // Inserting operation
        = await insertSyncQueueRecord(createSyncItem(routeTransactionOperation, 'PENDING', 'INSERT'));

      // Inserting operation descriptions
      let resultInsertionOperationDescription:IResponse<ISyncRecord[]>
        = await insertSyncQueueRecords(createSyncItems(routeTransactionOperationDescription, 'PENDING', 'INSERT'));

        if (apiResponseStatus(resultInsertionOperation, 201)
        && apiResponseStatus(resultInsertionOperationDescription, 201)) {
          resultInsertion = true;
        } else {
          resultInsertion = false;
        }

    } else {
      /* It means, that there is not movements for the current operation,
         so, it won't be registered  */
      resultInsertion = true;
    }

    return resultInsertion;
  } catch (error) {
    return false;
  }
}

export function substractingProductFromCurrentInventory(currentInventory: IProductInventory[],
  inventoryToSubstract:IProductInventory[]):IProductInventory[] {
    // Creating a copy of the current inventory
    const updatedInventory:IProductInventory[] = currentInventory
    .map((product:IProductInventory) => { return { ...product }; });

    inventoryToSubstract.forEach((product:IProductInventory) => {
      const amountToSubstract:number = product.amount;

      const index:number = updatedInventory.findIndex(currentProduct =>
          { return currentProduct.id_product === product.id_product; });

      const currentAmount:number = updatedInventory[index].amount;

      if(index === -1) {
        /* Do nothing */
      } else {
        updatedInventory[index] = {
          ...updatedInventory[index],
          amount: currentAmount - amountToSubstract,
        };
      }

    });

    return updatedInventory;
}

export async function insertionTransactionOperationsAndOperationDescriptions(
  routeTransactionOperation:IRouteTransactionOperation,
  routeTransactionOperationDescription:IRouteTransactionOperationDescription[]
):Promise<boolean> {
  let resultInsertion:boolean = true;
  if (routeTransactionOperationDescription[0] !== undefined) {
    /* There was a movement in concept of devolution. */
    let resultInsertionOperation:IResponse<IRouteTransactionOperation>
      = await insertRouteTransactionOperation(routeTransactionOperation);
    let resultInsertionOperationDescription
    :IResponse<IRouteTransactionOperationDescription[]>
      = await insertRouteTransactionOperationDescription(routeTransactionOperationDescription);

      if (apiResponseStatus(resultInsertionOperation, 201)
      && apiResponseStatus(resultInsertionOperationDescription, 201)) {
        resultInsertion = true;
      } else {
        resultInsertion = false;
      }

  } else {
    /* It means, that there is not movements for the current operation,
       so, it won't be registered  */
    resultInsertion = true;
  }
  return resultInsertion;
}
