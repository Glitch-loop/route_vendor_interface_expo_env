import DayOperationLocalModel from '@/src/infrastructure/persitence/model/local-models/DayOperationLocalModel';

export function isDayOperationLocalModel(model: unknown): model is DayOperationLocalModel {
    return (
        typeof model === 'object' &&
        model !== null &&
        'id_day_operation' in model && typeof model.id_day_operation === 'string' &&
        'id_item' in model && typeof model.id_item === 'string' &&
        'operation_type' in model && typeof model.operation_type === 'string' &&
        'id_dependency' in model && typeof model.id_dependency === 'string' &&
        'latitude' in model && typeof model.latitude === 'string' &&
        'longitude' in model && typeof model.longitude === 'string'
    );
}
