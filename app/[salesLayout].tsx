// Libraries
import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, Text } from 'react-native';
import tw from 'twrnc';
import { Router, useRouter } from 'expo-router';
import { useGlobalSearchParams, useLocalSearchParams } from 'expo-router/build/hooks';

// Redux context.
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';

// Interfaces and enums
import { IProductInventory } from '../interfaces/interfaces';

// Utils

// UI Components
import Toast from 'react-native-toast-message';
import TableProduct from '@/components/SalesLayout/TableProduct';
import SaleSummarize from '@/components/SalesLayout/SaleSummarize';
import ConfirmationBand from '@/components/ConfirmationBand';
import ResultSale from '@/components/ResultSale';
import SubtotalLine from '@/components/SalesLayout/SubtotalLine';
import PaymentProcess from '@/components/SalesLayout/PaymentProcess';
import MenuHeader from '@/components/generalComponents/MenuHeader';
import ActionButton from '@/components/SalesLayout/ActionButton';
import { SafeAreaView } from 'react-native-safe-area-context';


// Services
import { printTicketBluetooth } from '../services/printerService';


// Controllers
import { 
  getInitialInventoryParametersFromRoute, 
} from '@/controllers/SaleController';

// Mapper and DTOs
import RouteTransactionDescriptionDTO from '@/src/application/dto/RouteTransactionDescriptionDTO';
import ProductInventoryDTO from "@/src/application/dto/ProductInventoryDTO";
import ProductDTO from '@/src/application/dto/ProductDTO';
import PAYMENT_METHODS from '@/src/core/enums/PaymentMethod';


// Use cases and queries
import { container as di_conatiner } from '@/src/infrastructure/di/container';
import RegisterNewRouteTransaction from '@/src/application/commands/RegisterNewRouteTransaction';
import RetrieveCurrentShiftInventoryQuery from '@/src/application/queries/RetrieveCurrentShiftInventoryQuery';
import RetrieveDayOperationQuery from '@/src/application/queries/RetrieveDayOperationQuery';

// Redux
import { setProductInventory } from '@/redux/slices/productsInventorySlice';
import { setDayOperations } from '@/redux/slices/dayOperationsSlice';

// Utils
import {
  getTicketSale,
} from '../utils/saleFunction';
import { 
  getProductDevolutionBalanceWithoutNegativeNumber,
  getMessageForProductDevolutionOperation,
  getGreatTotal,
  productCommitedValidation
} from '@/utils/route-transaciton/utils';
import { DAY_OPERATIONS } from '@/src/core/enums/DayOperations';
import { createMapProductInventoryWithProduct } from '@/utils/inventory/utils';
import RetrieveRouteTransactionByIDQuery from '@/src/application/queries/RetrieveRouteTransactionByIDQuery';

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
  id_route_transaction_search_param?: string;
}

const salesLayout = () => {
  const params = useLocalSearchParams<typeSearchParams>();

  const {
    id_store_search_param,
    id_route_transaction_search_param
  } = params as typeSearchParams;

  // const glob = useGlobalSearchParams();

  // // Auxiliar variables
  // // Getting information from parameters
  // let initialProductDevolution:IProductInventory[] 
  // = getInitialInventoryParametersFromRoute(glob.information, 'initialProductDevolution');

  // let initialProductResposition:IProductInventory[]
  //   = getInitialInventoryParametersFromRoute(glob.information, 'initialProductReposition');

  // let initialSaleProduct:IProductInventory[]
  //   = getInitialInventoryParametersFromRoute(glob.information, 'initialProductSale');

  // Redux context definitions
  const dispatch: AppDispatch = useDispatch();
  const productInventory      = useSelector((state: RootState) => state.productsInventory);
  const availableProducts     = useSelector((state: RootState) => state.products);
  const workDayInformation    = useSelector((state: RootState) => state.workDayInformation);

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
        const retrieve_route_transaction_by_id = di_conatiner.resolve<RetrieveRouteTransactionByIDQuery>(RetrieveRouteTransactionByIDQuery);
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
    const registerNewRouteTransactionCommand = di_conatiner.resolve<RegisterNewRouteTransaction>(RegisterNewRouteTransaction);

    setFinishedSale(true); // Finishing sale payment process.

    if (workDayInformation === null || id_store_search_param === undefined) {
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
      await registerNewRouteTransactionCommand.execute(
        [...productDevolution, ...productReposition, ...productSale],
        workDayInformation!,
        paymentMethod,
        receivedCash,
        id_store_search_param
      );
      
      const retrieveCurrentShiftInventory = di_conatiner.resolve<RetrieveCurrentShiftInventoryQuery>(RetrieveCurrentShiftInventoryQuery);
      const retrieveDayOperationQuery = di_conatiner.resolve<RetrieveDayOperationQuery>(RetrieveDayOperationQuery);
            
      const newInventory = await retrieveCurrentShiftInventory.execute();
      const newDayOperationsList = await retrieveDayOperationQuery.execute();
      
      dispatch(setDayOperations(newDayOperationsList));
      dispatch(setProductInventory(newInventory));

      Toast.show({
        type: 'success',
        text1:'Se ha registrado la venta satisfactoriamente.',
        text2: 'Se ha registrado la venta satisfactoriamente.'});
            
        setResultSaleState(true);
      } catch (error) {
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
    try {
      await printTicketBluetooth(getTicketSale(productDevolution,productReposition, productSale));
    } catch(error) {
      Toast.show({
        type: 'error',
        text1:'Hubo un problema de conexción con la impresora.',
        text2: 'No se encontro la impresora, porfavor intente conectarla con el telefono he intente nuevamente.'});
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
      setProductSale(declaredProductDevolution);
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
      if (productInventoryMap !== undefined) {
        if (item === null) {
          setProductSale(
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
      <SafeAreaView>
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
            <View style={tw`w-full flex flex-1 flex-col items-center`}>
              <View style={tw`my-3 w-full flex flex-row justify-center items-center`}>
                <MenuHeader onGoBack={handleOnGoBack}/>
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
              <ActionButton style='h-14 max-w-32 bg-blue-500' onClick={() => { handleOnTryAgain() }}>
                <Text>Imprimir ticket</Text>
              </ActionButton>
            </View>
            <ConfirmationBand
              textOnAccept    = { 'Continuar' }
              textOnCancel    = { 'Cancelar operación' }
              handleOnAccept  = { handleSalePaymentProcess }
              handleOnCancel  = { handleCancelSale }/>
            <View style={tw`flex flex-row mt-10`} />
          </ScrollView> 
        }
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
