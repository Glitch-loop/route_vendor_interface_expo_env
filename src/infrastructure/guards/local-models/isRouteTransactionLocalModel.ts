import RouteTransactionLocalModel from '@/src/infrastructure/persitence/model/local-models/RouteTransactionLocalModel';
import { isRouteTransactionDescriptionLocalModel } from './isRouteTransactionDescriptionLocalModel';

export function isRouteTransactionLocalModel(model: unknown): model is RouteTransactionLocalModel {
  if (model === null) return false
  if (typeof model !== 'object') return false

  return (
      typeof model === 'object' &&
      model !== null &&
      'id_route_transaction' in model && typeof model.id_route_transaction === 'string' &&
      'date' in model && typeof model.date === 'string' &&
      'state' in model && typeof model.state === 'number' &&
      'cash_received' in model && typeof model.cash_received === 'number' &&
      'latitude' in model && typeof model.latitude === 'string' &&
      'longitude' in model && typeof model.longitude === 'string' &&
      'id_work_day' in model && typeof model.id_work_day === 'string' &&
      'created_by' in model && typeof model.created_by === 'string' &&
      'id_payment_method' in model && typeof model.id_payment_method === 'string' &&
      'id_store' in model && typeof model.id_store === 'string' &&
      'transaction_descriptions' in model && Array.isArray(model.transaction_descriptions) && model.transaction_descriptions.every(isRouteTransactionDescriptionLocalModel)
  );
}
