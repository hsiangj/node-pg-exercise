process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testInvoice;

beforeEach(async() => {
  const companyResult = await db.query(`
  INSERT INTO companies (code, name, description)
  VALUES ('testco', 'Test Company', 'Testing company')`);

  await db.query("SELECT setval('invoices_id_seq', 1, false)");

  const invoiceResult = await db.query(`
  INSERT INTO invoices (comp_code, amt, paid, paid_date)
  VALUES ('testco', 100, false, null), ('testco', 300, true, '2018-01-01') 
  RETURNING id, comp_code, amt, paid, add_date, paid_date`);

  testInvoice = invoiceResult.rows;
});

afterEach(async () => {
  await db.query('DELETE FROM invoices');
  await db.query('DELETE FROM companies');
});

afterAll(async () => {
  await db.end();
});

describe('GET /invoices', () => {
  test('Get a list of invoices', async() => {
    const res = await request(app).get('/invoices');
    expect(res.statusCode).toBe(200);
    
    expect(res.body).toEqual({invoices: [{
      id: 1,
      comp_code: 'testco'
    },
    {
      id: 2,
      comp_code: 'testco'
    }
    ]});
  })
});

describe('GET /invoices/:id', () => {
  test('Get a single invoice', async () => {
    const res = await request(app).get('/invoices/1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      {
        "invoice": {
          id: 1,
          amt: 100,
          add_date: testInvoice[0].add_date.toISOString(),
          paid: false,
          paid_date: null,
          company: {
            code: 'testco',
            name: 'Test Company',
            description: 'Testing company',
          }
        }
      }
    ) 
  })
  test('Respond with 404 for invoice not found', async () => {
    const res = await request(app).get('/invoices/60');
    expect(res.statusCode).toBe(404);
  })
})

describe('POST /invoices', () => {
  test('Add an invoice', async () => {
    const res = await request(app).post('/invoices').send({amt: 500, comp_code: 'testco'});
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(
      {
        'invoice': {
          id: 3,
          comp_code: 'testco',
          amt: 500,
          add_date: expect.any(String),
          paid: false,
          paid_date: null
        }
      }
    )
  })
})

describe('PUT /invoices/:id', () => {
  test('Update an invoice', async () => {
    const res = await request(app).put('/invoices/1').send({amt: 200, paid: false })
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      {
        'invoice': {
          id: 1,
          comp_code: 'testco',
          amt: 200,
          add_date: expect.any(String),
          paid: false,
          paid_date: null
        }
      }
    )
  })
  test('Respond with 404 for invoice not found', async () => {
    const res = await request(app).put('/invoices/60').send({amt: 5000});
    expect(res.statusCode).toBe(404);
  })
})

describe('DELETE /invoices/:id', () => {
  test('Delete an invoice', async() => {
    const res = await request(app).delete('/invoices/1');
    expect(res.body).toEqual({'status': 'deleted'});
    const resGet = await request(app).get('/invoices');
    expect(resGet.body.invoices.length).toBe(1);
  })
  test('Respond with 404 for invoice not found', async () => {
    const res = await request(app).put('/invoices/60').send({amt: 5000});
    expect(res.statusCode).toBe(404);
  })
})