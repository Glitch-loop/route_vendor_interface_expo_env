import RouteDTO from '@/src/application/dto/RouteDTO';
import RouteDayDTO from '@/src/application/dto/RouteDayDTO';
import RouteDayStoreDTO from '@/src/application/dto/RouteDayStoreDTO';
import ProductDTO from '@/src/application/dto/ProductDTO';
import StoreDTO from '@/src/application/dto/StoreDTO';
import InventoryOperationDTO from '@/src/application/dto/InventoryOperationDTO';
import InventoryOperationDescriptionDTO from '@/src/application/dto/InventoryOperationDescriptionDTO';
import WorkDayInformationDTO  from '@/src/application/dto/WorkdayInformationDTO';
import RouteTransactionDTO from '@/src/application/dto/RouteTransactionDTO';
import RouteTransactionDescriptionDTO from '@/src/application/dto/RouteTransactionDescriptionDTO';
import ProductInventoryDTO from '@/src/application/dto/ProductInventoryDTO';
import DayOperationDTO from '@/src/application/dto/DayOperationDTO';

export function isProductDTO(dto: any): dto is ProductDTO {
    return (
        dto && typeof dto === 'object' &&
        'id_product' in dto &&
        'product_name' in dto &&
        'barcode' in dto &&
        'weight' in dto &&
        'unit' in dto &&
        'comission' in dto &&
        'price' in dto &&
        'product_status' in dto &&
        'order_to_show' in dto
    );
}

export function isInventoryOperationDTO(dto: any): dto is InventoryOperationDTO {
    return (
        dto && typeof dto === 'object' &&
        'id_inventory_operation' in dto &&
        'sign_confirmation' in dto &&
        'date' in dto &&
        'state' in dto &&
        'audit' in dto &&
        'id_inventory_operation_type' in dto &&
        'id_work_day' in dto &&
        'inventory_operation_descriptions' in dto
    );
}

export function isWorkDayDTO(dto: any): dto is WorkDayInformationDTO {
    return (
        dto && typeof dto === 'object' &&
        'id_work_day' in dto &&
        'start_date' in dto &&
        'finish_date' in dto &&
        'start_petty_cash' in dto &&
        'final_petty_cash' in dto &&
        'id_route' in dto &&
        'route_name' in dto &&
        'description' in dto &&
        'route_status' in dto &&
        'id_day' in dto &&
        'id_route_day' in dto
    );
}

export function isRouteDTO(dto: any): dto is RouteDTO {
    return (
        dto && typeof dto === 'object' &&
        'id_route' in dto &&
        'route_name' in dto &&
        'description' in dto &&
        'route_status' in dto &&
        'id_vendor' in dto &&
        'route_day_by_day' in dto
    );
}

export function isRouteDayDTO(dto: any): dto is RouteDayDTO {
    return (
        dto && typeof dto === 'object' &&
        'id_route_day' in dto &&
        'id_route' in dto &&
        'id_day' in dto &&
        'stores' in dto
    )
}

export function isRouteTransactionDescriptionDTO(dto: any): dto is RouteTransactionDescriptionDTO {
    return (
        dto && typeof dto === 'object' &&
        'id_route_transaction_description' in dto &&
        'price_at_moment' in dto &&
        'amount' in dto &&
        'created_at' in dto &&
        'id_transaction_operation_type' in dto &&
        'id_product' in dto &&
        'id_route_transaction' in dto &&
        'id_product_inventory' in dto
    );
}

export function isRouteTransactionDTO(dto: any): dto is RouteTransactionDTO {
    return (
        dto && typeof dto === 'object' &&
        'id_route_transaction' in dto &&
        'date' in dto &&
        'state' in dto &&
        'cash_received' in dto &&
        'id_work_day' in dto &&
        'id_store' in dto &&
        'payment_method' in dto &&
        'transaction_description' in dto
    );
}

export function isInventoryOperationDescriptionDTO(dto: any): dto is InventoryOperationDescriptionDTO {
    return (
        dto && typeof dto === 'object' &&
        'id_product_operation_description' in dto &&
        'price_at_moment' in dto &&
        'amount' in dto &&
        'id_inventory_operation' in dto &&
        'id_product' in dto
    );
}

export function isProductInventoryDTO(dto: any): dto is ProductInventoryDTO {
    return (
        dto && typeof dto === 'object' &&
        'id_product_inventory' in dto &&
        'price_at_moment' in dto &&
        'stock' in dto &&
        'id_product' in dto
    );
}

export function isDayOperationDTO(dto: any): dto is DayOperationDTO {
    return (
        dto && typeof dto === 'object' &&
        'id_day_operation' in dto &&
        'id_item' in dto &&
        'operation_type' in dto &&
        'created_at' in dto
    );
}

export function isStoreDTO(dto: any): dto is StoreDTO {
    return (
        dto && typeof dto === 'object' &&
        'id_store' in dto &&
        'street' in dto &&
        'ext_number' in dto &&
        'colony' in dto &&
        'postal_code' in dto &&
        'address_reference' in dto &&
        'store_name' in dto &&
        'latitude' in dto &&
        'longitude' in dto &&
        'creation_date' in dto &&
        'status_store' in dto &&
        'is_new' in dto
    );
}