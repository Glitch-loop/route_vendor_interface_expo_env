// Libraries
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { DataTable, ActivityIndicator } from 'react-native-paper';
import tw from 'twrnc';

// Interfaces
import { IDayOperation, IProductInventory } from '../../interfaces/interfaces';
import AutomatedCorrectionNumberInput from '../generalComponents/AutomatedCorrectionInput';
import DAYS_OPERATIONS from '../../lib/day_operations';

// Styles
import {
  headerTitleTableStyle,
  viewTagHeaderTableStyle,
  textHeaderTableStyle,
  rowTableStyle,
  cellTableStyle,
  viewTagRowTableStyle,
  textRowTableStyle,
} from '../../utils/inventoryOperationTableStyles';

/*
  The intnetion of this component is to provide an interface to perform an inventory operation.
  At the moment of write this documentation there are 4 possible operations:
  - Start inventory
  - Restock inventory
  - Product inventory
  - Final inventory

  All of them implies to receive/deliver product, depending on the context of how the inventory operation
  is performed is how it is going to impact in the vendor's inventory.

  This component recieves these parameters:
    - suggestedInventory: Suggestion for the vendor to take product for the route (informative).
    - currentInventory: The current vendor's inventory.
    - operationInventory: The inventory that vendor's is taking for the route.
    - enablingFinalInventory: The addition between the current inventory and what the vendor is currently taking.
    - setInventoryOperation: Handler to update "inventory operation".

  Note: If you pass "[]" (empty) array, it will be taking as there is not information (this option was preferred
  over the "undefined" one).

  Note: The param on which the component build the table is "operationInventory" (the information of the other arrays
  display its information around "operationInventory").
*/
function foundCurrentProductInArray(arrProduct: IProductInventory[], current_id_product: string):number {
  let resultAmount = 0;
  if (arrProduct.length > 0) {
    let foundSuggestedProduct = arrProduct.find(suggestedProduct =>
      suggestedProduct.id_product === current_id_product);

      if (foundSuggestedProduct !== undefined) {
        resultAmount = foundSuggestedProduct.amount;
      } else {
        resultAmount = 0;
      }
  } else {
    resultAmount =  0;
  }

  return resultAmount;
}

function determineFlowOfProduct(operation:IDayOperation):number {
  let result:number = 0;
  // This operations are made from the factory perspective
  if (operation.id_type_operation === DAYS_OPERATIONS.product_devolution_inventory) {
    result = 1; // It is an inflow
  } else if (operation.id_type_operation === DAYS_OPERATIONS.end_shift_inventory){
    result = 2; // It is an inflow
  } else {
    result = 0; // It is an outflow
  }

  return result;
}

function determineHeaderOfInputColumn(context:number):string {
  let result:string = ""
  if (context === 1) {
    result = 'Merma a reportar';
  } else if (context === 2) {
    result = 'Producto a devolver';
  } else {
    result = 'Producto a llevar';
  }
  return result;                       
}

function detemrineHeaderOfTotalColumn(context:number):string {
  let result:string = ""
  if (context === 1) {
    result = 'Merma a entregar';
  } else if (context === 2) {
    result = 'Producto a devolver';
  } else {
    result = 'Inventario a llevar';
  }
  return result;                 
}


