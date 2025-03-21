// Libraries
import store from '../redux/store';

// Embedded database
import {
  insertDayOperations,
  insertDayOperation,
  deleteAllDayOperations,
  getDayOperations,
  updateDayOperation,
} from '../queries/SQLite/sqlLiteQueries';

// Interfaces
import {
  IRouteDayStores,
  IDayOperation,
  IInventoryOperation,
  IResponse,
  IStore,
  IStoreStatusDay,
 } from '../interfaces/interfaces';
 import { enumStoreStates } from '@/interfaces/enumStoreStates';

// Utils
import { planningRouteDayOperations } from '../utils/routesFunctions';
import {
  apiResponseProcess,
  apiResponseStatus,
  getDataFromApiResponse,
} from '../utils/apiResponse';
import { isTypeIInventoryOperation } from '../utils/guards';
import { generateUUIDv4 } from '../utils/generalFunctions';
import { determineRouteDayState } from '@/utils/routeDayStoreStatesAutomata';
import DAYS_OPERATIONS from '@/lib/day_operations';



const initialStateStore:IStore&IStoreStatusDay = {
  id_store: '',
  street: '',
  ext_number: '',
  colony: '',
  postal_code: '',
  address_reference: '',
  store_name: '',
  owner_name: '',
  cellphone: '',
  latitude: '',
  longuitude: '',
  id_creator: 0,
  creation_date: '',
  creation_context: '',
  status_store: '',
  route_day_state: 0,
};


/*
  Related to day operations
*/
export function createDayOperationConcept(
  idItem:string,
  idTypeOperation:string,
  operationOrder:number,
  currentOperation:number
):IDayOperation {
  const dayOperation:IDayOperation = {
    id_day_operation: '',
    id_item: '', //At this point the inventory hasn't been created.
    id_type_operation: '',
    operation_order: 0,
    current_operation: 0,
  };
  try {
    // Creating a day operation (day operation resulted from the ivnentory operation).
    dayOperation.id_day_operation = generateUUIDv4();
    dayOperation.id_item = idItem;
    dayOperation.id_type_operation = idTypeOperation;
    dayOperation.operation_order = operationOrder;
    dayOperation.current_operation = currentOperation;

    return dayOperation;
  } catch (error) {
    return dayOperation;
  }
}

export async function appendDayOperation(operation:any):Promise<IResponse<IDayOperation>> {
  const reduxState = store.getState();
  const dayOperations:IDayOperation[] = reduxState.dayOperations;
  const newListDayOperations:IDayOperation[] = [];

  let idTypeOperation:string = '';
  let idItem:string = '';

  if(isTypeIInventoryOperation(operation)) {
    idTypeOperation = operation.id_inventory_operation;
    idItem = operation.id_inventory_operation_type;
  }

  const newDayOperation:IDayOperation = createDayOperationConcept(idTypeOperation, idItem, 0, 0);

  // Creating a copy of the list of the day operations.
  dayOperations.forEach(dayOperation => { newListDayOperations.push(dayOperation); });

  // Since it is the end shift operation, it is exected that it is going to be the last operation.
  newListDayOperations.push(newDayOperation);

  // Replacing the entire list of day operations in embedded datbase.
  // Delete all the information from the database.
  const resultDeletionAllDayOperations:IResponse<null> = await deleteAllDayOperations();

  // Store information in embedded database.
  const resultInsertionDayOperations:IResponse<any>
    = await insertDayOperations(newListDayOperations);

  if(apiResponseStatus(resultInsertionDayOperations, 201)
  && apiResponseStatus(resultDeletionAllDayOperations, 200)) {
    /* There is no instructions */
  } else {
    resultInsertionDayOperations.responseCode = 400;
    // Reverting the day operation to the previous stage
    await deleteAllDayOperations();
    await insertDayOperations(dayOperations);
  }
  resultInsertionDayOperations.data = newDayOperation;
  return resultInsertionDayOperations;
}

