// Libraries
import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import tw from 'twrnc';

// DTOS
import ProductDTO from '@/src/application/dto/ProductDTO';

// Components
import SubtotalLine from '@/components/sale-layout/SubtotalLine';
import RouteTransactionDescriptionDTO from '@/src/application/dto/RouteTransactionDescriptionDTO';

// Interfaces and utils
import { formatNumberAsAccountingCurrency } from '@/utils/string/utils';
import { getProductDevolutionBalanceWithoutNegativeNumber } from '@/utils/route-transaciton/utils';

const SummarizeFormat = ({
    productInventoryMap,
    transactionMovements,
    totalSectionCaptionMessage = 'Total: ',
    emptyMovementCaption = 'Ningún movimiento en la operación',
  }:{
    productInventoryMap: Map<string, ProductDTO>,
    transactionMovements: RouteTransactionDescriptionDTO[],
    totalSectionCaptionMessage?:string,
    emptyMovementCaption?: string,
  }) => {
  return (
    <View style={tw`w-11/12 flex flex-col items-center`}>
      <View style={tw`w-full flex flex-row items-center`}>
        <Text style={tw`flex basis-1/4 font-bold text-center text-black`}>Producto</Text>
        <Text style={tw`flex basis-1/4 font-bold text-center text-black`}>Precio</Text>
        <Text style={tw`flex basis-1/4 font-bold text-center text-black`}>Cantidad</Text>
        <Text style={tw`flex basis-1/4 font-bold text-center text-black`}>Valor</Text>
      </View>
      { transactionMovements.length > 0 ? (
        transactionMovements.map(productMovement => {
        const { id_route_transaction_description, id_product_inventory, amount, price_at_moment} = productMovement;
        if (productInventoryMap.has(id_product_inventory) === false) return null;
        const product = productInventoryMap.get(id_product_inventory)!;
        
        const { product_name } = product;
          
        return (
          <View key={id_route_transaction_description} style={tw`w-full my-1 flex flex-row items-center`}>
            <Text style={tw`flex basis-1/4 text-center text-black`}>{product_name}</Text>
            <Text style={tw`flex basis-1/4 text-center text-black`}>{formatNumberAsAccountingCurrency(price_at_moment)}</Text>
            <Text style={tw`flex basis-1/4 text-center text-black`}>{amount}</Text>
            <Text style={tw`flex basis-1/4 text-center text-black`}>{formatNumberAsAccountingCurrency(amount * price_at_moment)}</Text>
          </View>
        );})
        ) : (
          <Text style={tw`text-black text-xl text-center mt-3`}> {emptyMovementCaption} </Text>
      )}
      {/* Getting subtotal product devolution */}
      { transactionMovements.length > 0 &&
        <SubtotalLine
          description={totalSectionCaptionMessage}
          total={getProductDevolutionBalanceWithoutNegativeNumber(transactionMovements, [])}
          fontStyle={'font-bold italic text-base'}/>
      }
    </View>
  );
};

export default SummarizeFormat;
