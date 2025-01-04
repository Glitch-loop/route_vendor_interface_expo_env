import { 
    createEmbeddedDatabase,
    dropEmbeddedDatabase
} from '../../queries/SQLite/sqlLiteQueries';

import {
    IResponse
} from '../../interfaces/interfaces';

test('Creating embedded database', async () => {
    const result:IResponse<null> = await createEmbeddedDatabase();

    expect(result.responseCode).toEqual(201);
})

test('Dropping embedded database', async () => {
    const result:IResponse<null> = await dropEmbeddedDatabase();

    expect(result.responseCode).toEqual(200);
})