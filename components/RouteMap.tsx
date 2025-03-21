// Librarires
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import tw from 'twrnc';

// Services
// import {
//   getCurrentLocation,
// } from '../services/geolocationService';

import { ICoordinates, IStore } from '../interfaces/interfaces';
import { Button } from 'react-native';
import { View } from 'react-native';
import { LocaleDirContext } from '@react-navigation/native';
import { capitalizeFirstLetterOfEachWord } from '@/utils/generalFunctions';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden', // Fix for Android rendering issues
  },
  map: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 10,
    borderRadius: 5,
    elevation: 5, // Specific to Android for proper layering
  },
  text: {
    fontSize: 16,
    color: 'black',
  },
  marker: {
    backgroundColor: '#18181a'
  }
});

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
 
const RouteMap = ({
  latitude, 
  longitude,
  stores,
  onClick
}:{
  latitude:number, 
  longitude:number,
  stores:IStore[],
  onClick?:(store:IStore) => void
}) => {
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
    <View style={styles.mapContainer}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={INITIAL_REGION} // Initial perspective of the map
        showsUserLocation={true}  // Show the user's current location
        showsMyLocationButton={true}  // Button to return to user's location
        ref={mapRef}
        >
        {/* Add a marker at the user's current position */}
        {/* <Marker 
          style={styles.marker}
          pinColor='#18181a'
          title='hola mundo'
        coordinate={{ latitude: latitude, longitude: longitude }}/> */}

        { stores.map((store) => {
          return (
            <Marker
            key={store.id_store}
              title={capitalizeFirstLetterOfEachWord(store.store_name)}
              onPress={() => { if (onClick) onClick(store) }}
              coordinate={{ latitude: parseFloat(store.latitude), longitude: parseFloat(store.longuitude) }}/>
          )
        })
        }
      </MapView>
    </View>
  );
};





export default RouteMap;
