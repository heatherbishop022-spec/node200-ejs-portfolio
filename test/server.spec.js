process.env.NODE_ENV = 'test';

const assert = require('assert');
const request = require('supertest');
const app = require('../server');

describe('Portfolio site', () => {
  let saved;

  beforeEach(() => {
    saved = [];
    // Fake Google Sheets so tests never hit the real API
    app.locals.saveContact = async (contact) => { saved.push(contact); };
  });

  it('home page loads and links to GitHub', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 200);
    assert.ok(res.text.includes('github.com'));
  });

  it('portfolio page lists projects', async () => {
    const res = await request(app).get('/portfolio');
    assert.strictEqual(res.status, 200);
    assert.ok(res.text.includes('class="card"'));
  });

  it('contact page has first name, last name, and email fields', async () => {
    const res = await request(app).get('/contact');
    assert.strictEqual(res.status, 200);
    ['name="firstName"', 'name="lastName"', 'name="email"', 'name="message"'].forEach((field) => {
      assert.ok(res.text.includes(field), `missing ${field}`);
    });
  });

  it('thanks the contact by name and saves their info', async () => {
    const res = await request(app)
      .post('/thanks')
      .type('form')
      .send({ firstName: 'Sarah', lastName: 'Person', email: 'sarah@example.com' });
    assert.strictEqual(res.status, 200);
    assert.ok(res.text.includes('Sarah'));
    assert.ok(res.text.includes('Person'));
    assert.strictEqual(saved.length, 1);
    assert.strictEqual(saved[0].email, 'sarah@example.com');
  });

  it('saves the optional message', async () => {
    await request(app)
      .post('/thanks')
      .type('form')
      .send({ firstName: 'Sarah', lastName: 'Person', email: 'sarah@example.com', message: 'Love your work!' });
    assert.strictEqual(saved[0].message, 'Love your work!');
  });

  it('keeps the user on the form when the email is missing', async () => {
    const res = await request(app)
      .post('/thanks')
      .type('form')
      .send({ firstName: 'Sarah', lastName: 'Person', email: '' });
    assert.strictEqual(res.status, 400);
    assert.ok(res.text.includes('valid email'));
    assert.strictEqual(saved.length, 0);
  });

  it('shows an error if saving fails', async () => {
    app.locals.saveContact = async () => { throw new Error('Sheets is down'); };
    const res = await request(app)
      .post('/thanks')
      .type('form')
      .send({ firstName: 'Sarah', lastName: 'Person', email: 'sarah@example.com' });
    assert.strictEqual(res.status, 500);
    assert.ok(res.text.includes('try again'));
  });

  it('returns 404 for unknown pages', async () => {
    const res = await request(app).get('/nope');
    assert.strictEqual(res.status, 404);
  });
});
