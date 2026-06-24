import InventoryOperationServerModel from '@/src/infrastructure/persitence/model/server-models/InventoryOperationServerModel';

export function isInventoryOperationServerModel(model: unknown): model is InventoryOperationServerModel {
    return (
        typeof model === 'object' &&
        model !== null &&
        'id_inventory_origin' in model && typeof model.id_inventory_origin === 'string' &&
        'id_inventory_target' in model && typeof model.id_inventory_target === 'string' &&
        'created_by' in model && typeof model.created_by === 'string' &&
        'id_inventory_operation' in model && typeof model.id_inventory_operation === 'string' &&
        'latitude' in model && typeof model.latitude === 'string' &&
        'longitude' in model && typeof model.longitude === 'string'
    );
}
