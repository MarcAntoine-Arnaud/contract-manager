import supertest from 'supertest';
import { expect } from 'chai';
import app from 'server';
import Contract from 'models/contract.model';
import { config } from 'config/config';

let cookie: any;
let contractId: any;
const SERVER_PORT = 9999;
const _logYellow = (value: string) => {
  console.log(`\x1b[93m${value}\x1b[37m`);
};
const _logGreen = (value: string) => {
  console.log(`\x1b[32m${value}\x1b[37m`);
};
const _logObject = (data: any) => {
  console.log(`\x1b[90m${JSON.stringify(data, null, 2)}\x1b[37m`);
};
describe('Scenario creating an ecosystem contract\n\tthen process an input policy with permission obligation and prohibition', () => {
  let server: any;
  let authToken: string;
  before(async () => {
    server = await app.startServer(config.mongo.testUrl);
    await new Promise((resolve) => {
      server.listen(SERVER_PORT, () => {
        console.log(`Test server is running on port ${SERVER_PORT}`);
        resolve(true);
      });
    });
    await Contract.deleteMany({});
  });

  it('should log the user', async () => {
    _logYellow('\n-Login the user');
    const authResponse = await supertest(app.router).get('/user/login');
    cookie = authResponse.headers['set-cookie'];
    authToken = authResponse.body.token;
    _logGreen('Authentication token:');
    _logObject(authResponse.body);
    _logGreen('Cookies:');
    _logObject(cookie);
    expect(authResponse.status).to.equal(200);
  });

  it('should generate an ecosystem contract', async () => {
    _logYellow('\n-Generate a contract with the following odrl policy');
    const contract = {
      '@context': 'http://www.w3.org/ns/odrl/2/',
      '@type': 'Offer',
      permission: [
        {
          action: 'read',
          target: 'http://contract-target',
          constraint: [
            {
              leftOperand: 'age',
              operator: 'gt',
              rightOperand: 17,
            },
          ],
        },
      ],
      prohibition: [
        {
          action: 'read',
          target: 'http://contract-target',
          constraint: [
            {
              leftOperand: 'age',
              operator: 'gt',
              rightOperand: 20,
            },
          ],
        },
      ],
    };
    _logGreen('The odrl input contract:');
    _logObject(contract);
    const response = await supertest(app.router)
      .post('/contracts/')
      .set('Cookie', cookie)
      .set('Authorization', `Bearer ${authToken}`)
      .send(contract);
    _logGreen('The contract in database:');
    _logObject(response.body);
    expect(response.status).to.equal(201);
    contractId = response.body._id;
  });

  it('should process the user policy hover the contract', async () => {
    const policy = {
      '@context': 'http://www.w3.org/ns/odrl/2/',
      '@type': 'authorisation',
      permission: [
        {
          action: 'read',
          target: 'http://contract-target',
          constraint: [
            {
              leftOperand: 'age',
              operator: 'gt',
              rightOperand: 21,
            },
            {
              leftOperand: 'role',
              operator: 'eq',
              rightOperand: 'admin',
            },
          ],
        },
        {
          action: 'use',
          target: 'http://contract-target-task',
          constraint: [
            {
              leftOperand: 'role',
              operator: 'eq',
              rightOperand: 'admin',
            },
          ],
        },
      ],
    };
    _logYellow('\n-Check if resource is exploitable');
    _logGreen('The odrl user policy:');
    _logObject(policy);
    const response = await supertest(app.router)
      .post(`/contracts/check-exploitability/${contractId}`)
      .set('Cookie', cookie)
      .set('Authorization', `Bearer ${authToken}`)
      .send(policy);
    _logGreen('Resource is exploitable:');
    _logObject(response.body);
    expect(response.body.authorised).to.equal(true);
  });
  after(async () => {
    await Contract.deleteMany({});
    server.close();
    console.log('Test server stopped.');
  });
});