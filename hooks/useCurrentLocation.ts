import { useState, useEffect } from 'react';


import * as Location from 'expo-location'

interface expoLocationHook {
    getCurrentUserLocation():  Promise<Location.LocationObject | null>
    getMostAccurateCurrentUserLocation():  Promise<Location.LocationObject | null>
}

function useCurrentLocation(): expoLocationHook {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [bestLocation, setBestLocation] = useState<Location.LocationObject | null>(null);


    const getCurrentUserLocation = async () => {
        if (bestLocation !== null) {
            getMostAccurateCurrentUserLocation();
            return bestLocation;
        }

        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'denied') {
          return null;
        }
  
        let location = await Location.getCurrentPositionAsync({accuracy: Location.Accuracy.Lowest});
        setLocation(location);
        return location; 
    }

    const getMostAccurateCurrentUserLocation = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'denied') {
          return null;
        }
  
        let location = await Location.getCurrentPositionAsync({accuracy: Location.Accuracy.Highest});
        setBestLocation(location);
        return location; 
    }





    return {
        getCurrentUserLocation,
        getMostAccurateCurrentUserLocation
    };
}

export default useCurrentLocation;