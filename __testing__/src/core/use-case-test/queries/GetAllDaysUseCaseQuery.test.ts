// Load environment variables first
import 'dotenv/config';
import 'reflect-metadata';

// Test file for DI container
import { container } from '../../../../../src/infrastructure/di/container';
import { GetAllDaysQuery } from '../../../../../src/application/queries/GetAllDaysQuery';

describe('GetAllDaysQuery', () => {
  it('should resolve from DI container and execute successfully', async () => {
    console.log('🧪 Testing DI Container...\n');

    // Resolve use case from container
    const getAllDaysUseCase = container.resolve(GetAllDaysQuery);
    
    console.log('✅ UseCase resolved successfully');
    console.log('📦 UseCase instance:', getAllDaysUseCase);
    
    // Execute use case
    console.log('\n🚀 Executing use case...');
    const data = await getAllDaysUseCase.execute();
    
    console.log('📊 Use case result:', data);

    // Assert
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    
    console.log('✅ Use case executed successfully');
  });
});
