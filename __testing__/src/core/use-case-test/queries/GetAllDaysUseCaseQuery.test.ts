// Load environment variables first
import 'dotenv/config';

// Test file for DI container
import 'reflect-metadata';
import { container } from '../../../../../src/infrastructure/di/container';
import { GetAllDaysQuery } from '../../../../../src/application/queries/GetAllDaysQuery';

async function testDI() {
  console.log('🧪 Testing DI Container...\n');

  try {
    // Resolve use case from container
    const getAllDaysUseCase = container.resolve(GetAllDaysQuery);
    
    console.log('✅ UseCase resolved successfully');
    console.log('📦 UseCase instance:', getAllDaysUseCase);
    
    // Execute use case
    console.log('\n🚀 Executing use case...');
    const data = await getAllDaysUseCase.execute();
    
    console.log('📊 Use case result:', data);

    console.log('✅ Use case executed successfully');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

testDI();
