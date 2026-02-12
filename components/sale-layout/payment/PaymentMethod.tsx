// Libraries
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { RadioButton } from 'react-native-paper';
import tw from 'twrnc';

// Utils
import PAYMENT_METHODS from '@/src/core/enums/PaymentMethod';
import { getNamePaymentMethodById } from '@/utils/route-transaciton/utils';


const PaymentMethod = ({
    currentPaymentMethod,
    onSelectPaymentMethod,
  }:{
    currentPaymentMethod:string,
    onSelectPaymentMethod:any,
  }) => {
  /*By default, cash method is selected*/
  const [selectedMethod, setSelectedMethod] = useState<string>(currentPaymentMethod);
  const entries = Object.entries(PAYMENT_METHODS);

  return (
    <View>
      <Text style={tw`text-lg text-black text-center mb-2`}>Selecciona una opción</Text>
      { entries.map(([key, value]) => {
        return (
          <View
          key={value}
          style={tw`flex flex-row items-center`}>
            <RadioButton
              value="first"
              status={ value === selectedMethod ? 'checked' : 'unchecked' }
              onPress={() => {
                setSelectedMethod(value);
                onSelectPaymentMethod(value);
              }}
            />
            <Text style={tw`ml-2 text-lg text-black`}>{ getNamePaymentMethodById(value) }</Text>
          </View>
      );})}
    </View>
  );
};

export default PaymentMethod;
