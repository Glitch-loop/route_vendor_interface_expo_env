// src/application/mappers/mapperDTO.ts
import { Route } from '@/src/core/entities/Route';
import { RouteTransaction } from '@/src/core/entities/RouteTransaction';
import { Store } from '@/src/core/entities/Store';
import { Product } from '@/src/core/entities/Product';
import { WorkDayInformation } from '@/src/core/entities/WorkDayInformation';
import { InventoryOperation } from '@/src/core/entities/InventoryOperation';
import { ProductInventory } from '@/src/core/entities/ProductInventory';
import { DayOperation } from '@/src/core/entities/DayOperation';
import { RouteTransactionDescription } from '@/src/core/object-values/RouteTransactionDescription';
import { PaymentMethod } from '@/src/core/object-values/PaymentMethod';
import { PAYMENT_METHODS } from '@/src/core/enums/PaymentMethod';

// DTOs
import RouteDTO from '@/src/application/dto/RouteDTO';
import RouteDayDTO from '@/src/application/dto/RouteDayDTO';
import RouteDayStoreDTO from '@/src/application/dto/RouteDayStoreDTO';
import ProductDTO from '@/src/application/dto/ProductDTO';
import StoreDTO from '@/src/application/dto/StoreDTO';
import InventoryOperationDTO from '@/src/application/dto/InventoryOperationDTO';
import ProductInventoryDTO from '@/src/application/dto/ProductInventoryDTO';
import InventoryOperationDescriptionDTO from '@/src/application/dto/InventoryOperationDescriptionDTO';
import WorkDayInformationDTO  from '@/src/application/dto/WorkdayInformationDTO';
import DayOperationDTO from '@/src/application/dto/DayOperationDTO';
import RouteTransactionDTO from '@/src/application/dto/RouteTransactionDTO';
import RouteTransactionDescriptionDTO from '@/src/application/dto/RouteTransactionDescriptionDTO';
import { InventoryOperationDescription } from '@/src/core/object-values/InventoryOperationDescription';
import { RouteDay } from '@/src/core/object-values/RouteDay';
import { RouteDayStore } from '@/src/core/object-values/RouteDayStore';

// dto guards
import { 
    isProductDTO,
    isStoreDTO,
    isInventoryOperationDTO,
    isInventoryOperationDescriptionDTO,
    isWorkDayDTO,
    isRouteDTO,
    isRouteDayDTO,
    isRouteTransactionDescriptionDTO,
    isRouteTransactionDTO
 } from '@/src/application/guards/dtoGuards';

// entity guard
import {
    isRoute,
    isProduct,
    isInventoryOperation,
    isTransaction,
    isStore,
    isProductInventory,
    isWorkDay,
    isDayOperation,
    isTransactionDescription
} from '@/src/application/guards/entityGuards';
import { ROUTE_TRANSACTION_STATE } from '@/src/core/enums/RouteTransactionState';

export class MapperDTO {
  
    constructor() {}

  // Method overloads for type safety
    toDTO(entity: Route): RouteDTO;
    toDTO(entity: Product): ProductDTO;
    toDTO(entity: Store): StoreDTO;
    toDTO(entity: InventoryOperation): InventoryOperationDTO;
    toDTO(entity: ProductInventory): ProductInventoryDTO;
    toDTO(entity: WorkDayInformation): WorkDayInformationDTO;
    toDTO(entity: DayOperation): DayOperationDTO;
    toDTO(entity: RouteTransaction): RouteTransactionDTO;
    toDTO(entity: RouteTransactionDescription): RouteTransactionDescriptionDTO;
        toDTO(entity: Route | Product | Store | InventoryOperation | ProductInventory | WorkDayInformation | DayOperation | RouteTransaction | RouteTransactionDescription): any {
        // Route
        if (isRoute(entity)) {
            return this.routeToDTO(entity);
        }
        
        // Product
        if (isProduct(entity)) {
          return this.productToDTO(entity);
        }

        // Store
        if (isStore(entity)) {
            return this.storeToDTO(entity);
        }

        // InventoryOperation
        if (isInventoryOperation(entity)) {
          return this.inventoryOperationToDTO(entity);
        }

        // ProductInventory
        if (isProductInventory(entity)) {
            return this.productInventoryToDTO(entity as ProductInventory);
        }

        // WorkDayInformation
        if (isWorkDay(entity)) {
            return this.workDayToDTO(entity);
        }

        // DayOperation
        if (isDayOperation(entity)) {
            return this.dayOperationToDTO(entity as DayOperation);
        }

        // RouteTransaction
        if (isTransaction(entity)) {
            return this.routeTransactionToDTO(entity as RouteTransaction);
        }

        // RouteTransactionDescription
        if (isTransactionDescription(entity)) {
            return this.routeTransactionDescriptionToDTO(entity as RouteTransactionDescription);
        }       
        
        throw new Error('Unknown entity type');
  }

