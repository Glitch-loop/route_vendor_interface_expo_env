// Libraries
import { injectable, inject } from 'tsyringe';

// Object values
import { Day } from '@/src/core/object-values/Day';
import { RouteDayStores } from '@/src/core/object-values/RouteDayStores';

// Entities
import { Route } from '@/src/core/entities/Route';

// Interfaces
import { RouteRepository } from '@/src/core/interfaces/RouteRepository';

// Infrastructure
import { SupabaseDataSource } from '@/src/infrastructure/datasources/SupabaseDataSource'; 

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';

@injectable()
export class SupabaseRouteRepository implements RouteRepository {
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

  async listRoutesDayByRoute(id_route: string): Promise<RouteDayStores[]> {
    try {
      const { data, error } = await this.supabase
        .from('route_day_stores')
        .select('*')
        .eq('id_route', id_route);
      if (error) throw new Error('Error fetching route days by route');
      return data;
    } catch (error) {
      throw new Error('Error fetching route days by route');
    }
  }
}