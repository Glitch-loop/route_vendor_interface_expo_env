import { User } from "../entities/User";

export abstract class LocalUserRepository {
    abstract insertUser(user: User): Promise<void>;
    abstract deleteUser(user: User): Promise<void>;
    abstract getUserByPhoneNumber(cellphone: string): Promise<User[]>;
}