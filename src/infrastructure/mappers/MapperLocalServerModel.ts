import { injectable } from 'tsyringe';

import DayOperationLocalModel from '@/src/infrastructure/persitence/model/local-models/DayOperationLocalModel';
import InventoryOperationDescriptionLocalModel from '@/src/infrastructure/persitence/model/local-models/InventoryOperationDescriptionLocalModel';
import InventoryOperationLocalModel from '@/src/infrastructure/persitence/model/local-models/InventoryOperationLocalModel';
import RouteTransactionDescriptionLocalModel from '@/src/infrastructure/persitence/model/local-models/RouteTransactionDescriptionLocalModel';
import RouteTransactionLocalModel from '@/src/infrastructure/persitence/model/local-models/RouteTransactionLocalModel';
import StoreLocalModel from '@/src/infrastructure/persitence/model/local-models/StoreLocalModel';
import WorkDayInformationLocalModel from '@/src/infrastructure/persitence/model/local-models/WorkdayInformationLocalModel';

import DayOperationServerModel from '@/src/infrastructure/persitence/model/server-models/DayOperationServerModel';
import InventoryOperationDescriptionServerModel from '@/src/infrastructure/persitence/model/server-models/InventoryOperationDescriptionServerModel';
import InventoryOperationServerModel from '@/src/infrastructure/persitence/model/server-models/InventoryOperationServerModel';
import RouteTransactionDescriptionServerModel from '@/src/infrastructure/persitence/model/server-models/RouteTransactionDescriptionServerModel';
import RouteTransactionServerModel from '@/src/infrastructure/persitence/model/server-models/RouteTransactionServerModel';
import StoreServerModel from '@/src/infrastructure/persitence/model/server-models/StoreServerModel';
import WorkDayInformationServerModel from '@/src/infrastructure/persitence/model/server-models/WorkdayInformationServerModel';

import { isDayOperationLocalModel } from '@/src/infrastructure/guards/local-models/isDayOperationLocalModel';
import { isInventoryOperationDescriptionLocalModel } from '@/src/infrastructure/guards/local-models/isInventoryOperationDescriptionLocalModel';
import { isInventoryOperationLocalModel } from '@/src/infrastructure/guards/local-models/isInventoryOperationLocalModel';
import { isRouteTransactionDescriptionLocalModel } from '@/src/infrastructure/guards/local-models/isRouteTransactionDescriptionLocalModel';
import { isRouteTransactionLocalModel } from '@/src/infrastructure/guards/local-models/isRouteTransactionLocalModel';
import { isStoreLocalModel } from '@/src/infrastructure/guards/local-models/isStoreLocalModel';
import { isWorkDayInformationLocalModel } from '@/src/infrastructure/guards/local-models/isWorkDayInformationLocalModel';

import { isDayOperationServerModel } from '@/src/infrastructure/guards/server-models/isDayOperationServerModel';
import { isInventoryOperationDescriptionServerModel } from '@/src/infrastructure/guards/server-models/isInventoryOperationDescriptionServerModel';
import { isInventoryOperationServerModel } from '@/src/infrastructure/guards/server-models/isInventoryOperationServerModel';
import { isRouteTransactionDescriptionServerModel } from '@/src/infrastructure/guards/server-models/isRouteTransactionDescriptionServerModel';
import { isRouteTransactionServerModel } from '@/src/infrastructure/guards/server-models/isRouteTransactionServerModel';
import { isStoreServerModel } from '@/src/infrastructure/guards/server-models/isStoreServerModel';
import { isWorkDayInformationServerModel } from '@/src/infrastructure/guards/server-models/isWorkDayInformationServerModel';
import PAYMENT_SCHEMAS from '@/src/core/enums/PaymentSchemaEnum';
import DAY_OPERATIONS from '@/src/core/enums/DayOperations';
import { useDebugValue } from 'react';

@injectable()
export class MapperLocalServerModel {
	constructor() {}

