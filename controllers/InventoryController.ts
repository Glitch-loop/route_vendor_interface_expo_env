
// Queries
// Main database
import { RepositoryFactory } from '../queries/repositories/RepositoryFactory';

// Embedded database
import {
  insertProducts,
  insertInventoryOperation,
  insertInventoryOperationDescription,
  getInventoryOperationDescription,
  updateProducts,
  deleteAllProducts,
  deleteAllInventoryOperations,
  deleteAllInventoryOperationsDescriptions,
  deleteInventoryOperationDescriptionsById,
  deleteInventoryOperationsById,
  getProducts,
  getInventoryOperation,
  getAllInventoryOperations,
  getAllRouteTransactions,
  getAllRouteTransactionsOperations,
  getAllRouteTransactionsOperationDescriptions,
  updateInventoryOperation,
} from '../queries/SQLite/sqlLiteQueries';

// Interfaces
import {
  IProductInventory,
  IDayGeneralInformation,
  IDay,
  IRouteDay,
  IRoute,
  IDayOperation,
  IInventoryOperation,
  IInventoryOperationDescription,
  IResponse,
  ISyncRecord,
  IProduct,
  IRouteTransaction,
  IRouteTransactionOperation,
  IStore,
  IStoreStatusDay,
  IRouteTransactionOperationDescription,
} from '../interfaces/interfaces';

// Services
import {
  createRecordForSyncingWithCentralDatabse,
  createRecordsForSyncingWithCentralDatabse,
  deleteRecordForSyncingWithCentralDatabase,
  deleteRecordsForSyncingWithCentralDatabase,
} from '../services/syncService';

// Utils
import DAYS_OPERATIONS from '../lib/day_operations';
import { timestamp_format } from '../utils/momentFormat';
import { calculateNewInventoryAfterAnInventoryOperation } from '../utils/inventoryOperations';
import {
  apiResponseStatus,
  createApiResponse,
  getDataFromApiResponse,
} from '../utils/apiResponse';
import Toast from 'react-native-toast-message';

import {
  addingInformationParticularFieldOfObject,
  generateUUIDv4,
} from '../utils/generalFunctions';

// Initializing database connection
let repository = RepositoryFactory.createRepository('supabase');

// Definition
const initialProduct:IProductInventory = {
  id_product: '',
  product_name: '',
  barcode: '',
  weight: '',
  unit: '',
  comission: 0,
  price: 0,
  product_status: 0,
  order_to_show: 0,
  amount: 0,
};

export function getTitleOfInventoryOperation(dayOperation: IDayOperation):string {
  let title:string = 'Inventario';

  if (dayOperation.id_type_operation === DAYS_OPERATIONS.start_shift_inventory) {
    title = 'Inventario inicial';
  } else if(dayOperation.id_type_operation === DAYS_OPERATIONS.restock_inventory) {
    title = 'Re-sctok de inventario';
  } else if(dayOperation.id_type_operation === DAYS_OPERATIONS.end_shift_inventory) {
    title = 'Inventario final';
  } else if(dayOperation.id_type_operation === DAYS_OPERATIONS.product_devolution_inventory) {
    title = 'Devolución de producto';
  } else {
    /* There is not instructions */
  }

  return title;
}

export function deterimenIfExistsMovement(
  movementsInventoryOperation:IProductInventory[]
) {
  let isAtLeastOneMovement:boolean = false;

  movementsInventoryOperation.forEach((inventory:IProductInventory) => {
    const { amount } = inventory;
    if(amount > 0) {
      isAtLeastOneMovement = true;
    }
  });

  return isAtLeastOneMovement;
}

// Related to inventory operation
function creatingInventoryOperation(dayGeneralInformation:IDayGeneralInformation, idTypeOperation:string):IInventoryOperation {
  const inventoryOperation:IInventoryOperation = {
    id_inventory_operation: '',
    sign_confirmation: '',
    date: '',
    state: 1,
    audit: 0,
    id_inventory_operation_type: '',
    id_work_day: '',
  };
  try {
    if (idTypeOperation === '') {
      /* It is not possible to create a new inventory operation without the ID
      of the type operation*/
    } else {
      // Creating the inventory operation (this inventory operation is tied to the "work day").
      inventoryOperation.id_inventory_operation = generateUUIDv4();
      inventoryOperation.sign_confirmation = '1';
      inventoryOperation.date = timestamp_format();
      inventoryOperation.audit = 0;
      inventoryOperation.state = 1;
      inventoryOperation.id_inventory_operation_type = idTypeOperation;
      inventoryOperation.id_work_day = dayGeneralInformation.id_work_day;
    }

    return inventoryOperation;
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: 'Error durante la creación del inventario.',
      text2: 'Ha habido un error al momento de crear el inventario.',
    });
    return inventoryOperation;
  }
}

