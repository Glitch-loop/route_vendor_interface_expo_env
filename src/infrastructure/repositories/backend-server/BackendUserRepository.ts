// Libraries
import { injectable, inject } from 'tsyringe';

// Interfaces & entities
import { ServerUserRepository } from '@/src/core/interfaces/ServerUserRepository';
import { User } from '@/src/core/entities/User';

// Infrastructure
import { BackendDataSource } from '@/src/infrastructure/datasources/BackendDatasource';

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';

interface LoginRequestInterface {
	cellphone: string;
	password: string;
}

interface UserInterface {
	id_user: string;
	cellphone: string;
	name: string;
	status: number;
	salary: number;
	created_at: string;
	updated_at: string;
	assigned_roles: any[];
	address: string;
	rfc: string;
	imss: string;
}

@injectable()
export class BackendUserRepository implements ServerUserRepository {
	constructor(@inject(TOKENS.BackendDataSource) private readonly dataSource: BackendDataSource) {}

	async getUserByPhoneNumber(cellphone: string): Promise<User[]> {
		try {
			/*
        Note (06-25-26)
        Endpoint doesn't provide a way to retrieve all the routes.
        There is not an "next_item" field for knowing if there is more information
        for retrieving.
      */
			const response = await this.dataSource.get<UserInterface[]>(
				'/users'
			);

			const users: User[] = [];
			for (const record of response.data || []) {
				users.push({
					id_vendor: record.id_user,
					cellphone: record.cellphone ?? null,
					name: record.name ?? '',
					password: null,
					status: record.status ?? null,
				});
			}

			return users.filter((user) => user.cellphone === cellphone); // TODO: Implement query params for filtering at backend.
		} catch (error: any) {
			throw new Error(`Failed to retrieve user by cellphone: ${error}`);
		}
	}

	async login(cellphone: string, password: string): Promise<string|null> {
		const body: LoginRequestInterface = {
			cellphone: cellphone,
			password: password
		}

		try {
			const access_token = await this.dataSource.post<string|undefined>(
				'/security/login',
				body
			);
			// console.log("access_token: ", access_token)
			return access_token ? access_token : null;

		} catch (error) {
			return null;
		}
	}
}