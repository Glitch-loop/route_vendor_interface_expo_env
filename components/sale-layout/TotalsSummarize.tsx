// Librarires
import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';

// DTOs
import RouteTransactionDTO from '@/src/application/dto/RouteTransactionDTO';
import RouteTransactionDescriptionDTO from '@/src/application/dto/RouteTransactionDescriptionDTO';

// Utils
import { 
  getProductDevolutionBalance,
  calculateChange,
  getNamePaymentMethodById
} from '@/utils/route-transaciton/utils';
import { formatNumberAsAccountingCurrency } from '@/utils/string/utils';

const TotalsSummarize = ({
  routeTransaction,
  productsDevolution,
  productsReposition,
  productsSample,
  productsSale
}:{
  routeTransaction?:RouteTransactionDTO
  productsDevolution:RouteTransactionDescriptionDTO[],
  productsReposition:RouteTransactionDescriptionDTO[],
  productsSample:RouteTransactionDescriptionDTO[],
  productsSale:RouteTransactionDescriptionDTO[],
}) => {
  let subtotalProductDevolution = getProductDevolutionBalance(productsDevolution, []);
  let subtotalProductReposition = getProductDevolutionBalance(productsReposition, []);
  let subtotalSaleProduct       = getProductDevolutionBalance(productsSale, []);
  let subtotalSampleProduct     = getProductDevolutionBalance(productsSample, []);
  let productDevolutionBalance  = '$0';
  let greatTotal                = '$0';
  let cashReceived              = '$0';
  let greatTotalNumber          = (subtotalSaleProduct + subtotalSampleProduct + subtotalProductReposition - subtotalProductDevolution);
  
  // Getting product devolution balance
  if (subtotalProductReposition - subtotalProductDevolution < 0) {
    productDevolutionBalance = '-$' + ((subtotalProductReposition - subtotalProductDevolution) * -1).toString();
  } else {
    productDevolutionBalance = '$' + (subtotalProductReposition - subtotalProductDevolution).toString();
  }

  // Getting great total of the operation
  if (subtotalSaleProduct + subtotalProductReposition - subtotalProductDevolution < 0) {
    greatTotal = '-$' + ((subtotalSaleProduct + subtotalProductReposition - subtotalProductDevolution) * -1).toString();
  } else {
    greatTotal = '$' + greatTotalNumber.toString();
  }

  if (routeTransaction === undefined) {
    /* Do nothing */
  } else {
    if (routeTransaction.cash_received < 0) {
      cashReceived = '$' + (routeTransaction.cash_received * -1).toString();
    } else {
      cashReceived = '$' + (routeTransaction.cash_received).toString();
    }
  }

  return (
    <View style={tw`w-full my-5 flex flex-col justify-center items-center`}>
      <View style={tw`w-full flex flex-row`}>
        <Text style={tw`flex basis-4/6 text-base text-black text-right italic`}>
          Valor total de devolución de producto:
        </Text>
        <Text style={tw`flex basis-2/6 text-base text-black text-center align-middle italic`}>
          { formatNumberAsAccountingCurrency(subtotalProductDevolution) }
        </Text>
      </View>
      <View style={tw`w-full flex flex-row`}>
        <Text style={tw`flex basis-4/6 text-base text-black text-right italic`}>
          Valor total de reposición de producto:
        </Text>
        <Text style={tw`flex basis-2/6 text-base text-black text-center align-middle italic`}>
          { formatNumberAsAccountingCurrency(subtotalProductReposition) }
        </Text>
      </View>
      <View style={tw`w-full flex flex-row`}>
        <Text style={tw`flex basis-4/6 text-base text-black text-right font-bold italic`}>
          Balance de devolución de producto:
        </Text>
        <Text
          style={tw`flex basis-2/6 text-base text-black text-center align-middle font-bold italic`}>
          { formatNumberAsAccountingCurrency(subtotalProductReposition - subtotalProductDevolution) }
        </Text>
      </View>
      <View style={tw`flex flex-row w-11/12 border border-solid mt-2`} />
      <View style={tw`w-full flex flex-row`}>
        <Text style={tw`flex basis-4/6 text-base text-black text-right italic`}>
          Balance de devolución de producto:
        </Text>
        <Text style={tw`flex basis-2/6 text-base text-black text-center align-middle italic`}>
          { formatNumberAsAccountingCurrency(subtotalProductReposition - subtotalProductDevolution) }
        </Text>
      </View>
      <View style={tw`w-full flex flex-row`}>
        <Text style={tw`flex basis-4/6 text-base text-black text-right italic`}>
          Total de cortesia:
        </Text>
        <Text style={tw`flex basis-2/6 text-base text-black text-center align-middle italic`}>
          { formatNumberAsAccountingCurrency(subtotalSampleProduct) }
        </Text>
      </View>
      <View style={tw`w-full flex flex-row`}>
        <Text style={tw`flex basis-4/6 text-base text-black text-right italic`}>
          Total de venta:
        </Text>
        <Text style={tw`flex basis-2/6 text-base text-black text-center align-middle italic`}>
          { formatNumberAsAccountingCurrency(subtotalSaleProduct) }
        </Text>
      </View>
      <View style={tw`w-full flex flex-row`}>
        <Text style={tw`flex basis-4/6 text-base text-black text-right font-bold italic`}>
          Gran total:
        </Text>
        <Text style={tw`flex basis-2/6 text-base text-black text-center align-middle font-bold italic`}>
          { formatNumberAsAccountingCurrency(greatTotalNumber) }
        </Text>
      </View>
      { routeTransaction !== undefined &&
        <View style={tw`w-full flex flex-row`}>
          <Text style={tw`flex basis-4/6 text-base text-black text-right font-bold italic`}>
            Metodo de pago {`(${getNamePaymentMethodById(routeTransaction.payment_method)})`}:
          </Text>
          <Text style={tw`flex basis-2/6 text-base text-black text-center align-middle font-bold italic`}>
            { formatNumberAsAccountingCurrency(routeTransaction.cash_received) }
          </Text>
        </View>
      }
      { routeTransaction !== undefined &&
        <View style={tw`w-full flex flex-row`}>
          <Text style={tw`flex basis-4/6 text-base text-black text-right font-bold italic`}>
            Cambio:
          </Text>
          <Text style={tw`flex basis-2/6 text-base text-black text-center align-middle font-bold italic`}>
            { formatNumberAsAccountingCurrency(calculateChange(greatTotalNumber, routeTransaction.cash_received)) }
          </Text>
        </View>
      }
    </View>
  );
};

export default TotalsSummarize;
