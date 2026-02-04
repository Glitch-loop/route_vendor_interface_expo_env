// Libraries
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { ActivityIndicator, List, Text } from 'react-native-paper';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/FontAwesome';

// Services
import {
  getPrinterConnectionStatus,
  getBluetoothPrinterConnection,
  disconnectPrinter,
  ensureBluetoothPermissions
} from '../../services/printerService';

// Hooks
// import useBLE from '@/hooks/useBLE';

// Components
import ActionDialog from '../ActionDialog';
import Toast from 'react-native-toast-message';
import RNBluetoothClassic, { BluetoothDevice, BluetoothDeviceEvent, BluetoothEventListener } from 'react-native-bluetooth-classic';

// Interfaces
import { PrinterService } from '@/src/core/interfaces/PrinterService';

// Container
import { container as di_container } from '@/src/infrastructure/di/container';
import { BluetoothPrinterService } from '@/src/infrastructure/services/BluetoothPrinterService';
import ListPrintersDialog from '../bluetooth/ListPrintersDialog';


const BluetoothButton = () => {
  const printerService = di_container.resolve<BluetoothPrinterService>(BluetoothPrinterService);
  
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isBeingConnected, setIsBeingConnected] = useState<boolean>(false);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [showListPrintersDialog, setShowListPrintersDialog] = useState<boolean>(false);
  const [renderingComponent, setRenderingComponent] = useState<boolean>(true);
  
  const [pairedPrinters, setPairedPrinters] = useState<BluetoothDevice[]>([]);
  const [discoveredPrinters, setDiscoveredPrinters] = useState<BluetoothDeviceEvent[]>([]);
  const [connectedPrinter, setConnectedPrinter] = useState<BluetoothDevice | null>(null);


  // const { 
  //   scanForPeripherals,
  //   requestPermissions,
  //   allDevices
  // }
  // = useBLE();
  
  // useBLE();
  // useEffect(() => {
  //   // Determine the status for the first time
  //   getPrinterConnectionStatus()
  //   .then((response:boolean) => {
  //     setIsConnected(response);
  //     setRenderingComponent(false);
  //   });

  //   const intervalAction = setInterval(async () => {
  //     const printerStatus:boolean = await getPrinterConnectionStatus();

  //     if(isConnected && !printerStatus) {
  //       Toast.show({type: 'error',
  //         text1:'Se ha desconectado la impresora',
  //         text2: 'Se ha desconectado al impresora.'});
  //     }

  //     setRenderingComponent(false);
  //     setIsConnected(await getPrinterConnectionStatus());
  //   }, 30000);

  //   /* Clear action when unmount */
  //   return () => clearInterval(intervalAction);
  // }, []);

  // useEffect(() => {
  //   if (isBeingConnected) {
  //     getBluetoothPrinterConnection()
  //     .then((result:boolean) => {
  //       setIsBeingConnected(false);
  //       setIsConnected(result);
  //     })
  //     .catch(() => {
  //       /* Somthing was wrong during printer connection*/
  //       setIsBeingConnected(false);
  //       setIsConnected(false);
  //     });
  //   }
  // }, [isBeingConnected]);

  useEffect(() => {
    // printerService.connectToPrinter();
  });
  
  const handleOnAccessBleMenu = async () => {
    console.log("Accessing BLE menu");

    setPairedPrinters(await printerService.getBondedPrinters());
    printerService.discoverDevice(
      (device: BluetoothDeviceEvent) => {
        console.log("Discovered device: ", device);
        // Functional update to avoid stale closure and dedupe by address
        setDiscoveredPrinters((prevDevices) => {
          const exists = prevDevices.some(d => d.device.address === device.device.address);
          if (exists) return prevDevices;
          return [...prevDevices, device];
        });
      }
    )
    setShowListPrintersDialog(true);
    
  }

  const handlerConnectPrinter = async () => {
    printerService.connectToPrinter();
    // const event = RNBluetoothClassic.onDeviceDiscovered((device) => {
    //         console.log("Discovered device: ", device);
            
    //     });

      
    // try {
    //   await ensureBluetoothPermissions();
    //   if (isBeingConnected === false){ // Avoiding multiple click from the user
    //     if (await getPrinterConnectionStatus()) {
    //       /* Maybe the user wants to disconnect the printer from the device */
    //       setIsConnected(true);
    //       setShowDialog(true);
    //     } else {
    //       /* Beginning process for printer connection */
    //       setIsBeingConnected(true);
    //       setIsConnected(false);
    //     }
    //   } else {
    //     /* User cannot start a connection process more than once. */
    //   }
    // } catch (error) {
    //   console.log(error)
    // }
  };

  const handlerCancelDisconnectDevice = () => {
    setShowDialog(false);
  };

  const handlerDisconnectPrinter = async () => {
    await disconnectPrinter();
    setIsConnected(false);
    setShowDialog(false);
  };

  const handlePairDevice = async (deviceEvent: BluetoothDeviceEvent) => {
    console.log("Pairing device: ", deviceEvent);
    const { device } = deviceEvent;
    try {
      const result = await printerService.pairDevice(device)

      if (result) {

        setPairedPrinters(await printerService.getBondedPrinters())

        setDiscoveredPrinters(discoveredPrinters.filter(d => d.device.address !== device.address));

        Toast.show({type: 'success',
          text1:'Impresora registrada satisfactoriamente',
          text2: 'Ahora puedes proceder a conectar la impresora.'});


      } else {
        Toast.show({type: 'error',
          text1:'No se ha podido regitrar la impresora',
          text2: 'Si pide contraseña, generalmente es: 0000 ó 1234.'});
      }

    } catch {
      Toast.show({type: 'error',
        text1:'No se ha podido regitrar la impresora',
        text2: 'Intenta nuevamente.'});
    }
  };

  const handleConnectDevice = async (device: BluetoothDevice) => {
    if (connectedPrinter !== null) {
      Toast.show({type: 'info',
        text1:'Desconecta la impresora actual',
        text2: 'Primero debes desconectar la impresora ya conectada.'});
      return;
    }
    try {
        

        Toast.show({type: 'info',
        text1:'Iniciando conexión con la impresora',
        text2: 'Puede tomar unos segundos...'});
      
      const result = await printerService.connectDevice(device);
      if (result) {
        setConnectedPrinter(device);
        setPairedPrinters(prev => prev.filter(p => p.address !== device.address));
        Toast.show({type: 'success',
          text1:'Impresora conectada',
          text2: 'La impresora está lista para usar.'});
      }
    } catch (error) {
      Toast.show({type: 'error',
        text1:'No se ha podido conectar la impresora',
        text2: 'Intenta nuevamente.'});   
    }
  }

  const handleUnPairDevice = async (device: BluetoothDevice) => {
    try {
        Toast.show({type: 'info',
        text1:'Removiendo impresora del registro',
        text2: 'Puedes volver a registrarla después.'});

        const result = await printerService.unpairDevice(device);

        if (result) {
          Toast.show({type: 'success',
          text1:'Impresora removida del registro',
          text2: 'Puedes volver a registrarla después.'});
          setPairedPrinters(await printerService.getBondedPrinters())
          // Clear connected state if this device was connected
          setConnectedPrinter(prev => (prev && prev.address === device.address) ? null : prev);
        } else {
          Toast.show({type: 'error',
            text1:'Ha habido un problema al remover la impresora del registro',
            text2: 'Intenta nuevamente.'});             
        }

    } catch (error) {
      Toast.show({type: 'error',
        text1:'No se ha podido remover la impresora del registro',
        text2: 'Intenta nuevamente.'});   
    }
  }

  const handleCloseDialog = () => {
    setShowListPrintersDialog(false);
  }

  const handleDisconnectConnectedDevice = async (device: BluetoothDevice) => {
    try {
      Toast.show({type: 'info',
        text1:'Desconectando impresora',
        text2: 'Puede tomar unos segundos...'});
      const result = await printerService.disconnectDevice(device);
      if (result) {
        setConnectedPrinter(null);
        setPairedPrinters(await printerService.getBondedPrinters());
        Toast.show({type: 'success',
          text1:'Impresora desconectada',
          text2: 'Puedes reconectarla cuando lo necesites.'});
      } else {
        Toast.show({type: 'error',
          text1:'No se ha podido desconectar la impresora',
          text2: 'Intenta nuevamente.'});
      }
    } catch (error) {
      Toast.show({type: 'error',
        text1:'No se ha podido desconectar la impresora',
        text2: 'Intenta nuevamente.'});
    }
  }

  return (
    <View>
      { showListPrintersDialog &&
      <ListPrintersDialog
        connectedPrinter={connectedPrinter}
        listPairedPrinters={pairedPrinters}
        listDiscoveredPrinters={discoveredPrinters}
        onSelectPairedPrinter={handleConnectDevice}
        onSelectDiscoveredPrinter={handlePairDevice} 
        onUnregisterPairedPrinter={handleUnPairDevice}
        onDisconnectConnectedPrinter={handleDisconnectConnectedDevice}
        onCloseDialog={handleCloseDialog}
        />
        
      }
        {/* <ActionDialog
          visible={showDialog}
          onAcceptDialog={handlerDisconnectPrinter}
          onDeclinedialog={handlerCancelDisconnectDevice}>
          <Text>
            ¿Quieres desconetar el dispositivo de la impresora?
          </Text>
        </ActionDialog> */}
      <Pressable
        style={tw`bg-blue-700 py-6 px-6 rounded-full`}
        onPress={handleOnAccessBleMenu}>
        <Icon name={'print'}
          style={tw`absolute inset-0 top-3 text-base text-center`} color="#fff" />
      </Pressable>
      { isBeingConnected || renderingComponent ?
        <ActivityIndicator style={tw`absolute top-0 right-8`}/> :
        <View
          style={tw`absolute top-0 right-8 ${isConnected ? 'bg-green-500' : 'bg-red-700'} py-3 px-3 
          rounded-full`}/>
      }
    </View>
  );
};

export default BluetoothButton;