const TableInventoryOperations = (
  {
    suggestedInventory,
    currentInventory,
    operationInventory,
    setInventoryOperation,
    currentOperation,
  }:{
    suggestedInventory:IProductInventory[],
    currentInventory:IProductInventory[],
    operationInventory:IProductInventory[],
    setInventoryOperation:any,
    currentOperation:IDayOperation,
  }) => {
    let contextForTheOperation:number = determineFlowOfProduct(currentOperation);
  return (
    <View style={tw`w-full flex flex-row`}>
      { operationInventory.length ?
        <View style={tw`w-full flex flex-row`}>
          <DataTable style={tw`w-1/3`}>
            {/* Header section */}
            <DataTable.Header>
              {/* This field is never empty since it is necessary anytime */}
              <DataTable.Title style={tw`${headerTitleTableStyle}`}>
                <View style={tw`${viewTagRowTableStyle}`}>
                  <Text style={tw`${textHeaderTableStyle}`}>Producto</Text>
                </View>
              </DataTable.Title>
            </DataTable.Header>
            {/* Body section */}
            { operationInventory.length > 0 &&
              operationInventory.map((product) => {
                return (
                  <DataTable.Row key={product.id_product}>
                    {/* This field is never empty since it is necessary anytime */}
                    <DataTable.Cell style={tw`${cellTableStyle}`}>
                      <Text style={tw`text-black ${textRowTableStyle}`}>{product.product_name}</Text>
                    </DataTable.Cell>
                  </DataTable.Row>
                );
              })
            }
          </DataTable>
          <ScrollView horizontal={true}>
            <DataTable style={tw`w-auto`}>
              <DataTable.Header>
                { suggestedInventory.length > 0 &&
                  <DataTable.Title style={tw`${headerTitleTableStyle}`}>
                    <View style={tw`${viewTagHeaderTableStyle}`}>
                      <Text style={tw`${textHeaderTableStyle}`}>Sugerido</Text>
                    </View>
                  </DataTable.Title>
                }
                { currentInventory.length > 0 &&
                  <DataTable.Title style={tw`${headerTitleTableStyle}`}>
                    <View style={tw`${viewTagHeaderTableStyle}`}>
                      <Text style={tw`${textHeaderTableStyle}`}>Inventario Actual</Text>
                    </View>
                  </DataTable.Title>
                }
                {/* This field is never empty since it is the reason of this component (inventory operation) */}
                <DataTable.Title style={tw`${headerTitleTableStyle}`}>
                  <View style={tw`${viewTagHeaderTableStyle}`}>
                    <Text style={tw`${textHeaderTableStyle}`}>
                      { determineHeaderOfInputColumn(contextForTheOperation) }
                    </Text>
                  </View>
                </DataTable.Title>
                <DataTable.Title style={tw`${headerTitleTableStyle}`}>
                  <View style={tw`${viewTagHeaderTableStyle}`}>
                    <Text style={tw`${textHeaderTableStyle}`}>
                      { detemrineHeaderOfTotalColumn(contextForTheOperation) }
                    </Text>
                  </View>
                </DataTable.Title>
              </DataTable.Header>
              {/* Body section*/}
              { operationInventory.length > 0 &&
                operationInventory.map((product) => {
                  // Propierties that are always going to be present.
                  let id_product = product.id_product;
                  let amount = product.amount;

                  // Properties that might not appear
                  let suggestedAmount = 0;
                  let currentInventoryAmount = 0;

                  // Searching products for each array
                  suggestedAmount = foundCurrentProductInArray(suggestedInventory, id_product);
                  currentInventoryAmount = foundCurrentProductInArray(currentInventory, id_product);

                  // Handlers
                  const handlerChangeInventory = (input: number) => {
                    // Creating a copy og the inventory operation.
                    const updatedInventory: IProductInventory[] = [...operationInventory];

                    // Looking for the product to update.
                    const index:number = operationInventory
                      .findIndex((productOperationInventory:IProductInventory) => productOperationInventory.id_product === id_product);

                    if (index !== -1) { // The product exists in the inventory.
                      const updatedProduct = { ...updatedInventory[index], amount: input };

                      updatedInventory[index] = updatedProduct;

                      setInventoryOperation(updatedInventory);
                    } else {
                      /* The product is not in the inventory */
                    }
                  };

                  return (
                    <DataTable.Row key={product.id_product}>
                      { suggestedInventory.length > 0 &&
                        <DataTable.Cell style={tw`${cellTableStyle}`}>
                          <Text style={tw`text-black ${textRowTableStyle}`}>{suggestedAmount}</Text>
                        </DataTable.Cell>
                      }
                      { currentInventory.length > 0 &&
                        <DataTable.Cell style={tw`${cellTableStyle}`}>
                          <Text style={tw`text-black ${textRowTableStyle}`}>{currentInventoryAmount}</Text>
                        </DataTable.Cell>
                      }
                      <DataTable.Cell style={tw`${cellTableStyle}`}>
                        <View style={tw`w-8/12`}>
                          <AutomatedCorrectionNumberInput
                            amount={amount}
                            onChangeAmount={handlerChangeInventory}/>
                        </View>
                      </DataTable.Cell>
                      <DataTable.Cell style={tw`${cellTableStyle}`}>
                        <Text style={tw`text-black ${textRowTableStyle}`}>{ amount + currentInventoryAmount }</Text>
                      </DataTable.Cell>
                    </DataTable.Row>
                  );
                })
              }
            </DataTable>
          </ScrollView>
        </View> 
        :
        <DataTable.Row>
          <View style={tw`w-full h-full flex flex-col justify-center`}>
            <ActivityIndicator size={'large'} />
          </View>
        </DataTable.Row>
      }

    </View>
  );
};

export default TableInventoryOperations;
