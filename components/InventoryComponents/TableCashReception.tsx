// Librarries
import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';
import { DataTable } from 'react-native-paper';

// Interfaces
import { ICurrency } from '../../interfaces/interfaces';
import AutomatedCorrectionNumberInput from '../generalComponents/AutomatedCorrectionInput';
import { headerTitleTableStyle, textHeaderTableStyle } from '@/utils/inventoryOperationTableStyles';



const TableCashReception = (
  {
    cashInventoryOperation,
    setCashInventoryOperation,
  }:
  {
    cashInventoryOperation:ICurrency[],
    setCashInventoryOperation:any
  }) => {

  return (
    <DataTable style={tw`w-full`}>
      <DataTable.Header>
        <DataTable.Title style={tw`${headerTitleTableStyle}`}>
          <Text style={tw`text-black ${textHeaderTableStyle}`}>Denominación</Text>
        </DataTable.Title>
        <DataTable.Title style={tw`${headerTitleTableStyle}`}>
          <Text style={tw`text-black ${textHeaderTableStyle}`}>Cantidad</Text>
        </DataTable.Title>
      </DataTable.Header>
      {cashInventoryOperation.map((cashInventoryDenomination:ICurrency) =>
      {
        const handlerChangeAmountCash = (input: number) => {
          const index:number = cashInventoryOperation.findIndex(
          (cashDenomination:ICurrency) => cashDenomination.id_denomination === cashInventoryDenomination.id_denomination);

          const updatedCashInventory: ICurrency[] = [...cashInventoryOperation];

          if (index === -1) {
            /* The denomination is not in the operation */
          } else {
            /* The denomination exists */
            const updatedCash:ICurrency = { ...updatedCashInventory[index], amount: input };
            updatedCashInventory[index] = updatedCash;
            setCashInventoryOperation(updatedCashInventory);
          }
        };
        return (
          <DataTable.Row
          key={cashInventoryDenomination.id_denomination}>
            <DataTable.Cell style={tw`flex flex-row justify-center`}>
              <Text style={tw`text-black`}>${cashInventoryDenomination.value}</Text>
            </DataTable.Cell>
            <DataTable.Cell style={tw`flex flex-row justify-center`}>
            <View style={tw`w-8/12`}>
              <AutomatedCorrectionNumberInput
                amount={cashInventoryDenomination.amount!}
                onChangeAmount={handlerChangeAmountCash}/>
            </View>
            </DataTable.Cell>
          </DataTable.Row>
        );})}
    </DataTable>
  );
};

export default TableCashReception;
