// Libraries
import store from '../redux/store';

// Embedded database
import {
  insertDayOperations,
  insertDayOperation,
  deleteAllDayOperations,
  getDayOperations,
} from '../queries/SQLite/sqlLiteQueries';

// Interfaces
import {
  IRouteDayStores,
  IDayOperation,
  IInventoryOperation,
  IResponse,
 } from '../interfaces/interfaces';

// Utils
import { planningRouteDayOperations } from '../utils/routesFunctions';
import {
  apiResponseProcess,
  apiResponseStatus,
  getDataFromApiResponse,
} from '../utils/apiResponse';
import { isTypeIInventoryOperation } from '../utils/guards';
import { generateUUIDv4 } from '../utils/generalFunctions';
import DAYS_OPERATIONS from '@/lib/day_operations';


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
    idTypeOperation = operation.id_inventory_operation;
    idItem = operation.id_inventory_operation_type;
  }

  const newDayOperation:IDayOperation = createDayOperationConcept(idTypeOperation, idItem, 0, 0);
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
