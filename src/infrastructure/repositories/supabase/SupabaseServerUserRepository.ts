// Libraries
import { injectable, inject } from 'tsyringe';

// Interfaces & entities
import { ServerUserRepository } from '@/src/core/interfaces/ServerUserRepository';
import { User } from '@/src/core/entities/User';

// Infrastructure
import { SupabaseDataSource } from '@/src/infrastructure/datasources/SupabaseDataSource';

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';
import { SERVER_DATABASE_ENUM } from '@/src/infrastructure/persitence/enums/serverTablesEnum';

@injectable()
export class SupabaseServerUserRepository implements ServerUserRepository {
	constructor(@inject(TOKENS.SupabaseDataSource) private readonly dataSource: SupabaseDataSource) {}

	private get supabase() {
		return this.dataSource.getClient();
	}

	async getUserByPhoneNumber(cellphone: string): Promise<User[]> {
		try {
			const { data, error } = await this.supabase
				.from(SERVER_DATABASE_ENUM.VENDORS)
				.select('*')
				.eq('cellphone', cellphone);

			if (error) throw new Error(`Error retrieving user: ${error.message}`);

			const users: User[] = [];
			for (const record of data || []) {
				users.push({
					id_vendor: record.id_vendor,
					cellphone: record.cellphone ?? null,
					name: record.name ?? '',
					password: record.password ?? null,
					status: record.status ?? null,
				});
			}

			return users;
		} catch (error: any) {
			throw new Error(`Failed to retrieve user by cellphone: ${error.message}`);
		}
	}
}