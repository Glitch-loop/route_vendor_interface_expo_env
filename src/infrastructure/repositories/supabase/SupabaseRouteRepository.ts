// Libraries
import { injectable, inject } from 'tsyringe';

// Object values
import { Day } from '@/src/core/object-values/Day';
import { RouteDay } from '@/src/core/object-values/RouteDay';
import { RouteDayStore } from '@/src/core/object-values/RouteDayStore';

// Entities
import { Route } from '@/src/core/entities/Route';

// Interfaces
import { RouteRepository } from '@/src/core/interfaces/RouteRepository';

// Infrastructure
import { SupabaseDataSource } from '@/src/infrastructure/datasources/SupabaseDataSource'; 

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';
import { CENTRAL_TABLES } from '../../database/central-database/centralTables';


@injectable()
export class SupabaseRouteRepository implements RouteRepository {
  constructor(@inject(TOKENS.SupabaseDataSource) private readonly dataSource: SupabaseDataSource) {}

  private get supabase() {
    return this.dataSource.getClient();
  }

  async listRoutesByUser(user: string): Promise<Route[]> {
    console.log('*********************Fetching routes for user:', user);
    try {
      const { data, error } = await this.supabase
        .from(CENTRAL_TABLES.ROUTES)
        .select('*')
        .eq('id_vendor', user);

      if (error) throw new Error('Error fetching routes: ' + error.message);

      return data
        
    } catch (error) {
      throw new Error('Error fetching routes: ' + error);
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

  async listRouteDaysByRoute(id_route: string): Promise<RouteDay[]> {
    try {
      const { data, error } = await this.supabase
        .from(CENTRAL_TABLES.ROUTE_DAY)
        .select('*')
        .eq('id_route', id_route);
      if (error) throw new Error('Error fetching route days by route' + error.message);
      return data;
    } catch (error) {
      throw new Error('Error fetching route days by route' + error);
    }
  }

  async listRouteDayStoresByRoute(id_route_day: string): Promise<RouteDayStore[]> {
    try {
      const { data, error } = await this.supabase
        .from(CENTRAL_TABLES.ROUTE_DAY_STORES)
        .select('*')
        .eq('id_route_day', id_route_day);
      if (error) throw new Error('Error fetching route day stores by route day' + error.message);
      return data;
    } catch (error) {
      throw new Error('Error fetching route day stores by route day' + error);
    }
  }
}