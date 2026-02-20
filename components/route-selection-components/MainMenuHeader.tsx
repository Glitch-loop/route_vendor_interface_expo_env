// Libraries
import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';
import { useRouter, Router } from 'expo-router';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { logoutUser } from '@/redux/slices/userSlice'

// UI components
import ProjectButton from '@/components/shared-components/ProjectButton';
import { capitalizeFirstLetterOfEachWord } from '@/utils/generalFunctions';


const MainMenuHeader = (
  {
    onLogOut
  }:
  {
    onLogOut: () => void;
  }
) => {
  // Redux (context definitions)
  const user = useSelector((state: RootState) => state.user);

  return (
    <View
    style={tw`w-full flex flex-row justify-around items-center`}>
      <View style={tw`flex flex-col`}>
        <Text 
          ellipsizeMode='tail'
          numberOfLines={1}
          style={tw`max-w-48 text-base text-black text-center`}>{user ? capitalizeFirstLetterOfEachWord(user.name) : 'No identificado'}</Text>
        <Text 
          ellipsizeMode='tail'
          numberOfLines={1}
          style={tw`max-w-48 text-base text-black text-center`}>{user ? user.cellphone : ''}</Text>
      </View>
      <ProjectButton
          title='Cerrar sesión'
          onPress={() => { onLogOut()}}
          buttonVariant='primary'
          textStyle='text-gray-800'
          buttonStyle={tw`px-4 py-3 rounded-md`}
        />
    </View>
  );
};

export default MainMenuHeader;
