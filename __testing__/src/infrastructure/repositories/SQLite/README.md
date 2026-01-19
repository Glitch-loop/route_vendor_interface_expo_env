# Unit and component testing of SQLite implementation.

Since it was not possible to simulate an SQLite database in a node environment (for testing with Jest), it was deicided to move these testing to:

> app/\__testing\__/component-testing/SQLite

Librarires we tried to mock the SQLiteDatabase:
1. expo-sqlite-mock
2. Create a custom mock.

In the second option, although we had more control over the testing making a mock, we considered that the effort we will put to develop this will be overkill, being prefereable to test directly at runtime, these for simplicity and the option to make testing in a more real environment.