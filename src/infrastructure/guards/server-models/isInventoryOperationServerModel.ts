import InventoryOperationServerModel from '@/src/infrastructure/persitence/model/server-models/InventoryOperationServerModel';
import { isInventoryOperationDescriptionServerModel } from './isInventoryOperationDescriptionServerModel';

export function isInventoryOperationServerModel(model: unknown): model is InventoryOperationServerModel {
    return (
        typeof model === 'object' &&
        model !== null &&
        'id_inventory_operation' in model && typeof model.id_inventory_operation === 'string' &&
        'date' in model && typeof model.date === 'string' &&
        'state' in model && typeof model.state === 'number' &&
        'id_inventory_operation_type' in model && typeof model.id_inventory_operation_type === 'string' &&
        'id_work_day' in model && typeof model.id_work_day === 'string' &&
        'id_user' in model && typeof model.id_user === 'string' &&
        'inventory_operation_descriptions' in model && Array.isArray(model.inventory_operation_descriptions) && model.inventory_operation_descriptions.every(isInventoryOperationDescriptionServerModel)
    );
}
