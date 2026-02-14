// Interfaces
import { IStoreRouteMap } from "@/interfaces/interfaces";

// DTOs
import DayOperationDTO from "@/src/application/dto/DayOperationDTO";
import StoreDTO from "@/src/application/dto/StoreDTO";

// Utils
import { createDayOperationDependencyMap, getDayOperationColor, getRouteStatusStore } from "@/utils/day-operation/utils";
import { LocationObjectCoords } from "expo-location";
import { LatLng } from "react-native-maps";


export function getAddressOfStore(store: StoreDTO): string {
    const { street, ext_number, colony, postal_code } = store;
    return `${street} #${ext_number}, ${colony}, ${postal_code}`;
}

// export function distanceBetweenTwoPoints(x1:number, y1:number, x2:number, y2:number) {
//   const { sqrt, pow } = Math;
//   console.log("Formula: ", sqrt(pow((x1 - x2), 2) + pow((y1 - y2), 2)))
//   return sqrt(pow((x1 - x2), 2) + pow((y1 - y2), 2));
// }

export function distanceBetweenTwoPoints(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  
  return distance;
}

export function convertStoreDTOToIStoreRouteMap(stores: StoreDTO[], dayOperations: DayOperationDTO[]) : IStoreRouteMap[] {
    const storeRouteMap: IStoreRouteMap[] = [];
    const dayOperationMap = new Map<string, DayOperationDTO>(); // Accessing quickly to day operation by store id
    const dependencyMap = createDayOperationDependencyMap(dayOperations);
    dayOperations.forEach((dayOperation) => {
        dayOperationMap.set(dayOperation.id_item, dayOperation);
    });

    stores.forEach((store) => {
        const dayOperation = dayOperationMap.get(store.id_store);
        let color = '';
        let status = '';
        if (dayOperation) {
            const { operation_type } = dayOperation;
            color = getDayOperationColor(dayOperation, dependencyMap, false);
            status = getRouteStatusStore(operation_type);            
        } else {
            color = getDayOperationColor(undefined, dependencyMap, false);
            status = getRouteStatusStore(undefined);
        }

        storeRouteMap.push({
            ...store,
            tw_color: color,
            route_status_store: status
        });
    })

    return storeRouteMap;
}

export function findStoresAround(pivotLocation:LocationObjectCoords|LatLng|null, stores:IStoreRouteMap[]|null, metersAround:number):IStoreRouteMap[] {
    let storesToShow:IStoreRouteMap[] = [];

    if (pivotLocation !== null && stores !== null) {
        const kmRange = metersAround / 1000; // Convert meters to kilometers
        
        storesToShow = stores.filter((store) => {
            // distanceBetweenTwoPoints returns distance in kilometers
            const distanceInKm:number = distanceBetweenTwoPoints(
                parseFloat(store.latitude),
                parseFloat(store.longitude),
                pivotLocation.latitude,
                pivotLocation.longitude
            );

            return distanceInKm <= kmRange;
        });
        
    } else {
        storesToShow = [];
    }

    return storesToShow;
}
