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

/**
 * Helper: Get unique transaction dates sorted in ascending order (earliest first)
 */
const getUniqueSortedDates = (descriptions: RouteTransactionDescriptionDTO[]): Date[] => {
    const uniqueDates = new Set<string>();
    descriptions.forEach(desc => {
        const dateStr = new Date(desc.created_at).toISOString().split('T')[0];
        uniqueDates.add(dateStr);
    });
    return Array.from(uniqueDates)
        .map(dateStr => new Date(dateStr))
        .sort((a, b) => a.getTime() - b.getTime());
};

/**
 * Helper: Get total amount for a product on a specific date
 */
const getProductAmountByDate = (
    descriptions: RouteTransactionDescriptionDTO[],
    productId: string,
    date: Date
): number => {
    const dateStr = date.toISOString().split('T')[0];
    return descriptions
        .filter(desc => {
            const descDateStr = new Date(desc.created_at).toISOString().split('T')[0];
            return desc.id_product === productId && descDateStr === dateStr;
        })
        .reduce((sum, desc) => sum + desc.amount, 0);
};

/**
 * Helper: Render a summary table for a transaction type
 */
const renderTransactionTable = (
    title: string,
    descriptions: RouteTransactionDescriptionDTO[],
    productInventoryMap: Map<string, ProductClass>
) => {
    const dates = getUniqueSortedDates(descriptions);
    const uniqueProducts = new Set(descriptions.map(d => d.id_product));
    const productsWithAmount: string[] = [];

    // Filter products that have at least one transaction
    uniqueProducts.forEach(productId => {
        const totalAmount = dates.reduce(
            (sum, date) => sum + getProductAmountByDate(descriptions, productId, date),
            0
        );
        if (totalAmount > 0) {
            productsWithAmount.push(productId);
        }
    });

    // If no products, return nothing
    if (productsWithAmount.length === 0) {
        return null;
    }

    const dateHeaders = dates.map(d => d.toISOString().split('T')[0]);

    return (
        <View style={tw`mb-6`}>
            <Text style={tw`text-lg font-bold mb-2`}>{title}</Text>
            <ScrollView horizontal>
                <DataTable style={tw`border border-gray-300`}>
                    <DataTable.Header style={tw`bg-blue-100`}>
                        <DataTable.Title style={tw`flex-1 min-w-40`}>
                            <Text style={tw`font-bold`}>Producto</Text>
                        </DataTable.Title>
                        {dateHeaders.map((dateStr) => (
                            <DataTable.Title key={dateStr} style={tw`flex-none w-24 items-center`}>
                                <Text style={tw`font-bold text-xs text-center`}>{dateStr}</Text>
                            </DataTable.Title>
                        ))}
                    </DataTable.Header>

                    {productsWithAmount.map((productId) => {
                        const product = productInventoryMap.get(productId);
                        const productName = product?.product.product_name

                        return (
                            <DataTable.Row key={productId} style={tw`border-t border-gray-200`}>
                                <DataTable.Cell style={tw`flex-1 min-w-40`}>
                                    <Text style={tw`text-sm`}>{productName}</Text>
                                </DataTable.Cell>
                                {dateHeaders.map((dateStr) => {
                                    const date = new Date(dateStr);
                                    const amount = getProductAmountByDate(descriptions, productId, date);
                                    return (
                                        <DataTable.Cell
                                            key={`${productId}-${dateStr}`}
                                            style={tw`flex-none w-24 items-center`}
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
    const salesTransactionDescriptions: RouteTransactionDescriptionDTO[] = 
        getRouteTransactionDescriptionsOfActiveTransactionsByTypeOfOperations(
            routeTransactions,
            DAY_OPERATIONS.sales
        );

    const devolutionTransactionDescriptions: RouteTransactionDescriptionDTO[] = 
        getRouteTransactionDescriptionsOfActiveTransactionsByTypeOfOperations(
            routeTransactions,
            DAY_OPERATIONS.product_devolution
        );

    // Products that had at least one sale
    const productsInStore: Set<string> = new Set(
        salesTransactionDescriptions.map(desc => desc.id_product)
    );

    // Products in inventory map but not in sales
    const productsNotInStore: string[] = Array.from(productInventoryMap.keys())
        .filter(productId => !productsInStore.has(productId))
        .sort((a, b) => {
            const productA = productInventoryMap.get(a);
            const productB = productInventoryMap.get(b);
            return (productA?.product.product_name ?? '').localeCompare(productB?.product.product_name ?? '');
        });

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

            {/* Products Not in Store */}
            {productsNotInStore.length > 0 && (
                <View style={tw`mb-6`}>
                    <Text style={tw`text-lg font-bold mb-2`}>Productos Sin Venta</Text>
                    <View style={tw`bg-gray-50 border border-gray-300 rounded p-3`}>
                        {productsNotInStore.map((productId) => {
                            const product = productInventoryMap.get(productId);
                            const productName = product?.product.product_name ?? `Product ${productId.substring(0, 8)}`;
                            return (
                                <View key={productId} style={tw`py-2 border-b border-gray-200`}>
                                    <Text style={tw`text-sm text-gray-700`}>{productName}</Text>
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