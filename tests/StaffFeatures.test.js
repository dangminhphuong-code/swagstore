'use strict';

const fs = require('fs');
const path = require('path');

const Product = require('../models/Product');
const Account = require('../models/Account');
const authCtrl = require('../controllers/authController');

const productsFile = path.join(__dirname, '..', 'data', 'products.json');
const productsBackup = path.join(__dirname, '..', 'data', 'products.json.bak');

const accountsFile = path.join(__dirname, '..', 'data', 'accounts.json');
const accountsBackup = path.join(__dirname, '..', 'data', 'accounts.json.bak');

function mockRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.send = jest.fn(() => res);
  res.redirect = jest.fn(() => res);
  return res;
}

beforeAll(() => {
  if (fs.existsSync(productsFile)) fs.copyFileSync(productsFile, productsBackup);
  if (fs.existsSync(accountsFile)) fs.copyFileSync(accountsFile, accountsBackup);
});

afterAll(() => {
  if (fs.existsSync(productsBackup)) {
    fs.copyFileSync(productsBackup, productsFile);
    fs.unlinkSync(productsBackup);
  }

  if (fs.existsSync(accountsBackup)) {
    fs.copyFileSync(accountsBackup, accountsFile);
    fs.unlinkSync(accountsBackup);
  }
});

beforeEach(() => {
  fs.writeFileSync(productsFile, JSON.stringify([
    {
      id: 1,
      name: 'Test Product',
      desc: 'Demo product',
      price: 10,
      category: 'Apparel',
      type: 'T-Shirt',
      image: '',
      badge: ''
    }
  ], null, 2));

  fs.writeFileSync(accountsFile, '[]');
});

describe('Account role', () => {
  test('creates customer by default', () => {
    const acc = Account.add({
      name: 'Customer',
      email: 'customer@test.com',
      password: '123',
      address: 'HCMC'
    });

    expect(acc.role).toBe('customer');
  });

  test('creates staff account', () => {
    const acc = Account.add({
      name: 'Staff',
      email: 'staff@test.com',
      password: '123',
      address: 'Store',
      role: 'staff'
    });

    expect(acc.role).toBe('staff');
  });

  test('rejects invalid role', () => {
    expect(() => Account.add({
      name: 'Bad',
      email: 'bad@test.com',
      password: '123',
      address: 'Nowhere',
      role: 'admin'
    })).toThrow('Invalid role.');
  });
});

describe('Product CRUD by staff feature', () => {
  test('creates product', () => {
    const product = Product.add({
      name: 'New Shirt',
      desc: 'Nice shirt',
      price: 20,
      category: 'Apparel',
      type: 'T-Shirt'
    });

    expect(product.id).toBeDefined();
    expect(product.name).toBe('New Shirt');
    expect(Product.getAll()).toHaveLength(2);
  });

  test('updates product', () => {
    const updated = Product.update(1, {
      name: 'Updated Product',
      price: 99
    });

    expect(updated.name).toBe('Updated Product');
    expect(updated.price).toBe(99);
  });

  test('deletes product', () => {
    const removed = Product.delete(1);

    expect(removed.id).toBe(1);
    expect(Product.getAll()).toHaveLength(0);
  });

  test('throws when deleting missing product', () => {
    expect(() => Product.delete(999)).toThrow('Product not found.');
  });
});

describe('requireStaff middleware', () => {
  test('redirects if user is not logged in', () => {
    const req = { session: {} };
    const res = mockRes();
    const next = jest.fn();

    authCtrl.requireStaff(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/login?error=1');
    expect(next).not.toHaveBeenCalled();
  });

  test('blocks customer account', () => {
    const req = { session: { user: { id: 1, role: 'customer' } } };
    const res = mockRes();
    const next = jest.fn();

    authCtrl.requireStaff(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('allows staff account', () => {
    const req = { session: { user: { id: 1, role: 'staff' } } };
    const res = mockRes();
    const next = jest.fn();

    authCtrl.requireStaff(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});