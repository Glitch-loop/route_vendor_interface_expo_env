import React from 'react';
import { View, Text, Pressable } from 'react-native';
import tw from 'twrnc';


import { useRouter, Router } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { logoutUser } from '../redux/slices/userSlice'


const MainMenuHeader = () => {

  // Redux (context definitions)
  const dispatch:AppDispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);

  // router
  const router:Router = useRouter();

  // Handlers
  const handlerLogOut = () => {
    dispatch(logoutUser(null));

    router.replace('/loginLayout')
  }

  return (
    <View
    style={tw`w-full flex flex-row justify-around items-center`}>
      <View style={tw`flex flex-col`}>
        <Text style={tw`text-2xl text-black text-center`}>{user.name}</Text>
        <Text style={tw`text-base text-black text-center`}>{user.cellphone}</Text>
      </View>
      <Pressable 
        onPress={() => { handlerLogOut()}}
        style={tw`bg-blue-700 px-4 py-3 rounded-md flex flex-row justify-center`}>
        <Text style={tw`text-white`}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
};

export default MainMenuHeader;
