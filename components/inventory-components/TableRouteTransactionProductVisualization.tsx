// Libraries
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { DataTable, ActivityIndicator } from 'react-native-paper';
import tw from 'twrnc';

// DTOs
import ProductDTO  from '@/src/application/dto/ProductDTO'
import StoreDTO from '@/src/application/dto/StoreDTO';
import RouteTransactionDTO from '@/src/application/dto/RouteTransactionDTO';

// Enums
import DAY_OPERATIONS from '@/src/core/enums/DayOperations';

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
import { ROUTE_TRANSACTION_STATE } from '@/src/core/enums/RouteTransactionState';
import { capitalizeFirstLetterOfEachWord } from '@/utils/string/utils';

/*
 This component is an abstraction from "TableInventoryVisualization" component, here, what is in the "props"
 is what will be displayed, so the order of how the information is stored in the arrays will influence in
 how the information will be displayed.

 The intention of this component is to provide a component for display information around a "concept" like:
 - Stores
 - Movements
 - Products

 Rather than displaying the information of the route as in the main workflow.
*/

interface consolidatedInformation {
  amount: number;
}

function determineWidthAccordingWithLengthOfName(name: string): string {
  let width:string = "w-32"; // Default width
  
  if (name.length > 20 && name.length <= 30) {
    width = "w-48 max-w-48";
  } else if (name.length > 30 && name.length <= 40) {
    width = "w-64 max-w-64";
  } else if (name.length > 40) {
    width = "w-96 max-w-96";
  }
  
  return width;
}

