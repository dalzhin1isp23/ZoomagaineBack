import { Db } from 'mongodb';

export const up = async (db: Db) => {
  await db.collection('users').createIndex({ mail: 1 }, { unique: true });
  await db.collection('users').createIndex({ role: 1 });

  await db.collection('products').createIndex({ name: 1 });
  await db.collection('products').createIndex({ category: 1 });
  await db.collection('products').createIndex({ price: 1 });

  await db.collection('pets').createIndex({ owner: 1 });
  await db.collection('pets').createIndex({ animal: 1 });
  await db.collection('pets').createIndex({ 'documents.expiresAt': 1 });

  await db.collection('authorithations').createIndex({ login: 1 }, { unique: true });
  await db.collection('authorithations').createIndex({ user: 1 });
  
  console.log('Индексы созданы');
};

export const down = async (db: Db) => {
  await db.collection('users').dropIndexes();
  await db.collection('products').dropIndexes();
  await db.collection('pets').dropIndexes();
  await db.collection('authorithations').dropIndexes();
};