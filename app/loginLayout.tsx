// Libraries
import React, { useEffect, useState } from 'react';
import { View, TextInput, KeyboardAvoidingView, Pressable, Text } from 'react-native';
import tw from 'twrnc';
import { Router, useRouter } from 'expo-router';

// Redux states
import { useDispatch } from 'react-redux';
import { setUser } from '../redux/slices/userSlice';
import { AppDispatch } from '../redux/store';
// Services
import { container as di_container } from '@/src/infrastructure/di/container';
import AuthenticationService from '@/src/infrastructure/services/AuthenticationService';

// Componentes
import Toast from 'react-native-toast-message';
import UserDTO from '@/src/application/dto/UserDTO';

export default function login() {
  // Redux states
  const dispatch:AppDispatch = useDispatch();

  // Routing
  const router:Router = useRouter();

  // Declaring states
  const [inputCellphone, setInputCellphone] = useState<string>('');
  const [inputPassword, setInputPassword] = useState<string>('');

  useEffect(() => {
    console.log("Login")
    setUpUserSession();
  }, []);
  
  const setUpUserSession = async () => {
    const authenticationService = di_container.resolve(AuthenticationService);
    const userSession:UserDTO | null = await authenticationService.activeSession();
    if (userSession === null) return;
    dispatch(setUser(userSession));
    router.replace('/routeSelectionLayout');
  }

  // Handlers
  const handlerLogin = async (cellphone:string, password:string) => {
    Toast.show({type: 'info',
      text1:'Validando información.',
      text2: 'Validando credenciales para acceder.',
    });

    try {
      const authenticationService = di_container.resolve(AuthenticationService);
      const authenticatedUser = await authenticationService.loginUser(
        cellphone.trim(),
        password.trim()
      );

      if (authenticatedUser) {
        dispatch(setUser(authenticatedUser));
        router.replace('/routeSelectionLayout');
        return;
      }

      Toast.show({
        type: 'error',
        text1: 'Credenciales inválidas.',
        text2: 'Revisa tu número telefónico y contraseña.',
      });
    } catch (error) {
      console.log('Error logging user: ', error);
      Toast.show({
        type: 'error',
        text1: 'Error durante autenticación.',
        text2: 'Ha habido un error durante la autenticación de las credenciales.',
      });
    }
  };


  return (
    <KeyboardAvoidingView>
        <View style={tw`w-full h-full flex flex-col justify-center items-center`}>
            <TextInput
            style={tw`w-3/4 h-10
            border border-black rounded-lg px-4 bg-gray-100 
            text-base text-black text-center`}
            placeholder="Numero de telefóno"
            onChangeText={(text) => { setInputCellphone(text); }}/>
            <TextInput
            style={tw`w-3/4 h-10 my-6 border border-black rounded-lg bg-gray-100 text-base text-black text-center`}
            placeholder="Contraseña"
            secureTextEntry={true}
            onChangeText={(text) => { setInputPassword(text); }}
            />
            <Pressable
            style={tw`w-3/4 h-10 bg-blue-400 px-4 py-3 rounded-md flex flex-row justify-center items-center`}
            onPress={() => { handlerLogin(inputCellphone, inputPassword); }}>
            <Text style={tw`text-slate-100 text-center`}> Iniciar sesión </Text>
            </Pressable>
        </View>
    </KeyboardAvoidingView>
  );
};
