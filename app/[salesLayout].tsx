// Libraries
import React, { useState } from 'react';
import { View, ScrollView, Pressable, Text } from 'react-native';
import tw from 'twrnc';
import Toast from 'react-native-toast-message';
import { Router, useRouter } from 'expo-router';
import { generateUUIDv4 } from '../utils/generalFunctions';

// Redux context.
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { setCurrentOperation, setDayOperationBeforeCurrentOperation, setNextOperation } from '../redux/slices/dayOperationsSlice';

// Interfaces and enums
import {
  IDayOperation,
  IPaymentMethod,
  IProductInventory,
  IResponse,
  IRouteTransaction,
  IRouteTransactionOperation,
  IRouteTransactionOperationDescription,
  IStore,
  IStoreStatusDay,
} from '../interfaces/interfaces';

// Utils
import {
  getGreatTotal,
  getMessageForProductDevolutionOperation,
  getProductDevolutionBalanceWithoutNegativeNumber,
  getTicketSale,
} from '../utils/saleFunction';
import DAYS_OPERATIONS from '../lib/day_operations';

// Components
// import productInventory from '../moocks/productInventory';
import TableProduct from '../components/SalesLayout/TableProduct';
import SaleSummarize from '../components/SalesLayout/SaleSummarize';
import ConfirmationBand from '../components/ConfirmationBand';
import ResultSale from '../components/ResultSale';
import SubtotalLine from '../components/SalesLayout/SubtotalLine';
import PaymentProcess from '../components/SalesLayout/PaymentProcess';
import MenuHeader from '../components/generalComponents/MenuHeader';
import ActionButton from '@/components/SalesLayout/ActionButton';

// Utils
import { timestamp_format } from '../utils/date/momentFormat';

// Services
import { printTicketBluetooth } from '../services/printerService';

// Redux context
import { updateStores } from '../redux/slices/storesSlice';
import { updateProductsInventory } from '../redux/slices/productsInventorySlice';

// Database
import {
  deleteRouteTransactionById,
  deleteRouteTransactionOperationById,
  deleteRouteTransactionOperationDescriptionsById,
  deleteSyncQueueRecord,
  deleteSyncQueueRecords,
  insertDayOperation,
  insertRouteTransaction,
  insertSyncQueueRecord,
  updateProducts,
  updateStore,
} from '../queries/SQLite/sqlLiteQueries';

// Utils
import { apiResponseStatus } from '../utils/apiResponse';
import { createSyncItem, createSyncItems } from '../utils/syncFunctions';
import { syncingRecordsWithCentralDatabase } from '../services/syncService';
import { useGlobalSearchParams } from 'expo-router/build/hooks';

// Controllers
import { 
  createRouteTransactionOperation, 
  createRouteTransactionOperationDescription, 
  getInitialInventoryParametersFromRoute, 
  insertionSyncRecordTransactionOperationAndOperationDescriptions, 
  insertionTransactionOperationsAndOperationDescriptions, 
  productCommitedValidation, 
  substractingProductFromCurrentInventory, 
  validatingIfRepositionIsValid 
} from '@/controllers/SaleController';

import { 
  determinigNextOperation, 
  determiningNextStatusOfStore, 
  updateDayOperations 
} from '@/controllers/DayOperationController';
import { enumStoreStates } from '@/interfaces/enumStoreStates';

function processProductCommitedValidation(
  productInventory:IProductInventory[],
  productsToCommit:IProductInventory[],
  productSharingInventory:IProductInventory[],
  isProductReposition:boolean
):IProductInventory[] {
  const responseProductCommitedValidation:IResponse<IProductInventory[]> = productCommitedValidation(
    productInventory, productsToCommit, productSharingInventory, isProductReposition);

  const {data, responseCode, error} = responseProductCommitedValidation;

  if (responseCode === 400) {
    Toast.show({type: 'error', 
      text1:'Cantidad a vender excede el inventario.', 
      text2: error
    });
  }

  return data;
}