function creatingInventoryOperationDescription(inventory:IProductInventory[], inventoryOperation:IInventoryOperation):IInventoryOperationDescription[] {
  const inventoryOperationDescription:IInventoryOperationDescription[] = [];
  try {
    const { id_inventory_operation } = inventoryOperation;
    // Extracting information from the inventory operation.
    inventory.forEach(product => {
      const {
        price,
        amount,
        id_product,
      } = product;

      if (amount > 0) {

        inventoryOperationDescription.push({
          id_product_operation_description: generateUUIDv4(),
          price_at_moment: price,
          amount: amount,
          id_inventory_operation: id_inventory_operation,
          id_product: id_product,
        });
      } else {
        /* It means the product doesn't have any "amount", it can mean for both
        scenarios: inflow or outflow. */
      }
    });
    return inventoryOperationDescription;
  } catch (error) {
    return inventoryOperationDescription;
  }
}

export async function createInventoryOperation(
  routeDay:IRoute&IDayGeneralInformation&IDay&IRouteDay,
  inventory:IProductInventory[],
  idTypeInventory:string,
):Promise<IResponse<IInventoryOperation>> {

  const inventoryOperation:IInventoryOperation
  = creatingInventoryOperation(routeDay, idTypeInventory);

  const inventoryOperationDescription:IInventoryOperationDescription[]
  = creatingInventoryOperationDescription(inventory, inventoryOperation);

  const resultInventoryOperation:IResponse<IInventoryOperation>
    = await insertInventoryOperation(inventoryOperation);

  const resultInventoryOperationDescription:IResponse<IInventoryOperationDescription[]>
    = await insertInventoryOperationDescription(inventoryOperationDescription);

  const resultCreateRecordForSyncingOperation:IResponse<ISyncRecord>
    = await createRecordForSyncingWithCentralDatabse(inventoryOperation, 'PENDING', 'INSERT');

  const resultCreateRecordForSyncingOperationDescription:IResponse<ISyncRecord> =
  await createRecordsForSyncingWithCentralDatabse(
    inventoryOperationDescription,
    'PENDING',
    'INSERT');

  if (apiResponseStatus(resultInventoryOperation, 201)
   && apiResponseStatus(resultInventoryOperationDescription, 201)
   && apiResponseStatus(resultCreateRecordForSyncingOperation, 201)
   && apiResponseStatus(resultCreateRecordForSyncingOperationDescription, 201)
  ) {
    return createApiResponse(
      resultInventoryOperation.responseCode,
      inventoryOperation,
      null,
      'Inventory operation created successfully'
    );
  } else {

    await deleteInventoryOperationsById(inventoryOperation);
    await deleteInventoryOperationDescriptionsById(inventoryOperationDescription);

    await deleteRecordForSyncingWithCentralDatabase(inventoryOperation, 'PENDING', 'INSERT');
    await deleteRecordsForSyncingWithCentralDatabase(inventoryOperationDescription,
      'PENDING',
      'INSERT');

    return createApiResponse(resultInventoryOperation.responseCode,
      inventoryOperation,
      null,
      'Inventory operation created successfully'
    );
  }
}

export async function cleanAllInventoryOperationsFromDatabase() {
  // Deleting inventory
  await deleteAllProducts();

  // Deleting all inventory operations.
  await deleteAllInventoryOperationsDescriptions();
  await deleteAllInventoryOperations();
}

export async function createVendorInventory(inventory:IProductInventory[]) {
  /* Related to the inventory that the vendor will use to sell */
  /* Related to the product information */
  // Storing information in embedded database.

  const resultInsertProducts:IResponse<IProductInventory[]>
    = await insertProducts(inventory);

  if (apiResponseStatus(resultInsertProducts, 201)) {
    /* There is not instructions */
  } else {
    resultInsertProducts.responseCode = 400;
    await deleteAllProducts();
  }

  return resultInsertProducts;
}

