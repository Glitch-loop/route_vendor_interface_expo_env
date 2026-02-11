import StoreDTO from "@/src/application/dto/StoreDTO";


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