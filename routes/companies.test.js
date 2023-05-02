process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;

beforeEach(async() => {
  const companyResult = await db.query(`
  INSERT INTO companies (code, name, description)
  VALUES ('testco', 'Test Company', 'Testing company')
  RETURNING code, name, description`);

  testCompany = companyResult.rows[0];
});

afterEach(async () => {
  await db.query('DELETE FROM companies');
});

afterAll(async () => {
  await db.end();
});


describe('GET /companies', () => {
  test('Get all companies', async() => {
    const res = await request(app).get('/companies');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({companies: [testCompany]});
  })
});

describe('GET /companies/:code', () => {
  test('Get a company', async () => {
    const res = await request(app).get(`/companies/${testCompany.code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({company: {...testCompany, industries:[],invoices:[]}});
  })
  test('Respond with 404 if company not found', async () => {
    const res = await request(app).get(`/companies/randomco`);
    expect(res.statusCode).toBe(404);
  })
})

describe('POST /companies', () => {
  test('Add a company', async () => {
    const res = await request(app).post('/companies').send({name: 'add co', description:'Add a co'})
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      company:
      {
        code: 'addco',
        name: 'add co',
        description: 'Add a co'
      }
    });
  })
  test('Return 500 for duplicate company', async () => {
    const res = await request(app).post('/companies').send({name: 'testco', description:'Add a co'})
    expect(res.statusCode).toBe(500);
  })
})

describe('PUT /companies/:code', () => {
  test('Update a company', async () => {
    const res = await request(app).put(`/companies/${testCompany.code}`).send({name: 'newtestco', description: 'updated test co'});
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      company: {
        code: 'testco',
        name: 'newtestco',
        description: 'updated test co'
      }
    })
  })
  test('Respond with 404 if company not found', async () => {
    const res = await request(app).put(`/companies/randomco`);
    expect(res.statusCode).toBe(404);
  })
  test('Return 500 for incomplete data', async () => {
    const res = await request(app).put(`/companies/${testCompany.code}`).send({})
    expect(res.statusCode).toBe(500);
  })
})

describe('DELETE /companies/:code', () => {
  test('Delete a company', async () => {
    const res = await request(app).delete(`/companies/${testCompany.code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({status: 'deleted'});
  })
  test('Respond with 404 if company not found', async () => {
    const res = await request(app).delete(`/companies/randomco`);
    expect(res.statusCode).toBe(404);
  })
})