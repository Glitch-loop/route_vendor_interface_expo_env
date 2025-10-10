import * as SQLite from 'expo-sqlite';
// import { sqlLite_route_repository } from './sqlLite_route_repository';

//const db = SQLite.openDatabase('test.db');
const db = SQLite.openDatabaseSync(':memory:');

beforeAll(() => {
  // Create tables for testing
  db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync(`
      CREATE TABLE IF NOT EXISTS routeDay (
        id_route TEXT PRIMARY KEY,
        route_name TEXT,
        description TEXT,
        route_status INTEGER,
        id_vendor TEXT
      );
    `);
    await tx.runAsync(`
      CREATE TABLE IF NOT EXISTS day (
        id_day TEXT PRIMARY KEY,
        day_name TEXT,
        day_status INTEGER
      );
    `);
  });
});

afterAll(() => {
  // Clean up the database
  db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync('DROP TABLE IF EXISTS routeDay;');
    await tx.runAsync('DROP TABLE IF EXISTS day;');
  });
});

test('listRoutes should return routes', async () => {
//   const repository = new sqlLite_route_repository();

  // Insert test data
  db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync(
      `INSERT INTO routeDay (id_route, route_name, description, route_status, id_vendor)
       VALUES (?, ?, ?, ?, ?);`,
      ['1', 'Route 1', 'Description 1', 1, 'Vendor1']
    );
  });

//   const routes = await repository.listRoutes('Vendor1');
//   expect(routes).toHaveLength(1);
//   expect(routes[0].route_name).toBe('Route 1');
})