/*
  Function to delete the inventory operation in case of process failure.
*/
export async function cancelCreationOfInventoryOperation(inventoryOperation:IInventoryOperation) {
    const {id_inventory_operation} = inventoryOperation;

    const resultInventoryOperation:IResponse<IInventoryOperationDescription[]>
      = await getInventoryOperationDescription(id_inventory_operation);
    let inventoryOperationDescription:IInventoryOperationDescription[]
      = getDataFromApiResponse(resultInventoryOperation);

    // Deleting the current inventory operation
    await deleteInventoryOperationsById(inventoryOperation);

    // Deleting the "descriptions" of the current inventory operation
    await deleteInventoryOperationDescriptionsById(inventoryOperationDescription);

    // Deleting sync records of the operation
    /*
      Since it is a cancelation for inventory opereration creation, the "sync records" were added
      with 'PENDING' and 'INSERTION'.
    */
    await deleteRecordForSyncingWithCentralDatabase(inventoryOperation, 'PENDING', 'INSERT');
    await deleteRecordsForSyncingWithCentralDatabase(
      inventoryOperationDescription,
      'PENDING',
      'INSERT');
}

/*
  Function for desactivate an inventory operation
*/
export async function desactivateInventoryOperation(id_inventory_operation:string) {
  const resultGetInventoryOperation:IResponse<IInventoryOperation[]> =  await getInventoryOperation(
    id_inventory_operation
  );
  const inventoryOperation:IInventoryOperation[] = getDataFromApiResponse(
    resultGetInventoryOperation
  );

  const resultUpdteInventoryOperaion:IResponse<IInventoryOperation> = await updateInventoryOperation(
    {
      ...inventoryOperation[0],
      state: 0,
    }
  );

  const updtedInventoryOperaion = getDataFromApiResponse(resultUpdteInventoryOperaion);

  const resultSyncRecordCreation:IResponse<ISyncRecord> =
    await createRecordForSyncingWithCentralDatabse(updtedInventoryOperaion, 'PENDING', 'UPDATE');

  if (apiResponseStatus(resultGetInventoryOperation, 200)
   && apiResponseStatus(resultUpdteInventoryOperaion, 200)
   && apiResponseStatus(resultSyncRecordCreation, 201)
  ) {
    return createApiResponse(resultUpdteInventoryOperaion.responseCode,
      resultUpdteInventoryOperaion.data,
      resultUpdteInventoryOperaion.error,
      resultUpdteInventoryOperaion.message
    );
  } else {

    await updateInventoryOperation({ ...inventoryOperation[0], state: 1 });
    await deleteRecordForSyncingWithCentralDatabase(updtedInventoryOperaion, 'PENDING', 'UPDATE');

    return createApiResponse(400,
      resultUpdteInventoryOperaion.data,
      resultUpdteInventoryOperaion.error,
      resultUpdteInventoryOperaion.message
    );
  }
}

/*
  Function for cancel the 'desactivation' of an inventory operation
*/
export async function cancelDesactivateInventoryOperation(id_inventory_operation:string) {
  const resultGetInventoryOperation:IResponse<IInventoryOperation[]> =  await getInventoryOperation(
    id_inventory_operation
  );
  const inventoryOperation:IInventoryOperation[] = getDataFromApiResponse(
    resultGetInventoryOperation
  );

  const resultUpdteInventoryOperaion:IResponse<IInventoryOperation> = await updateInventoryOperation({
    ...inventoryOperation[0],
    state: 1,
  });

  const updtedInventoryOperaion = getDataFromApiResponse(resultUpdteInventoryOperaion);

  const resultSyncRecordDeletion:IResponse<null> =
    await deleteRecordForSyncingWithCentralDatabase(updtedInventoryOperaion, 'PENDING', 'UPDATE');

  if (apiResponseStatus(resultGetInventoryOperation, 200)
   && apiResponseStatus(resultUpdteInventoryOperaion, 200)
   && apiResponseStatus(resultSyncRecordDeletion, 200)
  ) {
    return createApiResponse(resultUpdteInventoryOperaion.responseCode,
      resultUpdteInventoryOperaion.data,
      resultUpdteInventoryOperaion.error,
      resultUpdteInventoryOperaion.message
    );
  } else {
    return createApiResponse(400,
      resultUpdteInventoryOperaion.data,
      resultUpdteInventoryOperaion.error,
      resultUpdteInventoryOperaion.message
    );
  }
}


