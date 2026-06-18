// Libraries
import { inject, injectable } from 'tsyringe';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

// Interfaces
import { ServerUserRepository } from '@/src/core/interfaces/ServerUserRepository';
import { LocalUserRepository } from '@/src/core/interfaces/LocalUserRepository';

// Tokens
import { TOKENS } from '../di/tokens';

// DTOs
import UserDTO from '@/src/application/dto/UserDTO';

// Entities
import { User } from '@/src/core/entities/User';

// Infrastructure
import { BackendDataSource } from '../datasources/BackendDatasource';

const USER_SESSION_KEY = 'twister_user_session';
const EIGHT_HOURS_IN_MS = 8 * 60 * 60 * 1000;

@injectable()
export default class AuthenticationService {
    constructor(
        @inject(TOKENS.BackendDataSource) private readonly dataSource: BackendDataSource,
        @inject(TOKENS.ServerAuthenticationRepository) private readonly serverAuthrepository: ServerUserRepository,
        @inject(TOKENS.LocalAuthenticationRepository) private readonly localAuthRepository: LocalUserRepository
    ) { }

    /*
        Prioritize online login over offline login
    */
    async loginUser(cellphone: string, password: string): Promise<UserDTO | null> {
        // Online login
        const access_token: string|null = await this.serverAuthrepository.login(cellphone, password);
        if(access_token === null) { // Try offline login
            const localUsers = await this.localAuthRepository.getUserByPhoneNumber(cellphone);
            const localUser = localUsers.at(0);

            // Offline login
            if (localUser) {
                if (!this.passwordMatches(localUser.password, password)) return null;
                await this.persistSession(localUser);
                return this.mapUserToDTO(localUser);
            } else {
                return null;
            }
        } else { // Online login was successfully.
            this.dataSource.setAuthToken(access_token);
            const users: User[] = await this.serverAuthrepository.getUserByPhoneNumber(cellphone);
            
            if (users.at(0) === undefined) return null;
            users.at(0)!.password = password;
            const serverUser: User = users.at(0)!;
            serverUser.token = access_token;

            // Persist user for offline login
            await this.localAuthRepository.insertUser({...serverUser, password: password});

            // Persist session
            await this.persistSession(serverUser); 
            return this.mapUserToDTO(serverUser);
        }
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
        if (!useSessionKey) return null;
        const session = await SecureStore.getItemAsync(useSessionKey);
        if (!session) return null;
        const parsedSession = JSON.parse(session);
        this.dataSource.setAuthToken(parsedSession.user.token);
        const expiresAt = new Date(parsedSession.expires_at);
        if (new Date() < expiresAt) {
            return this.mapUserToDTO(parsedSession.user as User);
        } else {
            await SecureStore.deleteItemAsync(useSessionKey);
            return null;
        }
    }

    

    async logoutUser(): Promise<void> {
        const useSessionKey = "twister_user_session";
        await SecureStore.deleteItemAsync(useSessionKey);
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
                    token: user.token,
                },
            };
            console.log("Session to persit: ", session)
            await SecureStore.setItemAsync(useSessionKey, JSON.stringify(session));
        } catch (error) {
            throw new Error('Error persisting user session: ' + error);
        }
    }
}
