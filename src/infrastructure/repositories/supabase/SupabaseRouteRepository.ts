import { Route } from '../../../core/entities/Route';
import { RouteRepository } from '../../../core/interfaces/RouteRepository';
import { supabase } from '../../supabaseClient';

export class SupbaseRouteRepository implements RouteRepository {
  async listRoutes(user: string): Promise<Route[]> {
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .eq('user_id', user);
    }
}


