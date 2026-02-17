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
        console.log('Attempting login for cellphone: ', await SecureStore.getItemAsync(USER_SESSION_KEY));
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

    async activeSession(): Promise<UserDTO | null> {
        const useSessionKey = 'twister_user_session';
        // console.log('TOKEN: ', process.env.EXPO_USER_SESSION_KEY)
        if (!useSessionKey) return null;
        
        const session = await SecureStore.getItemAsync(useSessionKey);
        if (!session) return null;
        
        const parsedSession = JSON.parse(session);
        const expiresAt = new Date(parsedSession.expires_at);
        if (new Date() < expiresAt) {
            return this.mapUserToDTO(parsedSession.user as User);
        } else {
            await SecureStore.deleteItemAsync(useSessionKey);
            return null;
        }
    }

    private async persistSession(user: User): Promise<void> {
        try {
            // const useSessionKey = process.env.EXPO_USER_SESSION_KEY;
            const useSessionKey = "twister_user_session";
            if (!useSessionKey) return;

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
            
            await SecureStore.setItemAsync(useSessionKey, JSON.stringify(session));
        } catch (error) {
            throw new Error('Error persisting user session: ' + error);
        }
    }
}
