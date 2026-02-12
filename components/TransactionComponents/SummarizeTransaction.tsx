// Libraries
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';
import { Router, useRouter } from 'expo-router';

// Redux context.
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { setProductInventory } from '@/redux/slices/productsInventorySlice';

// Interfaces

// Components
import SectionTitle from '@/components/sale-layout/SectionTitle';
import SummarizeFormat from '@/components/TransactionComponents/SummarizeFormat';
import TotalsSummarize from '@/components/sale-layout/TotalsSummarize';
import DangerButton from '@/components/shared-components/DangerButton';
import ActionDialog from '@/components/shared-components/ActionDialog';
import ConfirmationBand from '@/components/shared-components/ConfirmationBand';

// UI - components
import Toast from 'react-native-toast-message';

// Use cases
import { container as container_di } from '@/src/infrastructure/di/container';
import CancelRouteTransactionUseCase from '@/src/application/commands/CancelRouteTransactionUseCase';
import RetrieveRouteTransactionByIDQuery from '@/src/application/queries/RetrieveRouteTransactionByIDQuery';
import RetrieveCurrentShiftInventoryQuery from '@/src/application/queries/RetrieveCurrentShiftInventoryQuery';

// DTO
import RouteTransactionDTO from '@/src/application/dto/RouteTransactionDTO';
import ProductDTO from '@/src/application/dto/ProductDTO';
import ProductInventoryDTO from '@/src/application/dto/ProductInventoryDTO';
import RouteTransactionDescriptionDTO from '@/src/application/dto/RouteTransactionDescriptionDTO';

// Utils
import DAY_OPERATIONS from '@/src/core/enums/DayOperations';
import { ROUTE_TRANSACTION_STATE } from '@/src/core/enums/RouteTransactionState';
import { format_date_to_UI_format } from '@/utils/date/momentFormat';
import { getTicketSale } from '@/utils/route-transaciton/utils';
import StoreDTO from '@/src/application/dto/StoreDTO';
import { BluetoothPrinterService } from '@/src/infrastructure/services/BluetoothPrinterService';