	toServerModel(model: DayOperationLocalModel): DayOperationServerModel;
	toServerModel(model: InventoryOperationDescriptionLocalModel): InventoryOperationDescriptionServerModel;
	toServerModel(model: InventoryOperationLocalModel): InventoryOperationServerModel;
	toServerModel(model: RouteTransactionDescriptionLocalModel): RouteTransactionDescriptionServerModel;
	toServerModel(model: RouteTransactionLocalModel): RouteTransactionServerModel;
	toServerModel(model: StoreLocalModel): StoreServerModel;
	toServerModel(model: WorkDayInformationLocalModel): WorkDayInformationServerModel;
	toServerModel(
		model:
			| DayOperationLocalModel
			| InventoryOperationDescriptionLocalModel
			| InventoryOperationLocalModel
			| RouteTransactionDescriptionLocalModel
			| RouteTransactionLocalModel
			| StoreLocalModel
			| WorkDayInformationLocalModel
	): any {
		if (isDayOperationLocalModel(model)) return this.dayOperationLocalToServer(model);
		if (isInventoryOperationDescriptionLocalModel(model)) return this.inventoryOperationDescriptionLocalToServer(model);
		if (isInventoryOperationLocalModel(model)) return this.inventoryOperationLocalToServer(model);
		if (isRouteTransactionDescriptionLocalModel(model)) return this.routeTransactionDescriptionLocalToServer(model);
		if (isRouteTransactionLocalModel(model)) return this.routeTransactionLocalToServer(model);
		if (isStoreLocalModel(model)) return this.storeLocalToServer(model);
		if (isWorkDayInformationLocalModel(model)) return this.workDayInformationLocalToServer(model);
    console.log("Model to convert: ", model)
		throw new Error('Unknown local model type at moment of transforming to server model.');
	}

	toLocalModel(model: DayOperationServerModel): DayOperationLocalModel;
	toLocalModel(model: InventoryOperationDescriptionServerModel): InventoryOperationDescriptionLocalModel;
	toLocalModel(model: InventoryOperationServerModel): InventoryOperationLocalModel;
	toLocalModel(model: RouteTransactionDescriptionServerModel): RouteTransactionDescriptionLocalModel;
	toLocalModel(model: RouteTransactionServerModel): RouteTransactionLocalModel;
	toLocalModel(model: StoreServerModel): StoreLocalModel;
	toLocalModel(model: WorkDayInformationServerModel): WorkDayInformationLocalModel;
	toLocalModel(
		model:
			| DayOperationServerModel
			| InventoryOperationDescriptionServerModel
			| InventoryOperationServerModel
			| RouteTransactionDescriptionServerModel
			| RouteTransactionServerModel
			| StoreServerModel
			| WorkDayInformationServerModel
	): any {
		if (isDayOperationServerModel(model)) return this.dayOperationServerToLocal(model);
		// if (isInventoryOperationDescriptionServerModel(model)) return this.inventoryOperationDescriptionServerToLocal(model);
		// if (isInventoryOperationServerModel(model)) return this.inventoryOperationServerToLocal(model);
		if (isRouteTransactionDescriptionServerModel(model)) return this.routeTransactionDescriptionServerToLocal(model);
		// if (isRouteTransactionServerModel(model)) return this.routeTransactionServerToLocal(model);
		if (isStoreServerModel(model)) return this.storeServerToLocal(model);
		if (isWorkDayInformationServerModel(model)) return this.workDayInformationServerToLocal(model);
    
		throw new Error('Unknown server model type at moment of transforming to local model.');
	}

  // ---------------------- Transformation from local model to server model. ----------------------
	private dayOperationLocalToServer(model: DayOperationLocalModel): DayOperationServerModel {
    const { operation_type, id_item } = model;
    let id_location:string|undefined = undefined;
    let id_route_transaction:string|undefined = undefined;
    let id_inventory_operation:string|undefined = undefined;
    
    
    if(operation_type === DAY_OPERATIONS.route_transaction 
    || operation_type === DAY_OPERATIONS.cancel_route_transaction
    ) {
      id_route_transaction = id_item;
    } else if (
       operation_type === DAY_OPERATIONS.cancel_inventory_operation
    || operation_type === DAY_OPERATIONS.restock_inventory
    || operation_type === DAY_OPERATIONS.start_shift_inventory
    || operation_type === DAY_OPERATIONS.end_shift_inventory
    || operation_type === DAY_OPERATIONS.product_devolution_inventory
    ) {
      id_inventory_operation = id_item;
    } else if(
      operation_type === DAY_OPERATIONS.prospect_registration
      || operation_type === DAY_OPERATIONS.new_client_registration
      || operation_type === DAY_OPERATIONS.attend_client_petition
      || operation_type === DAY_OPERATIONS.attention_out_of_route
      || operation_type === DAY_OPERATIONS.route_client_attention
      || operation_type === DAY_OPERATIONS.client_visited
    ) {
      id_location = id_item;
    }
    
		return {
      id_operation_type: model.operation_type,
      created_at: new Date(model.created_at),
      latitude: model.latitude,
      longitude: model.longitude,
      id_location: id_location,
      id_route_transaction: id_route_transaction,
      id_inventory_operation: id_inventory_operation,
      id_route_day: '',
      id_day_operation_dependent: model.id_dependency,
      id_work_day_operation: model.id_day_operation,
      is_synced: 0,
      updated_at: model.created_at,
      is_deleted: 0,
    };
	}

