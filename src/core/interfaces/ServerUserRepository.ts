import { User } from '@/src/core/entities/User';

export abstract class ServerUserRepository {
    abstract getUserByPhoneNumber(cellphone: string): Promise<User[]>;
}