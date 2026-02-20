// Librarires
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region, Camera, LatLng } from 'react-native-maps';
import tw from 'twrnc';

// Interfaces
import { IStoreRouteMap } from '@/interfaces/interfaces';
import { View } from 'react-native';

// Utils 
import { capitalizeFirstLetterOfEachWord } from '@/utils/string/utils';
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
  stores,
  initialCoordinates,
  selectedStore,
  onClick,
  onSelectLocation
}:{
  stores:(IStoreRouteMap)[],
  initialCoordinates?:LatLng
  selectedStore?:IStoreRouteMap,
  onClick?:(store:IStoreRouteMap) => void
  onSelectLocation?:(coordinates:LatLng|undefined) => void
}) => {
  const mapRef = useRef<MapView|null>(null);
  const markerRefs = useRef<Record<string, any|null>>({});
  const selectedLocationMarkerRef = useRef(null);

  const [initialLocation, setInitialLocation] = useState<Region|undefined>(undefined);
  const [selectedLocation, setSelectedLocation] = useState<LatLng|undefined>(undefined);
  


  useEffect(() => {
    setUpMap();
  }, [initialCoordinates]);

  useEffect(() => {
    if (selectedStore !== undefined && mapRef !== null) {
        const { id_store, latitude, longitude } = selectedStore;
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

    if (selectedStore !== undefined && markerRefs.current !== null) {
      // @ts-ignore
      const { id_store } = selectedStore;
      setTimeout(() => {
        // @ts-ignore
        markerRefs.current[id_store]?.showCallout?.();
      }, 100);
    }
   }, [selectedStore])

   useEffect(() => {
    if (selectedLocation && selectedLocationMarkerRef.current !== null) {
      // @ts-ignore
      setTimeout(() => {
        // @ts-ignore
        selectedLocationMarkerRef.current?.showCallout?.();

        setTimeout(() => {
          // @ts-ignore
          selectedLocationMarkerRef.current?.hideCallout?.();
        }, 2000);

      }, 100);



    }
    }, [selectedLocation])
    
   
   
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
  }

  const handleLocationSelected = (coordinates: LatLng) => {
     if (onSelectLocation === undefined) return;    
      setSelectedLocation(coordinates);
      onSelectLocation(coordinates);
     // Automatically show callout after a small delay to ensure marker is rendered
     setTimeout(() => {
       // @ts-ignore
       selectedLocationMarkerRef.current?.showCallout?.();
     }, 100);
  }

  const handleDeselectLocation = () => {
    setSelectedLocation(undefined);
    if (onSelectLocation) onSelectLocation(undefined);
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
        onPress={(data) => { handleLocationSelected(data.nativeEvent.coordinate); }}>
          { selectedLocation &&
          <Marker  
              ref={selectedLocationMarkerRef}
              key={Date.now()} // Unique key to force re-render when location changes
              pinColor={tw.color('bg-blue-400')}
              title={`Buscar al rededor de esta ubicación`}
              description="Presiona nuevamente para deseleccionar"
              onPress={() => { handleDeselectLocation(); }}
              coordinate={selectedLocation} />
          }

          { stores.map((store) => {
            let marker_color = '';
            const { id_store, store_name, latitude, longitude, tw_color, route_status_store } = store;
            marker_color = tw_color;

            return (
              <Marker
                ref={((ref) => { markerRefs.current[id_store] = ref; })}
                key={id_store}
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
