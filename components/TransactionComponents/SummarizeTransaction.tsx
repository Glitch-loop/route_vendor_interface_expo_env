// Libraries
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';
import { Router, useRouter } from 'expo-router';

// Redux context.
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';

// Interfaces
import {
  IProductInventory,
  IResponse,
  IRouteTransaction,
  IStore,
} from '../../interfaces/interfaces';

// Components
import SectionTitle from '@/components/SalesLayout/SectionTitle';
import SummarizeFormat from '@/components/TransactionComponents/SummarizeFormat';
import TotalsSummarize from '@/components/SalesLayout/TotalsSummarize';
import DangerButton from '@/components/generalComponents/DangerButton';
import ActionDialog from '@/components/ActionDialog';
import ConfirmationBand from '@/components/ConfirmationBand';

// Embedded Database
import {
  deleteSyncQueueRecord,
  insertSyncQueueRecord,
  updateProducts,
  updateTransaction,
} from '../../queries/SQLite/sqlLiteQueries';

// Services
import { printTicketBluetooth } from '../../services/printerService';
import Toast from 'react-native-toast-message';
import { apiResponseStatus } from '../../utils/apiResponse';
import { createSyncItem } from '../../utils/syncFunctions';
import { syncingRecordsWithCentralDatabase } from '../../services/syncService';

// DTO
import RouteTransactionDTO from '@/src/application/dto/RouteTransactionDTO';
import ProductDTO from '@/src/application/dto/ProductDTO';
import ProductInventoryDTO from '@/src/application/dto/ProductInventoryDTO';
import RouteTransactionDescriptionDTO from '@/src/application/dto/RouteTransactionDescriptionDTO';

