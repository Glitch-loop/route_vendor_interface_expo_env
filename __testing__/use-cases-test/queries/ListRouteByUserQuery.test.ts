// Load environment variables first
import 'dotenv/config';

// Test file for DI container
import 'reflect-metadata';
import { container } from '../../../src/infrastructure/di/container';
import { ListRouteByUserQuery } from '../../../src/application/queries/ListRouteByUserQuery';

async function testDI() {
  console.log('🧪 Testing ListRouteByUserQuery...\n');

  try {
    // Resolve query from container
    const listRouteByUserQuery = container.resolve(ListRouteByUserQuery);
    
    console.log('✅ Query resolved successfully');
    console.log('📦 Query instance:', listRouteByUserQuery);
    
    // Execute query with test user ID
    const testUserId = '6caa642d-aade-4673-9525-50ef5c5eafd7'; // Replace with actual user ID
    console.log(`\n🚀 Executing query for user: ${testUserId}...`);
    const routes = await listRouteByUserQuery.execute(testUserId);
    
    console.log('📊 Query result:');
    console.log(`   Found ${routes.length} route(s)`);
    console.log('   Routes:', routes);

    console.log('\n✅ Query executed successfully');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

testDI();