    toEntity(dto: ProductDTO): Product;
    toEntity(dto: StoreDTO): Store;
    toEntity(dto: InventoryOperationDTO): InventoryOperation;
    toEntity(dto: InventoryOperationDescriptionDTO): InventoryOperationDescription;
    toEntity(dto: WorkDayInformationDTO): WorkDayInformation;
    toEntity(dto: RouteDTO): Route;
    toEntity(dto: RouteDayDTO): RouteDay;
    toEntity(dto: RouteTransactionDTO): RouteTransaction;
    toEntity(dto: RouteTransactionDescriptionDTO): RouteTransactionDescription;
    toEntity(dto: ProductDTO | StoreDTO | InventoryOperationDTO | InventoryOperationDescriptionDTO | WorkDayInformationDTO | RouteDTO | RouteDayDTO | DayOperationDTO | RouteTransactionDTO | RouteTransactionDescriptionDTO): Product | Store | InventoryOperation | InventoryOperationDescription | WorkDayInformation | Route | RouteDay | DayOperation | RouteTransaction | RouteTransactionDescription {
        if (isProductDTO(dto)) return this.productDTOToEntity(dto);
        if (isStoreDTO(dto)) return this.storeDTOToEntity(dto);
        if (isInventoryOperationDTO(dto)) return this.inventoryOperationDTOToEntity(dto);
        if (isInventoryOperationDescriptionDTO(dto)) return this.inventoryProductDescriptionDTOToEntity(dto);
        if (isWorkDayDTO(dto)) return this.workDayDTOToEntity(dto);
        if (isRouteDTO(dto)) return this.routeDTOToEntity(dto);
        if (isRouteDayDTO(dto)) return this.routeDayDTOToEntity(dto);
        if (isRouteTransactionDTO(dto)) return this.routeTransactionDTOToEntity(dto);
        if (isRouteTransactionDescriptionDTO(dto)) return this.routeTransactionDescriptionDTOToEntity(dto);
        
        throw new Error('Unknown DTO type');
    }

    // ==================== MAPPER METHODS ENTITY to DTO ====================

    private routeToDTO(entity: Route): RouteDTO {
    const routeDayMap = new Map<string, RouteDayDTO>(); // <id_day, RouteDayDTO>

    const { route_day } = entity;

    // Organizing route days and their stores by day id
    for (const routeDay of route_day) {
        const routeDayStoreDTOs: RouteDayStoreDTO[] = [];
        const { stores } = routeDay;

        for (const store of stores) {
            const storeDTO: RouteDayStoreDTO = {
                id_route_day_store: store.id_route_day_store,
                position_in_route: store.position_in_route,
                id_route_day: store.id_route_day,
                id_store: store.id_store
            };
            routeDayStoreDTOs.push(storeDTO);
        }

        routeDayMap.set(
            routeDay.id_day, 
            {
                id_route_day: routeDay.id_route_day,
                id_route: routeDay.id_route,
                id_day: routeDay.id_day,
                stores: routeDayStoreDTOs
            }
        )
    }

    const routeDTO: RouteDTO = {
        id_route: entity.id_route,
        route_name:  entity.route_name,
        description: entity.description,
        route_status: entity.route_status,
        id_vendor: entity.id_vendor,
        route_day_by_day: routeDayMap
    }


    return routeDTO;
    }

    private productToDTO(entity: Product): ProductDTO {
        return {
            id_product: entity.id_product,
            product_name: entity.product_name,
            barcode: entity.barcode || '',
            weight: entity.weight || '',
            unit: entity.unit || '',
            comission: entity.comission,
            price: entity.price,
            product_status: entity.product_status,
            order_to_show: entity.order_to_show,
        };
    }

    private storeToDTO(entity: Store): StoreDTO {
        return {
            id_store: entity.id_store,
            street: entity.street,
            ext_number: entity.ext_number,
            colony: entity.colony,
            postal_code: entity.postal_code,
            address_reference: entity.address_reference,
            store_name: entity.store_name,
            latitude: entity.latitude,
            longitude: entity.longitude,
            creation_date: entity.creation_date,
            status_store: entity.status_store,
            is_new: entity.is_new
        };
    }

    private inventoryOperationToDTO(entity: InventoryOperation): InventoryOperationDTO {
        return {
            id_inventory_operation: entity.id_inventory_operation,
            sign_confirmation: entity.sign_confirmation,
            date: entity.date.toISOString(),
            state: entity.state,
            audit: entity.audit,
            id_inventory_operation_type: entity.id_inventory_operation_type,
            id_work_day: entity.id_work_day,
            inventory_operation_descriptions: entity.inventory_operation_descriptions.map((desc) => this.inventoryProductDescriptionToDTO(desc)),
        };
    }

