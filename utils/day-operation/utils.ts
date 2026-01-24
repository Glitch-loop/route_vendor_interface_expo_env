import { DAY_OPERATIONS } from "@/src/core/enums/DayOperations";

export function getTitleDayOperation(inventory_operation_type: string): string {
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


export function getStyleDayOperationForMenuOperation(inventory_operation_type: string): string { 
    let style: string = "";
    switch (inventory_operation_type) {
        case DAY_OPERATIONS.start_shift_inventory:
            style = 'my-2 bg-red-300 rounded w-11/12 h-16 flex flex-row justify-center items-center text-white';
            break;

        case DAY_OPERATIONS.end_shift_inventory:
            style = 'my-2 bg-red-300 rounded w-11/12 h-16 flex flex-row justify-center items-center text-white';
            break;

        case DAY_OPERATIONS.restock_inventory:
            style = 'my-2 bg-red-300 rounded w-11/12 h-16 flex flex-row justify-center items-center text-white';
            break;

        case DAY_OPERATIONS.product_devolution_inventory:
            style = 'my-2 bg-red-300 rounded w-11/12 h-16 flex flex-row justify-center items-center text-white';
            break;

        case DAY_OPERATIONS.new_client_registration:
            style ='my-2 bg-green-400 rounded w-11/12 h-16 flex flex-row justify-center items-center text-white'
            break;

        case DAY_OPERATIONS.attention_out_of_route:
            style = 'my-2 bg-orange-600 rounded w-11/12 h-16 flex flex-row justify-center items-center text-white';
            break;
        
        case DAY_OPERATIONS.attend_client_petition:
            style = 'my-2 bg-amber-500 rounded w-11/12 h-16 flex flex-row justify-center items-center text-white';
            break;

        case DAY_OPERATIONS.route_client_attention:
            style = 'my-2 bg-amber-300 rounded w-11/12 h-16 flex flex-row justify-center items-center text-white';
            break;
        

    }
    return style;
}