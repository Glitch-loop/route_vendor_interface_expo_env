// Load environment variables first
import 'dotenv/config';

// Enable decorators metadata required by tsyringe
import 'reflect-metadata';

import { container } from '../../../src/infrastructure/di/container';
import { RegisterNewClientUseCase } from '../../../src/application/commands/RegisterNewClientUseCase';
import { Store } from '../../../src/core/entities/Store';

async function testRegisterNewClient() {
  console.log('🧪 Testing RegisterNewClientUseCase via DI...\n');

  try {
    const useCase = container.resolve(RegisterNewClientUseCase);
    console.log('✅ UseCase resolved successfully');

    // Prepare sample store payload (adjust values to your real schema if needed)
    const now = new Date().toISOString();
    const sampleStores: Store[] = [
      new Store(
        '00000000-0000-0000-0000-000000000001',
        'Main St',
        '123',
        'Downtown',
        '12345',
        'Near the park',
        'Sample Store',
        'John Doe',
        '+521234567890',
        '19.432608',
        '−99.133209',
        '11111111-1111-1111-1111-111111111111',
        now,
        'jest-test',
        '1',
        0
      )
    ];

    console.log('\n🚀 Executing use case...');
    await useCase.execute(sampleStores);
    console.log('✅ Stores registered successfully');
  } catch (error: any) {
    console.error('❌ Error executing RegisterNewClientUseCase:', error?.message ?? error);
  }
}

// Run test
testRegisterNewClient();
