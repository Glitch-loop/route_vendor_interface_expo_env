import DayOperationDTO from "@/src/application/dto/DayOperationDTO";
import InventoryOperationDTO from "@/src/application/dto/InventoryOperationDTO";
import { DAY_OPERATIONS } from "@/src/core/enums/DayOperations";


export function getTitleDayOperation(inventory_operation_type: string, inventory_to_consult: InventoryOperationDTO|undefined|null): string {
    let title = "";
    if (inventory_operation_type === DAY_OPERATIONS.consult_inventory) {
        if (inventory_to_consult) {
            const { id_inventory_operation_type } = inventory_to_consult;
            title = "Consulta de inventario - " + getNameDayOperation(id_inventory_operation_type);
        } else {
            title = "Consulta de inventario";
        }
    } else {
        title = getNameDayOperation(inventory_operation_type);
    }  
    return title;
}

export function getNameDayOperation(inventory_operation_type: string,): string {
    let title: string = "";
    switch (inventory_operation_type) {
        case DAY_OPERATIONS.start_shift_inventory:
            title = "Inventario inicial";
            break;

        case DAY_OPERATIONS.end_shift_inventory:
            title = "Inventario final";
            break;

        case DAY_OPERATIONS.restock_inventory:
            title = "Re-stock de inventario";
            break;

        case DAY_OPERATIONS.consult_inventory:
            title = "Consulta de inventario";
            break;

        case DAY_OPERATIONS.product_devolution_inventory:
            title = "Devolución de productos";
            break;
    }
    return title;
}

export function getTitleDayOperationForMenuOperation(inventory_operation_type: string): string {
    let title: string = "";
    switch (inventory_operation_type) {
        case DAY_OPERATIONS.start_shift_inventory:
            title = "Inventario de inicio de ruta";
            break;

        case DAY_OPERATIONS.end_shift_inventory:
            title = "Inventario final";
            break;

        case DAY_OPERATIONS.restock_inventory:
            title = "Restock de producto";
            break;

        case DAY_OPERATIONS.product_devolution_inventory:
            title = "Devolución de producto";
            break;
    }
    return title;
}

export function getDayOperationColor(dayOperation: DayOperationDTO|undefined, dependencyMap: Map<string, DayOperationDTO>, isCurrentOperation: boolean): string {
    let style: string = "";
    
    if (dayOperation === undefined) {
        style = 'bg-red-300';
    } else {
        const { operation_type, id_day_operation } = dayOperation;
        let day_operation_type: DAY_OPERATIONS = operation_type;
    
        if (day_operation_type === undefined) return 'bg-red-300';
    
        switch (day_operation_type) {
            case DAY_OPERATIONS.start_shift_inventory:
            case DAY_OPERATIONS.restock_inventory:
            case DAY_OPERATIONS.product_devolution_inventory:
            case DAY_OPERATIONS.end_shift_inventory:
                style ='bg-red-300';
                break;
            case DAY_OPERATIONS.new_client_registration:
                style ='bg-green-400';
                break;
            case DAY_OPERATIONS.attention_out_of_route:
                style = 'bg-orange-600';
                break;
            case DAY_OPERATIONS.attend_client_petition:
                style = 'bg-amber-500';
                break;
            case DAY_OPERATIONS.route_client_attention:
                if (dependencyMap.has(id_day_operation)) style = 'bg-amber-300/75';
                else style = 'bg-amber-300';
                break;
            default: 
                style = 'bg-red-300';
        }
    
        if (isCurrentOperation) style = 'bg-indigo-300';
    }
    

    return style;
}

export function getRouteStatusStore(day_operation_type: string|undefined): string {
    let style: string = "";
    if (day_operation_type === undefined) return 'Cliente fuera de ruta';

    switch (day_operation_type) {
        case DAY_OPERATIONS.new_client_registration:
            style ='Nuevo cliente';
            break;
        case DAY_OPERATIONS.attention_out_of_route:
            style = 'Cliente fuera de ruta';
            break;
        case DAY_OPERATIONS.attend_client_petition:
            style = 'Cliente atendido por solicitud';
            break;
        case DAY_OPERATIONS.route_client_attention:
            style = 'Cliente en ruta';
            break;
        default: 
            style = 'Cliente fuera de ruta';
    }
    return style;
}

export function createDayOperationDependencyMap(dayOperations: DayOperationDTO[]): Map<string, DayOperationDTO> {
    const dependencyMap: Map<string, DayOperationDTO> = new Map(); // <id_dependency, DayOperationDTO[]>
    for (const dayOperation of dayOperations) {
        const { id_dependency } = dayOperation;

        if (id_dependency === null) continue;

        dependencyMap.set(id_dependency, { ...dayOperation });
    }

    return dependencyMap;
}

export function determinePositionOrderToAttendOfStoreToAttend(id_item_to_determine: string, dayOperations: DayOperationDTO[]): number {
    let numberToAttend = 0;
    const orderedDayOperations = dayOperations.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    for (const dayOperation of orderedDayOperations) {
        const { id_day_operation, operation_type } = dayOperation;

        if (operation_type === DAY_OPERATIONS.route_client_attention) {
            numberToAttend += 1;
        }

        if (id_day_operation === id_item_to_determine) break;
    }

    return numberToAttend;
}