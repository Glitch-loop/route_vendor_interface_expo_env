// Libraries
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { DataTable, ActivityIndicator } from 'react-native-paper';
import tw from 'twrnc';

// Interfaces
import AutomatedCorrectionNumberInput from '@/components/shared-components/AutomatedCorrectionInput';;

// Styles
import {
  headerTitleTableStyle,
  viewTagHeaderTableStyle,
  textHeaderTableStyle,
  rowTableStyle,
  cellTableStyle,
  viewTagRowTableStyle,
  textRowTableStyle,
  cellTableStyleWithAmountOfProduct,
} from '../../utils/inventoryOperationTableStyles';

// DTOs
import ProductInventoryDTO from '@/src/application/dto/ProductInventoryDTO';
import InventoryOperationDescriptionDTO from '@/src/application/dto/InventoryOperationDescriptionDTO';
import ProductDTO from '@/src/application/dto/ProductDTO';

// Guards
import { 
  isInventoryOperationDescriptionDTO,
} from '@/src/application/guards/dtoGuards';

// Utils
import { DAY_OPERATIONS } from '@/src/core/enums/DayOperations';
import { capitalizeFirstLetterOfEachWord } from '@/utils/string/utils';

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
function getAmountOfProductInArray(arrProduct: (ProductInventoryDTO[]|InventoryOperationDescriptionDTO[]), id_product: string): number {
  let resultAmount = 0;
  if (arrProduct.length > 0) {
    let foundProductRecord = arrProduct.find(suggestedProduct => suggestedProduct.id_product === id_product);

    if (foundProductRecord === undefined) {
      resultAmount = 0;
    } else {
      if (isInventoryOperationDescriptionDTO(foundProductRecord)) {
          resultAmount = foundProductRecord.amount;
      } else {
         resultAmount = foundProductRecord?.stock;
      }
    }
  } else {
    resultAmount =  0;
  }

  return resultAmount;  
}

function determineHeaderOfInputColumn(id_type_of_operation: string):string {
  let result:string = ""
  if (id_type_of_operation === DAY_OPERATIONS.product_devolution) {
    result = 'Merma a reportar';
  } else if (id_type_of_operation === DAY_OPERATIONS.end_shift_inventory) {
    result = 'Producto a regresar';
  } else {
    result = 'Producto a llevar';
  }

  return result;                        
}

function determineHeaderOfFinalColumn(id_type_of_operation: string):string {
  let result:string = ""
  if (id_type_of_operation === DAY_OPERATIONS.product_devolution) {
    result = 'Merma a reportar';
  } else if (id_type_of_operation === DAY_OPERATIONS.end_shift_inventory) {
    result = 'Producto regresado';
  } else {
    result = 'Producto en ruta';
  }

  return result;                        
}



function detemrineHeaderOfTotalColumn(id_type_of_operation:string):string {
  let result:string = ""
  if (id_type_of_operation === DAY_OPERATIONS.product_devolution) {
    result = 'Merma a entregar';
  } else if (id_type_of_operation === DAY_OPERATIONS.end_shift_inventory) {
    result = 'Producto a regresar';
  } else {
    result = 'Inventario a llevar';
  }
  return result;                 
}


