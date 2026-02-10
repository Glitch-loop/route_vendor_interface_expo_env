// Librarires

import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, CameraZoomRange, Region, Camera, Callout, LatLng } from 'react-native-maps';
import tw from 'twrnc';
import { IStoreRouteMap } from '../interfaces/interfaces';
import { View } from 'react-native';
import { capitalizeFirstLetterOfEachWord } from '@/utils/generalFunctions';
import useCurrentLocation from '@/hooks/useCurrentLocation';

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
  
}

const INITIAL_LOCATION_CAMERA:Camera = {
  center: INITIAL_REGION,
  heading: 0,
  pitch: 0,
  zoom: 18
}

const RouteMap = ({
  initialCoordinates,
  selectedStore,
  stores,
  onClick
}:{
  initialCoordinates?:LatLng
  selectedStore?:IStoreRouteMap,
  stores:(IStoreRouteMap)[],
  onClick?:(store:IStoreRouteMap) => void
}) => {
  const mapRef = useRef<MapView|null>(null);

  const [location, setLocation] = useState<Camera>(INITIAL_LOCATION_CAMERA);
  
  
  const [locationToFocus, setLocationToFocus] = useState<Camera|undefined>(undefined);
  const [locations, setLocations] =useState<IStoreRouteMap[]>([])

  const [initialLocation, setInitialLocation] = useState<Region|undefined>(undefined);
  
  // Hooks
  const userCurrentLocation = useCurrentLocation();

  useEffect(() => {
    setUpMap();
  }, [initialCoordinates]);

  useEffect(() => {
    if (selectedStore !== undefined && mapRef !== null) {
        const { latitude, longitude } = selectedStore;
        const newCamera: Camera = {
        center: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
        },
        heading: 0,
        pitch: 0,
        zoom: 18
      }

      if (mapRef.current !== null) {
        mapRef.current.animateCamera(newCamera, { duration: 1000 });
      }
    }
   }, [selectedStore])

  // Auxiliar
   const setUpMap = async () => {
      // const userLocation: LocationObject | null = await userCurrentLocation.getCurrentUserLocation();
      if(initialCoordinates) {
        const { latitude, longitude } = initialCoordinates;
        setInitialLocation({
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        })
        // const newCamera: Camera = {
        //   center: {
        //       latitude: latitude,
        //       longitude: longitude,
        //   },
        //   heading: 0,
        //   pitch: 0,
        //   zoom: 15
        // }

        // if (mapRef.current !== null) {
        //   mapRef.current.animateCamera(newCamera, { duration: 1000 });
        // }
      }
   }

  // Handlers
  const handleGoToLocation = () => {
    if (mapRef.current !== null) {
      const newCamera: Camera = {
        center: {
            latitude: 20.641640381312676,
            longitude: -105.2190063835951,
        },
        heading: 0,
        pitch: 0,
        zoom: 18
      }

      mapRef.current.animateCamera(newCamera, { duration: 0 });
    }
  }

  return (
    <View style={styles.mapContainer}>
      <MapView
      ref={mapRef}
      // camera={initialCoordinates}
      region={initialLocation}
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      showsUserLocation={true}  // Show the user's current location
      showsMyLocationButton={true}  // Button to return to user's location
      onPress={(data) => {
        handleGoToLocation();
        console.log(data.nativeEvent.coordinate) 
      }}
      // region={location}
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
              pinColor={tw.color(store.tw_color)}
              title={capitalizeFirstLetterOfEachWord(store.store_name)}
              onPress={() => { if (onClick) onClick(store) }}
              coordinate={{ latitude: parseFloat(store.latitude), longitude: parseFloat(store.longitude) }}>
                <Callout>
                  <Text>Hello world</Text>
                </Callout>
            </Marker>
          )
        })
        }
      </MapView>
    </View>
  );
};





export default RouteMap;
