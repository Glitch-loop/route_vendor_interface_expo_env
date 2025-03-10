// Libraries
import React, { useState } from 'react';
import { View, TextInput, KeyboardAvoidingView, Pressable, Text } from 'react-native';
import tw from 'twrnc';
import { Router, useRouter } from 'expo-router';

// Redux states
import { useDispatch } from 'react-redux';
import { setUser } from '../redux/slices/userSlice';
import { AppDispatch } from '../redux/store';
//Services
import { loginUser } from '../services/authenticationService';

// Interfaces
import { IResponse, IUser } from '../interfaces/interfaces';

// Componentes
import Toast from 'react-native-toast-message';

export default function login() {
  // Redux states
  const dispatch:AppDispatch = useDispatch();

  // Routing
  const router:Router = useRouter();

  // Declaring states
  const [inputCellphone, setInputCellphone] = useState<string>('');
  const [inputPassword, setInputPassword] = useState<string>('');

  // Handlers
  const handlerLogin = async (cellphone:string, password:string) => {
    Toast.show({type: 'info',
      text1:'Validando información.',
      text2: 'Validando credenciales para acceder.',
    });

    const response:IResponse<IUser> = await loginUser({
      id_vendor: '',
      cellphone: cellphone.trim(),
      name: '',
      password: password.trim(),
      status: 0,
    });

    const { responseCode, data } = response;


    if(responseCode === 200) {
      dispatch(setUser(data));
      router.replace('/routeSelectionLayout')
    //   navigation.reset({
    //     index: 0,
    //     routes: [{ name: 'routeSelection' }],
    //   });
    } else {
      Toast.show({type: 'error',
        text1:'Error durante autenticación.',
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