    private productInventoryToDTO(entity: ProductInventory): ProductInventoryDTO {
        return {
            id_product_inventory: (entity as any)['id_product_inventory'],
            price_at_moment: entity.get_price_of_product(),
            stock: entity.get_stock_of_product(),
            id_product: (entity as any)['id_product'],
        };
    }

    private workDayToDTO(entity: WorkDayInformation): WorkDayInformationDTO {
        return {
            id_work_day: entity.id_work_day,
            start_date: entity.start_date.toISOString(),
            finish_date: entity.finish_date ? entity.finish_date.toISOString() : null,
            start_petty_cash: entity.start_petty_cash,
            final_petty_cash: entity.final_petty_cash,
            id_route: entity.id_route,
            route_name: entity.route_name,
            description: entity.description,
            route_status: entity.route_status,
            id_day: entity.id_day,
            id_route_day: entity.id_route_day,
        };
    }

    private dayOperationToDTO(entity: DayOperation): DayOperationDTO {
        return {
            id_day_operation: entity.id_day_operation,
            id_item: entity.id_item,
            operation_type: entity.operation_type,
            created_at: entity.created_at.toISOString(),
        };
    }

    private routeTransactionToDTO(entity: RouteTransaction): RouteTransactionDTO {
        return {
            id_route_transaction: entity.id_route_transaction,
            date: entity.date.toISOString(),
            state: entity.state as any,
            cash_received: entity.cash_received,
            id_work_day: entity.id_work_day,
            id_store: entity.id_store,
            payment_method: entity.payment_method,
            transaction_description: (entity.transaction_description || []).map(d => this.routeTransactionDescriptionToDTO(d)),
        };
    }

    // InventoryOperationDescription (domain) -> InventoryOperationDescriptionDTO (UI)
    private inventoryProductDescriptionToDTO(desc: InventoryOperationDescription): InventoryOperationDescriptionDTO {
        return {
            id_product_operation_description: desc.id_inventory_operation_description,
            price_at_moment: desc.price_at_moment,
            amount: desc.amount,
            id_inventory_operation: desc.id_inventory_operation,
            id_product: desc.id_product,
        };
    }

    private routeTransactionDescriptionToDTO(desc: RouteTransactionDescription): RouteTransactionDescriptionDTO {
        return {
            id_route_transaction_description: desc.id_route_transaction_description,
            price_at_moment: desc.price_at_moment,
            amount: desc.amount,
            created_at: desc.created_at,
            id_transaction_operation_type: desc.id_transaction_operation_type,
            id_product: desc.id_product,
            id_route_transaction: desc.id_route_transaction,
            id_product_inventory: desc.id_product_inventory,
        };
    }

 
    // ==================== MAPPER METHODS DTO to ENTITY ====================

    // ProductDTO -> Product (domain)
    private productDTOToEntity(dto: ProductDTO): Product {
        return new Product(
            dto.id_product,
            dto.product_name,
            dto.barcode ?? null,
            dto.weight ?? null,
            dto.unit ?? null,
            dto.comission,
            dto.price,
            dto.product_status,
            dto.order_to_show
        );
    }

    // StoreDTO -> Store (domain)
    private storeDTOToEntity(dto: StoreDTO): Store {
        return new Store(
            dto.id_store,
            dto.street,
            dto.ext_number ?? null,
            dto.colony,
            dto.postal_code,
            dto.address_reference ?? null,
            dto.store_name ?? null,
            null,
            null,
            dto.latitude,
            dto.longitude,
            '',
            dto.creation_date,
            '',
            dto.status_store,
            dto.is_new ?? 0
        );
    }

    // InventoryOperationDescriptionDTO -> InventoryOperationDescription (domain)
    private inventoryProductDescriptionDTOToEntity(dto: InventoryOperationDescriptionDTO): InventoryOperationDescription {
        return new InventoryOperationDescription(
            dto.id_product_operation_description,
            dto.price_at_moment,
            dto.amount,
            new Date(),
            dto.id_inventory_operation,
            dto.id_product
        );
    }

    // InventoryOperationDTO -> InventoryOperation (domain)
    private inventoryOperationDTOToEntity(dto: InventoryOperationDTO): InventoryOperation {
        return new InventoryOperation(
            dto.id_inventory_operation,
            dto.sign_confirmation,
            new Date(dto.date),
            dto.state,
            dto.audit,
            dto.id_inventory_operation_type,
            dto.id_work_day,
            (dto.inventory_operation_descriptions || []).map(d => this.inventoryProductDescriptionDTOToEntity(d))
        );
    }

