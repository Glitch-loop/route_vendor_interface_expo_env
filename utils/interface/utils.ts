

export function convertArrayOfInterfacesToMapOfInterfaces(field_to_use_as_key: string, array_of_interfaces: any[]): Map<string, any> { 
    const map_of_interfaces: Map<string, any> = new Map<string, any>();
    array_of_interfaces.forEach((current_interface:any) => {
      const key:string = current_interface[field_to_use_as_key];
      map_of_interfaces.set(key, current_interface);
    });
    
    return map_of_interfaces;
}