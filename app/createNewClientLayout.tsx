// Libraries
import React from 'react';
import { View, Text, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';

// Components
import MenuHeader from '@/components/shared-components/MenuHeader';
import RouteMap from '@/components/RouteMap';

export default function CreateNewClientLayout() {
  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Header */}
      <View style={tw`border-b border-gray-200`}>
        <MenuHeader />
      </View>

      <ScrollView contentContainerStyle={tw`pb-8`}>
        {/* Map section: show near clients */}
        <View style={tw`h-56`}>
          <RouteMap latitude={20.6416403813} longitude={-105.2190063836} stores={[]} />
        </View>

        {/* Campo de búsqueda de dirección (consulta a Google Maps) */}
        <View style={tw`px-4 mt-4`}>
          <Text style={tw`text-base font-semibold text-gray-800`}>Buscar dirección</Text>
          <TextInput
            placeholder="Escribe una dirección para buscar..."
            style={tw`mt-2 border border-gray-300 rounded-md px-3 py-2 text-gray-900`}
          />
        </View>

        {/* Formulario: un campo por cada atributo de StoreDTO (sin latitud/longitud) */}
        <View style={tw`px-4 mt-6`}>
          <Text style={tw`text-lg font-bold text-gray-900`}>Nuevo cliente</Text>

          {/* id_store */}
          <View style={tw`mt-4`}>
            <Text style={tw`text-sm text-gray-700`}>ID de la tienda</Text>
            <TextInput placeholder="p. ej., tienda-001" style={tw`mt-2 border border-gray-300 rounded-md px-3 py-2`} />
          </View>

          {/* street */}
          <View style={tw`mt-4`}>
            <Text style={tw`text-sm text-gray-700`}>Calle</Text>
            <TextInput placeholder="Nombre de la calle" style={tw`mt-2 border border-gray-300 rounded-md px-3 py-2`} />
          </View>

          {/* ext_number */}
          <View style={tw`mt-4`}>
            <Text style={tw`text-sm text-gray-700`}>Número exterior</Text>
            <TextInput placeholder="p. ej., 123" style={tw`mt-2 border border-gray-300 rounded-md px-3 py-2`} />
          </View>

          {/* colony */}
          <View style={tw`mt-4`}>
            <Text style={tw`text-sm text-gray-700`}>Colonia</Text>
            <TextInput placeholder="Colonia / barrio" style={tw`mt-2 border border-gray-300 rounded-md px-3 py-2`} />
          </View>

          {/* postal_code */}
          <View style={tw`mt-4`}>
            <Text style={tw`text-sm text-gray-700`}>Código postal</Text>
            <TextInput placeholder="p. ej., 12345" style={tw`mt-2 border border-gray-300 rounded-md px-3 py-2`} />
          </View>

          {/* address_reference */}
          <View style={tw`mt-4`}>
            <Text style={tw`text-sm text-gray-700`}>Referencia de la dirección</Text>
            <TextInput placeholder="Referencias o indicaciones adicionales" style={tw`mt-2 border border-gray-300 rounded-md px-3 py-2`} />
          </View>

          {/* store_name */}
          <View style={tw`mt-4`}>
            <Text style={tw`text-sm text-gray-700`}>Nombre de la tienda</Text>
            <TextInput placeholder="Nombre del negocio" style={tw`mt-2 border border-gray-300 rounded-md px-3 py-2`} />
          </View>

          {/* creation_date */}
          <View style={tw`mt-4`}>
            <Text style={tw`text-sm text-gray-700`}>Fecha de creación</Text>
            <TextInput placeholder="AAAA-MM-DD o cadena ISO" style={tw`mt-2 border border-gray-300 rounded-md px-3 py-2`} />
          </View>

          {/* status_store */}
          <View style={tw`mt-4`}>
            <Text style={tw`text-sm text-gray-700`}>Estado</Text>
            <TextInput placeholder="p. ej., 1 (Activo)" keyboardType="numeric" style={tw`mt-2 border border-gray-300 rounded-md px-3 py-2`} />
          </View>

          {/* is_new */}
          <View style={tw`mt-4 mb-8`}>
            <Text style={tw`text-sm text-gray-700`}>¿Es nuevo?</Text>
            <TextInput placeholder="p. ej., 1 para Sí, 0 para No" keyboardType="numeric" style={tw`mt-2 border border-gray-300 rounded-md px-3 py-2`} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
