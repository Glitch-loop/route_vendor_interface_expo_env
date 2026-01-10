import * as SQLite3 from 'sqlite3';
import * as SQLite from 'expo-sqlite';

beforeAll(async () => {
  
  const db = await SQLite.openDatabaseAsync(':memory:');
  
  console.log('Database opened');
  console.log('Database name:', db.name);
  console.log('Database object:', db.db);
  console.log('Database version:', db.databasePath);
  
  await db.withExclusiveTransactionAsync(tx => {
    tx.runAsync(`CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)`);
    tx.runAsync(`INSERT INTO test (name) VALUES (?)`, ['Alice']);
    tx.runAsync(`INSERT INTO test (name) VALUES (?)`, ['Bob']);
  });
});

test('Retrieve data from SQLite', done => {
  console.log('Starting the testing');
  db.withExclusiveTransactionAsync(tx => {
    tx.runAsync(`SELECT * FROM test`, [], (_, { rows }) => {
      expect(rows.length).toBe(2);
      expect(rows.item(0).name).toBe('Alice');
      done();
    });
  });
});