// Getters
export async function getProductForInventoryOperation():Promise<IResponse<IProductInventory[]>> {
  let productInventory:IProductInventory[] = [];
  let allProducts:IProduct[] = [];
  let allProductsEmbeddedDatabase:IProduct[] = [];

  const responseGetAllProducts:IResponse<IProduct[]> = await repository.getAllProducts();

  if(apiResponseStatus(responseGetAllProducts, 200)) {
    allProducts = getDataFromApiResponse(responseGetAllProducts);
    allProducts.map(product => {
      productInventory.push({
        ...product,
        amount: 0,
      });
    });
  } else {
    // If something was wrong, then consult to the local database
    const responseGetAllProductFromEmbeddedDatabase:IResponse<IProductInventory[]>
      =  await getProducts();
    if(apiResponseStatus(responseGetAllProductFromEmbeddedDatabase, 200)) {
        allProductsEmbeddedDatabase = getDataFromApiResponse(
          responseGetAllProductFromEmbeddedDatabase
        );
        allProductsEmbeddedDatabase.map(product => {
        productInventory.push({
          ...product,
          amount: 0,
        });
      });
    } else {
      /*
        It means that it is nt possible to retrieve the products from database and from the
        embedded database
        */
      return createApiResponse(
        400,
        productInventory,
        'It was not possible to retrieve the products netiher the main database nor embedded database.',
        null
      );
    }
  }
  return createApiResponse(
    200,
    productInventory,
    '',
    null
  );
}

export async function getTotalInventoriesOfAllStoresByIdOperationType(
  id_day_operation:string,
  stores:(IStore&IStoreStatusDay)[]
):Promise<(IStore & IStoreStatusDay & { productInventory: IProductInventory[] })[]> {
  //Declare variables of function
  const totalOfProductRelatedToOperationTypeByStore:(IStore & IStoreStatusDay & { productInventory: IProductInventory[] })[] = [];

  // Get infomration from database.
  const arrRouteTransactions:IRouteTransaction[] = getDataFromApiResponse(
    await getAllRouteTransactions());

  const arrRouteTransactionOperations:IRouteTransactionOperation[] = getDataFromApiResponse(
    await getAllRouteTransactionsOperations());

  const arrRouteTransactionOperationDescriptions:IRouteTransactionOperationDescription[]
  = getDataFromApiResponse(await getAllRouteTransactionsOperationDescriptions());

  // Convert information into json.
  const dictRouteTransactions = arrRouteTransactions
  .reduce<Record<string,IRouteTransaction>>((dict,routeTransaction) => {
    const {id_route_transaction} = routeTransaction;
    dict[id_route_transaction] = routeTransaction;
    return dict;
  },{});

  const dictRouteTransactionOperations = arrRouteTransactionOperations
  .reduce<Record<string, IRouteTransactionOperation>>((dict, routeTransactionOperation) => {
    const { id_route_transaction_operation } = routeTransactionOperation;
    dict[id_route_transaction_operation] = routeTransactionOperation;
    return dict;
  }, {});



  const dictStores = stores.reduce<Record<string, IStore & IStoreStatusDay & { dictProductInventory: Record<string, IProductInventory> }>>(
    (dict, store) => {
    const { id_store }  = store;
    dict[id_store] = {
      ...store,
      dictProductInventory: {},
    };
    return dict;
  }, {});

  // Find to which store belongs a 'route transaction operation description'.
    // Taking account the type of operation.
  for(let transactionDescription of arrRouteTransactionOperationDescriptions) {
    const {
      id_route_transaction_operation,
      amount,
      price_at_moment,
      id_product,
    } = transactionDescription;

    if(id_route_transaction_operation !== undefined) {
      if(dictRouteTransactionOperations[id_route_transaction_operation] !== undefined) {
        const {
          id_route_transaction_operation_type,
          id_route_transaction,
        } = dictRouteTransactionOperations[id_route_transaction_operation];
        if (id_route_transaction_operation_type !== undefined) {
          if (id_route_transaction_operation_type === id_day_operation) {
            if (dictRouteTransactions[id_route_transaction] !== undefined) {
              const { id_store, state } = dictRouteTransactions[id_route_transaction];
              // Verifyng the store exists and the transaction is acive
              if (dictStores[id_store] !== undefined && state === 1) {
                const { dictProductInventory } = dictStores[id_store];
                dictStores[id_store].dictProductInventory = addingInformationParticularFieldOfObject(
                  dictProductInventory,
                  id_product,
                  'amount',
                  amount,
                  {
                    ...initialProduct,
                    amount: amount,
                    id_product: id_product,
                    price: price_at_moment,
                  }
                );
              }
            }
          } else {
            /* Other type of operations don't matter. */
          }
        }
      }
    }
  }

  // Convert the json into the interface to retrieve.
  for (let storeKey in dictStores) {
    const {dictProductInventory}  = dictStores[storeKey];
    const arrProducts:IProductInventory[] = [];

    for (let productKey in dictProductInventory) {
      arrProducts.push(dictProductInventory[productKey]);
    }

    totalOfProductRelatedToOperationTypeByStore.push({
      ...dictStores[storeKey],
      productInventory: arrProducts,
    });
  }

  return totalOfProductRelatedToOperationTypeByStore;
}

