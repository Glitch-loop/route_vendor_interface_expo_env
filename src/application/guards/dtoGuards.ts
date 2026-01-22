import RouteDTO from '@/src/application/dto/RouteDTO';
import RouteDayDTO from '@/src/application/dto/RouteDayDTO';
import RouteDayStoreDTO from '@/src/application/dto/RouteDayStoreDTO';
import ProductDTO from '@/src/application/dto/ProductDTO';
import InventoryOperationDTO from '@/src/application/dto/InventoryOperationDTO';
import InventoryOperationDescriptionDTO from '@/src/application/dto/InventoryOperationDescriptionDTO';
import WorkDayInformationDTO  from '@/src/application/dto/WorkdayInformationDTO';
import RouteTransactionDTO from '@/src/application/dto/RouteTransactionDTO';
import RouteTransactionDescriptionDTO from '@/src/application/dto/RouteTransactionDescriptionDTO';
import ProductInventoryDTO from '@/src/application/dto/ProductInventoryDTO';

export function isProductDTO(dto: any): dto is ProductDTO {
    return (
        dto && typeof dto === 'object' &&
        'id_product' in dto && 'product_name' in dto && 'price' in dto
    );
}

export function isInventoryOperationDTO(dto: any): dto is InventoryOperationDTO {
    return (
        dto && typeof dto === 'object' &&
        'id_inventory_operation' in dto && 'id_inventory_operation_type' in dto && 'inventoryOperationDescriptions' in dto
    );
}

export function isWorkDayDTO(dto: any): dto is WorkDayInformationDTO {
    return (
        dto && typeof dto === 'object' &&
        'id_work_day' in dto && 'start_date' in dto && 'id_route_day' in dto
    );
}

export function isRouteDTO(dto: any): dto is RouteDTO {
    return (
        dto && typeof dto === 'object' &&
        'id_route' in dto && 'route_day_by_day' in dto
    );
}

export function isRouteDayDTO(dto: any): dto is RouteDayDTO {
    return (
        dto && typeof dto === 'object' &&
        'id_route_day' in dto && 'stores' in dto
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
        'id_route_transaction' in dto
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