// Libraries
import React from 'react';
import { View } from 'react-native';
import tw from 'twrnc';
import ProjectButton from './ProjectButton';
import { ButtonVariant } from '@/utils/types/ButtonVariantType';


const ConfirmationBand = ({
  textOnAccept,
  textOnCancel,
  handleOnAccept,
  handleOnCancel,
  styleOnAccept = 'success',
  styleOnCancel = 'warning',
}:{
  textOnAccept:string,
  textOnCancel:string,
  handleOnAccept:any,
  handleOnCancel:any,
  styleOnAccept?:ButtonVariant,
  styleOnCancel?:ButtonVariant,
}) => {
  return (
    <View style={tw`flex flex-row justify-around`}>
      <ProjectButton
        title={textOnCancel}
        onPress={handleOnCancel}
        buttonVariant={styleOnCancel}
        buttonStyle={tw`h-14 max-w-32 rounded
        flex flex-row basis-1/2  justify-center items-center`}
        textStyle='text-center text-black' />
        {/*<Pressable style={
          tw`${styleOnCancel!} h-14 max-w-32 border border-solid rounded
          flex flex-row basis-1/2  justify-center items-center`}
          onPress={() => {handleOnCancel();}}>
          <Text style={tw`text-center text-black`}>{textOnCancel}</Text>
        </Pressable> */}
      <ProjectButton
        title={textOnAccept}
        onPress={handleOnAccept}
        buttonVariant={styleOnAccept}
        buttonStyle={tw`h-14 max-w-32 rounded
        flex flex-row basis-1/2  justify-center items-center`}
        textStyle='text-center text-black' />
      {/* <Pressable style={
        tw`${styleOnAccept!} h-14 max-w-32 border border-solid rounded
        flex flex-row basis-1/2 justify-center items-center`}
        onPress={() => {handleOnAccept();}}>
        <Text style={tw`text-center text-black`}>{textOnAccept}</Text>
      </Pressable> */}
    </View>
  );
};


export default ConfirmationBand;
