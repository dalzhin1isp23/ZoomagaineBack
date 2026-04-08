import { Db } from 'mongodb';

export const up = async (db: Db) => {

  const categories = ['Для собак', 'Для кошек', 'Для птиц', 'Для грызунов', 'Универсальное'];
  const catCollection = db.collection('categories');
  for (const name of categories) {
    await catCollection.updateOne({ name }, { $set: { name } }, { upsert: true });
  }

  const types = ['Корм', 'Лакомства', 'Игрушки', 'Аксессуары', 'Ветеринария', 'Гигиена'];
  const typeCollection = db.collection('types');
  for (const name of types) {
    await typeCollection.updateOne({ name }, { $set: { name } }, { upsert: true });
  }
  
  console.log('Категории и типы созданы');
};

export const down = async (db: Db) => {
  await db.collection('categories').deleteMany({});
  await db.collection('types').deleteMany({});
};