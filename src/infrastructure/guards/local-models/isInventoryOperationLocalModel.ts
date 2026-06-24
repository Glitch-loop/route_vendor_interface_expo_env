import InventoryOperationLocalModel from '@/src/infrastructure/persitence/model/local-models/InventoryOperationLocalModel';

export function isInventoryOperationLocalModel(model: unknown): model is InventoryOperationLocalModel {
    return (
        typeof model === 'object' &&
        model !== null &&
        'id_inventory_operation' in model && typeof model.id_inventory_operation === 'string' &&
        'sign_confirmation' in model && typeof model.sign_confirmation === 'string' &&
        'state' in model && typeof model.state === 'number' &&
        'audit' in model && typeof model.audit === 'number' &&
        'id_inventory_operation_type' in model && typeof model.id_inventory_operation_type === 'string' &&
        'id_work_day' in model && typeof model.id_work_day === 'string'
    );
}