export async function getTotalInventoryOfAllTransactionByIdOperationType(
  id_day_operation:string,
):Promise<IProductInventory[]> {
  //Declare variables of function
  const totalOfProductRelatedToOperationType:IProductInventory[] = [];
  let dictProducts:Record<string, IProductInventory> = {};

  // Get infomration from database.
  const arrRouteTransactions:IRouteTransaction[] = getDataFromApiResponse(
    await getAllRouteTransactions());

  const arrRouteTransactionOperations:IRouteTransactionOperation[] = getDataFromApiResponse(
    await getAllRouteTransactionsOperations());

  const arrRouteTransactionOperationDescriptions:IRouteTransactionOperationDescription[]
  = getDataFromApiResponse(await getAllRouteTransactionsOperationDescriptions());

  // Convert information into json.
  const dictRouteTransactions = arrRouteTransactions
  .reduce<Record<string,IRouteTransaction>>((dict,routeTransaction) => {
    const {id_route_transaction} = routeTransaction;
    dict[id_route_transaction] = routeTransaction;
    return dict;
  },{});

  const dictRouteTransactionOperations = arrRouteTransactionOperations
  .reduce<Record<string, IRouteTransactionOperation>>((dict, routeTransactionOperation) => {
    const { id_route_transaction_operation } = routeTransactionOperation;
    dict[id_route_transaction_operation] = routeTransactionOperation;
    return dict;
  }, {});

  // Find to which store belongs a 'route transaction operation description'.
  // Taking account the type of operation.
  for(let transactionDescription of arrRouteTransactionOperationDescriptions) {
    const {
      id_route_transaction_operation,
      amount,
      price_at_moment,
      id_product,
    } = transactionDescription;

    console.log("transaction description")
    if(id_route_transaction_operation !== undefined) {
      console.log("route operation")
      if(dictRouteTransactionOperations[id_route_transaction_operation] !== undefined) {
        const {
          id_route_transaction_operation_type,
          id_route_transaction,
        } = dictRouteTransactionOperations[id_route_transaction_operation];
        console.log("route transaction")
        if (id_route_transaction_operation_type !== undefined) {
          console.log("determining operatin day")
          if (id_route_transaction_operation_type === id_day_operation) {
            if (dictRouteTransactions[id_route_transaction] !== undefined) {
              console.log("store")
              const { state } = dictRouteTransactions[id_route_transaction];
              // Verifyng transaction is acive
              if (state === 1) {
                console.log("Adding product: ", amount)
                dictProducts = addingInformationParticularFieldOfObject(
                  dictProducts,
                  id_product,
                  'amount',
                  amount,
                  {
                    ...initialProduct,
                    amount: amount,
                    id_product: id_product,
                    price: price_at_moment,
                  }
                );
              }
            }
          } else {
            /* Other type of operations don't matter. */
          }
        }
      }
    }
  }

  // Convert the json into the interface to retrieve.
  for (let productKey in dictProducts) {
    totalOfProductRelatedToOperationType.push(dictProducts[productKey]);
  }


  return totalOfProductRelatedToOperationType;
}

