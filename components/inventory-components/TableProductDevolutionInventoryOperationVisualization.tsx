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
  determineRowStyle,
  determineHeaderStyle,
} from '../../utils/inventoryOperationTableStyles';

// DTOs
import ProductDTO from '@/src/application/dto/ProductDTO';
import ProductInventoryDTO from '@/src/application/dto/ProductInventoryDTO';
import InventoryOperationDescriptionDTO from '@/src/application/dto/InventoryOperationDescriptionDTO';
import RouteTransactionDescriptionDTO from '@/src/application/dto/RouteTransactionDescriptionDTO';
import { convertArrayOfInterfacesToMapOfArraysOfInterfaces, convertArrayOfInterfacesToMapOfInterfaces } from '@/utils/interface/utils';


/*
  Component for showing product devolution comparison between:
  1. Products reported from route transactions (devolution)
  2. Products devolution from inventory operations
  3. Discrepancies between the two sources
*/

const TableProductDevolutionInventoryOperationVisualization = (
  {
    availableProducts,
    devolutionInventory,
    routeTransactionOperations,
  }:{
    availableProducts: ProductDTO[],
    devolutionInventory: InventoryOperationDescriptionDTO[],
    routeTransactionOperations: RouteTransactionDescriptionDTO[],
  }) => {

  const availableProductsStored: ProductDTO[] = availableProducts.sort((a, b) => a.order_to_show - b.order_to_show);
  console.log("devolutionInventory component: ", devolutionInventory.length)
  console.log("routeTransactionOperations component: ", routeTransactionOperations.length)
  const mapDevolutionInventory: Map<string, InventoryOperationDescriptionDTO> = convertArrayOfInterfacesToMapOfInterfaces('id_product', devolutionInventory);
  const mapSoldOperations: Map<string, RouteTransactionDescriptionDTO[]> = convertArrayOfInterfacesToMapOfArraysOfInterfaces('id_product', routeTransactionOperations);

  return (
    <View style={tw`w-full flex flex-row`}>
      { (devolutionInventory.length > 0 || routeTransactionOperations.length > 0) ?
        <View style={tw`w-full flex flex-row`}>
          {/* Column 1: Product names */}
          <DataTable style={tw`w-1/3`}>
            <DataTable.Header>
              <DataTable.Title style={tw`${determineHeaderStyle('Producto', false, undefined)}`}>
                  <Text style={tw`${textHeaderTableStyle}`}>Producto</Text>
              </DataTable.Title>
            </DataTable.Header>
            { availableProductsStored.map((product, indexAvailableProducts) => {
              const { id_product, product_name } = product;
              return (
                <DataTable.Row key={id_product}>
                  <DataTable.Cell style={tw`${determineRowStyle(indexAvailableProducts, false, false, 'Producto', undefined)}`}>
                      <Text style={tw`${textRowTableStyle}`}>{product_name}</Text>
                  </DataTable.Cell>
                </DataTable.Row>
              );})
            }
          </DataTable>

          {/* Columns 2-4: Devolution data */}
          <ScrollView horizontal={true}>
            <DataTable style={tw`w-full`}>
              {/* Header section */}
              <DataTable.Header>
                <DataTable.Title style={tw`${determineHeaderStyle('Devolución reportada', true, undefined)} w-40`}>
                    <Text style={tw`${textHeaderTableStyle}`}>Devolución reportada</Text>
                </DataTable.Title>
                <DataTable.Title style={tw`${determineHeaderStyle('Dev. en transacciones', true, undefined)} w-50`}>
                    <Text style={tw`${textHeaderTableStyle}`}>Dev. en transacciones</Text>
                </DataTable.Title>
                <DataTable.Title style={tw`${determineHeaderStyle('Discrepancia', true, undefined)} w-40`}>
                    <Text style={tw`${textHeaderTableStyle} font-bold underline`}>Discrepancia</Text>
                </DataTable.Title>
              </DataTable.Header>

              {/* Body section */}
              { availableProductsStored.map((product, indexAvailableProducts) => {
                const id_product = product.id_product;

                const devolutionReported = mapSoldOperations.has(id_product) 
                  ? mapSoldOperations.get(id_product)!.reduce((acc, curr) => acc + curr.amount, 0) 
                  : 0;

                const devolutionFromInventory = mapDevolutionInventory.has(id_product) 
                  ? mapDevolutionInventory.get(id_product)!.amount 
                  : 0;

                const discrepancy = devolutionReported - devolutionFromInventory;
                const hasDiscrepancy = discrepancy !== 0;

                return (
                  <DataTable.Row key={id_product}>
                    <DataTable.Cell style={tw`${determineRowStyle(indexAvailableProducts, devolutionFromInventory > 0, true, 'Devolución reportada', undefined)} w-40`}>
                      <Text style={tw`${textRowTableStyle}`}>{devolutionFromInventory}</Text>
                    </DataTable.Cell>

                    <DataTable.Cell style={tw`${determineRowStyle(indexAvailableProducts, devolutionReported > 0, true, 'Dev. en transacciones', undefined)} w-50`}>
                      <Text style={tw`${textRowTableStyle}`}>{devolutionReported}</Text>
                    </DataTable.Cell>

                    <DataTable.Cell style={tw`${determineRowStyle(indexAvailableProducts, hasDiscrepancy, true, 'Discrepancia', undefined)} ${hasDiscrepancy ? 'bg-red-200' : 'bg-green-200'} w-40`}>
                      <View style={tw`${viewTagRowTableStyle}`}>
                        <Text style={tw`${textRowTableStyle}`}>
                          {discrepancy === 0 ? '✓' : (discrepancy > 0 ? `+${discrepancy}` : discrepancy)}
                        </Text>
                      </View>
                    </DataTable.Cell>
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

export default TableProductDevolutionInventoryOperationVisualization;
