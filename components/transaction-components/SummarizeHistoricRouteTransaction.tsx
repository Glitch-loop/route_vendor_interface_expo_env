import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { DataTable } from 'react-native-paper';
import tw from 'twrnc';

import ProductDTO from "@/src/application/dto/ProductDTO";
import ProductInventoryDTO from "@/src/application/dto/ProductInventoryDTO";
import RouteTransactionDescriptionDTO from "@/src/application/dto/RouteTransactionDescriptionDTO";
import RouteTransactionDTO from "@/src/application/dto/RouteTransactionDTO";
import DAY_OPERATIONS from "@/src/core/enums/DayOperations";
import { getRouteTransactionDescriptionsOfActiveTransactionsByTypeOfOperations } from "@/utils/product-inventory/utils";
import ProductClass from '@/classes/ProductClass';
import { format_date_to_UI_format, format_date_to_UI_short_format } from '@/utils/date/momentFormat';
import { capitalizeFirstLetterOfEachWord } from '@/utils/generalFunctions';

interface TransactionDescriptionWithDate extends RouteTransactionDescriptionDTO {
  transaction_date: string;
}

const getDateKey = (dateValue: string | Date): string => {
  if (typeof dateValue === 'string') {
    const match = dateValue.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }

  const date = new Date(dateValue);
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0')
  ].join('-');
};

/**
 * Helper: Get unique transaction dates sorted in ascending order (earliest first)
 */
const getUniqueSortedDates = (descriptions: TransactionDescriptionWithDate[]): Date[] => {
  const uniqueDates = new Set<string>();
  descriptions.forEach(desc => {
    const dateStr = getDateKey(desc.transaction_date);
    uniqueDates.add(dateStr);
  });
  return Array.from(uniqueDates)
    .map(dateStr => new Date(dateStr))
    .sort((a, b) => b.getTime() - a.getTime());
};

/**
 * Helper: Get total amount for a product on a specific date
 */
const getProductAmountByDate = (
  descriptions: TransactionDescriptionWithDate[],
  productId: string,
  date: Date
): number => {
  const dateStr = getDateKey(date);
  return descriptions
    .filter(desc => {
      const descDateStr = getDateKey(desc.transaction_date);
      return desc.id_product === productId && descDateStr === dateStr;
    })
    .reduce((sum, desc) => sum + desc.amount, 0);
};

/**
 * Helper: Render a summary table for a transaction type
 */
const renderTransactionTable = (
  title: string,
  descriptions: TransactionDescriptionWithDate[],
  productInventoryMap: Map<string, ProductClass>
) => {
  const dates = getUniqueSortedDates(descriptions);
  const uniqueProducts = new Set(descriptions.map(d => d.id_product));
  const productsWithAmount: Set<string> = new Set<string>();

  // Filter products that have at least one transaction
  uniqueProducts.forEach(productId => {
    const totalAmount = dates.reduce(
      (sum, date) => sum + getProductAmountByDate(descriptions, productId, date),
      0
    );
    if (totalAmount > 0) {
      productsWithAmount.add(productId);
    }
  });

  // If no products, return nothing
  if (productsWithAmount.size === 0) {
    return null;
  }

  const dateHeaders = dates.sort((a, b) => b.getTime() - a.getTime()).map(d => d.toISOString().split('T')[0]);

  // Get order for printing
  const orderToPrint = Array.from(productInventoryMap.values())
    .sort((a, b) => a.product.order_to_show - b.product.order_to_show);

  return (
    <View style={tw`mb-6`}>
      <Text style={tw`text-lg font-bold mb-2`}>{title}</Text>
      <ScrollView horizontal>
        <DataTable style={tw`w-full border border-gray-300`}>
          <DataTable.Header style={tw`bg-blue-100 h-[70px]`}>
            <DataTable.Title style={tw`flex-none w-[100px] h-[70px]`}>
              <Text style={tw`font-bold`}>Producto</Text>
            </DataTable.Title>
            {dateHeaders.map((dateStr) => {
              const formaTedString = format_date_to_UI_short_format(dateStr);
              return (
                <DataTable.Title key={dateStr} style={tw`flex-none flex flex-col justify-center w-[60px] h-[70px]`}>
                  <View style={tw`h-[70px] -rotate-90`}>
                    <Text style={tw`font-bold text-xs text-center`}> 
                      { formaTedString }
                    </Text>
                  </View>
                </DataTable.Title>
              )
            })}
          </DataTable.Header>

          {orderToPrint.map((currentProductproduct) => {

            const productId = currentProductproduct.product.id_product;

            if(!productsWithAmount.has(productId)) return null;

            const product = productInventoryMap.get(productId);
            const productName = capitalizeFirstLetterOfEachWord(product?.product.product_name)

            return (
              <DataTable.Row key={productId} style={tw`border-t border-gray-200`}>
                <DataTable.Cell  style={tw`flex-none w-[100px]`}>
                  <Text style={tw`text-sm`}>{productName}</Text>
                </DataTable.Cell>
                {dateHeaders.map((dateStr) => {
                  const date = new Date(dateStr);
                  const amount = getProductAmountByDate(descriptions, productId, date);
                  return (
                    <DataTable.Cell
                      key={`${productId}-${dateStr}`}
                      style={tw`flex-none flex flex-col justify-center w-[60px] items-center`}
                    >
                      <Text style={tw`text-sm text-center`}>
                        {amount > 0 ? amount : '0'}
                      </Text>
                    </DataTable.Cell>
                  );
                })}
              </DataTable.Row>
            );
          })}
        </DataTable>
      </ScrollView>
    </View>
  );
};

