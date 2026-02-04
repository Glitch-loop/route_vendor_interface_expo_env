import { KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { BluetoothDevice, BluetoothDeviceEvent } from "react-native-bluetooth-classic";
import { Dialog, Portal, List, Divider, IconButton } from "react-native-paper";
import tw from "twrnc";
import React from "react";
import { View, Text, ScrollView } from "react-native";
import Toast from "react-native-toast-message";


const ListPrintersDialog = (
    {
        connectedPrinter,
        listPairedPrinters,
        listDiscoveredPrinters,
        onSelectPairedPrinter,
        onSelectDiscoveredPrinter,
        onUnregisterPairedPrinter,
        onDisconnectConnectedPrinter,
        onCloseDialog
    } : {
      connectedPrinter?: BluetoothDevice | null,
      listPairedPrinters: BluetoothDevice[],
      listDiscoveredPrinters: BluetoothDeviceEvent[],
      onSelectPairedPrinter: (printer: BluetoothDevice) => void,
      onSelectDiscoveredPrinter: (printer: BluetoothDeviceEvent) => void,
      onUnregisterPairedPrinter: (printer: BluetoothDevice) => void,
      onDisconnectConnectedPrinter?: (printer: BluetoothDevice) => void,
      onCloseDialog: () => void,
    }
) => {
    return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Portal>
        <Dialog visible={true}>
          <View style={tw`absolute right-0 top-0 my-2 mr-2 px-1 pt-1`}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              android_ripple={{ color: 'rgba(0,0,0,0.12)', radius: 24 }}
              style={({ pressed }) => [{
                backgroundColor: pressed ? '#6b7280' : '#d1d5db', // dark vs light gray
                borderRadius: 999,
                padding: 6,
              }]}
              onPress={onCloseDialog}
            >
              <List.Icon icon="close" color="#111827" />
            </Pressable>
          </View>
          <View style={tw`flex-row items-center justify-between px-3 pt-1`}>
            <Text style={tw`text-lg font-semibold`}>Selecciona impresora</Text>
          </View>
          <Dialog.Content>
            <ScrollView style={{ maxHeight: 400 }}>
              <List.Section>
                <List.Subheader>Impresora conectada</List.Subheader>
                {connectedPrinter ? (
                  <View>
                    <Pressable
                      android_ripple={{ color: 'rgba(0,0,0,0.12)' }}
                      style={({ pressed }) => [{ backgroundColor: pressed ? '#eef2ff' : 'transparent' }]}
                      onPress={() => onDisconnectConnectedPrinter && onDisconnectConnectedPrinter(connectedPrinter)}
                    >
                      <List.Item
                        title={connectedPrinter.name ?? connectedPrinter.address}
                        description={connectedPrinter.address}
                        left={(props) => <List.Icon {...props} icon="printer" />}
                        right={(props) => (
                          <IconButton
                            icon="bluetooth-off"
                            iconColor="#b91c1c"
                            onPress={() => onDisconnectConnectedPrinter && onDisconnectConnectedPrinter(connectedPrinter)}
                          />
                        )}
                      />
                    </Pressable>
                  </View>
                ) : (
                  <Text style={tw`text-gray-500 px-2 py-2`}>No hay impresora conectada</Text>
                )}
              </List.Section>

              <List.Section>
                <List.Subheader>Impresoras registradas</List.Subheader>
                {listPairedPrinters.length === 0 ? (
                  <Text style={tw`text-gray-500 px-2 py-2`}>No hay impresoras registradas</Text>
                ) : (
                  listPairedPrinters.map((printer: BluetoothDevice, idx: number) => (
                    <View key={printer.address}>
                      <Pressable
                        android_ripple={{ color: 'rgba(0,0,0,0.12)' }}
                        style={({ pressed }) => [{ backgroundColor: pressed ? '#eef2ff' : 'transparent' }]}
                        onPress={() => onSelectPairedPrinter(printer)}
                      >
                        <List.Item
                          title={printer.name ?? printer.address}
                          description={printer.address}
                          left={(props) => <List.Icon {...props} icon="printer" />}
                          right={(props) => (
                            <IconButton
                              icon="bluetooth-off"
                              iconColor="#b91c1c"
                              onPress={() => { onUnregisterPairedPrinter(printer); }}
                            />
                          )}
                        />
                      </Pressable>
                      {idx < listPairedPrinters.length - 1 && <Divider />}
                    </View>
                  ))
                )}
              </List.Section>

              <List.Section>
                <List.Subheader>Impresoras descubiertas</List.Subheader>
                {listDiscoveredPrinters.length === 0 ? (
                  <Text style={tw`text-gray-500 px-2 py-2`}>No se han descubierto impresoras</Text>
                ) : (
                  listDiscoveredPrinters.map((printerEvent: BluetoothDeviceEvent, idx: number) => (
                    <View key={printerEvent.device.address}>
                      <Pressable
                        android_ripple={{ color: 'rgba(0,0,0,0.12)' }}
                        style={({ pressed }) => [{ backgroundColor: pressed ? '#eef2ff' : 'transparent' }]}
                        onPress={() => onSelectDiscoveredPrinter(printerEvent)}
                      >
                        <List.Item
                          title={printerEvent.device.name ?? printerEvent.device.address}
                          description={printerEvent.device.address}
                          left={(props) => <List.Icon {...props} icon="printer" />}
                          right={(props) => <List.Icon {...props} icon="bluetooth-connect" color="#1622a3"/>}
                        />
                      </Pressable>
                      {idx < listDiscoveredPrinters.length - 1 && <Divider />}
                    </View>
                  ))
                )}
              </List.Section>
            </ScrollView>
          </Dialog.Content>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
    );
}

export default ListPrintersDialog;