// Libraries
import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../di/tokens';
import { ServerUserRepository } from '@/src/core/interfaces/ServerUserRepository';
import { LocalUserRepository } from '@/src/core/interfaces/LocalUserRepository';
import UserDTO from '@/src/application/dto/UserDTO';
import { User } from '@/src/core/entities/User';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const USER_SESSION_KEY = 'twister_user_session';
const EIGHT_HOURS_IN_MS = 8 * 60 * 60 * 1000;

@injectable()
export default class AuthenticationService {
    constructor(
        @inject(TOKENS.ServerAuthenticationRepository) private readonly serverAuthrepository: ServerUserRepository,
        @inject(TOKENS.LocalAuthenticationRepository) private readonly localAuthRepository: LocalUserRepository
    ) { }

    async loginUser(cellphone: string, password: string): Promise<UserDTO | null> {
        const localUsers = await this.localAuthRepository.getUserByPhoneNumber(cellphone);
        const localUser = localUsers.at(0);

        if (localUser) {
            if (!this.passwordMatches(localUser.password, password)) return null;
            await this.persistSession(localUser);
            return this.mapUserToDTO(localUser);
        }

        const serverUsers = await this.serverAuthrepository.getUserByPhoneNumber(cellphone);
        const serverUser = serverUsers.at(0);

        if (!serverUser) return null;
        if (!this.passwordMatches(serverUser.password, password)) return null;

        await this.localAuthRepository.insertUser(serverUser);
        await this.persistSession(serverUser);
        return this.mapUserToDTO(serverUser);
    }

    private passwordMatches(storedPassword: string | null, providedPassword: string): boolean {
        return (storedPassword ?? '') === providedPassword;
    }

    private mapUserToDTO(user: User): UserDTO {
        return {
            id_vendor: user.id_vendor,
            cellphone: user.cellphone,
            name: user.name,
            password: user.password,
            status: user.status,
        };
    }

    private async persistSession(user: User): Promise<void> {
        try {
            const session = {
                token: Crypto.randomUUID(),
                expires_at: new Date(Date.now() + EIGHT_HOURS_IN_MS).toISOString(),
                user: {
                    id_vendor: user.id_vendor,
                    cellphone: user.cellphone,
                    name: user.name,
                    status: user.status,
                },
            };

            await SecureStore.setItemAsync(USER_SESSION_KEY, JSON.stringify(session));
        } catch (error) {
            console.log('Error persisting user session: ', error);
        }
    }
}
