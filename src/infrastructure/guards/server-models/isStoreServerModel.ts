import StoreServerModel from '@/src/infrastructure/persitence/model/server-models/StoreServerModel';

export function isStoreServerModel(model: unknown): model is StoreServerModel {
    return (
        typeof model === 'object' &&
        model !== null &&
        'id_location' in model && typeof model.id_location === 'string' &&
        'street' in model && typeof model.street === 'string' &&
        'ext_number' in model && (typeof model.ext_number === 'string' || model.ext_number === null) &&
        'colony' in model && typeof model.colony === 'string' &&
        'postal_code' in model && typeof model.postal_code === 'string' &&
        'location_name' in model && (typeof model.location_name === 'string' || model.location_name === null) &&
        'latitude' in model && typeof model.latitude === 'string' &&
        'longitude' in model && typeof model.longitude === 'string' &&
        'id_creator' in model && typeof model.id_creator === 'string' &&
        'id_client' in model && typeof model.id_client === 'string' &&
        'id_location_type' in model && typeof model.id_location_type === 'string' &&
        'address_reference' in model && (typeof model.address_reference === 'string' || model.address_reference === null)
    );
}
