// Librarires
import React, { useState, useEffect, useRef } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import tw from 'twrnc';

// Services
// import {
//   getCurrentLocation,
// } from '../services/geolocationService';

import { ICoordinates } from '../interfaces/interfaces';
import { Button } from 'react-native';
import { View } from 'react-native';


const INITIAL_REGION = {
  latitude: 20.641640381312676,
  longitude: -105.2190063835951,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
  zoom: 5
}

const markers:any[] = [
  {
    latitude: 20.641640381312676,
    longitude: -105.2190063835951,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
    zoom: 0.5
  }
]
 
const RouteMap = ({latitude, longitude}:{latitude:number, longitude:number}) => {
  const mapRef = useRef<MapView|null>(null);

  const [location, setLocation] = useState(
    {
      latitude: 20.641640381312676,
      longitude: -105.2190063835951,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });

    const [locations, setLocations] =useState<any[]>([])

  const handlerGetStorePosition = () => {
    setLocation(    {
      latitude: latitude,
      longitude: longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    })
    setLocations([
      {
        latitude: latitude,
        longitude: longitude,
        latitudeDelta: 2,
        longitudeDelta: 2,
      }
    ])
  }

  return (
    <View style={tw`flex-1 w-full`}>
      <MapView
        style={tw`flex-1 w-full`}
        provider={PROVIDER_GOOGLE}
        initialRegion={INITIAL_REGION} // Initial perspective of the map
        showsUserLocation={true}  // Show the user's current location
        showsMyLocationButton={true}  // Button to return to user's location
        ref={mapRef}
        >
        {/* Add a marker at the user's current position */}
        <Marker coordinate={{ latitude: latitude, longitude: longitude }}/>
      </MapView>
        {/* <Button onPress={handlerGetStorePosition} title='heello' /> */}

    </View>
  );
};
export default RouteMap;