const TableInventoryOperation = (
  {
    availableProducts,
    suggestedInventory,
    currentInventory,
    movementsOfOperation,
    setInventoryOperation,
    id_type_of_operation,
  }:{
    availableProducts: ProductDTO[]
    suggestedInventory:ProductInventoryDTO[],
    currentInventory:ProductInventoryDTO[],
    movementsOfOperation: InventoryOperationDescriptionDTO[],
    setInventoryOperation: (product: InventoryOperationDescriptionDTO[]) => void,
    id_type_of_operation: string,
  }) => {
    // let contextForTheOperation:number = determineFlowOfProduct(currentOperation);
    const orderedAvailableProducts = availableProducts.map(prod => prod).sort((a, b) => a.order_to_show - b.order_to_show);

  return (
    <View style={tw`w-full flex flex-row`}>
      { orderedAvailableProducts.length ?
        <View style={tw`w-full flex flex-row`}>
          <DataTable
          style={tw`w-1/3`}
          >
            {/* Header section */}
            <DataTable.Header>
              {/* This field is never empty since it is necessary anytime */}
              <DataTable.Title style={tw`${headerTitleTableStyle}`}>
                <Text style={tw`${textHeaderTableStyle}`}> Producto </Text>
              </DataTable.Title>
            </DataTable.Header>
            {/* Body section */}
            { orderedAvailableProducts.length > 0 &&
              orderedAvailableProducts.map((product) => {
                const { id_product, product_name } = product;
                return (
                  <DataTable.Row key={id_product}>
                    <DataTable.Cell style={tw`${cellTableStyle}`}>
                      <Text style={tw`${textRowTableStyle}`}> { capitalizeFirstLetterOfEachWord(product_name) } </Text>
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
                  <DataTable.Title style={tw`${headerTitleTableStyle} w-40`}>
                        <Text style={tw`${textHeaderTableStyle}`}>Sugerido</Text>
                  </DataTable.Title>
                }
                { currentInventory.length > 0 &&
                  <DataTable.Title style={tw`w-40 ${headerTitleTableStyle}`}>
                      <Text style={tw`${textHeaderTableStyle}`}>Inventario Actual</Text>
                  </DataTable.Title>
                }
                {/* This field is never empty since it is the reason of this component (inventory operation) */}
                <DataTable.Title style={tw`${headerTitleTableStyle} w-40`}>
                  <Text style={tw`${textHeaderTableStyle}`} >{ determineHeaderOfInputColumn(id_type_of_operation) }</Text>
                </DataTable.Title>
                <DataTable.Title style={tw`${headerTitleTableStyle} w-40`} >
                  <Text style={tw`${textHeaderTableStyle}`} >{ determineHeaderOfFinalColumn(id_type_of_operation) }</Text>
                </DataTable.Title>
              </DataTable.Header>
              
              {/* Body section*/}
              { orderedAvailableProducts.length > 0 &&
                orderedAvailableProducts.map((product) => {
                  const { id_product, price } = product;
                  let amount:number = 0;
                  let suggestedAmount:number = 0;
                  let currentInventoryAmount:number = 0;

                  amount = getAmountOfProductInArray(movementsOfOperation, id_product);
                  suggestedAmount = getAmountOfProductInArray(suggestedInventory, id_product);
                  currentInventoryAmount = getAmountOfProductInArray(currentInventory, id_product);

                  // Handlers
                  const handlerChangeInventory = (input: number) => {
                    setInventoryOperation(
                      [
                        ...movementsOfOperation.filter((productOperationInventory) => { return productOperationInventory.id_product !== id_product; }),
                        { 
                          id_product_operation_description: '',
                          price_at_moment: price,
                          amount: input,
                          id_inventory_operation: '',
                          id_product: id_product
                        }
                      ]
                    );
                  };

                  return (
                    <DataTable.Row key={product.id_product}>
                      { suggestedInventory.length > 0 &&
                        <DataTable.Cell style={tw`${suggestedAmount > 0 ? cellTableStyleWithAmountOfProduct : cellTableStyle} w-40`}>
                          <Text style={tw`text-black ${textRowTableStyle}`}>{suggestedAmount}</Text>
                        </DataTable.Cell>
                      }
                      { currentInventory.length > 0 &&
                        <DataTable.Cell style={tw`${currentInventoryAmount > 0 ? cellTableStyleWithAmountOfProduct : cellTableStyle} w-40 `}>
                          <Text style={tw`text-black ${textRowTableStyle}`}>{currentInventoryAmount}</Text>
                        </DataTable.Cell>
                      }
                      <DataTable.Cell style={tw`${cellTableStyle} w-40`}>
                        <View style={tw`w-8/12`}>
                          <AutomatedCorrectionNumberInput
                            amount={amount}
                            onChangeAmount={handlerChangeInventory}/>
                        </View>
                      </DataTable.Cell>
                      <DataTable.Cell style={tw`${amount + currentInventoryAmount > 0 ? cellTableStyleWithAmountOfProduct : cellTableStyle} w-40`}>
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
          <View style={tw`w-full flex flex-col justify-center`}>
            <ActivityIndicator size={'large'} />
          </View>
        </DataTable.Row>
      }

    </View>
  );
};

export default TableInventoryOperation;