const SummarizeTransaction = ({
  productInventoryMap,
  routeTransaction,
}:{
  productInventoryMap: Map<string, ProductDTO&ProductInventoryDTO>,
  routeTransaction:RouteTransactionDTO,
}) => {
  //Router
  const router:Router = useRouter()

  /* Declaring redux context */
  const dispatch: AppDispatch = useDispatch();
  const productInventory = useSelector((state: RootState) => state.productsInventory);
  const stores = useSelector((state: RootState) => state.stores);
  const vendor = useSelector((state: RootState) => state.user);
  const shiftWorkDay = useSelector((state: RootState) => state.workDayInformation);

  /*
    Declaring states to store the movements for each operations.
    At the moment there are only 3 type of operations that a transaction can contain.

    In the declaration of each state, first it is gotten the specific id of the operation according to the type of the state;
    In the first state it is asked for the ID of the operation of the type operation devolution.

    Once the ID is gotten, it is used to get the "description" (or movements) of the operation, this consulting to the map that contains
    all the movements of all the operation of the trasnaction.

    Once it was retrieved the movements for the specific operation, it is converted to the interface that it comes to the IproductIvnetory
    interface.

  */
  const [currentTransaction, setCurrentTransaction] = useState<RouteTransactionDTO>(routeTransaction);

  const { transaction_description } = routeTransaction;

  // Variables for displaying information
  const productsDevolution: RouteTransactionDescriptionDTO[] = transaction_description.filter((description) => description.id_transaction_operation_type === DAY_OPERATIONS.product_devolution)

  const productsReposition:RouteTransactionDescriptionDTO[] = transaction_description.filter((description) => description.id_transaction_operation_type === DAY_OPERATIONS.product_reposition);

  const productsSale:RouteTransactionDescriptionDTO[] = transaction_description.filter((description) => description.id_transaction_operation_type === DAY_OPERATIONS.sales);

  // States regarded to the logic of the component
  const [showDialog, setShowDialog] = useState<boolean>(false);

  const printerService = container_di.resolve<BluetoothPrinterService>(BluetoothPrinterService);

  // Handlers
  const handleOnPrint = async () => {
    if (productInventoryMap === undefined) {
      Toast.show({
        type: 'error',
        text1: 'No se pudo imprimir el ticket de la venta.',
        text2: 'Intenta recargar la pagina nuevamente.'});
      return;
    }

    try {
      const { id_store } = routeTransaction;
      let storeToConsult:StoreDTO|undefined = undefined;

      if (stores !== null) storeToConsult = stores.find((storeItem:StoreDTO) => storeItem.id_store === id_store);
        await printerService.getConnectedPrinter();
        await printerService.printTicket(
          getTicketSale(
            productInventoryMap,
            productsDevolution,
            productsReposition,
            productsSale,
            routeTransaction,
            storeToConsult
          )
        );
    } catch(error) {
      Toast.show({
        type: 'error',
        text1:'Hubo un problema de conexión con la impresora.',
        text2: 'Verifica que la impresora este conectada e intenta nuevamente.'});
      /* There are no actions */
    }
  };

  const handleOnCancelASale = async () => { // TODO: Synchronization with central database
    const { id_route_transaction, state } = currentTransaction;
    if (state === ROUTE_TRANSACTION_STATE.CANCELLED) {
      Toast.show({type: 'info',
        text1:'La transacción ya se encuentra cancelada.',
        text2: 'No es posible cancelar una transacción que ya se encuentra cancelada.'});
    } else {
      try {
        const cancelRouteTransactionUseCase = container_di.resolve<CancelRouteTransactionUseCase>(CancelRouteTransactionUseCase);
        const retrieveRouteTransactionByIdQuery = container_di.resolve<RetrieveRouteTransactionByIDQuery>(RetrieveRouteTransactionByIDQuery);
        const retrieveCurrentShiftInventoryQuery = container_di.resolve<RetrieveCurrentShiftInventoryQuery>(RetrieveCurrentShiftInventoryQuery);

        await cancelRouteTransactionUseCase.execute(id_route_transaction);

        // Retrieving current inventory and route transaction after cancelation
        const currentInventory: ProductInventoryDTO[] = await retrieveCurrentShiftInventoryQuery.execute()
        const retrieveRouteTransactionByIdResult: RouteTransactionDTO[] = await retrieveRouteTransactionByIdQuery.execute([id_route_transaction]);

        // Updating redux context
        dispatch(setProductInventory(currentInventory)) 
        
        if (retrieveRouteTransactionByIdResult.length === 0) {
          Toast.show({type: 'error',
            text1:'Ha habido un error durante la cancelación de la transacción.',
            text2: 'Ha hanido un error durante la cancelación de la transacción.'});
            return;
        }

        const updatedRouteTransaction:RouteTransactionDTO = retrieveRouteTransactionByIdResult[0];

        // Updating state
        setCurrentTransaction(updatedRouteTransaction);

        Toast.show({type: 'success',
          text1:'Transacción cancelada exitosamente.',
          text2: 'Se ha cancelado la transacción exitosamente.'});

      } catch (error) {
        Toast.show({type: 'error',
          text1:'Ha habido un error durante la cancelación de la transacción.',
          text2: 'Ha hanido un error durante la cancelación de la transacción.'});
      }
    }

    setShowDialog(false);
  };

  const handleOnStartASale = async () => {
    const { id_store, id_route_transaction } = currentTransaction;
    router.push(`/salesLayout?id_store_search_param=${id_store}&id_route_transaction_search_param=${id_route_transaction}`);
  };

  const handleOnShowDialog = () => { 
    if (shiftWorkDay === null) {
      Toast.show({type: 'error', text1:'Error al iniciar venta', text2: 'Reinicia la aplicación e intenta de nuevo'});
      return;
    }

    const { finish_date } = shiftWorkDay;

    if (finish_date !== null) Toast.show({type: 'error', text1:'Inventario final finalizado', text2: 'No se pueden hacer mas operaciones'});
    else setShowDialog(true);       
    
  };

  const handleOnCancelShowDialog = () => { setShowDialog(false); };

  return (
    <View style={tw`w-full flex flex-row justify-center pt-7`}>
      <ActionDialog
        visible={showDialog}
        onAcceptDialog={() => {handleOnCancelASale();}}
        onDeclinedialog={() => {handleOnCancelShowDialog();}}>
          <Text style={tw`text-black text-xl text-center`}>¿Estas seguro de cancelar la venta?</Text>
      </ActionDialog>
      <View style={tw`w-full flex flex-row justify-center pt-7`}>
        { currentTransaction.state === ROUTE_TRANSACTION_STATE.ACTIVE &&
          <View style={tw`absolute -top-0 -right-3 z-10 mr-3 mb-6`}>
            <DangerButton
              iconName={'trash'}
              onPressButton={() => {handleOnShowDialog();}}/>
          </View>
        }
        <View style={tw`w-11/12 
          ${currentTransaction.state === ROUTE_TRANSACTION_STATE.ACTIVE ? 'bg-amber-300' : 'bg-amber-200'} 
          border p-2 flex flex-col justify-center items-center rounded-md`}>
          <View style={tw`w-full flex flex-col`}>
            <SectionTitle
              title={`Transacción`}
              caption={''}
              titlePositionStyle={'text-center w-full items-center justify-center'}/>
            <SectionTitle
              title={`Fecha: ${format_date_to_UI_format(currentTransaction.date)}`}
              caption={currentTransaction.state === ROUTE_TRANSACTION_STATE.ACTIVE ? '' : '(Cancelada)'}
              titlePositionStyle={'text-center w-full items-center justify-center'}/>
            {/* Product devolution section */}
            <SectionTitle
              title={'Devolución de producto'}
              caption={''}
              titlePositionStyle={'text-center w-full items-center justify-center'}
            />
            <SummarizeFormat
              productInventoryMap={productInventoryMap}
              productsMovement={productsDevolution}
              totalSectionCaptionMessage={'Valor total de devolución: '}/>
            <View style={tw`w-full border`}/>
            {/* Product reposition section */}
            <SectionTitle
              title={'Reposición de producto'}
              caption={''}
              titlePositionStyle={'text-center w-full flex flex-row justify-center'}
              />
            <SummarizeFormat
              productInventoryMap={productInventoryMap}
              productsMovement={productsReposition}
              totalSectionCaptionMessage={'Valor total de reposición: '}/>
            <View style={tw`w-full border`}/>
            {/* Product sale section */}
            <SectionTitle
              title={'Venta'}
              caption={''}
              titlePositionStyle={'text-center w-full flex flex-row justify-center'}
              />
            <SummarizeFormat
              productInventoryMap={productInventoryMap}
              productsMovement={productsSale}
              totalSectionCaptionMessage={'Total venta: '}/>
            <View style={tw`w-full border`}/>
            {/* Totals sections */}
            <TotalsSummarize
                routeTransaction={currentTransaction}
                productsDevolution={productsDevolution}
                productsReposition={productsReposition}
                productsSale={productsSale}
                productInventoryMap={productInventoryMap}
            />
            <View style={tw`w-full flex flex-row`}>
              <ConfirmationBand
                textOnAccept={'Iniciar venta apartir de esta'}
                textOnCancel={'Imprimr'}
                handleOnAccept={() => { handleOnStartASale(); }}
                handleOnCancel={() => {handleOnPrint();}}
                styleOnCancel={'bg-blue-500'}
                />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default SummarizeTransaction;
