// Libraries
import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../di/tokens';
import { ServerUserRepository } from '@/src/core/interfaces/ServerUserRepository';
import { LocalUserRepository } from '@/src/core/interfaces/LocalUserRepository';
import UserDTO from '@/src/application/dto/UserDTO';
import { User } from '@/src/core/entities/User';

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
            return this.passwordMatches(localUser.password, password)
                ? this.mapUserToDTO(localUser)
                : null;
        }

        const serverUsers = await this.serverAuthrepository.getUserByPhoneNumber(cellphone);
        const serverUser = serverUsers.at(0);

        if (!serverUser) return null;
        if (!this.passwordMatches(serverUser.password, password)) return null;

        await this.localAuthRepository.insertUser(serverUser);
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
}
