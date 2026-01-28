// Libraries
import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import tw from 'twrnc';

// Interfaces and utils
import { getProductDevolutionBalanceWithoutNegativeNumber } from '@/utils/route-transaciton/utils';

// Components
import SubtotalLine from '../SalesLayout/SubtotalLine';
import ProductInventoryDTO from '@/src/application/dto/ProductInventoryDTO';
import ProductDTO from '@/src/application/dto/ProductDTO';
import RouteTransactionDescriptionDTO from '@/src/application/dto/RouteTransactionDescriptionDTO';

/*
  Although this component is more related to "transaction summrizing",
  it was decided to use the IProductInventory interface because it is more used than
  the transaction interfaces (so, in this way, it is expected that with this decisition
  this component be more reusable).
*/

const SummarizeFormat = ({
    productInventoryMap,
    productsMovement,
    totalSectionCaptionMessage = 'Total: ',
    emptyMovementCaption = 'Ningún movimiento en la operación',
  }:{
    productInventoryMap: Map<string, ProductDTO&ProductInventoryDTO>,
    productsMovement: RouteTransactionDescriptionDTO[],
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
      { productsMovement.length > 0 ? (
        productsMovement.map(productMovement => {
        const { id_route_transaction_description, id_product_inventory, amount, price_at_moment} = productMovement;
        if (productInventoryMap.has(id_product_inventory) === false) return null;
        const product = productInventoryMap.get(id_product_inventory)!;
        
        const { product_name } = product;
          
        return (
          <View key={id_route_transaction_description} style={tw`w-full my-1 flex flex-row items-center`}>
            <Text style={tw`flex basis-1/4 text-center text-black`}>{product_name}</Text>
            <Text style={tw`flex basis-1/4 text-center text-black`}>${price_at_moment}</Text>
            <Text style={tw`flex basis-1/4 text-center text-black`}>{amount}</Text>
            <Text style={tw`flex basis-1/4 text-center text-black`}>${amount * price_at_moment}</Text>
          </View>
        );})
        ) : (
          <Text style={tw`text-black text-xl text-center mt-3`}> {emptyMovementCaption} </Text>
      )}
      {/* Getting subtotal product devolution */}
      { productsMovement.length > 0 &&
        <SubtotalLine
          description={totalSectionCaptionMessage}
          total={getProductDevolutionBalanceWithoutNegativeNumber(productsMovement, [], productInventoryMap).toString()}
          fontStyle={'font-bold italic text-base'}/>
      }
    </View>
  );
};

export default SummarizeFormat;
