'use strict';

const fs = require('fs');
const path = require('path');
const types = require('../data/types.json');
const Category = require('./Category');

const dataFile = path.join(__dirname, '..', 'data', 'products.json');

function readProducts() {
  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    const products = raw ? JSON.parse(raw) : [];
    return Array.isArray(products) ? products : [];
  } catch (_) {
    return [];
  }
}

function writeProducts(products) {
  fs.writeFileSync(dataFile, JSON.stringify(products, null, 2));
}

class Product {
  static getAll() {
    return readProducts();
  }

  static getById(id) {
    return Product.getAll().find(p => p.id === Number(id));
  }

  static getCategories() {
    return Category.getAll();
  }

  static getTypes() {
    return types;
  }

  static add(data) {
    const products = Product.getAll();

    if (!data.name || !data.price || !data.category || !data.type) {
      throw new Error('Product name, price, category and type are required.');
    }

    const newProduct = {
      id: products.length ? Math.max(...products.map(p => p.id)) + 1 : 1,
      name: String(data.name).trim(),
      desc: data.desc || '',
      price: Number(data.price),
      category: String(data.category).trim(),
      type: String(data.type).trim(),
      image: data.image || '',
      badge: data.badge || '',
    };

    products.push(newProduct);
    writeProducts(products);
    return newProduct;
  }

  static update(id, fields) {
    const products = Product.getAll();
    const index = products.findIndex(p => p.id === Number(id));

    if (index === -1) {
      throw new Error('Product not found.');
    }

    products[index] = {
      ...products[index],
      ...fields,
      id: products[index].id,
      price: fields.price !== undefined ? Number(fields.price) : products[index].price,
    };

    writeProducts(products);
    return products[index];
  }

  static delete(id) {
    const products = Product.getAll();
    const index = products.findIndex(p => p.id === Number(id));

    if (index === -1) {
      throw new Error('Product not found.');
    }

    const removed = products.splice(index, 1)[0];
    writeProducts(products);
    return removed;
  }
}

module.exports = Product;