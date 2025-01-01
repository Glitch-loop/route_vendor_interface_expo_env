import React from 'react';
import { View, Text, Pressable } from 'react-native';
import tw from 'twrnc';

import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';


const MainMenuHeader = () => {

  // Redux (context definitions)
  const user = useSelector((state: RootState) => state.user);

  return (
    <View
    style={tw`w-full flex flex-row justify-around items-center`}>
      <View style={tw`flex flex-col`}>
        <Text style={tw`text-2xl text-black text-center`}>{user.name}</Text>
        <Text style={tw`text-base text-black text-center`}>{user.cellphone}</Text>
      </View>
      <Pressable style={tw`bg-blue-700 px-4 py-3 rounded-full flex flex-row justify-center`}>
        <Text style={tw`text-white`}>Exit</Text>
      </Pressable>
    </View>
  );
};

export default MainMenuHeader;