export async function createDayOperationBeforeTheCurrentOperation(operation:any)
:Promise<IResponse<IDayOperation>> {
  const reduxState = store.getState();
  const dayOperations:IDayOperation[] = reduxState.dayOperations;

  let idTypeOperation:string = '';
  let idItem:string = '';

  if(isTypeIInventoryOperation(operation)) {
    idItem = operation.id_inventory_operation;
    idTypeOperation = operation.id_inventory_operation_type;
  }

  const newDayOperation:IDayOperation = createDayOperationConcept(idItem, idTypeOperation, 0, 0);
  const newListDayOperations:IDayOperation[] = [];

  /* Getting the index of the current operation*/
  const index = dayOperations.findIndex(dayOperation => dayOperation.current_operation === 1);

  // Creating a copy of the list of the day operations.
  dayOperations.forEach(dayOperation => { newListDayOperations.push(dayOperation); });

  if (index === -1) { // Case on which the re-stock operation is the last operation in the day.
    newListDayOperations.push(newDayOperation);
  } else { // Case on which the re-stock operation is at the middle of the day (between other day operations).
    newListDayOperations.splice(index, 0, newDayOperation);
  }

  // Replacing the entire list of day operations in embedded datbase.
  // Delete all the information from the database.
  const resultDeletionAllDayOperations:IResponse<null> = await deleteAllDayOperations();

  // Store information in embedded database.
  const resultInsertionAllDayOperations:IResponse<any>
    = await insertDayOperations(newListDayOperations);

  if(apiResponseStatus(resultInsertionAllDayOperations, 201)
  && apiResponseStatus(resultDeletionAllDayOperations, 200)) {
    /* There is no instructions */

  } else {
    resultInsertionAllDayOperations.responseCode = 400;
    // Reverting the day operation to the previous stage
    await deleteAllDayOperations();
    await insertDayOperations(dayOperations);
  }

  resultInsertionAllDayOperations.data = newDayOperation;
  return resultInsertionAllDayOperations;
}

/*
  Function for determining if the inventory operation might be modifiable
*/
export function determineIfInventoryOperationIsModifiable(dayOperations:IDayOperation[], currentOperation:IDayOperation):boolean {
  let isCurrentInventoryOperationModifiable:boolean = false;
  
  const index = dayOperations.findIndex((dayOperation) => {
    return dayOperation.id_day_operation === currentOperation.id_day_operation;
  });

  if (index !== -1) {
    if (currentOperation.id_type_operation === DAYS_OPERATIONS.end_shift_inventory
     || currentOperation.id_type_operation === DAYS_OPERATIONS.product_devolution_inventory) {
      /* Per day, there is only 1 product devolution and 1 final inventory.
        However, it might be another records of these types working as historic records.

        These two type of records are always modifiables.
      */
      let isOtherOperationOfTheSameTypeAbove:boolean = false;
      const { id_type_operation } = currentOperation;

      for(let i = index + 1; i < dayOperations.length; i++) {
        const dayOperation:IDayOperation = dayOperations[i];
        // Verifyng there is not another product devolution operation above
        if(dayOperation.id_type_operation === id_type_operation) {
          isOtherOperationOfTheSameTypeAbove = true;
          break;
        }
      }

      if (isOtherOperationOfTheSameTypeAbove) {
        isCurrentInventoryOperationModifiable = false;
      } else {
        isCurrentInventoryOperationModifiable = true;
      }
    } else {
      // Verifying the inventory is the last operation (excluding product devolution inventory)
      let isNextOperationCurrentOne:boolean = false;
      let isAnotherInventoryOperationAbove:boolean = false;
      if (dayOperations[index + 1].current_operation === 1) {
        isNextOperationCurrentOne = true;
      } else {
        isNextOperationCurrentOne = false;
      }

      // Checking if there is another inventory operation above.
      for(let i = index + 1; i < dayOperations.length; i++) {
        const dayOperation:IDayOperation = dayOperations[i];
        if (dayOperation.id_type_operation === DAYS_OPERATIONS.start_shift_inventory) {
          isAnotherInventoryOperationAbove = true;
        } else if(dayOperation.id_type_operation === DAYS_OPERATIONS.restock_inventory) {
          isAnotherInventoryOperationAbove = true;
        } else if(dayOperation.id_type_operation === DAYS_OPERATIONS.end_shift_inventory) {
          isAnotherInventoryOperationAbove = true;
        } else {
          /* Other operations that doesn't affetc */
        }
      }

      if(isAnotherInventoryOperationAbove === false && isNextOperationCurrentOne === true) {
        isCurrentInventoryOperationModifiable = true;
      } else {
        isCurrentInventoryOperationModifiable = false;
      }
    }
  } else {
    /* It means the record was not found in the array. */
    isCurrentInventoryOperationModifiable = false;
  }

  // Determining if the inventory is modifiable
  return isCurrentInventoryOperationModifiable;
}


