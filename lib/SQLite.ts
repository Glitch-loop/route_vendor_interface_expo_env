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


// export async function closeSQLiteConnection() {
//   try {
//     if(db) {
//       await db.close();
//     }
//   } catch (error) {
//     console.error('Failed to close the database: ', error);
//     throw error;
//   }
// }


