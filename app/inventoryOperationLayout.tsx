// Libraries
import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, BackHandler, Pressable } from 'react-native';
import tw from 'twrnc';
import { Router, useRouter, useLocalSearchParams } from 'expo-router';

// Redux context
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { setProductInventory } from '@/redux/slices/productsInventorySlice';
import { setWorkDayInformation } from '@/redux/slices/workdayInformation';
import { setDayOperations } from '@/redux/slices/dayOperationsSlice';

// Components
import RouteHeader from '../components/RouteHeader';
import TableInventoryOperations from '../components/InventoryComponents/TableInventoryOperation';
import VendorConfirmation from '../components/VendorConfirmation';
import TableInventoryVisualization from '../components/InventoryComponents/TableInventoryOperationVisualization';
import TableRouteTransactionProductVisualization from '../components/InventoryComponents/TableRouteTransactionProductVisualization';
import Icon from 'react-native-vector-icons/FontAwesome';

// Interfaces
import {
  ICurrency,
  IProductInventory,
 } from '../interfaces/interfaces';

// Utils
// import DAYS_OPERATIONS from '../lib/day_operations';
import TableCashReception from '../components/InventoryComponents/TableCashReception';
import { calculateNewInventoryAfterAnInventoryOperation, initialMXNCurrencyState, mergeInventories } from '../utils/inventoryOperations';
import Toast from 'react-native-toast-message';

import { cleanAllRecordsToSyncFromDatabase, syncingRecordsWithCentralDatabase } from '../services/syncService';


import ActionDialog from '../components/ActionDialog';

// Enums
import { DAY_OPERATIONS } from '@/src/core/enums/DayOperations';

// Utils
import { getTitleDayOperation } from '@/utils/day-operation/utils'; 
import { getTotalAmountFromCashInventory, determineIfExistsOperationDescriptionMovement } from '@/utils/inventory/utils';

// Definitions
const settingOperationDescriptions:any = {
  showErrorMessage: true,
  toastTitleError: 'Error durante la consulta de la operación de inventario',
  toastMessageError: 'Ha habido un error durante la consulta, no se ha podido recuperar parte de las operaciones de inventario, por favor intente nuevamente',
};
const settingAllInventoryOperations:any = {
  showErrorMessage: true,
  toastTitleError:'Error al mostrar inventario final',
  toastMessageError: 'Ha habido un error durante la consulta de las operaciones de inventario del dia, por favor intente nuevamente',
};


// Use cases
import ListAllProductOfCompany from '@/src/application/queries/ListAllProductOfCompany';

// DI container
import { container as di_container } from '@/src/infrastructure/di/container';

// Use cases and queries
import StartWorkDayUseCase from '@/src/application/commands/StartShiftDayUseCase';
import FinishShiftDayUseCase from '@/src/application/commands/FinishShiftDayUseCase';
import RegisterRestockOfProductUseCase from '@/src/application/commands/RegisterRestockOfProductUseCase';
import RegisterProductDevolutionUseCase from '@/src/application/commands/RegisterProductDevolutionUseCase';

import RetrieveCurrentShiftInventoryQuery from '@/src/application/queries/RetrieveCurrentShiftInventoryQuery';
import GetInventoryOperationByIDQuery from '@/src/application/queries/GetInventoryOperationByIDQuery';


// Mapper and DTOs
import InventoryOperationDTO from '@/src/application/dto/InventoryOperationDTO';
import ProductDTO from '@/src/application/dto/ProductDTO';
import ProductInventoryDTO from '@/src/application/dto/ProductInventoryDTO';
import InventoryOperationDescriptionDTO from '@/src/application/dto/InventoryOperationDescriptionDTO';
import RetrieveCurrentWorkdayInformationQuery from '@/src/application/queries/RetrieveCurrentWorkdayInformationQuery';
import RetrieveDayOperationQuery from '@/src/application/queries/RetrieveDayOperationQuery';

