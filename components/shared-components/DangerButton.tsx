import React from 'react';
import { Pressable } from 'react-native';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/FontAwesome';

const DangerButton = ({iconName, onPressButton}:{iconName:string, onPressButton:any}) => {
  return (
    <Pressable
      style={({pressed}) => [
        tw`bg-red-800 w-12 h-12 rounded-full`,
        pressed ? tw`bg-red-800` : tw`bg-red-600`,
      ]}
      onPress={() => {onPressButton();}}>
      <Icon name={iconName}
        style={tw`absolute inset-0 top-3 text-base text-center`} color="#fff" />
    </Pressable>
  );
};

export default DangerButton;
