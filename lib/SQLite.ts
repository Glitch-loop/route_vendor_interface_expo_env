import SQLite  from 'react-native-sqlite-storage';

let db = SQLite.openDatabase({ name: 'mydb.db', location: 'default' }, openCB, errorCB);

function errorCB(err:any) {
  console.log("OK errr")
  console.log('SQL Error: ' + err);
}

function openCB() {
  console.log('Database OPENED');
}

// Enable SQLite debugging
SQLite.enablePromise(true);

export async function createSQLiteConnection() {
  try {
    console.log("AAAAAAAAAAAAAAA")
    if (!db) {
      console.log("Try again")
      db = await SQLite.openDatabase({ name: 'mydb.db', location: 'default' },openCB, errorCB);
    }
    
    console.log("This is an attempt: ", db)
    return db;

  } catch (error) {
    console.error('Failed to open database: ', error);
    throw error;
  }
}


export async function closeSQLiteConnection() {
  try {
    if(db) {
      await db.close();
      db = null;
    }
  } catch (error) {
    console.error('Failed to close the database: ', error);
    throw error;
  }
}


