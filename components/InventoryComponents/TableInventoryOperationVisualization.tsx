// Libraries
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { DataTable, ActivityIndicator } from 'react-native-paper';
import tw from 'twrnc';

// Interfaces
import {
  IProductInventory,
 } from '../../interfaces/interfaces';
import { findProductAmountInArray } from '../../utils/inventoryOperations';

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
import ProductDTO from '@/src/application/dto/ProductDTO';
import ProductInventoryDTO from '@/src/application/dto/ProductInventoryDTO';
import InventoryOperationDescriptionDTO from '@/src/application/dto/InventoryOperationDescriptionDTO';
import RouteTransactionDescriptionDTO from '@/src/application/dto/RouteTransactionDescriptionDTO';
import { convertArrayOfInterfacesToMapOfInterfaces } from '@/utils/interface/utils';


/*
  To generalize as much as possible, this component was made to be capable of showing all the possible "inventory operations".

  At the moment of writing this, there are 4 possible operations:
  - Start inventory
  - Restock inventory
  - Product inventory
  - Final inventory

  Although each one has its particularities (business logic), all of them can share the same UI.
*/

const TableInventoryOperationVisualization = (
  {
    availableProducts,
    suggestedInventory,
    initialInventory,
    restockInventories,
    soldOperations,
    repositionsOperations,
    returnedInventory,
    inventoryWithdrawal = false,
    inventoryOutflow = false,
    finalOperation = false,
    issueInventory = false,
  }:{
    availableProducts: ProductDTO[],
    suggestedInventory: ProductInventoryDTO[],
    initialInventory: InventoryOperationDescriptionDTO[], // There is only "one" initial inventory operation
    restockInventories: InventoryOperationDescriptionDTO[][], // It could be many "restock" inventories
    soldOperations: RouteTransactionDescriptionDTO[], // Outflow in concept of selling
    repositionsOperations: RouteTransactionDescriptionDTO[], // Outflow in concept of repositions
    returnedInventory: InventoryOperationDescriptionDTO[], // Refers to the final inventory
    inventoryWithdrawal: boolean,
    inventoryOutflow: boolean,
    finalOperation: boolean,
    issueInventory: boolean,
  }) => {

  const availableProductsStored: ProductDTO[] = availableProducts.sort((a, b) => a.order_to_show - b.order_to_show);

  const mapSuggestedInventory: Map<string, ProductInventoryDTO> = convertArrayOfInterfacesToMapOfInterfaces('id_product', suggestedInventory);
  const mapInitialInventory: Map<string, InventoryOperationDescriptionDTO> = convertArrayOfInterfacesToMapOfInterfaces('id_product', initialInventory);
  
  const restockInventoriesMaps: Map<string, InventoryOperationDescriptionDTO>[] = [];
  restockInventories.forEach((restockInventory:InventoryOperationDescriptionDTO[]) => {
    const currentMapRestockInventory: Map<string, InventoryOperationDescriptionDTO>
      = convertArrayOfInterfacesToMapOfInterfaces('id_product', restockInventory);
    restockInventoriesMaps.push(currentMapRestockInventory);
  });
  
  const mapReturnedInventory: Map<string, InventoryOperationDescriptionDTO> = convertArrayOfInterfacesToMapOfInterfaces('id_product', returnedInventory);

  const mapSoldOperations: Map<string, RouteTransactionDescriptionDTO> = convertArrayOfInterfacesToMapOfInterfaces('id_product', soldOperations);
  const mapRepositionsOperations: Map<string, RouteTransactionDescriptionDTO> = convertArrayOfInterfacesToMapOfInterfaces('id_product', repositionsOperations);

  return (
    <View style={tw`w-full flex flex-row`}>
      { (initialInventory.length > 0
      || returnedInventory.length > 0
      || restockInventories.length > 0) ?
        <View style={tw`w-full flex flex-row`}>
          {/* Datatable for name of the products */}
          <DataTable style={tw`w-1/3`}>
            <DataTable.Header>
              <DataTable.Title style={tw`${headerTitleTableStyle}`}>
                  <Text style={tw`${textHeaderTableStyle}`}>Producto</Text>
              </DataTable.Title>
            </DataTable.Header>
            { availableProductsStored.map((product) => {
              return (
                <DataTable.Row key={product.id_product} style={tw`${rowTableStyle}`}>
                  <DataTable.Cell style={tw`${cellTableStyle}`}>
                      <Text style={tw`${textRowTableStyle}`}>{product.product_name}</Text>
                  </DataTable.Cell>
                </DataTable.Row>
              );})
            }
          </DataTable>
          {/* Datatable for the information for each concept */}
          <ScrollView horizontal={true}>
            <DataTable style={tw`w-full`}>
              {/* Header section */}
              <DataTable.Header>
                { initialInventory.length > 0 &&
                  <DataTable.Title style={tw`${headerTitleTableStyle}`}>
                      <Text style={tw`${textHeaderTableStyle}`}>Inventario inicial</Text>
                  </DataTable.Title>
                }
                { restockInventories.length > 0 &&
                  restockInventories.map((currentInventory, index) => {
                    return (
                      <DataTable.Title key={index} style={tw`${headerTitleTableStyle}`}>
                        <Text style={tw`${textHeaderTableStyle}`}>Re-stock</Text>
                      </DataTable.Title>
                    );
                  })
                }
                { inventoryWithdrawal &&
                  <DataTable.Title style={tw`${headerTitleTableStyle}`}>
                    <Text style={tw`${textHeaderTableStyle} font-bold underline`}>Salida total</Text>
                  </DataTable.Title>
                }
                { soldOperations.length > 0 &&
                  <DataTable.Title style={tw`${headerTitleTableStyle}`}>
                    <Text style={tw`${textHeaderTableStyle}`}>Venta</Text>
                  </DataTable.Title>
                }
                { repositionsOperations.length > 0 &&
                  <DataTable.Title style={tw`${headerTitleTableStyle}`}>
                    <Text style={tw`${textHeaderTableStyle}`}>Cambio</Text>
                  </DataTable.Title>
                }
                { inventoryOutflow &&
                  <DataTable.Title style={tw`${headerTitleTableStyle}`}>
                    <Text style={tw`${textHeaderTableStyle} font-bold underline`}>Total vendido y cambiado</Text>
                  </DataTable.Title>
                }
                { finalOperation &&
                  <DataTable.Title style={tw`${headerTitleTableStyle}`}>
                    <Text style={tw`${textHeaderTableStyle}`}>Inventario final</Text>
                  </DataTable.Title>
                }
                { returnedInventory.length > 0 &&
                    <DataTable.Title style={tw`${headerTitleTableStyle}`}>
                      <Text style={tw`${textHeaderTableStyle}`}>Inventario físico</Text>
                  </DataTable.Title>
                }
                { issueInventory &&
                  <DataTable.Title style={tw`${headerTitleTableStyle}`}>
                    <Text style={tw`${textHeaderTableStyle} font-bold underline`}>Problema con inventario</Text>
                  </DataTable.Title>
                }
              </DataTable.Header>
              {/* Body section */}
              { (initialInventory.length > 0 || returnedInventory.length > 0 || restockInventories.length > 0) &&
                availableProductsStored.map((product) => {
                  /*
                    To keep an order of how to print the inventory operations, it is used the variable "inventory" which has
                    all the products (and the current amount for each product).

                    "Inventory" is used has the reference of what to print in the "current iteration", so it is going to depend
                    on the current product that it is going to be searched that particular product in the other arrays that store
                    the information of the "product inventory"

                    Since the inventory operations only store if a product had a movement, if there is not find the product of the
                    current operation, it is going to be diplayed with a value of "0" (indicating that it was not a
                    movement of that particular product).
                  */

                  // Propierties that are always going to be present.
                  let id_product = product.id_product;

                  /* Declaring variables that will store the amount of product for each type of operation*/
                  let suggestedAmount = 0;
                  let initialInventoryOperationAmount = 0;
                  let returnedInventoryOperationAmount = 0;
                  let restockInventoryOperationAmount:number[] = [];
                  let soldInventoryOperationAmount = 0;
                  let repositionInventoryOperationAmount = 0;

                  // Special calculations variables
                  let withdrawalAmount = 0;
                  let inventoryOutflowAmount = 0;
                  let finalOperationAmount = 0;
                  let inventoryIssueAmount = 0;

                  // Searching the product in the inventory operations
                  suggestedAmount                     = mapSuggestedInventory.has(id_product) ? mapSuggestedInventory.get(id_product)!.stock : 0;
                  initialInventoryOperationAmount     = mapInitialInventory.has(id_product) ? mapInitialInventory.get(id_product)!.amount : 0;
                  returnedInventoryOperationAmount    = mapReturnedInventory.has(id_product) ? mapReturnedInventory.get(id_product)!.amount : 0;
                  soldInventoryOperationAmount        = mapSoldOperations.has(id_product) ? mapSoldOperations.get(id_product)!.amount : 0;
                  repositionInventoryOperationAmount  = mapRepositionsOperations.has(id_product) ? mapRepositionsOperations.get(id_product)!.amount : 0;
                  
              
                  restockInventoriesMaps.forEach((mapRestockInventory:Map<string, InventoryOperationDescriptionDTO>) => {
                    const currentRestockProductAmount = mapRestockInventory.has(id_product) ? mapRestockInventory.get(id_product)!.amount : 0;
                    withdrawalAmount += currentRestockProductAmount;
                    restockInventoryOperationAmount.push(currentRestockProductAmount);
                  });

                  // Special calculations
                  withdrawalAmount += initialInventoryOperationAmount;
                  inventoryOutflowAmount = soldInventoryOperationAmount + repositionInventoryOperationAmount;

                  finalOperationAmount = withdrawalAmount - inventoryOutflowAmount;

                  inventoryIssueAmount = finalOperationAmount - returnedInventoryOperationAmount;
                  return (
                    <DataTable.Row style={tw`${rowTableStyle}`}
                    key={product.id_product}>
                      {/* This field is never empty since it is necessary anytime */}
                      {/* Product (product identification) */}
                      {/* Suggested inventory */}
                      { suggestedInventory.length > 0 &&
                        <DataTable.Cell style={tw`${suggestedAmount > 0 ? cellTableStyleWithAmountOfProduct : cellTableStyle}`}>
                          <View style={tw`${viewTagRowTableStyle}`}>
                            <Text style={tw`${textRowTableStyle}`}>
                              {suggestedAmount}
                            </Text>
                          </View>
                        </DataTable.Cell>
                      }
                      {/* Initial inventory */}
                      { initialInventory.length > 0 &&
                        <DataTable.Cell style={tw`${initialInventoryOperationAmount > 0 ? cellTableStyleWithAmountOfProduct : cellTableStyle}`}>
                          <View style={tw`${viewTagRowTableStyle}`}>
                            <Text style={tw`${textRowTableStyle}`}>
                              {initialInventoryOperationAmount}
                            </Text>
                          </View>
                      </DataTable.Cell>

                      }
                      {/* Restock of product */}
                      { restockInventoryOperationAmount.length > 0 &&
                        restockInventoryOperationAmount.map((productAmount, index) => {
                          return (
                            <DataTable.Cell key={index} style={tw`${productAmount > 0 ? cellTableStyleWithAmountOfProduct : cellTableStyle}`}>
                              <View style={tw`${viewTagRowTableStyle}`}>
                                <Text style={tw`${textRowTableStyle}`}>
                                  {productAmount}
                                </Text>
                              </View>
                            </DataTable.Cell>
                          );
                        })
                      }
                      {/* Inflow product */}
                      { inventoryWithdrawal === true &&
                        <DataTable.Cell style={tw`${withdrawalAmount > 0 ? cellTableStyleWithAmountOfProduct : cellTableStyle}`}>
                          <View style={tw`${viewTagRowTableStyle}`}>
                            <Text style={tw`${textRowTableStyle}`}>
                              {withdrawalAmount}
                            </Text>
                          </View>
                        </DataTable.Cell>
                      }
                      {/* Product sold */}
                      { soldOperations.length > 0 &&
                        <DataTable.Cell style={tw`${soldInventoryOperationAmount > 0 ? cellTableStyleWithAmountOfProduct : cellTableStyle}`}>
                          <View style={tw`${viewTagRowTableStyle}`}>
                            <Text style={tw`${textRowTableStyle}`}>
                              {soldInventoryOperationAmount}
                            </Text>
                          </View>
                        </DataTable.Cell>
                      }
                      {/* Product reposition */}
                      { repositionsOperations.length > 0 &&
                        <DataTable.Cell style={tw`${repositionInventoryOperationAmount > 0 ? cellTableStyleWithAmountOfProduct : cellTableStyle}`}>
                          <View style={tw`${viewTagRowTableStyle}`}>
                            <Text style={tw`${textRowTableStyle}`}>
                              {repositionInventoryOperationAmount}
                            </Text>
                          </View>
                        </DataTable.Cell>
                      }
                      {/* Outflow product */}
                      { inventoryOutflow === true &&
                        <DataTable.Cell style={tw`${inventoryOutflowAmount > 0 ? cellTableStyleWithAmountOfProduct : cellTableStyle}`}>
                          <View style={tw`${viewTagRowTableStyle}`}>
                            <Text style={tw`${textRowTableStyle}`}>
                              {inventoryOutflowAmount}
                            </Text>
                          </View>
                        </DataTable.Cell>
                      }
                      {/* Final inventory */}
                      { finalOperation === true &&
                        <DataTable.Cell style={tw`${finalOperationAmount > 0 ? cellTableStyleWithAmountOfProduct : cellTableStyle}`}>
                          <View style={tw`${viewTagRowTableStyle}`}>
                            <Text style={tw`${textRowTableStyle}`}>
                              {finalOperationAmount}
                            </Text>
                          </View>
                        </DataTable.Cell>
                      }
                      {/* Returned inventory */}
                      { returnedInventory.length > 0 &&
                        <DataTable.Cell style={tw`${returnedInventoryOperationAmount > 0 ? cellTableStyleWithAmountOfProduct : cellTableStyle}`}>
                          <View style={tw`${viewTagRowTableStyle}`}>
                            <Text style={tw`${textRowTableStyle}`}>
                              {returnedInventoryOperationAmount}
                            </Text>
                          </View>
                        </DataTable.Cell>
                      }
                      {/* Inventory problem */}
                      { issueInventory === true &&
                        <DataTable.Cell style={tw`${cellTableStyle} 
                          ${inventoryIssueAmount === 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                          <View style={tw`${viewTagRowTableStyle}`}>
                            <Text style={tw`${textRowTableStyle}`}>
                              {inventoryIssueAmount}
                            </Text>
                          </View>
                        </DataTable.Cell>
                      }
                    </DataTable.Row>
                  );
                })
              }
            </DataTable>
          </ScrollView>
        </View> :
        <View style={tw`w-full flex flex-col justify-center`}>
          <ActivityIndicator size={'large'} />
        </View>
      }
    </View>
  );
};

export default TableInventoryOperationVisualization;
