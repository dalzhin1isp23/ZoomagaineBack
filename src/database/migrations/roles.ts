import { Db } from 'mongodb';

export const up = async (db: Db) => {
  const roles = ['admin', 'user', 'vet'];
  const collection = db.collection('roles');

  for (const name of roles) {
    await collection.updateOne(
      { name },
      { $set: { name } },
      { upsert: true }
    );
  }
  
  console.log('Роли созданы');
};

export const down = async (db: Db) => {
  await db.collection('roles').deleteMany({});
};