// TODO: Define if create a file for this type used in layout
type typeSearchParams = {
  id_type_of_operation_search_param: string;
  id_inventory_operation_search_param?: string;
}

const inventoryOperationLayout = () => {
  const params = useLocalSearchParams<typeSearchParams>();

  const { 
    id_type_of_operation_search_param, 
    id_inventory_operation_search_param 
  } = params as typeSearchParams;


  // Defining redux context
  const dispatch:AppDispatch = useDispatch();
  const route = useSelector((state: RootState) => state.route);
  const routeDay = useSelector((state: RootState) => state.routeDay);
  const productsInventory = useSelector((state: RootState) => state.productsInventory);
  const workDayInformation = useSelector((state: RootState) => state.workDayInformation);

  // Routing
  const router:Router = useRouter();

  // Defining states
  /* States related to 'movements' in the operation. */
  const [cashInventory, setCashInventory] = useState<ICurrency[]>(initialMXNCurrencyState());

  /* States related to the recommendation for the inventory to be taken. */
  const [suggestedProduct, setSuggestedProduct] = useState<IProductInventory[]>([]);

  /*
    Current inventory state stores the vendor's inventory (the inventory that currently has the
    vendor).
  */
  const [currentInventory, setCurrentInventory] = useState<IProductInventory[]>([]);

  /* States related to the configuration for inventory operation visualization. */
  const [initialShiftInventory, setInitialShiftInventory] = useState<IProductInventory[]>([]);
  const [restockInventories, setRestockInventories] = useState<IProductInventory[][]>([]);
  const [finalShiftInventory, setFinalShiftInventory] = useState<IProductInventory[]>([]);
  const [productRepositionTransactions, setProductRepositionTransactions]
    = useState<IProductInventory[]>([]);
  const [productSoldTransactions, setProductSoldTransactions] = useState<IProductInventory[]>([]);

  const [inventoryWithdrawal, setInventoryWithdrawal] = useState<boolean>(false);
  const [inventoryOutflow, setInventoryOutflow] = useState<boolean>(false);
  const [finalOperation, setFinalOperation] = useState<boolean>(false);
  const [issueInventory, setIssueInventory] = useState<boolean>(false);
  const [isInventoryOperationModifiable, setIsInventoryOperationModifiable] = useState<boolean>(false);

  /* States related to the layout logic */
  const [isOperation, setIsOperation] = useState<boolean>(true);
  const [isActiveOperation, setIsActiveOperation] = useState<boolean>(true);
  const [showDialog, setShowDialog] = useState<boolean>(false);

  /* States for route transaction operations */
  const [productSoldByStore, setProductSoldByStore] = useState<IProductInventory[][]>([]);
  const [productRepositionByStore, setProductRepositionByStore] = useState<IProductInventory[][]>([]);
  const [nameOfStores, setNameOfStores] = useState<string[]>([]);

  // State used for the logic of the component
  const [isInventoryAccepted, setIsInventoryAccepted] = useState<boolean>(false);
  const [isOperationToUpdate, setIsOperationToUpdate] = useState<boolean>(false);

  // =============== New states =====================
  const [currentShiftInventory, setCurrentShiftInventory] = useState<ProductInventoryDTO[]>([]);
  const [availableProducts, setAvailableProducts] = useState<ProductDTO[]>([]);
  const [suggestedInventory, setSuggestedInventory] = useState<ProductInventoryDTO[]>([]);
  const [inventoryOperationMovements, setInventoryOperationMovements] = useState<InventoryOperationDescriptionDTO[]>([]);
  const [inventoryOperationToConsult, setInventoryOperationToConsult] = useState<InventoryOperationDTO | null>(null);

  // Use effect operations
  useEffect(() => {
    setEnvironmentForInventoryOperation();
    setRoutingOfInventoryOperationScreen();
  }, []);

  // ======= Auxiliar functions ======
  const setEnvironmentForInventoryOperation = async () => {
    
    if (id_type_of_operation_search_param === DAY_OPERATIONS.consult_inventory) { 
      if (id_inventory_operation_search_param === undefined) {
          Toast.show({
            type: 'error',
            text1: 'Error al consultar la operación de inventario.',
            text2: 'No fue posible rastrar la operación de inventario, intente nuevamente.',
          });
        return
      };

      const get_inventory_operation_by_id_use_case_query = di_container.resolve<GetInventoryOperationByIDQuery>(GetInventoryOperationByIDQuery);
      const inventoryOperation = await get_inventory_operation_by_id_use_case_query.execute(id_inventory_operation_search_param)
      setInventoryOperationToConsult(inventoryOperation);

      setInventoryWithdrawal(false);
      setInventoryOutflow(false);
      setFinalOperation(false);
      setIssueInventory(false);

    } else if (id_type_of_operation_search_param === DAY_OPERATIONS.start_shift_inventory) {
      /* Dispose the list of product and let the user to introduce the inventory movement. */

      // Looking for all the products available for the company
      const use_case_query = di_container.resolve<ListAllProductOfCompany>(ListAllProductOfCompany);
      const products: ProductDTO[] = await use_case_query.execute()
      setAvailableProducts(products);

      // TODO: set suggested inventory for start shift inventory

      setInventoryWithdrawal(true);
      setInventoryOutflow(true);
      setFinalOperation(true);
      setIssueInventory(true);
    } else if (id_type_of_operation_search_param === DAY_OPERATIONS.restock_inventory) {
      // setInitialShiftInventory([]);
      // setRestockInventories([inventoryOperationProducts]);
      // setFinalShiftInventory([]);
    } else if (id_type_of_operation_search_param === DAY_OPERATIONS.end_shift_inventory) {
      // setInitialShiftInventory([]);
      // setRestockInventories([inventoryOperationProducts]);
      // setFinalShiftInventory([]);

    } else if (id_type_of_operation_search_param === DAY_OPERATIONS.product_devolution_inventory) {
      /* Getting the current inventory of the vendor */
      const retrieveCurrentShiftInventoryQuery = di_container.resolve<RetrieveCurrentShiftInventoryQuery>(RetrieveCurrentShiftInventoryQuery);
      const currentShiftInventory: ProductInventoryDTO[] = await retrieveCurrentShiftInventoryQuery.execute();
      setCurrentShiftInventory(currentShiftInventory);            

      setIsOperation(true);
    } else {
      /* Do nothing */
    }
  }

  const setRoutingOfInventoryOperationScreen = () => {
      // Determining where to redirect in case of the user touch the handler "back handler" of the phone
      const backAction = () => {
        if (workDayInformation === null) {
          router.back();
        } else {
          router.push('/routeOperationMenuLayout');
        }
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );

      return () => backHandler.remove();
  }

  // Handlers
  const handleGoBackOperationDayMenu = async ():Promise<void> => { router.replace('/routeOperationMenuLayout'); };

  const handleAcceptInventoryOperation = ():void => {
    let askToUserIfAgreeWithInventory: boolean = false;

    if (id_type_of_operation_search_param === DAY_OPERATIONS.start_shift_inventory
     || id_type_of_operation_search_param === DAY_OPERATIONS.end_shift_inventory) {
      if (getTotalAmountFromCashInventory(cashInventory) === 0 || !determineIfExistsOperationDescriptionMovement(inventoryOperationMovements)) askToUserIfAgreeWithInventory = true;
      else askToUserIfAgreeWithInventory = false;
    } else {
      if (!determineIfExistsOperationDescriptionMovement(inventoryOperationMovements)) askToUserIfAgreeWithInventory = true
    }

    if(askToUserIfAgreeWithInventory) {
      setShowDialog(true);
    } else {
      handleConfirmInventoryOperation();
    }
  }

  const handleCancelInventoryOperationProcess = ():void => { setShowDialog(false); };

  const handleConfirmInventoryOperation = async (): Promise<void> => {
      /* Avoiding re-executions */
      if (isInventoryAccepted === true) return;
      
      setIsInventoryAccepted(true);
      setShowDialog(false);

      /*
        There are 4 types of inventory operations:
        - Start shift inventory: Unique in the day.
        - Re-stock inventory: It might be several ones.
        - Product devolution inventory: It might be several ones.
        - End shift inventory: Unique in the day.

      */
      if (id_type_of_operation_search_param === DAY_OPERATIONS.start_shift_inventory) {
        const startShiftDayUseCaseCommand = di_container.resolve<StartWorkDayUseCase>(StartWorkDayUseCase);

        if (route === null || routeDay === null) {
          Toast.show({
            type: 'error',
            text1: 'Error durante la creación de la operación de inventario.',
            text2: 'No se ha podido recuperar la información de la ruta o del día de ruta, por favor intente nuevamente.',
          });
          setIsInventoryAccepted(false);
          return;
        }

        Toast.show({
          type: 'info',
          text1: 'Registrando día de trabajo.',
          text2: 'Tomará unos segundos.',
        });

        try {
          console.log("Executing start shift day use case");
          await startShiftDayUseCaseCommand.execute(
             getTotalAmountFromCashInventory(cashInventory),
             route,
             availableProducts,
             inventoryOperationMovements,
             routeDay
          )

          // Executing a synchronization process to register the start shift inventory
          // Note: In case of failure, the background process will eventually synchronize the records.
          
          // TODO: syncingRecordsWithCentralDatabase();


          const retrieveCurrentShiftInventoryQuery = di_container.resolve<RetrieveCurrentShiftInventoryQuery>(RetrieveCurrentShiftInventoryQuery);
          const retrieveWorkDayInformationQuery = di_container.resolve<RetrieveCurrentWorkdayInformationQuery>(RetrieveCurrentWorkdayInformationQuery);
          const retrieveCurrentDayOperationsQuery = di_container.resolve<RetrieveDayOperationQuery>(RetrieveDayOperationQuery);

          
          const productInventoryResult     = await retrieveCurrentShiftInventoryQuery.execute()
          const workDayInformationResult   = await retrieveWorkDayInformationQuery.execute()
          const currentDayOperationsResult = await retrieveCurrentDayOperationsQuery.execute()

          if (workDayInformationResult === null) {
            Toast.show({
              type: 'error',
              text1: 'Error durante la creación de la operación de inventario.',
              text2: 'No se ha podido recuperar la información de la ruta o del día de ruta, por favor intente nuevamente.',
            });
            return
          }
          
          dispatch(setProductInventory(productInventoryResult));
          dispatch(setWorkDayInformation(workDayInformationResult));
          dispatch(setDayOperations(currentDayOperationsResult));

          Toast.show({
            type: 'success',
            text1: 'Se ha registrado el inventario inicial con exito.',
            text2: 'El proceso para registrar el inventario inicial ha sido completado exitosamente.',
          });
 
          router.replace('/routeOperationMenuLayout');
        } catch (error) {
          console.log("Error during start shift inventory operation execution:", error);
          Toast.show({
            type: 'error',
            text1: 'Ha habido un error durante el registro del inventario inicial.',
            text2: 'Ha sucedido un error durante el registro del inventario inicial, por favor intente nuevamente.',
          });

          router.replace('/selectionRouteOperationLayout');
        }

      } else if (id_type_of_operation_search_param === DAY_OPERATIONS.restock_inventory) {
        if (workDayInformation === null) {
          Toast.show({
            type: 'error',
            text1: 'Ha ocurrido un error.',
            text2: 'Reinicia la aplicación e intenta nuevamente.',
          })
          return;
        }

        Toast.show({
          type: 'info',
          text1: 'Registrando re-stock.',
          text2: 'Tomará unos segundos.',
        });

        try {
          const registerRestockOfProductCommand = di_container.resolve<RegisterRestockOfProductUseCase>(RegisterRestockOfProductUseCase);
          registerRestockOfProductCommand.execute(
            inventoryOperationMovements,
            workDayInformation
          );

          const retrieveCurrentShiftInventoryQuery = di_container.resolve<RetrieveCurrentShiftInventoryQuery>(RetrieveCurrentShiftInventoryQuery);
          setProductInventory(await retrieveCurrentShiftInventoryQuery.execute());

          Toast.show({
                type: 'success',
                text1: 'Se ha registrado el restock exitosamente.',
                text2: '',
          });
          // TODO: Update redux
          router.replace('/routeOperationMenuLayout');
        } catch (error) {
          Toast.show({
            type: 'error',
            text1: 'Ha ocurrido un error, intente nuevamente.',
            text2: 'Intente la operación nuevamente.',
          });
          router.replace('/routeOperationMenuLayout');
        }
      } else if (id_type_of_operation_search_param === DAY_OPERATIONS.product_devolution_inventory) {
        if (workDayInformation === null) {
          Toast.show({
            type: 'error',
            text1: 'Ha ocurrido un error.',
            text2: 'Reinicia la aplicación e intenta nuevamente.',
          })
          return;
        }

        Toast.show({
          type: 'info',
          text1: 'Registrando merma de producto.',
          text2: 'Tomará unos segundos.',
        });

        try {
          const registerProductDevolutionCommand = di_container.resolve<RegisterProductDevolutionUseCase>(RegisterProductDevolutionUseCase);
          registerProductDevolutionCommand.execute(
            inventoryOperationMovements,
            workDayInformation
          );
          Toast.show({
                type: 'success',
                text1: 'Se ha registrado la merma de producto exitosamente.',
                text2: '',
          });
          // TODO: Update redux
          /*
            According with business rules, after registering a product devolution, the user registers the final shift inventory
          */
          router.replace(`/inventoryOperationLayout?id_type_of_operation_search_param=${DAY_OPERATIONS.end_shift_inventory}`);
        } catch (error) {
          Toast.show({
            type: 'error',
            text1: 'Ha ocurrido un error, intente nuevamente.',
            text2: 'Intente la operación nuevamente.',
          });
          router.replace('/routeOperationMenuLayout');
        }          
      } else if (id_type_of_operation_search_param === DAY_OPERATIONS.end_shift_inventory) {
        if (workDayInformation === null) {
          Toast.show({
            type: 'error',
            text1: 'Ha ocurrido un error.',
            text2: 'Reinicia la aplicación e intenta nuevamente.',
          })
          return;
        }

        Toast.show({
          type: 'info',
          text1: 'Registrando inventario final.',
          text2: 'Registrando información necesaria para cerrar el inventario final y terminar el dia correctamente.',
        });

        try {
          const registerEndShiftInventoryCommand = di_container.resolve<FinishShiftDayUseCase>(FinishShiftDayUseCase);
          await registerEndShiftInventoryCommand.execute(
            getTotalAmountFromCashInventory(cashInventory),
            inventoryOperationMovements,
            workDayInformation
          );

          Toast.show({
                type: 'success',
                text1: 'Se ha registrado el inventario final exitosamente.',
                text2: '',
          });
          // TODO: Update redux

          router.replace('/routeOperationMenuLayout');
        } catch (error) {
          Toast.show({
            type: 'error',
            text1: 'Ha ocurrido un error, intente nuevamente.',
            text2: 'Intente la operación nuevamente.',
          });
        }
         
      } else {
        /* Do nothing */
      }
  }

  const handlerOnVendorCancelation = () => {
    if (id_type_of_operation_search_param === DAY_OPERATIONS.start_shift_inventory) {
      /*
        According with the workflow, if the vendor is making the start shift inventory, if he decides to
        cancel the operation, he has to return to the route selection screen and make the process again.
      */
      router.replace('/routeSelectionLayout');
    } else {
      // That means the route vendor is canceling an inventory operation during the day.
      router.replace('/routeOperationMenuLayout');
    }
  };

  const handleStartInventoryOperationFromThisOperation = () => {
    console.log('Starting inventory operation from this operation');
  }

  return (
    <ScrollView style={tw`w-full flex flex-col`}>
      <ActionDialog
        visible={showDialog}
        onAcceptDialog={handleConfirmInventoryOperation}
        onDeclinedialog={handleCancelInventoryOperationProcess}>
          <View style={tw`w-11/12 flex flex-col`}>
            <Text style={tw`text-center text-black text-xl`}>
              ¿Estas seguró de continuar?
            </Text>
            <Text style={tw`my-2 text-center text-black text-xl font-bold`}>
              {
              id_type_of_operation_search_param === DAY_OPERATIONS.start_shift_inventory
              || id_type_of_operation_search_param === DAY_OPERATIONS.end_shift_inventory ?
              'Puede ser que estes olvidando registrar algún producto o cantidad de dinero.' :
              'Puede ser que estes olvidando registrar algún producto'
              }
            </Text>
          </View>
      </ActionDialog>

      <View style={tw`mt-3 w-full flex basis-1/6`}>
        {/* Go back it's considered as canceling the inventory operation */}
        <RouteHeader onGoBack={handlerOnVendorCancelation}/> 
      </View>

      {/* Inventory operation section. */}
      <View style={tw`w-full flex flex-row items-center justify-center`}>
        <View style={tw`flex flex-col items-center justify-center`}>
          <Text style={tw`text-center text-black text-2xl`}>
            { getTitleDayOperation(id_type_of_operation_search_param) }
          </Text>
          { !isActiveOperation &&
          <Text style={tw`text-center text-black text-base`}>
            Operación cancelada
          </Text>
          }
        </View>
        { (isInventoryOperationModifiable && !isOperation) &&
          <Pressable
            style={tw`bg-blue-500 py-6 px-6 rounded-full ml-3`}
            onPress={handleStartInventoryOperationFromThisOperation}
            >
            <Icon
              name={'edit'}
              style={tw`absolute inset-0 top-3 text-base text-center`} color="#fff" />
          </Pressable>
        }
      </View>

      {/* Depending on the action, it will be decided the menu to be displayed. */}
      { id_type_of_operation_search_param === DAY_OPERATIONS.consult_inventory ?
        <View style={tw`flex basis-auto w-full mt-3`}>
          <TableInventoryVisualization 
            availableProduct                = {availableProducts}
            suggestedInventory              = {suggestedInventory}
            initialInventory                = {[]}
            restockInventories              = {restockInventories}
            soldOperations                  = {productSoldTransactions}
            repositionsOperations           = {productRepositionTransactions}
            returnedInventory               = {[]}
            inventoryWithdrawal             = {inventoryWithdrawal}
            inventoryOutflow                = {inventoryOutflow}
            finalOperation                  = {finalOperation}
            issueInventory                  = {issueInventory}
            isInventoryOperationModifiable  = {isInventoryOperationModifiable}
            />
          { (inventoryOperationToConsult?.id_inventory_operation_type === DAY_OPERATIONS.end_shift_inventory && isActiveOperation === true) &&
            <View style={tw`flex basis-auto w-full mt-3`}>
              <Text style={tw`w-full text-center text-black text-2xl`}>
                Producto vendido por tienda
              </Text>
              <TableRouteTransactionProductVisualization
                  availableProducts               = {availableProducts}
                  stores                          = {[]}
                  routeTransactions               = {[]}
                  idInventoryOperationTypeToShow  = { id_type_of_operation_search_param }
                  calculateTotalOfProduct         = {true}/>
              <Text style={tw`w-full text-center text-black text-2xl`}>
                Producto vendido por tienda
              </Text>
              <TableRouteTransactionProductVisualization
                  availableProducts               = {availableProducts}
                  stores                          = {[]}
                  routeTransactions               = {[]}
                  idInventoryOperationTypeToShow  = { id_type_of_operation_search_param }
                  calculateTotalOfProduct         = {true}/>
              <Text style={tw`w-full text-center text-black text-2xl`}>
                Reposición de producto por tienda
              </Text>
                <TableRouteTransactionProductVisualization
                  availableProducts               = {availableProducts}
                  stores                          = {[]}
                  routeTransactions               = {[]}
                  idInventoryOperationTypeToShow  = { id_type_of_operation_search_param }
                  calculateTotalOfProduct         = {true}/>
            </View>
          }
        </View> :
        <View style={tw`flex basis-auto w-full mt-3`}>
          <TableInventoryOperations
              availableProducts={availableProducts}
              suggestedInventory={suggestedInventory}
              currentInventory={currentShiftInventory}
              movementsOfOperation={inventoryOperationMovements}
              setInventoryOperation={setInventoryOperationMovements}
              id_type_of_operation={id_type_of_operation_search_param} />
        </View>
      }
      {/* Cash reception section. */}
      {((id_type_of_operation_search_param === DAY_OPERATIONS.start_shift_inventory
      || id_type_of_operation_search_param === DAY_OPERATIONS.end_shift_inventory)
      && isOperation && !isOperationToUpdate) &&
        <View style={tw`flex basis-auto w-full mt-3`}>
          <Text style={tw`w-full text-center text-black text-2xl`}>
            {id_type_of_operation_search_param === DAY_OPERATIONS.start_shift_inventory && 'Fondo'}
            {id_type_of_operation_search_param === DAY_OPERATIONS.end_shift_inventory && 'Fondo + dinero de venta (efectivo)'}
          </Text>
          <TableCashReception
            cashInventoryOperation={cashInventory}
            setCashInventoryOperation={setCashInventory}/>
          <Text style={tw`w-full text-center text-black text-xl mt-2`}>
            Total:
            ${cashInventory.reduce((accumulator, denomination) => {
                return accumulator + denomination.amount! * denomination.value;},0)}
            </Text>
        </View>
      }
      {/* Total amount of petty cash */}
      { ((id_type_of_operation_search_param === DAY_OPERATIONS.start_shift_inventory
      || id_type_of_operation_search_param === DAY_OPERATIONS.end_shift_inventory) 
      && !isOperation
      && isActiveOperation
      && workDayInformation) &&
        <View style={tw`w-11/12 ml-3 flex flex-col basis-auto mt-3`}>
          <Text style={tw`text-black text-lg`}>
            Dinero llevado al inicio de la ruta: ${workDayInformation.start_petty_cash}
          </Text>
        </View>
      }
      { (id_type_of_operation_search_param === DAY_OPERATIONS.end_shift_inventory
      && !isOperation
      && isActiveOperation
      && workDayInformation) &&
        <View style={tw`w-11/12 ml-3 flex flex-col basis-auto mt-3`}>
          <Text style={tw`text-black text-lg`}>
            Dinero regresado al final de la ruta: ${workDayInformation.final_petty_cash ? workDayInformation.final_petty_cash : 0}
          </Text>
        </View>
      }
      {/* User actions */}
      <View style={tw`flex basis-1/6 mt-3`}>
        <VendorConfirmation
          onConfirm={isOperation ?
            handleAcceptInventoryOperation : handleGoBackOperationDayMenu}
          onCancel={isOperation ? handlerOnVendorCancelation : handleGoBackOperationDayMenu}
          message={'Escribiendo mi numero de telefono y marcando el cuadro de texto acepto tomar estos productos.'}
          confirmMessageButton={isOperation ? 'Aceptar' : 'Volver al menú'}
          cancelMessageButton={isOperation ? 'Cancelar' : 'Volver al menú'}
          requiredValidation={
            false
            //isOperation
            }/>
      </View>
      <View style={tw`flex basis-1/6`} />
    </ScrollView>
  );
};

export default inventoryOperationLayout;
