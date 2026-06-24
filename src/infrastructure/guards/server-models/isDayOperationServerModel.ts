import DayOperationServerModel from '@/src/infrastructure/persitence/model/server-models/DayOperationServerModel';

export function isDayOperationServerModel(model: unknown): model is DayOperationServerModel {
    return (
        typeof model === 'object' &&
        model !== null &&
        'id_operation_type' in model && typeof model.id_operation_type === 'string' &&
        'latitude' in model && typeof model.latitude === 'string' &&
        'longitude' in model && typeof model.longitude === 'string' &&
        'id_location' in model && typeof model.id_location === 'string' &&
        'id_route_transaction' in model && typeof model.id_route_transaction === 'string' &&
        'id_inventory_operation' in model && typeof model.id_inventory_operation === 'string' &&
        'id_route_day' in model && typeof model.id_route_day === 'string' &&
        'id_day_operation_dependent' in model && typeof model.id_day_operation_dependent === 'string' &&
        'id_work_day_operation' in model && typeof model.id_work_day_operation === 'string'
    );
}
