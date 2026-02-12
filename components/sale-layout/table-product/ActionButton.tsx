// Libraries
import React from 'react';
import { Text, Pressable } from 'react-native';
import tw from 'twrnc';

const ActionButton = ({
  children,
  colorStyle,
  colorPressedStyle,
  onClick,
  }:{
  children:any,
  colorStyle:string,
  colorPressedStyle:string,
  onClick:any,
  }) => {

  return (
    <Pressable
      style={({pressed}) => [
        tw`rounded px-2 py-1 h-8 flex flex-row justify-center items-center border border-solid`,
        pressed ? tw`${colorPressedStyle}` : tw`${colorStyle}`,
      ]}
      // style={

        
      //   tw`px-2 py-1 h-8 ${style}
      //   rounded flex flex-row justify-center items-center
      //   border border-solid`}
      onPress={onClick}>
      <Text>{children}</Text>
    </Pressable>
  );
};


export default ActionButton;
