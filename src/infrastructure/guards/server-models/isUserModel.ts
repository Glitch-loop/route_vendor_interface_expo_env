import UserModel from '@/src/infrastructure/persitence/model/server-models/UserModel';

export function isUserModel(model: unknown): model is UserModel {
    return (
        typeof model === 'object' &&
        model !== null &&
        'id_vendor' in model && typeof model.id_vendor === 'string' &&
        'cellphone' in model && typeof model.cellphone === 'string' &&
        'name' in model && typeof model.name === 'string' &&
        'password' in model && typeof model.password === 'string' &&
        'status' in model && typeof model.status === 'number'
    );
}
