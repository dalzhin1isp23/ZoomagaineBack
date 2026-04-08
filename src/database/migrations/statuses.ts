import { Db } from 'mongodb';

export const up = async (db: Db) => {
  const statuses = ['active', 'blocked', 'pending', 'deleted'];
  const collection = db.collection('statuses');

  for (const name of statuses) {
    await collection.updateOne(
      { name },
      { $set: { name } },
      { upsert: true }
    );
  }
  
  console.log('Статусы созданы');
};

export const down = async (db: Db) => {
  await db.collection('statuses').deleteMany({});
};