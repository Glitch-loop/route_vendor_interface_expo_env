// Librarires
import React, { useState, useEffect } from 'react';
import MapView, { Marker } from 'react-native-maps';
import tw from 'twrnc';

// Services
// import {
//   getCurrentLocation,
// } from '../services/geolocationService';

import { ICoordinates } from '../interfaces/interfaces';


const RouteMap = ({latitude, longitude}:{latitude:number, longitude:number}) => {
  console.log("latitude: ", latitude)
  console.log("longitude: ", longitude)
  const [location, setLocation] = useState(
    {
      latitude: latitude,
      longitude: longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });

  console.log("Locaion: ", location)
  return (
    <MapView
      style={tw`flex-1 w-full`}
      region={location} // Initial perspective of the map
      showsUserLocation={true}  // Show the user's current location
      showsMyLocationButton={true}  // Button to return to user's location
    >
      {/* Add a marker at the user's current position */}
      <Marker
        coordinate={{ latitude: location.latitude, longitude: location.longitude }}/>
    </MapView>
  );
};

export default RouteMap;
