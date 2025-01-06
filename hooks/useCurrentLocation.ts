import { useState, useEffect } from 'react';


import * as Location from 'expo-location'

interface expoLocationHook {
    getCurrentUserLocation():  Promise<Location.LocationObject | null>
}

function useCurrentLocation(): expoLocationHook {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);


    const getCurrentUserLocation = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          return null;
        }
  
        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);  
        return location; 
    }


    return {
        getCurrentUserLocation
    };
}

export default useCurrentLocation;