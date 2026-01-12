// Load environment variables first
import 'dotenv/config';

// Reflection metadata must be first
import 'reflect-metadata';

// Import container to trigger registrations
import '../../src/infrastructure/di/container';

// Then import other dependencies
import { container } from 'tsyringe';
import { ListRouteByUserQuery } from '../../src/application/queries/ListRouteByUserQuery';

async function testDI() {
  console.log('🧪 Testing ListRouteByUserQuery...\n');

  try {
    // Resolve query from container
    const listRouteByUserQuery = container.resolve(ListRouteByUserQuery);
    
    console.log('✅ Query resolved successfully');
    console.log('📦 Query instance:', listRouteByUserQuery);
    
    // Execute query with test user ID
    const testUserId = '219ae133-433f-4c89-bbf7-12e3f6e7c0cb'; // Replace with actual user ID
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