const salesLayout = () => {

  const glob = useGlobalSearchParams();


  // Auxiliar variables
  // Getting information from parameters
  let initialProductDevolution:IProductInventory[] 
  = getInitialInventoryParametersFromRoute(glob.information, 'initialProductDevolution');

  let initialProductResposition:IProductInventory[]
    = getInitialInventoryParametersFromRoute(glob.information, 'initialProductReposition');

  let initialSaleProduct:IProductInventory[]
    = getInitialInventoryParametersFromRoute(glob.information, 'initialProductSale');

  // Redux context definitions
  const dispatch: AppDispatch = useDispatch();
  const currentOperation = useSelector((state: RootState) => state.currentOperation);
  const routeDay = useSelector((state: RootState) => state.routeDay);
  const dayOperations = useSelector((state: RootState) => state.dayOperations);

  const stores = useSelector((state: RootState) => state.stores);
  const productInventory = useSelector((state: RootState) => state.productsInventory);

  // Routing
  const router:Router = useRouter();

  // Use states
  /* States to store the current product according with their context. */
  const [productDevolution, setProductDevolution]
    = useState<IProductInventory[]>(initialProductDevolution);

  const [productReposition, setProductReposition]
    = useState<IProductInventory[]>(processProductCommitedValidation(
      productInventory,
      initialProductResposition,
      initialSaleProduct,
      true));

  const [productSale, setProductSale]
    = useState<IProductInventory[]>(processProductCommitedValidation(
      productInventory,
      initialSaleProduct,
      initialProductResposition,
      false));


  /* States used in the logic of the layout. */
  const [startPaymentProcess, setStartPaymentProcess] = useState<boolean>(false);
  const [finishedSale, setFinishedSale] = useState<boolean>(false);
  const [resultSaleState, setResultSaleState] = useState<boolean>(true);

  // Handlers
  const handleCancelSale = () => {
    router.push('/storeMenuLayout');
  };

  const handleOnGoBack = () => {
    router.push('/storeMenuLayout');
  };

  const handleSalePaymentProcess = () => {
    /* Validating if the product reposition is valid */
    if(!validatingIfRepositionIsValid(productReposition, productDevolution, productReposition)) {
      Toast.show({
        type: 'error',
        text1:'Reposición de producto invalida',
        text2: 'No puedes continuar hasta presentar una propuesta valida para la reposición de producto'});
      setStartPaymentProcess(false);
    } else {
      setStartPaymentProcess(true);
    }
  };

  /*
    According with the workflow of the application, it is not until the vendor confirms
    the payment method (and the extra steps that each payment method requires are done)
    that the sale is closed.
  */

  const handlerPaySale = async (receivedCash:number, paymnetMethod:IPaymentMethod) => {
    /*This handler inserts the sale in the database*/
    /* Validating that the payment a correct state for the payment method*/
    setFinishedSale(true); // Finishing sale payment process.

    // Creating route transaction

    /*
      When a vendor vistis a store, a transaction is created.

      A transaction can contain of one the following "transaction  operations":
        - Sale
        - Product devolution
        - Product Reposition

      It is possible that a transaction doesn't have any "transaction operation", in this way,
      if this case happens, it indicates that the vendor visited the store but it wasn't any operation.

      To determine if it were a transaction operation, it is necessary that the transaction opertation
      counts with at least one transaction operation movement (this one is actual movement inventory and
      cash {inflow/outflow} operations that were made in the visit to the store).
    */
    Toast.show({
      type: 'info',
      text1:'Comenzando proceso para registrar la venta',
      text2: 'Iniciando proceso para registrar la venta'});

    // Variables to perform operations.
    // Variable get the inventory after route transaction.
    const updateInventory:IProductInventory[] = [];

    // Variables used to store the response of the insertions
    // Bands for determine if there was during the process.
    let resultOperationDevolution:boolean = true;
    let resultOperationSale:boolean       = true;
    let resultOperationReposition:boolean = true;

    // Creating transaction
    const routeTransaction:IRouteTransaction = {
      id_route_transaction: generateUUIDv4(),
      date: timestamp_format(),
      state: 1, // Indicating "active transaction"
      cash_received: receivedCash,
      id_work_day: routeDay.id_work_day,
      id_payment_method: paymnetMethod.id_payment_method,
      id_store: currentOperation.id_item, // Item will be the id of the store in question.
    };

    // Creating route transaction operations
    const productDevolutionRouteTransactionOperation:IRouteTransactionOperation
      = createRouteTransactionOperation(routeTransaction, DAYS_OPERATIONS.product_devolution);

    const productRepositionRouteTransactionOperation:IRouteTransactionOperation
      = createRouteTransactionOperation(routeTransaction, DAYS_OPERATIONS.product_reposition);

    const saleRouteTransactionOperation:IRouteTransactionOperation
      = createRouteTransactionOperation(routeTransaction, DAYS_OPERATIONS.sales);


    // Creating description for each type of transaction operation.
    /*
      The information used to create the route transaction operation description
      comes from the states that are in this component.
    */

    // Product devolution
    const productDevolutionRouteTransactionOperationDescription
      :IRouteTransactionOperationDescription[]
      = createRouteTransactionOperationDescription(
        productDevolutionRouteTransactionOperation,
        productDevolution);

    // Sale
    const saleRouteTransactionOperationDescription
      :IRouteTransactionOperationDescription[]
      = createRouteTransactionOperationDescription(
        saleRouteTransactionOperation,
        productSale);

      // Product reposition
    const productRepositionRouteTransactionOperationDescription
      :IRouteTransactionOperationDescription[]
      = createRouteTransactionOperationDescription(
        productRepositionRouteTransactionOperation,
        productReposition);

    /* Updating the inventory substrating it product sale and product reposition from the
        current inventory.

      The intention of this is to get the inventory after the route transaction operations.

      To make this, it is needed to substract the product of the concepts of "selling" and
      "product reposition" from the current operation.

      Once this is done, we got the inventory with the new amounts.

      Note product devolution doesn't have any effect in the current inventory.
      This concept is handler in a different way.
    */
    substractingProductFromCurrentInventory(
      substractingProductFromCurrentInventory(productInventory, productReposition),
      productSale)
        .forEach((updatedProduct:IProductInventory) => { updateInventory.push(updatedProduct); });

    // Storing transaction
    Toast.show({
      type: 'info',
      text1:'Guardando venta',
      text2: 'Registrando los movimientos de la venta.'});

    // Storing the route transaction in the database
    // Updating the status of the store
    const foundStore:(IStore&IStoreStatusDay|undefined) = stores.find(store => store.id_store === currentOperation.id_item);

    const updatedStore:IStore&IStoreStatusDay = determiningNextStatusOfStore(foundStore);

    /*
      Verifying the vendor is not making a second sale to a store that has already
      sold (in the route).

      If the current store is the current operation to do (it is the "turn" of the store
      to be visited), then it means that after this sale, the vendor has to go to the "next
      store" (it is needed to update the current operation).

      Otherwise, it means that the vendor is visiting other store that is not the current one.
    */
    const nextDayOperation:IDayOperation = determinigNextOperation(currentOperation, dayOperations, stores);

    try {
    // Inserting the transaction
    const resultInsertionRouteTransaction:IResponse<IRouteTransaction> = await insertRouteTransaction(routeTransaction);
    
    // Inserting route transaction operations
    // Inserting movements of the route transaction
    resultOperationDevolution = await insertionTransactionOperationsAndOperationDescriptions(productDevolutionRouteTransactionOperation,
      productDevolutionRouteTransactionOperationDescription);

    resultOperationReposition = await insertionTransactionOperationsAndOperationDescriptions(productRepositionRouteTransactionOperation,
      productRepositionRouteTransactionOperationDescription);

    resultOperationSale = await insertionTransactionOperationsAndOperationDescriptions(saleRouteTransactionOperation,
      saleRouteTransactionOperationDescription);
    
    // Updating inventory
    /*
      Sales and product reposition will directly be substracted from the inventory
      (the outflow of these concepts impact to the inventory).

      In the other hand, the product devolutions will not have any effect in the inventory,
      in this case, this movements will be gathered until the end of shift to calculate an
      inventory to determine the "product devolution inventory".
    */
    Toast.show({
      type: 'info',
      text1:'Actualizando inventario',
      text2: 'Registrando cambios en el inventario.'});

    // Updating embedded database
    let resultUpdateProducts:IResponse<IProductInventory[]> = await updateProducts(updateInventory);

    // Updating store's status
    /*
      Once the inventory has been updated successfully, the store's status will be
      updating depending on the context of the store in the route.
    */
    Toast.show({
      type: 'info',
      text1:'Actualizando estatus de la tienda',
      text2: 'Cambiando el estatus de la tienda en la ruta.'});

    let resultUpdatingStore = await updateStore(updatedStore);

    // Updating day operations
    if (updatedStore.route_day_state === enumStoreStates.SPECIAL_SALE) {
      let dayOperation:number = dayOperations.findIndex((dayOperation:IDayOperation) => dayOperation.id_item === updatedStore.id_store);
      
      if (dayOperation === -1) {
        await insertDayOperation(currentOperation);
        dispatch(setDayOperationBeforeCurrentOperation({ ...currentOperation }));
      }
    }
    
    let resultUpdateDayOperations:boolean = await updateDayOperations(currentOperation, nextDayOperation);
    /* Adding records to sync */
    /*
      From all the information created in the process, only the records regarded to the transaction
      itself will be synced with the database.
    */

    // Adding transaction
    const resultSyncInsertionRouteTransaction:IResponse<null>
      = await insertSyncQueueRecord(createSyncItem(routeTransaction, 'PENDING', 'INSERT'));

    // Adding route operations and their route description
    const resultSyncOperationDevolution:boolean
      = await insertionSyncRecordTransactionOperationAndOperationDescriptions(productDevolutionRouteTransactionOperation,
      productDevolutionRouteTransactionOperationDescription);


    const resultSyncOperationReposition:boolean
      = await insertionSyncRecordTransactionOperationAndOperationDescriptions(productRepositionRouteTransactionOperation,
      productRepositionRouteTransactionOperationDescription);

    const resultSyncOperationSale:boolean
      = await insertionSyncRecordTransactionOperationAndOperationDescriptions(
        saleRouteTransactionOperation, saleRouteTransactionOperationDescription);

    // Validating the process was correctly completed
    if (apiResponseStatus(resultInsertionRouteTransaction, 201)
    && resultOperationDevolution
    && resultOperationReposition
    && resultOperationSale
    && apiResponseStatus(resultUpdateProducts, 200)
    && apiResponseStatus(resultUpdatingStore, 200)
    && resultUpdateDayOperations
    && apiResponseStatus(resultSyncInsertionRouteTransaction, 201)
    && resultSyncOperationDevolution
    && resultSyncOperationReposition
    && resultSyncOperationSale
    ) {
      Toast.show({
        type: 'success',
        text1:'Se ha registrado la venta satisfactoriamente.',
        text2: 'Se ha registrado la venta satisfactoriamente.'});

      // Updating redux states
      dispatch(updateProductsInventory(updateInventory));

      /* This store doesn't belong to this day, but it was requested to be visited. */
      // Update redux context
      dispatch(updateStores([ updatedStore ]));

      if (nextDayOperation.id_day_operation !== currentOperation.id_day_operation) {
        // Updating redux state for the current operation
        dispatch(setCurrentOperation(nextDayOperation));
      }

      // Executing a synchronization process to register the start shift inventory
      // Note: In case of failure, the background process will eventually synchronize the records.
      syncingRecordsWithCentralDatabase();

      setResultSaleState(true);
    } else {
      Toast.show({
        type: 'error',
        text1:'Hubo un problema durante el registro de la venta',
        text2: 'Hubo un problema durante el registro de la venta, porfavor, intente nuevamente.'});

      // Deleting route transaction operations descriptions
      await deleteRouteTransactionOperationDescriptionsById(productDevolutionRouteTransactionOperationDescription);
      await deleteRouteTransactionOperationDescriptionsById(productRepositionRouteTransactionOperationDescription);
      await deleteRouteTransactionOperationDescriptionsById(saleRouteTransactionOperationDescription);

      // Deleting route transaction operations
      await deleteRouteTransactionOperationById(productDevolutionRouteTransactionOperation);
      await deleteRouteTransactionOperationById(saleRouteTransactionOperation);
      await deleteRouteTransactionOperationById(productRepositionRouteTransactionOperation);

      // Deleting route transaction
      await deleteRouteTransactionById(routeTransaction);

      // Recoverying inventory to before the transaction
      await updateProducts(productInventory);

      // Recoverying the store state to before the transaction
      if (foundStore !== undefined) {
        await updateStore(foundStore);
      } else { /* The store was not registered in the store to visit today. */ }

      // Recoverying the operations to before the transactions
      await updateDayOperations(nextDayOperation, currentOperation);

      // Deleting sync records
      await deleteSyncQueueRecord(createSyncItem(routeTransaction, 'PENDING', 'INSERT'));
      await deleteSyncQueueRecord(
        createSyncItem(productDevolutionRouteTransactionOperation, 'PENDING', 'INSERT'));
      await deleteSyncQueueRecords(
        createSyncItems(productDevolutionRouteTransactionOperationDescription, 'PENDING', 'INSERT'));
      await deleteSyncQueueRecord(
        createSyncItem(productRepositionRouteTransactionOperation, 'PENDING', 'INSERT'));
      await deleteSyncQueueRecords(
        createSyncItems(productRepositionRouteTransactionOperationDescription, 'PENDING', 'INSERT'));
      await deleteSyncQueueRecord(
        createSyncItem(saleRouteTransactionOperation, 'PENDING', 'INSERT'));
      await deleteSyncQueueRecords(
        createSyncItems(saleRouteTransactionOperationDescription, 'PENDING', 'INSERT'));

      setResultSaleState(false);
    }

    } catch (error) {
      Toast.show({
        type: 'error',
        text1:'Hubo un problema durante el registro de la venta',
        text2: 'Hubo un problema durante el registro de la venta, porfavor, intente nuevamente.'});

      // Deleting route transaction operations descriptions
      await deleteRouteTransactionOperationDescriptionsById(productDevolutionRouteTransactionOperationDescription);
      await deleteRouteTransactionOperationDescriptionsById(productRepositionRouteTransactionOperationDescription);
      await deleteRouteTransactionOperationDescriptionsById(saleRouteTransactionOperationDescription);

      // Deleting route transaction operations
      await deleteRouteTransactionOperationById(productDevolutionRouteTransactionOperation);
      await deleteRouteTransactionOperationById(saleRouteTransactionOperation);
      await deleteRouteTransactionOperationById(productRepositionRouteTransactionOperation);

      // Deleting route transaction
      await deleteRouteTransactionById(routeTransaction);

      // Recoverying inventory to before the transaction
      await updateProducts(productInventory);

      // Recoverying the store state to before the transaction
      if (foundStore !== undefined) {
        await updateStore(foundStore);
      } else { /* The store was not registered in the store to visit today. */ }

      // Recoverying the operations to before the transactions
      await updateDayOperations(nextDayOperation, currentOperation);

      // Deleting sync records
      await deleteSyncQueueRecord(createSyncItem(routeTransaction, 'PENDING', 'INSERT'));
      await deleteSyncQueueRecord(
        createSyncItem(productDevolutionRouteTransactionOperation, 'PENDING', 'INSERT'));
      await deleteSyncQueueRecords(
        createSyncItems(productDevolutionRouteTransactionOperationDescription, 'PENDING', 'INSERT'));
      await deleteSyncQueueRecord(
        createSyncItem(productRepositionRouteTransactionOperation, 'PENDING', 'INSERT'));
      await deleteSyncQueueRecords(
        createSyncItems(productRepositionRouteTransactionOperationDescription, 'PENDING', 'INSERT'));
      await deleteSyncQueueRecord(
        createSyncItem(saleRouteTransactionOperation, 'PENDING', 'INSERT'));
      await deleteSyncQueueRecords(
        createSyncItems(saleRouteTransactionOperationDescription, 'PENDING', 'INSERT'));

      setResultSaleState(false); // Something was wrong during the sale.
    }
  };

  const handlerOnSuccessfullCompletionSale = async () => {
    router.push('/routeOperationMenuLayout');
  };

  const handlerOnFailedCompletionSale = () => {
    // Updating the status of the store and moving to the next operation.
    dispatch(setNextOperation());
    router.push('/routeOperationMenuLayout');
  };

  const handlerOnPrintTicket = async () => {
    try {
      await printTicketBluetooth(getTicketSale(productDevolution,productReposition, productSale));
    } catch(error) {
      Toast.show({
        type: 'error',
        text1:'Hubo un problema de conexción con la impresora.',
        text2: 'No se encontro la impresora, porfavor intente conectarla con el telefono he intente nuevamente.'});
    }
  };

  const handlerOnTryAgain = () => {
    setFinishedSale(false);
    setResultSaleState(false);
  };

  // Related to add product

  // TODO provide validation for the product devolutuon, if there is not product devolution, then delete product reposition
  const handlerSetProductDevolution = (declaredProductDevolution:IProductInventory[]) => {
    if (declaredProductDevolution.length > 0) {
      /* That means that there is product devolution */
    } else {
      /* That means that there is not product devolution, so it is not possible to have product reposition */
      setProductReposition([]);
    }

    setProductDevolution(declaredProductDevolution)
  }

  /*
    Handler that cares the outflow of product.
    It is not possible to sell product that you don't have
  */
  const handlerSetProductReposition = (productsToCommit:IProductInventory[]) => {
    if (validatingIfRepositionIsValid(productsToCommit, productDevolution, productReposition)) {
      setProductReposition(
        processProductCommitedValidation(productInventory, productsToCommit, productSale, true));
    } else {

      if (productDevolution.length > 0) {
        // Toast.show({type: 'error', text1: "Propuesta de cambio imposible.", 
        //   text2: "No es posible excederte mas del valor de la reposición (solo se excedera si el valor unitario del producto es mayor)."});
        Toast.show({type: 'error', text1: "Propuesta de cambio imposible.", 
          text2: "El numero de 'bolsitas a reponer' tiene que ser igual o menor a las 'bolsitas de la merma'."});
        setProductReposition(productReposition)
      } else {
        Toast.show({
          type: 'error', 
          text1: "No se puede agregar una cambio de producto si no existe devolución", 
          text2: "No puedes agregar una reposición de producto ya que no existe devolución"});
      }
    }
  };

  const handlerSetSaleProduct = (productsToCommit:IProductInventory[]) => {
    setProductSale(
      processProductCommitedValidation(productInventory, productsToCommit, productReposition, false));
  };

  return (
    finishedSale === false ?
      <ScrollView
        nestedScrollEnabled={true}
        style={tw`w-full flex flex-col`}>
          {/*
            This dialog contais the process for finishing a sale.
            Steps:
              1- Choose a payment method.
              2- Client pays according to its selection.
          */}
          <PaymentProcess
            transactionIdentifier={routeDay.id_route_day}
            totalToPay={getGreatTotal(productDevolution, productReposition, productSale)}
            paymentProcess={startPaymentProcess}
            onCancelPaymentProcess={setStartPaymentProcess}
            onPaySale={(receivedCash:number, paymnetMethod:IPaymentMethod) => handlerPaySale(receivedCash, paymnetMethod)}/>
        <View style={tw`w-full flex flex-1 flex-col items-center`}>
          <View style={tw`my-3 w-full flex flex-row justify-center items-center`}>
            <MenuHeader onGoBack={handleOnGoBack}/>
          </View>
          <View style={tw`w-full flex flex-row`}>
            <TableProduct
              catalog={productInventory}
              commitedProducts={productDevolution}
              setCommitedProduct={handlerSetProductDevolution}
              sectionTitle={'Devolución de producto'}
              sectionCaption={'(Precios consultados al día de la venta)'}
              totalMessage={'Total de valor de devolución:'}
              />
          </View>
          <View style={tw`w-full flex flex-row`}>
            <TableProduct
              catalog={productInventory}
              commitedProducts={productReposition}
              setCommitedProduct={handlerSetProductReposition}
              sectionTitle={'Reposición de producto'}
              sectionCaption={'(Precios actuales tomados para la reposición)'}
              totalMessage={'Total de valor de la reposición:'}
              />
          </View>
          <View style={tw`flex flex-row my-1`}>
            <SubtotalLine
              description={getMessageForProductDevolutionOperation(productDevolution, productReposition)}
              total={getProductDevolutionBalanceWithoutNegativeNumber(productDevolution,
                    productReposition).toString()}
              fontStyle={'font-bold text-lg'}/>
          </View>
          <View style={tw`flex flex-row w-11/12 border border-solid mt-2`} />
          <View style={tw`w-full flex flex-row`}>
            <TableProduct
              catalog={productInventory}
              commitedProducts={productSale}
              setCommitedProduct={handlerSetSaleProduct}
              sectionTitle={'Productos para vender'}
              sectionCaption={'(Venta sugerida: Última venta)'}
              totalMessage={'Total de la venta:'}
              />
          </View>
          <View style={tw`w-full flex flex-row justify-center my-5`}>
            <SaleSummarize
              productsDevolution={productDevolution}
              productsReposition={productReposition}
              productsSale={productSale}/>
          </View>
        </View>
        <View style={tw`w-full flex flex-row justify-center my-3`}>
          <ActionButton style='h-14 max-w-32 bg-blue-500' onClick={() => {handlerOnPrintTicket()}}>
            <Text>Imprimir ticket</Text>
          </ActionButton>
        </View>
        <ConfirmationBand
          textOnAccept={'Continuar'}
          textOnCancel={'Cancelar operación'}
          handleOnAccept={handleSalePaymentProcess}
          handleOnCancel={handleCancelSale}/>
        <View style={tw`flex flex-row mt-10`} />
      </ScrollView>
      :
      <ResultSale
        onSuccessfullCompletion={handlerOnSuccessfullCompletionSale}
        onPrintTicket={handlerOnPrintTicket}
        onFailedCompletion={handlerOnFailedCompletionSale}
        onTryAgain={handlerOnTryAgain}
        resultSaleState={resultSaleState}/>
  );
};

export default salesLayout;
