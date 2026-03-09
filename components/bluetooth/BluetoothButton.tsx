// Libraries
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/FontAwesome';

// Hooks
// import useBLE from '@/hooks/useBLE';

// Components
import Toast from 'react-native-toast-message';
import { BluetoothDevice, BluetoothDeviceEvent } from 'react-native-bluetooth-classic';

// Container
import { container as di_container } from '@/src/infrastructure/di/container';
import { BluetoothPrinterService } from '@/src/infrastructure/services/BluetoothPrinterService';

// UI components
import ListPrintersDialog from '@/components/bluetooth/ListPrintersDialog';


const BluetoothButton = () => {
  const printerService = di_container.resolve<BluetoothPrinterService>(BluetoothPrinterService);
  
  const [isBeingConnected, setIsBeingConnected] = useState<boolean>(false);
  const [showListPrintersDialog, setShowListPrintersDialog] = useState<boolean>(false);
  const [renderingComponent, setRenderingComponent] = useState<boolean>(false);
  
  const [pairedPrinters, setPairedPrinters] = useState<BluetoothDevice[]>([]);
  const [discoveredPrinters, setDiscoveredPrinters] = useState<BluetoothDeviceEvent[]>([]);
  const [connectedPrinter, setConnectedPrinter] = useState<BluetoothDevice | null>(null);
  const connectedPrinterRef = useRef<BluetoothDevice | null>(null);

  // Auto-reconnect refs
  const lastConnectedPrinterRef = useRef<BluetoothDevice | null>(null);
  const reconnectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isManualDisconnectRef = useRef<boolean>(false);



  useEffect(() => {
    createListenerForDisconnectedDevice();
    initializeBluetoohComponent();
    
    return () => {
      // Cleanup any active listeners on unmount
      printerService.stopDisconnectPrinterListener();
      printerService.stopDiscoverPrinters();
      clearReconnectInterval();
    };
  }, []);

  useEffect(() => {
    connectedPrinterRef.current = connectedPrinter;
  }, [connectedPrinter]);
  
  // Auxiliar functions
  const getPairedPrinters = async (excludeConnectedPrinter: boolean): Promise<BluetoothDevice[]> => {
    // If possible, exclude the currently connected printer from the list
    const bondedPrinters: BluetoothDevice[] = await printerService.getBondedPrinters();
    let printersToReturn: BluetoothDevice[] = bondedPrinters;
    
    if (excludeConnectedPrinter === true) {
      if (connectedPrinter === null) {
        printersToReturn = bondedPrinters;
      } else {
        printersToReturn = bondedPrinters.filter(p => p.address !== connectedPrinter.address);
      }
    } else {
      printersToReturn = bondedPrinters;
    }
    
    
    return printersToReturn;
  };

  // Auto-reconnect functions
  const clearReconnectInterval = () => {
    if (reconnectIntervalRef.current) {
      clearInterval(reconnectIntervalRef.current);
      reconnectIntervalRef.current = null;
    }
  };

  const attemptReconnect = async () => {
    const deviceToReconnect = lastConnectedPrinterRef.current;
    if (!deviceToReconnect) {
      clearReconnectInterval();
      return;
    }

    try {
      const result = await printerService.connectDevice(deviceToReconnect);
      if (result) {
        // Successfully reconnected
        clearReconnectInterval();
        setConnectedPrinter(deviceToReconnect);
        setPairedPrinters(prev => prev.filter(p => p.address !== deviceToReconnect.address));
        lastConnectedPrinterRef.current = null;
        
        Toast.show({
          type: 'success',
          text1: 'Impresora reconectada',
          text2: 'La conexión se restableció automáticamente.'
        });
      }
    } catch (error) {
      // Connection attempt failed, will retry in next interval
    }
  };

  const startReconnectInterval = (device: BluetoothDevice) => {
    // Clear any existing interval first
    clearReconnectInterval();
    
    // Store the device to reconnect
    lastConnectedPrinterRef.current = device;
    
    Toast.show({
      type: 'info',
      text1: 'Impresora desconectada',
      text2: 'Intentando reconectar automáticamente...'
    });
    
    // Start interval to attempt reconnection every 3 seconds
    reconnectIntervalRef.current = setInterval(attemptReconnect, 3000);
  };

  const createListenerForDisconnectedDevice = async () => {
    await printerService.disconnectPrinterListener(
      (deviceEvent: BluetoothDeviceEvent) => {
        const { device } = deviceEvent;
        const { address } = device;
        const current = connectedPrinterRef.current;
        if (current && current.address === address) {
          // Deterministically mark disconnected and move it back to registered
          setConnectedPrinter(null);
          getPairedPrinters(false).then((printers) => setPairedPrinters(printers));
          
          // Start auto-reconnect if not a manual disconnect
          if (!isManualDisconnectRef.current) {
            startReconnectInterval(current);
          }
          isManualDisconnectRef.current = false;
        }
      }
    );
  };
      
  const initializeBluetoohComponent = async () => {
    setConnectedPrinter(await printerService.getConnectedPrinter())
  }

  // Handlers
  const handleOnAccessBleMenu = async () => {    
    setPairedPrinters(await getPairedPrinters(true));
    printerService.discoverPrinters(
      (device: BluetoothDeviceEvent) => {
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

  const handlePairDevice = async (deviceEvent: BluetoothDeviceEvent) => {
    const { device } = deviceEvent;
    try {
      const result = await printerService.pairDevice(device)

      if (result) {

        setPairedPrinters(await getPairedPrinters(true));

        setDiscoveredPrinters(discoveredPrinters.filter(d => d.device.address !== device.address));

        Toast.show({type: 'success',
          text1:'Impresora registrada satisfactoriamente',
          text2: 'Ahora puedes proceder a conectar la impresora.'});


      } else {
        Toast.show({type: 'error',
          text1:'No se ha podido registrar la impresora',
          text2: 'Si pide contraseña, generalmente es: 0000 ó 1234.'});
      }

    } catch {
      Toast.show({type: 'error',
        text1:'No se ha podido registrar la impresora',
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
      // Clear any ongoing auto-reconnect attempt
      clearReconnectInterval();
      lastConnectedPrinterRef.current = null;
      
      Toast.show({type: 'info',
      text1:'Iniciando conexión con la impresora',
      text2: 'Puede tomar unos segundos...'});
      const result = await printerService.connectDevice(device);
      if (result) {
        setConnectedPrinter(device);
        setPairedPrinters(prev => prev.filter(p => p.address !== device.address));
        
        setRenderingComponent(false);
        setIsBeingConnected(false);

        Toast.show({type: 'success',
          text1:'Impresora conectada',
          text2: 'La impresora está lista para usar.'});
      } else {
        Toast.show({type: 'error',
          text1:'No se ha podido conectar la impresora',
          text2: 'Asegurate que la impresora este encendida o cerca al telefono.'});   
      }
    } catch (error) {
      Toast.show({type: 'error',
        text1:'No se ha podido conectar la impresora',
        text2: 'Asegurate que la impresora este encendida o cerca al telefono.'});   
    }
  }

  const handleUnPairDevice = async (device: BluetoothDevice) => {
    try {
        // If unpairing the connected device, mark as manual to prevent auto-reconnect
        if (connectedPrinter && connectedPrinter.address === device.address) {
          isManualDisconnectRef.current = true;
          clearReconnectInterval();
          lastConnectedPrinterRef.current = null;
        }
        
        Toast.show({type: 'info',
        text1:'Removiendo impresora del registro',
        text2: 'Puedes volver a registrarla después.'});

        const result = await printerService.unpairDevice(device);

        if (result) {
          Toast.show({type: 'success',
          text1:'Impresora removida del registro',
          text2: 'Puedes volver a registrarla después.'});
          setPairedPrinters(await getPairedPrinters(true));
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

  const handleDisconnectConnectedDevice = async (device: BluetoothDevice) => {
    try {
      // Mark as manual disconnect to prevent auto-reconnect
      isManualDisconnectRef.current = true;
      clearReconnectInterval();
      lastConnectedPrinterRef.current = null;
      
      Toast.show({type: 'info',
        text1:'Desconectando impresora',
        text2: 'Puede tomar unos segundos...'});
      const result = await printerService.disconnectDevice(device);
      if (result) {
        setConnectedPrinter(null);
        setPairedPrinters(await getPairedPrinters(false));
        Toast.show({type: 'success',
          text1:'Impresora desconectada',
          text2: 'Puedes reconectarla cuando lo necesites.'});
      } else {
        Toast.show({type: 'error',
          text1:'No se ha podido desconectar la impresora',
          text2: 'Intenta nuevamente.'});
      }

      setRenderingComponent(false);
      setIsBeingConnected(false);
    } catch (error) {
      Toast.show({type: 'error',
        text1:'No se ha podido desconectar la impresora',
        text2: 'Intenta nuevamente.'});
    }
  }

  const handleCloseDialog = () => {
    printerService.stopDiscoverPrinters();
    setShowListPrintersDialog(false);
  }

  return (
    <View
      style={tw`w-10 h-10 flex justify-center items-center`}>
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
      <Pressable
        style={({pressed}) => [
          // py-6 px-6
          tw`bg-blue-700 w-12 h-12 rounded-full`,
          pressed ? tw`bg-blue-800` : tw`bg-blue-600`,
        ]}
        onPress={handleOnAccessBleMenu}>
        <Icon name={'print'}
          style={tw`absolute inset-0 top-3 text-base text-center`} color="#fff" />
      </Pressable>
      { isBeingConnected || renderingComponent ?
        <ActivityIndicator style={tw`absolute top-0 right-11`}/> :
        <View
          // py-3 px-3
          style={tw`absolute -top-1 right-7 ${connectedPrinter !== null ? 'bg-green-500' : 'bg-red-700'}  w-5 h-5
          rounded-full`}/>
      }
    </View>
  );
};

export default BluetoothButton;