/* Function for creating the list of operation for the day */
export async function createListOfDayOperations(
  startInventoryOperation:IInventoryOperation,
  storesOftheDay:IRouteDayStores[]
):Promise<IResponse<IDayOperation[]>> {

  // Always is the first operation of the day.
  const {
    id_inventory_operation,
    id_inventory_operation_type,
  } = startInventoryOperation;


  const newDayOperation:IDayOperation = createDayOperationConcept(
    id_inventory_operation,
    id_inventory_operation_type,
    0,
    0
  );

  const resultInsertDayOperation:IResponse<IDayOperation>
    = await insertDayOperation(newDayOperation);

  // Getting the rest of the day operations (the stores that are going to be visited)
  let dayOperationsOfStores:IDayOperation[] = planningRouteDayOperations(storesOftheDay);

  // Storing in embedded database
  if (dayOperationsOfStores.length > 0) {
    // The first store of the route is now the new current operation.
    dayOperationsOfStores[0].current_operation = 1;
  } else {
    // It means that there are not stores in the route day
  }

  const resultInsertDayOperations:IResponse<IDayOperation[]>
    = await insertDayOperations(dayOperationsOfStores);

  if (apiResponseProcess(resultInsertDayOperation, 201)
  && apiResponseProcess(resultInsertDayOperations, 201)) {
    const firstOperation:IDayOperation = getDataFromApiResponse(resultInsertDayOperation);
    resultInsertDayOperations.data.unshift(firstOperation);
  } else {
    deleteAllDayOperations();
    resultInsertDayOperations.responseCode = 500;
  }


  return resultInsertDayOperations;
}

export async function setDayOperations(dayOperations:IDayOperation[])
:Promise<IResponse<IDayOperation[]>> {
  await deleteAllDayOperations();
  return await insertDayOperations(dayOperations);
}

export async function cleanAllDayOperationsFromDatabase() {
  return await deleteAllDayOperations();
}

export async function getDayOperationsOfTheWorkDay():Promise<IResponse<IDayOperation[]>> {
  return await getDayOperations();
}

/* Function to update the day operations */
export async function updateDayOperations(currentOperation: IDayOperation, nextDayOperation: IDayOperation):Promise<boolean> {
  try {
    let resultProcess:boolean = true;
    let resultUpdateCurrentDay:IResponse<IDayOperation>;
    let resultUpdateNextDay:IResponse<IDayOperation>;

    if (currentOperation.id_day_operation !== nextDayOperation.id_day_operation) {
      // Update embedded database.
      resultUpdateCurrentDay = await updateDayOperation({
        ...currentOperation,
        current_operation: 0,
      });

      resultUpdateNextDay = await updateDayOperation({
        ...nextDayOperation,
        current_operation: 1,
      });

      if (apiResponseStatus(resultUpdateCurrentDay, 200)
      && apiResponseStatus(resultUpdateNextDay, 200)) {
        resultProcess = true;
      } else {
        resultProcess = false;
      }
    } else {
      /* It means, there is not a new current day. The current day remains */
    }

    return resultProcess;

  } catch (error) {
    return false;
  }
}

