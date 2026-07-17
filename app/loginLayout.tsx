// Libraries
import React, { useEffect, useState } from 'react';
import { View, TextInput, KeyboardAvoidingView, Pressable, Text, BackHandler } from 'react-native';
import tw from 'twrnc';
import { Router, useRouter } from 'expo-router';

// Redux states
import { useDispatch } from 'react-redux';
import { setUser } from '@/redux/slices/userSlice';
import { AppDispatch } from '@/redux/store';
// Services
import { container as di_container } from '@/src/infrastructure/di/container';
import AuthenticationService from '@/src/infrastructure/services/AuthenticationService';

// Componentes
import Toast from 'react-native-toast-message';
import UserDTO from '@/src/application/dto/UserDTO';
import useNetworkState from '@/hooks/useNetworkState';


export default function login() {
  // Redux states
  const dispatch:AppDispatch = useDispatch();

  // Routing
  const router:Router = useRouter();

  // Declaring states
  const [inputCellphone, setInputCellphone] = useState<string>('');
  const [inputPassword, setInputPassword] = useState<string>('');
  const [signInAttempts, setSignInAttempts] = useState<number>(0);

  // Hooks
  const { refreshNetworkState } = useNetworkState();

  useEffect(() => { 
    setUpUserSession();
    
    const backAction = () => {
      /*
        In this particular case, the "back handler" of the phone should not do anything.
        This because the "route store" becomes the new main menu of the vendor.

        This will be true until the user finishes the route of the day.
      */
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
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
    if (await refreshNetworkState() === true) {
      Toast.show({type: 'info',
        text1:'Validando información con el servidor.',
        text2: 'Validando credenciales para acceder. Puede tomar unos segundos.',
      });
    } else {
      Toast.show({type: 'info',
        text1:'Validando información.',
        text2: 'Validando credenciales para acceder. Puede tomar unos segundos.',
      });
    }

    if(cellphone.trim() === "" || password.trim() === "") {
      Toast.show({type: 'error',
        text1:'Campos invalidos.',
        text2: 'Número de telefóno o contraseña no pueden estar vacíos.',
      });
    }

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

      if(signInAttempts <= 2) {
        Toast.show({
          type: 'error',
          text1: 'Credenciales inválidas.',
          text2: 'Revisa tu número telefónico y contraseña.',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Credenciales inválidas. Intenta hacer un inicio de sesión con internet.',
          text2: 'Intenta iniciar sesión con tu número telefónico y contraseña.',
        });
      }

      setSignInAttempts((prev) => {return prev + 1 })
    } catch (error) {
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
          placeholder="Número de telefóno"
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
