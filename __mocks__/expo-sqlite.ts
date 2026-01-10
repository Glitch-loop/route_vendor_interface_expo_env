// __mocks__/expo-sqlite.ts
import sqlite3 from 'sqlite3';
sqlite3.verbose();

// Hold reference to open DBs
const databases = new Map<string, sqlite3.Database>();

export async function openDatabaseAsync(name: string) {
  const db = new sqlite3.Database(name === ':memory:' ? ':memory:' : `${name}.db`);
  databases.set(name, db);
  return { name, db };
}

export async function withExclusiveTransactionAsync(dbWrapper, fn: (tx) => Promise<void>) {
  const db = dbWrapper.db;
  return new Promise<void>((resolve, reject) => {
    db.serialize(async () => {
      try {
        await fn({
          executeSql: (sql: string, params: any[] = []) =>
            new Promise((res, rej) => {
              db.all(sql, params, (err, rows) => {
                if (err) rej(err);
                else res({ rows: { _array: rows } });
              });
            }),
        });
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  });
}

export async function prepareAsync(dbWrapper, sql: string) {
  const db = dbWrapper.db;
  const stmt = db.prepare(sql);
  return {
    runAsync: (params: any[] = []) =>
      new Promise((res, rej) => {
        stmt.run(params, function (err) {
          if (err) rej(err);
          else res({ lastInsertRowId: this.lastID, changes: this.changes });
        });
      }),
    executeSync: (params: any[] = []) => {
      stmt.run(params);
      return { changes: stmt.changes };
    },
    finalizeAsync: () =>
      new Promise((res) => {
        stmt.finalize(() => res(true));
      }),
  };
}

export async function runAsync(dbWrapper, sql: string, params: any[] = []) {
  const db = dbWrapper.db;
  return new Promise((res, rej) => {
    db.run(sql, params, function (err) {
      if (err) rej(err);
      else res({ lastInsertRowId: this.lastID, changes: this.changes });
    });
  });
}

export function executeSync(dbWrapper, sql: string, params: any[] = []) {
  const db = dbWrapper.db;
  db.run(sql, params);
  return { changes: 1 };
}

export function closeSync(dbWrapper) {
  const db = dbWrapper.db;
  db.close();
  databases.delete(dbWrapper.name);
}
