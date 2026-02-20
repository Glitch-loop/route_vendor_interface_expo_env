// Libraries
import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, KeyboardAvoidingView } from 'react-native';
import tw from 'twrnc';
import { Router, useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router/build/hooks';

// Redux context.
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { setProductInventory } from '@/redux/slices/productsInventorySlice';
import { setDayOperations } from '@/redux/slices/dayOperationsSlice';

// UI Components
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import TableProduct from '@/components/sale-layout/table-product/TableProduct';
import SaleSummarize from '@/components/sale-layout/SaleSummarize';
import ConfirmationBand from '@/components/shared-components/ConfirmationBand';
import ResultSale from '@/components/sale-layout/ResultSale';
import SubtotalLine from '@/components/sale-layout/SubtotalLine';
import PaymentProcess from '@/components/sale-layout/payment/PaymentProcess';
import MenuHeader from '@/components/shared-components/MenuHeader';
import ActionButton from '@/components/sale-layout/table-product/ActionButton';
import ProjectButton from '@/components/shared-components/ProjectButton';

// Mapper and DTOs
import RouteTransactionDescriptionDTO from '@/src/application/dto/RouteTransactionDescriptionDTO';
import ProductInventoryDTO from "@/src/application/dto/ProductInventoryDTO";
import ProductDTO from '@/src/application/dto/ProductDTO';
import StoreDTO from '@/src/application/dto/StoreDTO';
import DayOperationDTO from '@/src/application/dto/DayOperationDTO';

// Use cases and queries
import { container as di_container } from '@/src/infrastructure/di/container';
import RegisterNewRouteTransaction from '@/src/application/commands/RegisterNewRouteTransaction';
import RetrieveCurrentShiftInventoryQuery from '@/src/application/queries/RetrieveCurrentShiftInventoryQuery';
import RetrieveDayOperationQuery from '@/src/application/queries/RetrieveDayOperationQuery';
import RetrieveRouteTransactionByIDQuery from '@/src/application/queries/RetrieveRouteTransactionByIDQuery';
import VisitClientOutOfRouteUseCase from '@/src/application/commands/VisitClientOutOfRouteUseCase';

// Services
import { BluetoothPrinterService } from '@/src/infrastructure/services/BluetoothPrinterService';

// Utils
import { 
  getProductDevolutionBalanceWithoutNegativeNumber,
  getMessageForProductDevolutionOperation,
  getGreatTotal,
  productCommitedValidation,
  getTicketSale
} from '@/utils/route-transaciton/utils';
import PAYMENT_METHODS from '@/src/core/enums/PaymentMethod';
import { DAY_OPERATIONS } from '@/src/core/enums/DayOperations';
import { createMapProductInventoryWithProduct } from '@/utils/inventory/utils';
import DataReplicationService from '@/src/infrastructure/services/DataReplicationService';
import RouteTransactionDTO from '@/src/application/dto/RouteTransactionDTO';

// function productCommitedValidation(
//   productInventory: Map<string, ProductInventoryDTO>,
//   productsToCommit:RouteTransactionDescriptionDTO[],
//   productSharingInventory:RouteTransactionDescriptionDTO[],
//   isProductReposition:boolean
// ):RouteTransactionDescriptionDTO[] {
//   return productCommitedValidation(
//     productInventory, productsToCommit, productSharingInventory, isProductReposition);

//   // const {data, responseCode, error} = responseProductCommitedValidation;

//   // if (responseCode === 400) {
//   //   Toast.show({type: 'error', 
//   //     text1:'Cantidad a vender excede el inventario.', 
//   //     text2: error
//   //   });
//   // }

//   // return data;
// }

function pushProductToCommitList(productsToCommit:RouteTransactionDescriptionDTO[], productMovement: RouteTransactionDescriptionDTO) {
  const productToCommitForValidation: RouteTransactionDescriptionDTO[] = [];
  const { id_product_inventory } = productMovement;
  const index:number = productsToCommit.findIndex((product: RouteTransactionDescriptionDTO) => product.id_product_inventory === id_product_inventory);
  
  if (index === -1) {
    // New product to commit
    productToCommitForValidation.push(...productsToCommit, {...productMovement});
  } else {
    // Product already in the list, updating amount
    productsToCommit.forEach((product: RouteTransactionDescriptionDTO, idx:number) => {
      if (idx === index) {
        productToCommitForValidation.push({...productMovement});
      } else {
        productToCommitForValidation.push({...product});
      }
    });
  }

  return productToCommitForValidation;
}

type typeSearchParams = {
  id_store_search_param: string;
  id_day_operation_dependent_search_param?: string;
  id_route_transaction_search_param?: string;
  is_selling_out_of_route?: string;
}

const salesLayout = () => {
  const params = useLocalSearchParams<typeSearchParams>();

  const {
    id_store_search_param,
    id_day_operation_dependent_search_param,
    id_route_transaction_search_param,
    is_selling_out_of_route
  } = params as typeSearchParams;

  const printerService = di_container.resolve<BluetoothPrinterService>(BluetoothPrinterService);

  // Redux context definitions
  const dispatch: AppDispatch = useDispatch();
  const productInventory      = useSelector((state: RootState) => state.productsInventory);
  const availableProducts     = useSelector((state: RootState) => state.products);
  const workDayInformation    = useSelector((state: RootState) => state.workDayInformation);
  const stores                = useSelector((state: RootState) => state.stores);
  const userSessionReduxState = useSelector((state: RootState) => state.user);

  useEffect(() => {

    setpUpSalesLayout();
  }, [productInventory, availableProducts])

  // Routing
  const router:Router = useRouter();

  // Use states
  /* States to store the current product according with their context. */
  const [productDevolution, setProductDevolution] = useState<RouteTransactionDescriptionDTO[]>([]);

  const [productReposition, setProductReposition] = useState<RouteTransactionDescriptionDTO[]>([]);

  const [productSale, setProductSale] = useState<RouteTransactionDescriptionDTO[]>([]);

  const [productInventoryMap, setProductInventoryMap] = useState<Map<string, ProductInventoryDTO&ProductDTO> | undefined>(undefined);

  const [newRouteTransaction, setNewRouteTransaction] = useState<RouteTransactionDTO | null>(null);

  /* States used in the logic of the layout. */
  const [startPaymentProcess, setStartPaymentProcess] = useState<boolean>(false);
  const [finishedSale, setFinishedSale] = useState<boolean>(false);
  const [resultSaleState, setResultSaleState] = useState<boolean>(true);

  // Use effect
  const setpUpSalesLayout = async () => {
    // Setting up initial states for the sale layout.
    if (productInventory !== null && availableProducts !== null) {
      const productInventoryMapLocal = createMapProductInventoryWithProduct(productInventory, availableProducts)
      setProductInventoryMap(productInventoryMapLocal);

      if (id_route_transaction_search_param !== undefined) {
        const retrieve_route_transaction_by_id = di_container.resolve<RetrieveRouteTransactionByIDQuery>(RetrieveRouteTransactionByIDQuery);
        const routeTransactions = await retrieve_route_transaction_by_id.execute([ id_route_transaction_search_param ]);
  
        if (routeTransactions.length > 0) {
          const routeTransaction = routeTransactions[0];
          const devolutionMovements = routeTransaction.transaction_description.filter((movement => movement.id_transaction_operation_type === DAY_OPERATIONS.product_devolution));
          const repositionMovements = routeTransaction.transaction_description.filter((movement => movement.id_transaction_operation_type === DAY_OPERATIONS.product_reposition));
          const saleMovements = routeTransaction.transaction_description.filter((movement => movement.id_transaction_operation_type === DAY_OPERATIONS.sales));
        
          setProductDevolution(devolutionMovements);
          setProductReposition(
            productCommitedValidation(
              productInventoryMapLocal, 
              repositionMovements, 
              saleMovements, 
              true
            )
          );
  
          setProductSale(
            productCommitedValidation(
              productInventoryMapLocal, 
              saleMovements, 
              repositionMovements, 
              false
            )
          );
        
        }
  
      }   
    }
  }

  // Handlers
  const handleCancelSale = () => { router.back(); };

  const handleOnGoBack = () => { router.back(); };

  const handleSalePaymentProcess = () => {
    /* Validating if the product reposition is valid */
    // TODO: Define if this validation will be needed.
    // if(!validatingIfRepositionIsValid(productReposition, productDevolution, productReposition)) {
    //   Toast.show({
    //     type: 'error',
    //     text1:'Reposición de producto invalida',
    //     text2: 'No puedes continuar hasta presentar una propuesta valida para la reposición de producto'});
    //   setStartPaymentProcess(false);
    // } else {
    // }
    setStartPaymentProcess(true);
  };

  /*
    According with the workflow of the application, it is not until the vendor confirms
    the payment method (and the extra steps that each payment method requires are done)
    that the sale is closed.
  */
  const handlePaySale = async (receivedCash:number, paymentMethod:PAYMENT_METHODS) => {
    const registerNewRouteTransactionCommand = di_container.resolve<RegisterNewRouteTransaction>(RegisterNewRouteTransaction);
    const visitClientOutOfRouteCommand = di_container.resolve<VisitClientOutOfRouteUseCase>(VisitClientOutOfRouteUseCase);

    setFinishedSale(true); // Finishing sale payment process.

    if (workDayInformation === null || id_store_search_param === undefined && (id_day_operation_dependent_search_param === undefined || is_selling_out_of_route === undefined)) {
      Toast.show({
        type: 'error',
        text1:'Error interno',
        text2: 'No se pudo completar la venta, porfavor reinicie sesión.'});
      return;
    }


    Toast.show({
      type: 'info',
      text1:'Comenzando proceso para registrar la venta',
      text2: 'Iniciando proceso para registrar la venta'});
    
    try {
      let id_day_operation_dependent: string|null = null;
      if (is_selling_out_of_route === '1') {
        // Todo: Implement route transaction for client out the route.
        const visitedClientOutOfRoute: DayOperationDTO|null = await visitClientOutOfRouteCommand.execute(id_store_search_param);
        if (visitedClientOutOfRoute !== null) {
          const { id_day_operation } = visitedClientOutOfRoute;
          id_day_operation_dependent = id_day_operation;
        }
      } else if(id_day_operation_dependent_search_param !== undefined) {
        id_day_operation_dependent = id_day_operation_dependent_search_param;
      }

      if (id_day_operation_dependent === null) {
         Toast.show({
          type: 'error',
          text1:'Error interno',
          text2: 'No se pudo completar la venta, porfavor reinicie sesión.'});
        return;
      }
      
      const newRouteTransaction = await registerNewRouteTransactionCommand.execute(
        [...productDevolution, ...productReposition, ...productSale],
        workDayInformation!,
        paymentMethod,
        receivedCash,
        id_store_search_param,
        id_day_operation_dependent
      );
      setNewRouteTransaction(newRouteTransaction);

      const retrieveCurrentShiftInventory = di_container.resolve<RetrieveCurrentShiftInventoryQuery>(RetrieveCurrentShiftInventoryQuery);
      const retrieveDayOperationQuery = di_container.resolve<RetrieveDayOperationQuery>(RetrieveDayOperationQuery);
            
      const newInventory = await retrieveCurrentShiftInventory.execute();
      const newDayOperationsList = await retrieveDayOperationQuery.execute();
      
      dispatch(setDayOperations(newDayOperationsList));
      dispatch(setProductInventory(newInventory));

      Toast.show({
        type: 'success',
        text1:'Se ha registrado la venta satisfactoriamente.',
        text2: 'Se ha registrado la venta satisfactoriamente.'});
        
      // Syncing with central database
      if (userSessionReduxState !== null) {
        const syncingService = di_container.resolve<DataReplicationService>(DataReplicationService);
        syncingService.executeReplicationSession(userSessionReduxState);
      }

        setResultSaleState(true);
      } catch (error) {
        console.error("Error during registering route transaction: ", error);
        Toast.show({
          type: 'error',
          text1:'Hubo un problema durante el registro de la venta',
          text2: 'Hubo un problema durante el registro de la venta, porfavor, intente nuevamente.'});
        
        setResultSaleState(false);
    }

  }

  const handleOnSuccessfullCompletionSale = async () => { router.push('/routeOperationMenuLayout'); };

  const handleOnFailedCompletionSale = () => { router.push('/routeOperationMenuLayout'); };

  const handlePrintTicket = async () => {
    if (productInventoryMap === undefined) {
      Toast.show({
        type: 'error',
        text1: 'No se pudo imprimir el ticket de la venta.',
        text2: 'Intenta recargar la pagina nuevamente.'});
      return;
    }

    if (productDevolution.length === 0 && productReposition.length === 0 && productSale.length === 0) {
      Toast.show({
        type: 'info',
        text1: 'No hay movimientos para imprimir el ticket de la venta.',
        text2: 'Agrega movimientos antes de intentar imprimir el ticket.'});
      return;
    }

    try {      
      let storeToConsult:StoreDTO|undefined = undefined;
      let ticketToPrint: string = '';



      if (stores !== null) storeToConsult = stores.find((storeItem:StoreDTO) => storeItem.id_store === id_store_search_param);

      if (finishedSale) {          
          ticketToPrint = getTicketSale(
            productInventoryMap,
            productDevolution,
            productReposition,
            productSale,
            newRouteTransaction === null ? undefined : newRouteTransaction,
            storeToConsult,
            userSessionReduxState
          );
      } else {
        ticketToPrint = getTicketSale(
          productInventoryMap,
          productDevolution,
          productReposition,
          productSale,
          undefined, // At this point, the route transacion doesn't exist, it only exsits the movements of the route transaction.
          storeToConsult,
          userSessionReduxState
        );
      }

      // Set up printer
      await printerService.getConnectedPrinter();
      await printerService.printTicket(ticketToPrint);

    } catch(error) {
      Toast.show({
        type: 'error',
        text1:'Hubo un problema de conexión con la impresora.',
        text2: 'Verifica que la impresora este conectada e intenta nuevamente.'});
    }
  };

  const handleOnTryAgain = () => {
    setFinishedSale(false);
    setResultSaleState(false);
  };

  // Related to add product

  // TODO provide validation for the product devolutuon, if there is not product devolution, then delete product reposition
  const handlerSetProductDevolution = (declaredProductDevolution: RouteTransactionDescriptionDTO[], item: ProductDTO&ProductInventoryDTO|null, amountToSet: number) => {
    if (declaredProductDevolution.length > 0) {
      /* That means that there is product devolution */
    } else {
      /* That means that there is not product devolution, so it is not possible to have product reposition */
      setProductReposition([]);
    }

    if (item === null) {
      setProductDevolution(declaredProductDevolution);
    } else {
    const {id_product, price_at_moment, id_product_inventory} = item;
    
    const newRouteTransactionDescription:RouteTransactionDescriptionDTO = {
        id_route_transaction_description: '',
        price_at_moment: price_at_moment,
        amount: amountToSet,
        created_at: new Date(),
        id_transaction_operation_type: DAY_OPERATIONS.product_devolution,
        id_product: id_product,
        id_route_transaction: '',
        id_product_inventory: id_product_inventory,
    };

    setProductDevolution(pushProductToCommitList(declaredProductDevolution, newRouteTransactionDescription))
    }

  }

  /*
    Handler that cares the outflow of product.
    It is not possible to sell product that you don't have
  */
  const handleSetProductReposition = (productsToCommit: RouteTransactionDescriptionDTO[], item: ProductDTO&ProductInventoryDTO|null, amountToSet: number) => {
    if (productDevolution.length === 0)  {
      Toast.show({
        type: 'error',
        text1: "No puedes agregar una reposición de producto si no existe devolución", 
        text2: "Agrega una devolución de producto antes de agregar una reposición"});
      return;
    }
    
    if (productInventoryMap !== undefined) {
        if (item === null) {
          setProductReposition(
            productCommitedValidation(
              productInventoryMap, 
              productsToCommit, 
              productSale, 
              false));
        } else {
          const {id_product, price_at_moment, id_product_inventory} = item;
          const newRouteTransactionDescription:RouteTransactionDescriptionDTO = {
              id_route_transaction_description: '',
              price_at_moment: price_at_moment,
              amount: amountToSet,
              created_at: new Date(),
              id_transaction_operation_type: DAY_OPERATIONS.product_reposition,
              id_product: id_product,
              id_route_transaction: '',
              id_product_inventory: id_product_inventory,
          };

          setProductReposition(
            productCommitedValidation(
              productInventoryMap, 
              pushProductToCommitList(productsToCommit, newRouteTransactionDescription), 
              productSale, 
              true
            )
          );
        }
      }
    // TODO: Validate if there will be necessary to provide feedback to the user about the product reposition.
    // if (validatingIfRepositionIsValid(productsToCommit, productDevolution, productReposition)) {
    //   setProductReposition(
    //     productCommitedValidation(productInventoryMap, productsToCommit, productSale, true));
    // } else {
    //   if (productDevolution.length > 0) {
    //     // Toast.show({type: 'error', text1: "Propuesta de cambio imposible.", 
    //     //   text2: "No es posible excederte mas del valor de la reposición (solo se excedera si el valor unitario del producto es mayor)."});
    //     Toast.show({type: 'error', text1: "Propuesta de cambio imposible.", 
    //       text2: "El numero de 'bolsitas a reponer' tiene que ser igual o menor a las 'bolsitas de la merma'."});
    //     setProductReposition(productReposition)
    //   } else {
    //     Toast.show({
    //       type: 'error', 
    //       text1: "No se puede agregar una cambio de producto si no existe devolución", 
    //       text2: "No puedes agregar una reposición de producto ya que no existe devolución"});
    //   }
    // }
  };

  const handleSetSaleProduct = (productsToCommit: RouteTransactionDescriptionDTO[], item: ProductDTO&ProductInventoryDTO|null, amountToSet: number) => {
    if (productInventoryMap !== undefined) {
      if (item === null) {
        setProductSale(
          productCommitedValidation(
            productInventoryMap, 
            productsToCommit, 
            productReposition, 
            false));
      } else {
        const {id_product, price_at_moment, id_product_inventory} = item;
        
        // Creating movement with the new amount.
        const newRouteTransactionDescription:RouteTransactionDescriptionDTO = {
            id_route_transaction_description: '',
            price_at_moment: price_at_moment,
            amount: amountToSet,
            created_at: new Date(),
            id_transaction_operation_type: DAY_OPERATIONS.sales,
            id_product: id_product,
            id_route_transaction: '',
            id_product_inventory: id_product_inventory,
        };

        setProductSale(
          productCommitedValidation(
            productInventoryMap, 
            pushProductToCommitList(productsToCommit, newRouteTransactionDescription), 
            productReposition, 
            false));
      }
    }
  };

  return (
    finishedSale === false ?
      <SafeAreaView style={tw`flex-1`}>
        <KeyboardAvoidingView 
          style={tw`flex-1`} 
          behavior='padding' 
          keyboardVerticalOffset={10}
          >
        {
          productInventoryMap === undefined ?
          <View style={tw`w-full h-full flex flex-1 justify-center items-center`}>
            <Text>Cargando información del inventario...</Text>
          </View>
          :
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
                transactionIdentifier   = { workDayInformation?.id_work_day || '' }
                totalToPay              = { getGreatTotal(productDevolution, productReposition, productSale, productInventoryMap) }
                paymentProcess          = { startPaymentProcess }
                onCancelPaymentProcess  = { setStartPaymentProcess }
                onPaySale               = {(receivedCash:number, paymnetMethod:PAYMENT_METHODS) => handlePaySale(receivedCash, paymnetMethod)}/>
            <View style={tw`w-full flex flex-1 flex-col items-center justify-center`}>
              <View style={tw`my-3 w-full flex flex-row justify-center items-center`}>
                <MenuHeader 
                  id_store={id_store_search_param}
                  onGoBack={handleOnGoBack}
                  />
              </View>
              <View style={tw`w-full flex flex-row`}>
                <TableProduct
                  avialableProducts   = { availableProducts || [] }
                  productInventory    = { productInventory || [] }
                  commitedProducts    = { productDevolution }
                  setCommitedProduct  = { handlerSetProductDevolution }
                  sectionTitle        = {'Devolución de producto'}
                  sectionCaption      = {'(Precios consultados al día de la venta)'}
                  totalMessage        = {'Total de valor de devolución:'}
                  />
              </View>
              <View style={tw`w-full flex flex-row`}>
                <TableProduct
                  avialableProducts   = { availableProducts || [] }
                  productInventory    = { productInventory || [] }
                  commitedProducts    = { productReposition }
                  setCommitedProduct  = { handleSetProductReposition }
                  sectionTitle        = { 'Reposición de producto' }
                  sectionCaption      = { '(Precios actuales tomados para la reposición)' }
                  totalMessage        = { 'Total de valor de la reposición:' }
                  />
              </View>
              <View style={tw`flex flex-row my-1`}>
                <SubtotalLine
                  description     = { getMessageForProductDevolutionOperation(productDevolution, productReposition, productInventoryMap) }
                  total           = { getProductDevolutionBalanceWithoutNegativeNumber(productDevolution, productReposition, productInventoryMap).toString() }
                  fontStyle={'font-bold text-lg'}/>
              </View>
              <View style={tw`flex flex-row w-11/12 border border-solid mt-2`} />
              <View style={tw`w-full flex flex-row`}>
                <TableProduct
                  avialableProducts   = { availableProducts || [] }
                  productInventory    = { productInventory || [] }
                  commitedProducts    = { productSale }
                  setCommitedProduct  = { handleSetSaleProduct }
                  sectionTitle        = { 'Productos para vender' }
                  sectionCaption      = { '(Venta sugerida: Última venta)' }
                  totalMessage        = { 'Total de la venta:' }
                  />
              </View>
              <View style={tw`w-full flex flex-row justify-center my-5`}>
                <SaleSummarize
                  productsDevolution  = { productDevolution }
                  productsReposition  = { productReposition }
                  productsSale        = { productSale }
                  productInventoryMap = { productInventoryMap }/>
              </View>
            </View>
            <View style={tw`w-full flex flex-row justify-center my-3`}>
              <ProjectButton
                title={'Imprimir ticket'}
                onPress={() => { handlePrintTicket() }}
                buttonVariant={'primary'}
                buttonStyle={tw`h-14 max-w-32 rounded flex flex-row basis-1/2  justify-center items-center`}/>
            </View>
            <ConfirmationBand
              textOnAccept    = { 'Continuar' }
              textOnCancel    = { 'Cancelar operación' }
              handleOnAccept  = { handleSalePaymentProcess }
              handleOnCancel  = { handleCancelSale }/>
            <View style={tw`flex flex-row mt-10`} />
          </ScrollView> 
        }
        </KeyboardAvoidingView>
      </SafeAreaView>
      :
      <SafeAreaView>
        <ResultSale
          onSuccessfullCompletion = { handleOnSuccessfullCompletionSale }
          onPrintTicket           = { handlePrintTicket }
          onFailedCompletion      = { handleOnFailedCompletionSale }
          onTryAgain              = { handleOnTryAgain }
          resultSaleState         = { resultSaleState } />
      </SafeAreaView>
  );
};

export default salesLayout;
