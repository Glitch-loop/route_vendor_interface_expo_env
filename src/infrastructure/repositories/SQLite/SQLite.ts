import * as SQLite from 'expo-sqlite';


export async function createSQLiteConnection() {
  try {
    
    let db = await SQLite.openDatabaseAsync('mydb.db');
    return db;

  } catch (error) {
    console.error('Failed to open database: ', error);
    throw error;
  }
}