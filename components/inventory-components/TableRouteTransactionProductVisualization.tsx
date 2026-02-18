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
  determineRowStyle,
  determineHeaderStyle,
} from '../../utils/inventoryOperationTableStyles';
import { ROUTE_TRANSACTION_STATE } from '@/src/core/enums/RouteTransactionState';
import { capitalizeFirstLetterOfEachWord } from '@/utils/string/utils';
import DayOperationDTO from '@/src/application/dto/DayOperationDTO';
import { convertArrayOfInterfacesToMapOfInterfaces } from '@/utils/interface/utils';

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

const TableRouteTransactionProductVisualization = (
  {
    availableProducts,
    stores,
    routeTransactions,
    idInventoryOperationTypeToShow,
    dayOperations,
    calculateTotalOfProduct = false,
  }:{
    availableProducts: ProductDTO[],
    stores: StoreDTO[],
    routeTransactions: RouteTransactionDTO[],
    idInventoryOperationTypeToShow: DAY_OPERATIONS,
    dayOperations: DayOperationDTO[],
    calculateTotalOfProduct:boolean
  }) => {
  
    
  // Organizing product in ascending order to display in the table
  const sortedAvailableProducts: ProductDTO[] = availableProducts.sort((a, b) => a.order_to_show - b.order_to_show);
  const sortedRouteTransactions: RouteTransactionDTO[] = routeTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Order in ascending order. Earlier dates first
  
  const mapConsolidatedByConcept = new Map<string, Map<string, consolidatedInformation>>(); //Map <id_store, Map<id_product, consolidatedInformation>>
  
  // Determining stores to show based on route transactions. The problem with this method is that this doesn't show all the visited stores during the day. 
  // const storesToShow: (StoreDTO & RouteTransactionDTO)[] = [];
  // const storeIdsAdded: Set<string> = new Set();

  // // Join route transaction with store information
  // const transactionWithStore: ((RouteTransactionDTO & StoreDTO) | null)[] = sortedRouteTransactions.map(routeTransaction => {
  //   const store = stores.find(store => store.id_store === routeTransaction.id_store);
  //   if (store) return { ...routeTransaction, ...store };
  //   else return null;
  // });
  
  
  // Verify a store only appears only once.
  // for (const transaction of transactionWithStore) {
  //   if (transaction === null) continue;
  //   const { id_store } = transaction;
  //   if (!storeIdsAdded.has(id_store)) {
  //     storesToShow.push(transaction);
  //     storeIdsAdded.add(id_store);
  //   }
  // }
  
  // Determining stores to show based on day operations, this method is better than the previous one since it shows all the visited stores during the day, but the problem is that it doesn't consider if the store has route transactions of the type of operation to show, so it can show stores that doesn't have information to show in the table.
  const mapStoresById: Map<string, StoreDTO> = convertArrayOfInterfacesToMapOfInterfaces('id_store', stores);
  const storeIdsAdded: Set<string> = new Set();
  const storesToShow: (StoreDTO & DayOperationDTO)[] = [];

  for (const dayOperation of dayOperations) {
    const { id_item, operation_type } = dayOperation;

    if (operation_type === DAY_OPERATIONS.attend_client_petition
    ||  operation_type === DAY_OPERATIONS.attention_out_of_route
    || operation_type === DAY_OPERATIONS.new_client_registration
    || operation_type === DAY_OPERATIONS.route_client_attention) {

      const store = mapStoresById.get(id_item);

      if (store && !storeIdsAdded.has(id_item)) {
        storesToShow.push({ ...dayOperation, ...store });
        storeIdsAdded.add(id_item);
      }
    }
  }


  // Consolidate amounts by store and product across all transaction descriptions
  for (const routeTransaction of sortedRouteTransactions) {
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
            <DataTable.Header>
              {/* This field is never empty since it is necessary anytime */}
              <DataTable.Cell style={tw`${headerTitleTableStyle}`}>
                  <Text style={tw`${textHeaderTableStyle}`}>Producto</Text>
              </DataTable.Cell>
            </DataTable.Header>
            {
            sortedAvailableProducts.map((product, indexAvialableProducts) => {
              const { id_product, product_name } = product;
              return (
                <DataTable.Row key={id_product}>
                  <DataTable.Cell style={tw`${determineRowStyle(indexAvialableProducts, false, false, 'Producto', undefined)}`}>
                    <Text 
                    style={tw`${textRowTableStyle}`}
                    >{capitalizeFirstLetterOfEachWord(product_name)}</Text>
                  </DataTable.Cell>
                </DataTable.Row>
              );
            })
            }
          </DataTable>
          {/* Datatable for the information for each concept */}
          <ScrollView horizontal={true}>
            <DataTable style={tw`w-2/3`}>
              {/* Header section */}
              <DataTable.Header>
                {/* Set title of columns */}
                { storesToShow.map((store, index) => {
                    const { store_name, id_store } = store;
                    console.log('Store name: ', store_name)
                    return (
                      <DataTable.Cell key={id_store} style={tw`${determineHeaderStyle(store_name!, true, undefined)}`}>
                        <Text key={id_store} ellipsizeMode='tail' numberOfLines={1} style={tw`${textHeaderTableStyle}`}>
                          {capitalizeFirstLetterOfEachWord(store_name)}
                        </Text>
                      </DataTable.Cell>
                    );
                  })
                }
                { calculateTotalOfProduct &&
                <DataTable.Cell style={tw`${determineHeaderStyle('Total', true, undefined)}`}>
                  <Text ellipsizeMode='tail' numberOfLines={1} style={tw`${textHeaderTableStyle}`}>Total</Text>
                </DataTable.Cell>
                }
              </DataTable.Header>
              {/* Body section */}
              
              { (stores.length > 0) &&
                sortedAvailableProducts.map((product, indexRow) => {
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
                        if (consolidatedInformation !== undefined) totalOfProduct += consolidatedInformation.amount;
                        
                      }
                    }
                  }

                  return (
                    <DataTable.Row key={product.id_product}>
                      {/* This field is never empty since it is necessary anytime */}
                      {/* Restock of product */}
                      { storesToShow.map((store, index) => {
                          const { id_store, store_name } = store;
                          let productAmount:number = 0;
                          const storeInformation = mapConsolidatedByConcept.get(id_store);

                          if (storeInformation !== undefined) {
                            const consolidatedInformation = storeInformation.get(id_product);

                            if (consolidatedInformation !== undefined) productAmount = consolidatedInformation.amount
                          } 
                          return (
                            <DataTable.Cell key={index} style={tw`${determineRowStyle(indexRow, productAmount > 0, true, store_name!, undefined)}`}>
                                <Text style={tw`${textRowTableStyle}`}>{productAmount}</Text>
                            </DataTable.Cell>
                          );
                        })
                      }
                      {/* Inflow product */}
                      { calculateTotalOfProduct === true &&
                        <DataTable.Cell style={tw`${determineRowStyle(indexRow, totalOfProduct > 0, false, 'total', undefined)} border`}>
                          <Text style={tw`${textRowTableStyle}`}>{totalOfProduct}</Text>
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