/*
  This function helps to determine if there is necessary to update the current day operation.

  If it is necessary to update, the fucntion will return the next day operation, otherwise, it will 
  return the current day operation.
*/
export function determinigNextOperation(currentOperation: IDayOperation,
  dayOperations: IDayOperation[],
  stores:(IStore&IStoreStatusDay)[]
):IDayOperation {
  let nextDayOperation:IDayOperation = { ...currentOperation };

  /* Determining if moving to the next operation. */
  if (currentOperation.current_operation) {
    /* Moving to the next operation */
    // Updating embedded database
    const index = dayOperations
      .findIndex(operation => { return operation.id_item === currentOperation.id_item; });

    if (index > -1) { // The operation is in the list of day operations to do.
      if (index + 1 < dayOperations.length) { // Verifying it is not the last day operation.
        let candidateNextDayOperation:IDayOperation = dayOperations[index + 1];
        /*
          The vendor can follow the order of the route but also, he can
          sell to any store, it doesn't matter if the store is the next one or
          not, so it is needed to "find" the next day operation, not necessarily
          the next operation in the list.
        */
        // Searching the day operation (next store in status of pending)
        // For always going to start in the next day operation.
        for (let i = index + 1; i < dayOperations.length; i++) {
            // Finding in the array of stores that one that corresponds to the day operation
            const currentStore = stores.find((store:IStore&IStoreStatusDay) => {
              return dayOperations[i].id_item === store.id_store;
            });

            if(currentStore !== undefined) {
              if(currentStore.route_day_state === enumStoreStates.PENDING_TO_VISIT
              || currentStore.route_day_state === enumStoreStates.REQUEST_FOR_SELLING) {
                /*
                  Store gathers the criteria to be the next current operation.

                  Remember that:
                  - PENDING TO VISIT: It is the state on which the store belogns to the current
                  workday but it hasn't been visited.
                  - REQUEST FOR VISTING: It is the state on which the store doesn't belongs
                  to the current workday but they asked to be visited today.
                */
                candidateNextDayOperation = dayOperations[i];
                break;
              } else {
                /* There is not instructions; Store doesn't accomplish the criteria. */
              }
            } else {
              /* There is not instructions; Store doesn't exists in the "stores" state */
            }
        }

      nextDayOperation = { ...candidateNextDayOperation };

      } else {
        /*
          If it is the last operation, then it is not needed to move to the next one because
          the vendor is already in the last one.
        */
      }
    } else { /* There is not instructions. */ }
  } else {
    /*
      If the current store is not the current operation, then, it is not needed to make
      anything.

      The pointer that points to the current operation is only going to move when the store
      that is being selling is current operation.

      In this context, the vendor is selling a store that has already visited or
      that is pending to visit.
    */
  }

  return nextDayOperation;
}

export function determiningNextStatusOfStore(foundStore: IStore&IStoreStatusDay|undefined):IStore&IStoreStatusDay {
  // Creating variable to store the new status
  let updatedStore:IStore&IStoreStatusDay = { ...initialStateStore };
  console.log("Store to update: ", foundStore, " - route day state: ", foundStore?.route_day_state)
  if (foundStore !== undefined) {
    const { route_day_state } = foundStore;
    if(route_day_state === enumStoreStates.PENDING_TO_VISIT) { // The store is part of the route day
      updatedStore = {
        ...foundStore,
        route_day_state: determineRouteDayState(foundStore.route_day_state, 2),
      };
    } else if (route_day_state === enumStoreStates.REQUEST_FOR_SELLING) { // Store that doesn't belong to the route day, but he requested to be visited.
      updatedStore = {
        ...foundStore,
        route_day_state: determineRouteDayState(foundStore.route_day_state, 4),
      };
    } else if (route_day_state === enumStoreStates.NUETRAL_STATE) { // Store that had an spontaneous sale. The store doesn't belong to the route day and the store didn't request to be visited.
      updatedStore = {
        ...foundStore,
        route_day_state: determineRouteDayState(foundStore.route_day_state, 5),
      };
      console.log('SPECIAL SALE: ', updatedStore)
    } else {
      updatedStore = { ...foundStore };
    }
  } else {
    /* If the store is not in the set of day status, then, it means that it is a new client. */
    updatedStore = {
      ...initialStateStore,
      route_day_state: determineRouteDayState(enumStoreStates.NUETRAL_STATE, 6)
    }
  }

  return updatedStore;

}