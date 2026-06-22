// Libraries
import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import tw from 'twrnc';

// DTOs
import RouteTransactionDescriptionDTO from '@/src/application/dto/RouteTransactionDescriptionDTO';
import ProductDTO from '@/src/application/dto/ProductDTO';

// Utils
import { capitalizeFirstLetter, formatNumberAsAccountingCurrency } from '@/utils/string/utils';

const SummaryConceptTable = ({
  title,
  products,
  productInventoryMap,
}: {
  title: string;
  products: RouteTransactionDescriptionDTO[];
  productInventoryMap: Map<string, ProductDTO>;
}) => {
  return (
    <>
      <Text
        style={tw`my-1 w-full text-black font-bold text-lg flex flex-row text-center items-center justify-center`}>
        {title}
      </Text>
      <View style={tw`w-full flex flex-row items-center`}>
        <Text style={tw`flex basis-1/4 font-bold text-center text-black`}>Producto</Text>
        <Text style={tw`flex basis-1/4 font-bold text-center text-black`}>Precio</Text>
        <Text style={tw`flex basis-1/4 font-bold text-center text-black`}>Cantidad</Text>
        <Text style={tw`flex basis-1/4 font-bold text-center text-black`}>Valor</Text>
      </View>

      {products.length > 0 ? (
        products.map((product: RouteTransactionDescriptionDTO) => {
          const { id_product_inventory, price_at_moment, amount } = product;

          if (!productInventoryMap.has(id_product_inventory)) return null;

          const { product_name } = productInventoryMap.get(id_product_inventory)!;

          return (
            <View key={id_product_inventory} style={tw`w-full my-1 flex flex-row items-center`}>
              <Text style={tw`flex basis-1/4 text-center text-black`}>
                {capitalizeFirstLetter(product_name)}
              </Text>
              <Text style={tw`flex basis-1/4 text-center text-black`}>
                {formatNumberAsAccountingCurrency(price_at_moment)}
              </Text>
              <Text style={tw`flex basis-1/4 text-center text-black`}>{amount}</Text>
              <Text style={tw`flex basis-1/4 text-center text-black`}>
                {formatNumberAsAccountingCurrency(amount * price_at_moment)}
              </Text>
            </View>
          );
        })
      ) : (
        <Text style={tw`text-black text-xl text-center mt-3`}>
          No se ha seleccionado ningún producto
        </Text>
      )}
    </>
  );
};

export default SummaryConceptTable;
      