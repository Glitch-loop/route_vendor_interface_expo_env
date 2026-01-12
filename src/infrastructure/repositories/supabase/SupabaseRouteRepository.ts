import { injectable, inject } from 'tsyringe';
import { Day } from '@/src/core/object-values/Day';
import { Route } from '../../../core/entities/Route';
import { RouteRepository } from '../../../core/interfaces/RouteRepository';
import { SupabaseDataSource } from '../../datasources/SupabaseDataSource';
import { TOKENS } from '@/src/infrastructure/di/tokens';

@injectable()
export class SupbaseRouteRepository implements RouteRepository {
  constructor(@inject(TOKENS.SupabaseDataSource) private readonly dataSource: SupabaseDataSource) {}

  private get supabase() {
    return this.dataSource.getClient();
  }

  async listRoutesByUser(user: string): Promise<Route[]> {
    try {
      const { data, error } = await this.supabase
        .from('routes')
        .select('*')
        .eq('id_vendor', user);

      if (error) throw new Error('Error fetching routes');

      return data
        
    } catch (error) {
      throw new Error('Error fetching routes');
    }
  }

  async listDays(): Promise<Day[]> {
    try {
      const { data, error } = await this.supabase.from('days').select();
      if (error) throw new Error('Error fetching days');
      return data;
    } catch (error) {
      throw new Error('Error fetching days');
    }
  }
}