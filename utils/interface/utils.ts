export function convertArrayOfInterfacesToMapOfInterfaces(field_to_use_as_key: string, array_of_interfaces: any[]): Map<string, any> { 
    const map_of_interfaces: Map<string, any> = new Map<string, any>();
    array_of_interfaces.forEach((current_interface:any) => {
      const key:string = current_interface[field_to_use_as_key];
      map_of_interfaces.set(key, current_interface);
    });
    
    return map_of_interfaces;
}


export function convertArrayOfInterfacesToMapOfArraysOfInterfaces(field_to_use_as_key: string, array_of_interfaces: any[]): Map<string, any[]> {
  const map_of_arrays_of_interfaces: Map<string, any[]> = new Map<string, any[]>();

  array_of_interfaces.forEach((current_interface:any) => {
    const key:string = current_interface[field_to_use_as_key];

    if (map_of_arrays_of_interfaces.has(key)) {
      const current_array_of_interfaces = map_of_arrays_of_interfaces.get(key) || [];
      current_array_of_interfaces.push(current_interface);
      map_of_arrays_of_interfaces.set(key, current_array_of_interfaces);
    } else {
      map_of_arrays_of_interfaces.set(key, [current_interface]);
    }
  });
  
  return map_of_arrays_of_interfaces;
}