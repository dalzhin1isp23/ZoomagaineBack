import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import {
  Users,
  Authorithation,
  Roles,
  Status,
  Types,
  Category,
  Products,
  Pet,
  Orders,
  Basket,
  Lovers
} from '../models/index';

const MONGODB_URI = process.env.MONGODB_URI!;


const ROLE_NAMES = ['admin', 'delivery_manager', 'courier', 'assistant', 'user'];

const CATEGORIES = [
  'Собаки', 'Кошки', 'Птицы', 'Грызуны', 'Рыбы', 
  'Рептилии', 'Хорьки', 'Лошади', 'Экзотические насекомые', 'Сельхоз животные'
];

const TYPES_BY_CAT: Record<string, string[]> = {
  'Собаки': ['Сухой корм', 'Влажный корм', 'Амуниция', 'Игрушки', 'Груминг'],
  'Кошки': ['Наполнители', 'Когтеточки', 'Лакомства', 'Витамины', 'Домики'],
  'Птицы': ['Зерновые смеси', 'Клетки', 'Жердочки', 'Игрушки для клюва'],
  'Грызуны': ['Сено', 'Клетки', 'Колеса', 'Минеральные камни'],
  'Рыбы': ['Корм хлопья', 'Аквариумы', 'Фильтры', 'Кондиционеры для воды'],
  'Рептилии': ['Террариумы', 'УФ-лампы', 'Субстраты', 'Термоковрики'],
  'Хорьки': ['Спецкорм', 'Гамаки', 'Шлейки', 'Шампуни'],
  'Лошади': ['Средства для копыт', 'Щетки', 'Попоны', 'Лакомства (Мюсли)'],
  'Экзотические насекомые': ['Инсектарии', 'Субстрат мох', 'Кормовые добавки'],
  'Сельхоз животные': ['Премиксы', 'Поилки', 'Средства гигиены вымени']
};

const BRANDS = ['Royal Canin', 'Purina', 'Grandorf', 'Kong', 'Hunter', 'Tetra', 'Ferplast', 'Beaphar', 'Rio', 'Trixie'];


const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];


const clearDatabase = async () => {
  console.log(' Начинаю очистку базы данных...');
  const collections = [
    Users, Authorithation, Roles, Status, Types, 
    Category, Products, Pet, Orders, Basket, Lovers
  ];
  for (const model of collections) {
    await model.deleteMany({});
  }
  console.log(' База данных успешно очищена');
};


const seedProducts = async () => {
  console.log(' Генерирую товары...');
  const catMap = new Map();
  const typeMap = new Map();

 
  for (const catName of CATEGORIES) {
    const cat = await Category.create({ name: catName });
    catMap.set(catName, cat._id);
  }

  const allTypeNames = Array.from(new Set(Object.values(TYPES_BY_CAT).flat()));
  for (const tName of allTypeNames) {
    const type = await Types.create({ name: tName });
    typeMap.set(tName, type._id);
  }

  const productEntities = [];
  

  for (const catName of CATEGORIES) {
    const types = TYPES_BY_CAT[catName];
    for (const typeName of types) {
    
      const countForType = randomInt(3, 4);
      for (let i = 1; i <= countForType; i++) {
        const brand = randomItem(BRANDS);
        const name = `${typeName} ${brand} Gold Edition #${i}`;
        const slug = name.toLowerCase().replace(/\s+/g, '-');

        productEntities.push({
          name,
          description: `Высококачественный продукт "${typeName}" от ${brand}. Разработано специально для категории: ${catName}.`,
          manufacturer: brand,
          price: randomInt(400, 15000),
          remains: randomInt(5, 100),
          discount: Math.random() > 0.8 ? 15 : 0,
          type: typeMap.get(typeName),
          category: catMap.get(catName),
          images: [
            { url: `https://api.petshop.ru/images/${slug}-1.jpg`, isMain: true, altText: name },
            { url: `https://api.petshop.ru/images/${slug}-2.jpg`, isMain: false, altText: `${name} в упаковке` }
          ]
        });
      }
    }
  }

  const createdProducts = await Products.insertMany(productEntities);
  console.log(` Создано товаров: ${createdProducts.length}`);
  return createdProducts;
};


const seedUsersAndRoles = async () => {
  console.log(' Создаю роли и пользователей...');
  const rolesMap = new Map();
  
  for (const name of ROLE_NAMES) {
    const role = await Roles.create({ name });
    rolesMap.set(name, role._id);
  }

  const password = await bcrypt.hash('secret123', 10);

  for (const roleName of ROLE_NAMES) {
    const user = await Users.create({
      mail: `${roleName}@petshop.ru`,
      phone: `+7999${randomInt(1000000, 9999999)}`,
      role: rolesMap.get(roleName),
      status: 'active'
    });

    await Authorithation.create({
      login: roleName,
      password,
      user: user._id,
      isVerified: true
    });
  }

  return await Users.find().lean();
};


const runSeed = async () => {
  try {
    console.log(' Подключение к MongoDB...');
    await mongoose.connect(MONGODB_URI);

    await clearDatabase();
    

    await Status.insertMany([
      { name: 'new' }, { name: 'processing' }, { name: 'delivered' }, { name: 'canceled' }
    ]);

    const users = await seedUsersAndRoles();

 
    const products = await seedProducts();


    for (const user of users) {
      if (Math.random() > 0.5) {
        await Basket.create({
          user: user._id,
          product: randomItem(products)._id,
          count: randomInt(1, 2)
        });
      }
    }

    console.log('Сидинг успешно завершен!');
  } catch (error) {
    console.error(' Ошибка при сидинге:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runSeed();