	private inventoryOperationDescriptionLocalToServer(model: InventoryOperationDescriptionLocalModel): InventoryOperationDescriptionServerModel {
		return {
			id_product_operation_description: model.id_inventory_operation_description,
			price_at_moment: model.price_at_moment,
			cost_at_moment: model.cost_at_moment,
			quantity: model.amount,
			id_inventory_operation: model.id_inventory_operation,
			id_product: model.id_product,
			created_at: model.created_at,
			is_synced: model.is_synced,
			updated_at: model.updated_at,
			is_deleted: model.is_deleted,
		};
	}

	private inventoryOperationLocalToServer(model: InventoryOperationLocalModel): InventoryOperationServerModel {
		return {
			id_inventory_operation: model.id_inventory_operation,
			date: model.date,
			id_inventory_operation_type: model.id_inventory_operation_type,
			id_work_day: model.id_work_day,
			id_user: '',
			inventory_operation_descriptions: model.inventory_operation_descriptions.map((desc) => this.inventoryOperationDescriptionLocalToServer(desc)),
			is_synced: model.is_synced,
			updated_at: model.updated_at,
			is_deleted: model.is_deleted,
		};
	}

	private routeTransactionDescriptionLocalToServer(model: RouteTransactionDescriptionLocalModel): RouteTransactionDescriptionServerModel {
		return {
			id_transaction_description: model.id_route_transaction_description,
			price_at_moment: model.price_at_moment,
			cost_at_moment: model.cost_at_moment,
			quantity: model.amount,
			created_at: model.created_at instanceof Date ? model.created_at : new Date(model.created_at),
			id_transaction_operation_type: model.id_transaction_operation_type,
			id_product: model.id_product,
			is_synced: model.is_synced,
			updated_at: model.updated_at,
			is_deleted: model.is_deleted,
		};
	}

	private routeTransactionLocalToServer(model: RouteTransactionLocalModel): RouteTransactionServerModel {
		return {
			id_transaction: model.id_route_transaction,
			// cfdi: '', // Note (06-24-26): At moment this field is not necessary.
			received_amount: model.cash_received,
			state: model.state,
			// id_invoice_concept: '', // Note (06-24-26): At moment this field is not necessary.
			created_at: model.date,
			latitude: model.latitude,
			longitude: model.longitude,
			id_location: model.id_store,
			// id_client: '', // Note (06-24-26): At moment this field is not necessary.
			id_work_day: model.id_work_day,
			id_payment_method: model.id_payment_method,
			id_payment_schema: PAYMENT_SCHEMAS.IMMEDIATE, // Note (06-24-26): At moment, it's the unique valid type of schema.
			transaction_descriptions: model.transaction_descriptions.map((desc) => this.routeTransactionDescriptionLocalToServer(desc)),
			is_synced: model.is_synced,
			updated_at: model.updated_at,
			is_deleted: model.is_deleted,
		};
	}

	private storeLocalToServer(model: StoreLocalModel): StoreServerModel {
		return {
			id_location: model.id_store,
			street: model.street,
			ext_number: model.ext_number,
			colony: model.colony,
			postal_code: model.postal_code,
			location_name: model.store_name,
			latitude: model.latitude,
			longitude: model.longitude,
			id_creator: model.id_creator,
			id_client: model.id_client,
			id_location_type: model.id_location_type,
			created_at: model.creation_date,
			updated_at: model.updated_at,
			address_reference: model.address_reference,
			is_synced: model.is_synced,
			is_deleted: model.is_deleted,
		};
	}

	private workDayInformationLocalToServer(model: WorkDayInformationLocalModel): WorkDayInformationServerModel {
		return {
			id_work_day: model.id_work_day,
			start_date: model.start_date,
			start_petty_cash: model.start_petty_cash,
			id_route_day: model.id_route_day,
			id_user: model.id_user,
			finish_date: model.finish_date,
			final_petty_cash: model.final_petty_cash,
			is_synced: model.is_synced,
			updated_at: model.updated_at,
			is_deleted: model.is_deleted,
		};
	}

  // ---------------------- Transformation from server model to local model. ----------------------