const SummarizeHistoricRouteTransaction = ({
  routeTransactions,
  productInventoryMap
}: {
  routeTransactions: RouteTransactionDTO[],
  productInventoryMap: Map<string, ProductClass>
}) => {
  const transactionDateById = new Map<string, string>(
    routeTransactions.map((transaction) => [
      transaction.id_route_transaction,
      getDateKey(transaction.date)
    ])
  );

  const salesTransactionDescriptions: TransactionDescriptionWithDate[] = 
    getRouteTransactionDescriptionsOfActiveTransactionsByTypeOfOperations(
      routeTransactions,
      DAY_OPERATIONS.sales
    ).map((description) => ({
      ...description,
      transaction_date: transactionDateById.get(description.id_route_transaction) ?? getDateKey(description.created_at)
    }));

  const devolutionTransactionDescriptions: TransactionDescriptionWithDate[] = 
    getRouteTransactionDescriptionsOfActiveTransactionsByTypeOfOperations(
      routeTransactions,
      DAY_OPERATIONS.product_devolution
    ).map((description) => ({
      ...description,
      transaction_date: transactionDateById.get(description.id_route_transaction) ?? getDateKey(description.created_at)
    }));

  const repositionTransactionDescriptions: TransactionDescriptionWithDate[] = 
    getRouteTransactionDescriptionsOfActiveTransactionsByTypeOfOperations(
      routeTransactions,
      DAY_OPERATIONS.product_reposition
    ).map((description) => ({
      ...description,
      transaction_date: transactionDateById.get(description.id_route_transaction) ?? getDateKey(description.created_at)
    }));

  const sampleTransactionDescriptions: TransactionDescriptionWithDate[] = 
    getRouteTransactionDescriptionsOfActiveTransactionsByTypeOfOperations(
      routeTransactions,
      DAY_OPERATIONS.sample
    ).map((description) => ({
      ...description,
      transaction_date: transactionDateById.get(description.id_route_transaction) ?? getDateKey(description.created_at)
    }));

  // Products that had at least one sale
  const productsInStore: Set<string> = new Set(
    salesTransactionDescriptions.map(desc => desc.id_product)
  );

  // Products in inventory map but not in sales
  const productsNotInStore: Set<string> = new Set<string>(
    Array.from(productInventoryMap.keys()).filter(productId => !productsInStore.has(productId))
  );
    // .filter(productId => !productsInStore.has(productId))
    // .sort((a, b) => {
    //   const productA = productInventoryMap.get(a);
    //   const productB = productInventoryMap.get(b);
    //   return (productA?.product.product_name ?? '').localeCompare(productB?.product.product_name ?? '');
    // });

  // Get order for printing
  const orderToPrint = Array.from(productInventoryMap.values())
    .sort((a, b) => a.product.order_to_show - b.product.order_to_show);

  return (
    <ScrollView style={tw`flex-1 p-4`}>
      {/* Sales Table */}
      {renderTransactionTable(
        'Resumen de Ventas',
        salesTransactionDescriptions,
        productInventoryMap
      )}

      {/* Devolutions Table */}
      {renderTransactionTable(
        'Resumen de Devoluciones',
        devolutionTransactionDescriptions,
        productInventoryMap
      )}

      {/* Devolutions Table */}
      {renderTransactionTable(
        'Resumen de Reposiciones',
        repositionTransactionDescriptions,
        productInventoryMap
      )}
      
      {/* Devolutions Table */}
      {renderTransactionTable(
        'Resumen de Cortesias',
        sampleTransactionDescriptions,
        productInventoryMap
      )}

      {/* Products Not in Store */}
      {orderToPrint.length > 0 && (
        <View style={tw`mb-6`}>
          <Text style={tw`text-lg font-bold mb-2`}>Productos que no estan en tienda</Text>
          <View style={tw`bg-gray-50 border border-gray-300 rounded p-3`}>
            {orderToPrint.map((currentProduct) => {
              const productId = currentProduct.product.id_product
              if (!productsNotInStore.has(productId)) return null;
              const product = productInventoryMap.get(productId);
              const productName = product?.product.product_name ?? `Product ${productId.substring(0, 8)}`;
              return (
                <View key={productId} style={tw`py-2 border-b border-gray-200`}>
                  <Text style={tw`text-sm text-gray-700`}>{capitalizeFirstLetterOfEachWord(productName)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default SummarizeHistoricRouteTransaction;