    // WorkDayInformationDTO -> WorkDayInformation (domain)
    private workDayDTOToEntity(dto: WorkDayInformationDTO): WorkDayInformation {
        const { start_date, finish_date } = dto;
        let start = new Date();
        let finish = null;

        if (typeof start_date === 'string') {
            if(isNaN(Date.parse(start_date))) {
                throw new Error('Invalid start_date format in WorkDayInformationDTO');
            }
            start = new Date(start_date);
        }


        if (finish_date !== null) {
            if(isNaN(Date.parse(finish_date))) {
                throw new Error('Invalid finish_date format in WorkDayInformationDTO');
            }
            finish = new Date(finish_date);
        }

        return new WorkDayInformation(
            dto.id_work_day,
            start,
            finish,
            dto.start_petty_cash,
            dto.final_petty_cash ?? null,
            dto.id_route,
            dto.route_name,
            dto.description,
            dto.route_status,
            dto.id_day,
            dto.id_route_day,
        );
    }

    // DayOperationDTO -> DayOperation (domain)
    private dayOperationDTOToEntity(dto: DayOperationDTO): DayOperation {
        const { created_at } = dto;
        if(isNaN(Date.parse(created_at))) {
            throw new Error('Invalid start_date format in WorkDayInformationDTO');
        }

        const createdAt: Date = new Date(dto.created_at);

        return new DayOperation(
            dto.id_day_operation,
            dto.id_item,
            dto.operation_type,
            createdAt
        );
    }

    // RouteTransactionDTO -> RouteTransaction (domain)
    private routeTransactionDTOToEntity(dto: RouteTransactionDTO): RouteTransaction {
        const { id_route_transaction, date, state, cash_received, id_work_day, id_store, payment_method, transaction_description } = dto;
        const dateObj = typeof date === 'string' ? new Date(date) : new Date(date as any);
        return new RouteTransaction(
            id_route_transaction,
            dateObj,
            state as ROUTE_TRANSACTION_STATE,
            cash_received,
            id_work_day,
            id_store,
            payment_method as PAYMENT_METHODS,
            (transaction_description || []).map(d => this.routeTransactionDescriptionDTOToEntity(d))
        );
    }

    // RouteTransactionDescriptionDTO -> RouteTransactionDescription (domain)
    private routeTransactionDescriptionDTOToEntity(dto: RouteTransactionDescriptionDTO): RouteTransactionDescription {
        const createdAt = dto.created_at instanceof Date ? dto.created_at : new Date(dto.created_at);
        return new RouteTransactionDescription(
            dto.id_route_transaction_description,
            dto.price_at_moment,
            dto.amount,
            createdAt,
            dto.id_product_inventory,
            dto.id_transaction_operation_type,
            dto.id_product,
            dto.id_route_transaction
        );
    }
    // RouteDTO -> Route (domain)
    private routeDTOToEntity(dto: RouteDTO): Route {
        const routeDays: RouteDay[] = [];
        const { route_day_by_day } = dto;
        if (route_day_by_day !== null) {
            route_day_by_day.forEach((rd) => {
                const stores: RouteDayStore[] = (rd.stores || []).map(s =>
                    new RouteDayStore(
                        s.id_route_day_store,
                        s.position_in_route,
                        s.id_route_day,
                        s.id_store
                    )
                );
                routeDays.push(
                    new RouteDay(
                        rd.id_route_day,
                        rd.id_route,
                        rd.id_day,
                        stores
                    )
                );
            });
        }
        return new Route(
            dto.id_route,
            dto.route_name,
            dto.description,
            dto.route_status,
            dto.id_vendor,
            routeDays
        );
    }

    // RouteDayDTO -> RouteDay (domain)
    private routeDayDTOToEntity(dto: RouteDayDTO): RouteDay {
        const stores: RouteDayStore[] = (dto.stores || []).map(s =>
            new RouteDayStore(
                s.id_route_day_store,
                s.position_in_route,
                s.id_route_day,
                s.id_store
            )
        );
        return new RouteDay(
            dto.id_route_day,
            dto.id_route,
            dto.id_day,
            stores
        );
    }

  // ==================== HELPER METHODS ====================

  private formatAddress(store: Store): string {
    return `${store.street} ${store.ext_number}, ${store.colony}`;
  }


    private mapPaymentMethodToDTO(id_payment_method: string): PaymentMethod {
        // Create a minimal PaymentMethod value object; label mapping can be centralized if needed
        const labelMap: { [key: string]: string } = {
            [PAYMENT_METHODS.CASH]: 'Efectivo',
            [PAYMENT_METHODS.TRANSFER]: 'Transferencia',
            [PAYMENT_METHODS.CREDIT_CARD]: 'Tarjeta de crédito',
            [PAYMENT_METHODS.DEBIT_CARD]: 'Tarjeta de débito',
        } as any;
        const name = labelMap[id_payment_method] ?? 'Desconocido';
        return new PaymentMethod(id_payment_method, name);
    }

}