export async function getStatusOfInventoryOperation(id_inventory_operation:string):Promise<IResponse<IInventoryOperation[]>> {
  return await getInventoryOperation(id_inventory_operation);
}

/*
  Function that retrieves the product from an inventory operation and converts it into
  an array of IProductInventory interface.
*/
export async function getInventoryOperationForInventoryVisualization(id_inventory_operation:string):Promise<IResponse<IProductInventory[]>> {
  const inventoryOperationProducts:IProductInventory[] = [];

  // const resultGetInventoryOperation:IResponse<IInventoryOperation[]> = await getInventoryOperation(
  //   id_inventory_operation
  // );

  // let resultGetinventoryOperation = getDataFromApiResponse(resultGetInventoryOperation);
  const responseGetAllProductFromEmbeddedDatabase:IResponse<IProductInventory[]>
  =  await getProducts();

  const resultGetInventoryOperationDescription:IResponse<IInventoryOperationDescription[]>
    = await getInventoryOperationDescription(id_inventory_operation);

  if(
    apiResponseStatus(resultGetInventoryOperationDescription, 200)
    && apiResponseStatus(responseGetAllProductFromEmbeddedDatabase, 200)
  ) {
    let inventoryOperationDescriptions:IInventoryOperationDescription[] = getDataFromApiResponse(
      resultGetInventoryOperationDescription
    );
    let allProducts:IProduct[] = getDataFromApiResponse(responseGetAllProductFromEmbeddedDatabase);
    inventoryOperationDescriptions.forEach((inventoryOperationDescription) => {
      const foundProduct:IProduct|undefined = allProducts.find((currentProduct) => {
        return inventoryOperationDescription.id_product === currentProduct.id_product;
      });

      if (foundProduct) {
        inventoryOperationProducts.push({
          ...foundProduct,
          amount: inventoryOperationDescription.amount,
          id_product: inventoryOperationDescription.id_product,
          price: inventoryOperationDescription.price_at_moment,
        });
      } else {
        inventoryOperationProducts.push({
          ...initialProduct,
          amount: inventoryOperationDescription.amount,
          id_product: inventoryOperationDescription.id_product,
          price: inventoryOperationDescription.price_at_moment,
        });
      }
    });
  } else {
    /* There is not extra instructions */
  }

  return createApiResponse(
    resultGetInventoryOperationDescription.responseCode,
    inventoryOperationProducts,
    resultGetInventoryOperationDescription.message,
    resultGetInventoryOperationDescription.error,
  );
}

export async function getAllInventoryOperationsForInventoryVisualization():Promise<IResponse<IInventoryOperation[]>> {
  const resultGetAllInventoryOperations:IResponse<IInventoryOperation[]>
    = await getAllInventoryOperations();

  return resultGetAllInventoryOperations;
}

export async function getCurrentVendorInventory():Promise<IProductInventory[]> {
  const responseGetVendorInventory:IResponse<IProductInventory[]> = await getProducts();
  return getDataFromApiResponse(responseGetVendorInventory);
}

// Related to vendor's inventory
export async function updateVendorInventory(
  currentInventory: IProductInventory[],
  inventoryMovements: IProductInventory[],
  isInventoryMovementCancelation: boolean,
) {
  const newInventory:IProductInventory[] = calculateNewInventoryAfterAnInventoryOperation(
    currentInventory,
    inventoryMovements,
    isInventoryMovementCancelation);

  // Updating the inventory in embedded database with the last changes.
  const resultUpdatingInventory:IResponse<IProductInventory[]>
    = await updateProducts(newInventory);


  if (apiResponseStatus(resultUpdatingInventory, 200)) {
    /* There is no extra steps */
  } else {
    resultUpdatingInventory.responseCode = 400;
  }

  return resultUpdatingInventory;

}

export async function setVendorInventory(inventory:IProductInventory[]) {
  return await updateProducts(inventory);
}
