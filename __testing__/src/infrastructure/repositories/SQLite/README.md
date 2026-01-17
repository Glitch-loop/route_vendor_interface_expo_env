# SQLite Repository Tests

This directory contains Jest-based integration tests for all SQLite repository implementations in the Twister application.

## Test Files

- **SQLiteStoreRepository.test.ts** - Tests for store CRUD operations
- **SQLiteRouteTransactionRepository.test.ts** - Tests for route transaction management
- **SQLiteShiftOrganizationRepository.test.ts** - Tests for work day and day operations management
- **SQLiteInventoryOperationRepository.test.ts** - Tests for inventory operation tracking
- **SQLiteInventoryRepository.test.ts** - Tests for product inventory management

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run a specific test file
```bash
npm test -- SQLiteStoreRepository.test.ts
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Run tests without coverage
```bash
npm test -- --testPathPattern="SQLite"
```

## Test Structure

Each test file follows this structure:

1. **Setup Phase**
   - Initializes the DI container
   - Resolves the repository and SQLiteDataSource
   - Initializes the database connection

2. **Test Cases**
   - CRUD operations (Create, Read, Update, Delete)
   - Error handling
   - Edge cases (empty lists, non-existent records)

3. **Cleanup Phase**
   - Removes test data from the database
   - Ensures test isolation

## Important Notes

- Tests use the actual SQLite database
- Each test creates its own test data and cleans up after itself
- Tests are synchronous where possible (WorkDay/DayOperation operations)
- Tests are asynchronous where required (Route Transactions, Inventory operations)
- The database is persistent across test runs; cleanup is critical

## Example Test Pattern

```typescript
describe('Repository Name', () => {
  let repository: RepositoryType;
  let dataSource: SQLiteDataSource;

  beforeAll(async () => {
    dataSource = container.resolve<SQLiteDataSource>(TOKENS.SQLiteDataSource);
    await dataSource.initialize();
    repository = container.resolve<RepositoryType>(TOKENS.RepositoryToken);
  });

  it('should perform operation', async () => {
    // Test implementation
    // Cleanup
  });
});
```

## Dependencies

- `tsyringe` - Dependency injection container
- `jest` - Testing framework
- `@/src/infrastructure/di/container` - DI container with all registered services
- SQLite database with embedded tables created

## Troubleshooting

### Database Locked Errors
- Ensure previous tests completed and cleaned up
- Close any other database connections

### Import Resolution Errors
- Verify path aliases are correctly configured in `tsconfig.json`
- Ensure all entity and interface imports are correct

### Test Timeout
- Increase Jest timeout in test configuration
- Check for infinite loops in database operations

### Data Inconsistency
- Verify cleanup code is running in afterEach/afterAll hooks
- Check for duplicate test data IDs