// Utils
import { getTicketSale } from '../../utils/saleFunction';
import { format_date_to_UI_format } from '@/utils/date/momentFormat';
import DAY_OPERATIONS from '@/src/core/enums/DayOperations';
import { ROUTE_TRANSACTION_STATE } from '@/src/core/enums/RouteTransactionState';

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

  // Handlers
  const handleOnPrint = async () => {
    try {
      const foundStore:IStore|undefined =
        stores.find((store) => {return store.id_store === routeTransaction.id_store;});

      await printTicketBluetooth(
        getTicketSale(
          productsDevolution,
          productsReposition,
          productsSale,
          routeTransaction,
          foundStore,
          vendor
        ));
    } catch(error) {
      /* There are no actions */
    }
  };

  const handleOnCancelASale = async () => {
    try {
      /* The process for canceling a sale only is available for active transactions */
      if (currentTransaction.state === 1) {

        /* Creating a variable for storing the inventory with the products of the sale.
        (To store current inventory + products of the sale). */
        const newInventory:IProductInventory[] = productInventory
          .map((product:IProductInventory) => { return product; });

        /* Adding the product reposition and product for sale of the transaction to be cancelled. */
        productsReposition.forEach((product:IProductInventory) => {
          const index = newInventory.findIndex((newInventoryProduct:IProductInventory) =>
            { return product.id_product === newInventoryProduct.id_product; });

          if (index === -1) {
            /* The product doesn't exist in the inventory; No instructions */
          } else {
            newInventory[index] = {
              ...newInventory[index],
              amount: newInventory[index].amount + product.amount,
            };
            newInventory[index].amount = newInventory[index].amount + product.amount;
          }
        });

        productsSale.forEach((product:IProductInventory) => {
          const index = newInventory.findIndex((newInventoryProduct:IProductInventory) =>
            { return product.id_product === newInventoryProduct.id_product; });

          if (index === -1) {
            /* The product doesn't exist in the inventory; No instructions */
          } else {
            newInventory[index] = {
              ...newInventory[index],
              amount: newInventory[index].amount + product.amount,
            };
          }
        });

        /* Desactivating state of transaciton */
        const updatedTransaction:IRouteTransaction = {
          ...currentTransaction,
          state: 0, // 0 = Desactivated transaction.
        };

        // Updating embedded database
        const resultUpdationTransaction:IResponse<IRouteTransaction>
          =  await updateTransaction(updatedTransaction);

        /* Updating inventory */
        // Updating embedded database
        /* Note:
            Since 'newInventory' is a table that stores the inventory of the day (something that is
            going to vary throughout the time) this is not synced with the database.
        */
        const resultUpdationProductInventory:IResponse<IProductInventory[]>
          = await updateProducts(newInventory);

        // Adding records to sync with database
          const resultUpdateSyncTransaction
            = await insertSyncQueueRecord(createSyncItem(updatedTransaction, 'PENDING', 'UPDATE'));


        if (apiResponseStatus(resultUpdationTransaction, 200)
        && apiResponseStatus(resultUpdationProductInventory, 200)
        && apiResponseStatus(resultUpdateSyncTransaction, 201)) {
          // Updating redux context
          dispatch(updateProductsInventory(newInventory));

          /* Updating state of transaction; This will activate the 'desactivate status in the card'*/
          setCurrentTransaction(updatedTransaction);

          Toast.show({type: 'success',
            text1:'Transacción cancelada exitosamente.',
            text2: 'Se ha cancelado la transacción exitosamente.'});

          // Executing a synchronization process to register the start shift inventory
          // Note: In case of failure, the background process will eventually synchronize the records.
          syncingRecordsWithCentralDatabase();

        } else {
          /* Something was wrong during the cancelation of the transaction */
          // Ensuring the transaction is not cancelled
          await updateTransaction(currentTransaction);

          /* Ensuring the product inventory is in the previous state of the transaction cancelation operation */
          await updateProducts(productInventory);

          // Deleting records to sync
          await deleteSyncQueueRecord(createSyncItem(currentTransaction, 'PENDING', 'UPDATE'));

          Toast.show({type: 'error',
            text1:'Ha habido un error durante la cancelación de la transacción.',
            text2: 'Ha hanido un error durante la cancelación de la transacción.'});
        }
      } else {
        /* It is not possible to cancel a sale that is already cancelled */
      }
      setShowDialog(false);
    } catch (error) {
      setShowDialog(false);
      // Ensuring the transaction is not cancelled
      await updateTransaction(currentTransaction);

      /* Ensuring the product inventory is in the previous state of the transaction cancelation operation */
      await updateProducts(productInventory);

      // Deleting records to sync
      await deleteSyncQueueRecord(createSyncItem(currentTransaction, 'PENDING', 'UPDATE'));

      Toast.show({type: 'error',
        text1:'Ha habido un error durante la cancelación de la transacción.',
        text2: 'Ha hanido un error durante la cancelación de la transacción.'});
    }
  };

  const handleOnStartASale = async () => {
    const { id_store, id_route_transaction } = currentTransaction;
    router.push(`/salesLayout?id_store_search_param=${id_store}&id_route_transaction_search_param=${id_route_transaction}`);
  };

  const handleOnShowDialog = () => { setShowDialog(true); };

  const handleOnCancelShowDialog = () => { setShowDialog(false); };

  return (
    <View style={tw`w-full flex flex-row justify-center pt-7`}>
      <ActionDialog
        visible={showDialog}
        onAcceptDialog={() => {handleOnCancelASale();}}
        onDeclinedialog={() => {handleOnCancelShowDialog();}}>
          <Text style={tw`text-black text-xl text-center`}>
            ¿Estas seguro de cancelar la venta?
          </Text>
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
              title={`Transacción - ${format_date_to_UI_format(currentTransaction.date)}`}
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
                handleOnAccept={() => {
                  if (shiftWorkDay === null) {
                    Toast.show({type: 'error', text1:'Error al iniciar venta', text2: 'Reinicia la aplicación e intenta de nuevo'});
                    return;
                  }

                  const { finish_date } = shiftWorkDay;

                  if (finish_date === null) {
                    /* There is not an end shift operation, the work day is still open. So, user can make more operations*/
                    handleOnStartASale();
                  } else {
                    /*There is an end shift operation, the work day was closed. */
                    Toast.show({type: 'error', text1:'Inventario final finalizado', text2: 'No se pueden hacer mas operaciones'});
                  }
                }}
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
