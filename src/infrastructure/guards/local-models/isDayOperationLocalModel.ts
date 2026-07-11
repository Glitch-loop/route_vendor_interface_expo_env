import DayOperationLocalModel from '@/src/infrastructure/persitence/model/local-models/DayOperationLocalModel';

export function isDayOperationLocalModel(model: unknown): model is DayOperationLocalModel {
  if (model === null) return false;
  if (typeof model !== 'object') return false;
  return (
    'id_day_operation' in model && typeof model.id_day_operation === 'string' &&
    'id_item' in model && typeof model.id_item === 'string' &&
    'id_route_day' in model && typeof model.id_route_day === 'string' &&
    'operation_type' in model && typeof model.operation_type === 'string' &&
    'id_dependency' in model && (typeof model.id_dependency === 'string' || model.id_dependency === undefined) &&
    'latitude' in model && (typeof model.latitude === 'string' || model.latitude === undefined) &&
    'longitude' in model && (typeof model.longitude === 'string' || model.latitude === undefined)
  );
}
