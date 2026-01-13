# Dependency Injection: Multiple Repository Implementations

This document explains how to use multiple implementations of the same repository interface (Supabase vs SQLite).

## Overview

We have two implementations of `StoreRepository`:
- **SupabaseStoreRepository**: For remote/cloud operations
- **SQLiteStoreRepository**: For local/offline operations

## Pattern 1: Named Tokens (Current Implementation)

### Tokens Definition
```typescript
// src/infrastructure/di/tokens.ts
export const TOKENS = {
    // Generic - default implementations
    StoreRepository: Symbol('StoreRepository'),
    
    // Specific implementations
    SupabaseStoreRepository: Symbol('SupabaseStoreRepository'),
    SQLiteStoreRepository: Symbol('SQLiteStoreRepository'),
}
```

### Container Registration
```typescript
// src/infrastructure/di/container.ts

// Default implementation (Supabase)
container.register<StoreRepository>(TOKENS.StoreRepository, {
    useClass: SupabaseStoreRepository
})

// Specific implementations
container.register<StoreRepository>(TOKENS.SupabaseStoreRepository, {
    useClass: SupabaseStoreRepository
})

container.register<StoreRepository>(TOKENS.SQLiteStoreRepository, {
    useClass: SQLiteStoreRepository
})
```

### Usage in Use Cases

#### Example 1: RegisterNewClientUseCase (Uses Supabase)
```typescript
@injectable()
export class RegisterNewClientUseCase {
    constructor(
        @inject(TOKENS.SupabaseStoreRepository) 
        private repo: StoreRepository
    ) { }

    async execute(store: Store[]): Promise<void> {
        // This uses Supabase implementation
        await this.repo.insertStores(store)
    }
}
```

#### Example 2: StartWorkDayUseCase (Uses SQLite)
```typescript
@injectable()
export class StartWorkDayUseCase {
    constructor(
        @inject(TOKENS.SQLiteStoreRepository) 
        private storeRepo: StoreRepository
    ) { }

    async execute(): Promise<void> {
        // This uses SQLite implementation
        const stores = await this.storeRepo.listStores();
        // Work with local stores...
    }
}
```

#### Example 3: Using Default Implementation
```typescript
@injectable()
export class SomeUseCase {
    constructor(
        @inject(TOKENS.StoreRepository)  // Uses default (Supabase)
        private repo: StoreRepository
    ) { }
}
```

## Pattern 2: Factory Pattern (Alternative)

If you need to decide at runtime which implementation to use:

### Create a Factory
```typescript
// src/infrastructure/factories/StoreRepositoryFactory.ts
import { injectable, inject } from 'tsyringe';
import { StoreRepository } from '@/src/core/interfaces/StoreRepository';
import { TOKENS } from '@/src/infrastructure/di/tokens';

export type DataSource = 'supabase' | 'sqlite';

@injectable()
export class StoreRepositoryFactory {
    constructor(
        @inject(TOKENS.SupabaseStoreRepository) 
        private supabaseRepo: StoreRepository,
        
        @inject(TOKENS.SQLiteStoreRepository) 
        private sqliteRepo: StoreRepository
    ) { }

    getRepository(source: DataSource): StoreRepository {
        switch (source) {
            case 'supabase':
                return this.supabaseRepo;
            case 'sqlite':
                return this.sqliteRepo;
            default:
                throw new Error(`Unknown data source: ${source}`);
        }
    }
}
```

### Usage with Factory
```typescript
@injectable()
export class SyncUseCase {
    constructor(
        private factory: StoreRepositoryFactory
    ) { }

    async execute(isOnline: boolean): Promise<void> {
        const repo = this.factory.getRepository(
            isOnline ? 'supabase' : 'sqlite'
        );
        
        const stores = await repo.listStores();
        // Process stores...
    }
}
```

## Pattern 3: Strategy Pattern with Context

For complex scenarios where you need to switch between implementations dynamically:

```typescript
@injectable()
export class StoreService {
    private currentRepo: StoreRepository;
    
    constructor(
        @inject(TOKENS.SupabaseStoreRepository) 
        private supabaseRepo: StoreRepository,
        
        @inject(TOKENS.SQLiteStoreRepository) 
        private sqliteRepo: StoreRepository
    ) {
        // Set default
        this.currentRepo = this.sqliteRepo;
    }
    
    setDataSource(source: 'supabase' | 'sqlite'): void {
        this.currentRepo = source === 'supabase' 
            ? this.supabaseRepo 
            : this.sqliteRepo;
    }
    
    async getStores(): Promise<Store[]> {
        return this.currentRepo.listStores();
    }
}
```

## Best Practices

1. **Use Named Tokens** for use cases that always know which implementation they need (e.g., StartWorkDay always uses SQLite)

2. **Use Factory Pattern** when you need runtime decision-making based on conditions (e.g., online/offline status)

3. **Use Default Registration** (`TOKENS.StoreRepository`) for backward compatibility or when you don't care about the specific implementation

4. **Keep It Simple**: Start with named tokens. Only introduce factories if you have genuine runtime switching needs.

## Common Scenarios

| Scenario | Pattern | Example |
|----------|---------|---------|
| Register new client (online only) | Named Token | `@inject(TOKENS.SupabaseStoreRepository)` |
| Start work day (local only) | Named Token | `@inject(TOKENS.SQLiteStoreRepository)` |
| Sync operation (depends on connectivity) | Factory | `factory.getRepository(isOnline ? 'supabase' : 'sqlite')` |
| Legacy code (no preference) | Default Token | `@inject(TOKENS.StoreRepository)` |

## Migration Guide

To migrate existing use cases:

1. If they should use Supabase: Change `TOKENS.StoreRepository` → `TOKENS.SupabaseStoreRepository`
2. If they should use SQLite: Change `TOKENS.StoreRepository` → `TOKENS.SQLiteStoreRepository`
3. If they need both: Inject both tokens or use the factory pattern