const TableRouteTransactionProductVisualization = (
  {
    availableProducts,
    stores,
    routeTransactions,
    idInventoryOperationTypeToShow,
    calculateTotalOfProduct = false,
  }:{
    availableProducts: ProductDTO[],
    stores: StoreDTO[],
    routeTransactions: RouteTransactionDTO[],
    idInventoryOperationTypeToShow: DAY_OPERATIONS,
    calculateTotalOfProduct:boolean
  }) => {
  
    
  // Organizing product in ascending order to display in the table
  const sortedAvailableProducts = availableProducts.sort((a, b) => a.order_to_show - b.order_to_show);

  const mapConsolidatedByConcept = new Map<string, Map<string, consolidatedInformation>>(); //Map <id_store, Map<id_product, consolidatedInformation>>


  // Consolidate amounts by store and product across all transaction descriptions
  for (const routeTransaction of routeTransactions) {
    const { id_store, transaction_description, state } = routeTransaction;

    if (state === ROUTE_TRANSACTION_STATE.CANCELLED) continue; // Skip cancelled transactions

    if (!mapConsolidatedByConcept.has(id_store)) {
      mapConsolidatedByConcept.set(id_store, new Map<string, consolidatedInformation>());
    }

    const productMap = mapConsolidatedByConcept.get(id_store)!;
    for (const description of transaction_description) {
      const { id_product, amount, id_transaction_operation_type } = description;
      
      if (id_transaction_operation_type === idInventoryOperationTypeToShow) {
        if (!productMap.has(id_product)) {
          productMap.set(id_product, { amount: 0 });
        }
        
        const prevInformation = productMap.get(id_product)!;
        prevInformation.amount += amount;
      }
    }
    mapConsolidatedByConcept.set(id_store, productMap);
  }

  return (
    <View style={tw`w-full flex flex-row`}>
      {(sortedAvailableProducts.length > 0) ?
        <View style={tw`w-full flex flex-row`}>
          {/* Datatable for name of the products */}
          <DataTable style={tw`w-1/3`}>
            <DataTable.Header style={tw`w-full`}>
              {/* This field is never empty since it is necessary anytime */}
              <DataTable.Cell style={tw`h-12 ${headerTitleTableStyle} border-r w-48`}>
                  <Text style={tw`${textHeaderTableStyle}`}>
                    Producto
                  </Text>
              </DataTable.Cell>
            </DataTable.Header>
            {
              sortedAvailableProducts.map((product) => {
                const { id_product, product_name } = product;
                return (
                  <DataTable.Row key={id_product} style={tw`w-full`}>
                    <DataTable.Cell style={tw`${cellTableStyle} border-r w-48`}>
                        <Text style={tw`${textRowTableStyle}`}>
                          {capitalizeFirstLetterOfEachWord(product_name)}
                        </Text>
                    </DataTable.Cell>
                  </DataTable.Row>
                );
              })
            }
          </DataTable>
          {/* Datatable for the information for each concept */}
          <ScrollView horizontal={true}>
            <DataTable style={tw`w-full`}>
              {/* Header section */}
              <DataTable.Header>
                {/* Set title of columns */}
                { stores.map((store) => {
                    const { store_name, id_store } = store;
                    console.log(`TITLE - Store: ${store_name}, width: ${determineWidthAccordingWithLengthOfName(store_name!)}`)
                    return (
                      // <DataTable.Title key={id_store} style={tw`${headerTitleTableStyle} border-r w-32`} >
                          <DataTable.Cell key={id_store} style={tw`h-12 ${headerTitleTableStyle} border-r ${determineWidthAccordingWithLengthOfName(store_name!)}`}>
                            <Text 
                              ellipsizeMode='tail'
                              numberOfLines={1}
                              style={tw`${textHeaderTableStyle}`}
                              >
                              {capitalizeFirstLetterOfEachWord(store_name)}
                            </Text>
                          </DataTable.Cell>
                    // </DataTable.Title>
                    );
                  })
                }
                { calculateTotalOfProduct &&
                      <DataTable.Cell style={tw`${headerTitleTableStyle} w-32`}>
                      <Text 
                          ellipsizeMode='tail'
                          numberOfLines={1}
                          style={tw`${textHeaderTableStyle}`}
                          >
                        Total
                      </Text>
                    </DataTable.Cell>
                  // </DataTable.Title>
                }
              </DataTable.Header>
              {/* Body section */}
              
              { (stores.length > 0) &&
                sortedAvailableProducts.map((product) => {
                  /*
                    This table display the information using the product as the main reference, and then traversing for all the stores.
                    So for each product, we will get the amount for each store, and then display it in the table.
                  */
                  const { id_product } = product;
                  let totalOfProduct:number = 0;
                 
                  if (calculateTotalOfProduct === true) {
                    // Calculate total of product across all stores
                    for (const store of stores) {
                      const { id_store } = store;
                      const storeInformation = mapConsolidatedByConcept.get(id_store);
                      if (storeInformation !== undefined) {
                        const consolidatedInformation = storeInformation.get(id_product);
                        if (consolidatedInformation !== undefined) {
                          totalOfProduct += consolidatedInformation.amount;
                        }
                      }
                    }
                  }

                  return (
                    <DataTable.Row key={product.id_product}>
                      {/* This field is never empty since it is necessary anytime */}
                      {/* Restock of product */}
                      { stores.map((store, index) => {
                          const { id_store, store_name } = store;
                          let productAmount:number = 0;
                          const storeInformation = mapConsolidatedByConcept.get(id_store);

                          if (storeInformation !== undefined) {
                            const consolidatedInformation = storeInformation.get(id_product);

                            if (consolidatedInformation !== undefined) {
                              productAmount = consolidatedInformation.amount;
                            }
                          } 
                          console.log(`ROW - Store: ${store_name}, width: ${determineWidthAccordingWithLengthOfName(store_name!)}`)
                          return (
                            <DataTable.Cell key={index} 
                              style={tw`border-r ${productAmount > 0 ? cellTableStyleWithAmountOfProduct : cellTableStyle} ${determineWidthAccordingWithLengthOfName(store_name!)}`}
                              >
                              {/* <View style={tw`${viewTagRowTableStyle}`}> */}
                                <Text 
                                  style={tw`${textRowTableStyle}`}
                                  >
                                  {productAmount}
                                </Text>
                              {/* </View> */}
                            </DataTable.Cell>
                          );
                        })
                      }
                      {/* Inflow product */}
                      { calculateTotalOfProduct === true &&
                        <DataTable.Cell 
                        style={tw`${totalOfProduct > 0 ? cellTableStyleWithAmountOfProduct : cellTableStyle} w-32`}>
                          <Text style={tw`${textRowTableStyle}`}>
                            {totalOfProduct}
                          </Text>
                        </DataTable.Cell>
                      }
                    </DataTable.Row>
                  );
                })
              }
            </DataTable>
          </ScrollView>
        </View> :
        <View style={tw`w-full my-3 flex flex-col justify-center`}>
          <ActivityIndicator size={'large'} />
        </View>
    }
    </View>
  );
};

export default TableRouteTransactionProductVisualization;
