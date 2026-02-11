// Librarires

import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, CameraZoomRange, Region, Camera, Callout, LatLng } from 'react-native-maps';
import tw from 'twrnc';
import { IStoreRouteMap } from '../interfaces/interfaces';
import { View } from 'react-native';
import { capitalizeFirstLetterOfEachWord } from '@/utils/generalFunctions';
import useCurrentLocation from '@/hooks/useCurrentLocation';
import { getAddressOfStore } from '@/utils/stores/utils';

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
  },
  calloutContainer: {
    width: 150, // Set a fixed width for consistent rendering
    padding: 10,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
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
  const markerRef = useRef(null);

  const [initialLocation, setInitialLocation] = useState<Region|undefined>(undefined);
  const [locationSelected, setSelectedLocation] = useState<IStoreRouteMap|undefined>(undefined);

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
        zoom: 16
      }

      if (mapRef.current !== null) {
        mapRef.current.animateCamera(newCamera, { duration: 1000 });
      }


    }

    if (markerRef.current !== null) {
      // @ts-ignore
      console.log("foricing show callout")
      markerRef.current.showCallout();
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
  const handleSelectStore = (store: IStoreRouteMap) => {
    if (onClick) onClick(store);
    setSelectedLocation(store);

  }

  return (
    <View style={styles.mapContainer}>
      <MapView
      ref={mapRef}
      // camera={initialCoordinates}
      region={initialLocation}
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      showsUserLocation={true}
      showsMyLocationButton={true}
      onPress={(data) => {
        // handleGoToLocation();
        console.log(data.nativeEvent.coordinate) 
      }}>
        { selectedStore &&
        <Marker  
            ref={markerRef}            
            key={selectedStore.id_store}
            pinColor={"bg-blue-900"}
            title={`${ capitalizeFirstLetterOfEachWord(selectedStore.store_name) } - ${ selectedStore.route_status_store}`}
            description={getAddressOfStore(selectedStore)}
            onPress={() => { handleSelectStore(selectedStore) }}
            coordinate={{ latitude: parseFloat(selectedStore.latitude), longitude: parseFloat(selectedStore.longitude) }} />
        }

        { stores.map((store) => {
          let marker_color = '';
          const { store_name, latitude, longitude, tw_color, route_status_store } = store;
          marker_color = tw_color;
          if (selectedStore !== undefined) {
            if (store.id_store === selectedStore.id_store) {
              console.log('Selected store in map')
              return null
            }
          }
          return (
            <Marker
              key={store.id_store}
              pinColor={tw.color(marker_color)}
              title={`${ capitalizeFirstLetterOfEachWord(store_name) } - ${ route_status_store}`}
              description={getAddressOfStore(store)}
              onPress={() => { handleSelectStore(store) }}
              coordinate={{ latitude: parseFloat(latitude), longitude: parseFloat(longitude) }} />
          )
        })
        }
      </MapView>
    </View>
  );
};





export default RouteMap;