	private dayOperationServerToLocal(model: DayOperationServerModel): DayOperationLocalModel {
		return {
			id_day_operation: model.id_work_day_operation,
			id_item: model.id_location || model.id_route_transaction || model.id_inventory_operation || '',
			operation_type: model.id_operation_type,
			id_route_day: model.id_route_day,
			created_at: model.created_at instanceof Date ? model.created_at.toISOString() : model.created_at,
			id_dependency: model.id_day_operation_dependent,
			latitude: model.latitude,
			longitude: model.longitude,
			is_synced: model.is_synced,
			updated_at: model.updated_at,
			is_deleted: model.is_deleted,
		};
	}

	// private inventoryOperationDescriptionServerToLocal(model: InventoryOperationDescriptionServerModel): InventoryOperationDescriptionLocalModel {
	// 	return {
	// 		id_inventory_operation_description: model.id_inventory_operation_description,
	// 		price_at_moment: model.price_at_moment,
	// 		cost_at_moment: model.cost_at_moment,
	// 		amount: model.amount,
	// 		id_inventory_operation: model.id_inventory_operation,
	// 		id_product: model.id_product,
	// 		is_synced: model.is_synced,
	// 		updated_at: model.updated_at,
	// 		is_deleted: model.is_deleted,
	// 	};
	// }

	// private inventoryOperationServerToLocal(model: InventoryOperationServerModel): InventoryOperationLocalModel {
	// 	return {
	// 		id_inventory_operation: model.id_inventory_operation,
	// 		sign_confirmation: '',
	// 		date: model.created_at,
	// 		state: 0,
	// 		audit: 0,
	// 		id_inventory_operation_type: '',
	// 		id_work_day: '',
	// 		is_synced: model.is_synced,
	// 		updated_at: model.updated_at,
	// 		is_deleted: model.is_deleted,
	// 	};
	// }

	private routeTransactionDescriptionServerToLocal(model: RouteTransactionDescriptionServerModel): RouteTransactionDescriptionLocalModel {
		return {
			id_route_transaction_description: model.id_route_transaction_description,
			price_at_moment: model.price_at_moment,
			cost_at_moment: model.cost_at_moment,
			amount: model.quantity,
			created_at: model.created_at instanceof Date ? model.created_at : new Date(model.created_at),
			id_product_inventory: '',
			id_transaction_operation_type: model.id_transaction_operation_type,
			id_product: model.id_product,
			id_route_transaction: '',
			is_synced: model.is_synced,
			updated_at: model.updated_at,
			is_deleted: model.is_deleted,
		};
	}

	// private routeTransactionServerToLocal(model: RouteTransactionServerModel): RouteTransactionLocalModel {
	// 	return {
	// 		id_route_transaction: model.id_transaction,
	// 		date: model.created_at,
	// 		state: "ACTIVE",
	// 		cash_received: model.received_amount,
	// 		latitude: model.latitude,
	// 		longitude: model.longitude,
	// 		id_work_day: model.id_work_day,
	// 		id_payment_method: model.id_payment_method,
	// 		id_store: model.id_location,
	// 		transaction_descriptions: model.transaction_descriptions.map((desc) => this.routeTransactionDescriptionLocalToServer(desc)),
	// 		is_synced: model.is_synced,
	// 		updated_at: model.updated_at,
	// 		is_deleted: model.is_deleted,
	// 	};
	// }

	private storeServerToLocal(model: StoreServerModel): StoreLocalModel {
		return {
			id_store: model.id_location,
			street: model.street,
			ext_number: model.ext_number,
			colony: model.colony,
			postal_code: model.postal_code,
			address_reference: model.address_reference,
			store_name: model.location_name,
			owner_name: null,
			cellphone: null,
			latitude: model.latitude,
			longitude: model.longitude,
			id_creator: model.id_creator,
			id_client: model.id_client,
			id_location_type: model.id_location_type,
			creation_date: model.created_at,
			creation_context: '',
			status_store: 1,
			is_synced: model.is_synced,
			updated_at: model.updated_at,
			is_deleted: model.is_deleted,
		};
	}

	private workDayInformationServerToLocal(model: WorkDayInformationServerModel): WorkDayInformationLocalModel {
		return {
			id_work_day: model.id_work_day,
			start_date: model.start_date,
			finish_date: model.finish_date ?? '',
			start_petty_cash: model.start_petty_cash,
			final_petty_cash: model.final_petty_cash,
			id_route: '',
			route_name: '',
			description: null,
			route_status: '',
			id_day: '',
			id_user: model.id_user,
			id_route_day: model.id_route_day,
			is_synced: model.is_synced,
			updated_at: model.updated_at,
			is_deleted: model.is_deleted,
		};
	}
}
