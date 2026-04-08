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

const MONGODB_URI = process.env.MONGODB_URI;
const DROP_DB = process.env.DROP_DB === 'true';

const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start: Date, end: Date) => 
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const DOG_NAMES = ['Рекс', 'Барон', 'Бобик', 'Лорд', 'Граф', 'Зевс', 'Тайсон', 'Бим', 'Джек', 'Стрелка', 'Альфа', 'Бруно'];
const CAT_NAMES = ['Барсик', 'Мурзик', 'Пушок', 'Рыжик', 'Снежок', 'Багира', 'Луна', 'Симба', 'Гарфилд', 'Матроскин', 'Оливия', 'Белка'];
const BIRD_NAMES = ['Кеша', 'Гоша', 'Чижик', 'Пти', 'Скай', 'Блю', 'Санни', 'Полли', 'Рио', 'Золотой', 'Твити', 'Кук'];
const OTHER_NAMES = ['Хома', 'Шустрик', 'Пушок', 'Зубастик', 'Шелли', 'Спайк', 'Тортилла', 'Боня', 'Микки', 'Джери'];

const MANUFACTURERS = ['Royal Canin', 'ProPlan', 'Hills', 'Acana', 'Mнямс', 'PetToys', 'VetExpert', 'CatHome', 'Triol', 'Happy Dog', 'Purina', 'Whiskas'];
const PRODUCT_PREFIXES = ['Корм', 'Лакомство', 'Игрушка', 'Витамин', 'Шампунь', 'Ошейник', 'Поводок', 'Когтеточка', 'Домик', 'Миска', 'Лежанка', 'Переноска'];
const PET_TAGS = ['Стерилизован', 'Вакцинирован', 'Чипирован', 'Аллергик', 'Хроническое заболевание', 'Щенок', 'Взрослый', 'Сеньор', 'Беременная', 'Племенной', 'Активный', 'Спокойный', 'Агрессивный', 'Дружелюбный', 'Шумный', 'Домашний', 'Уличный', 'Питомник', 'Приют', 'На передержке'];
const ANIMAL_TYPES = ["Собака", "Кот", "Птица", "Грызун", "Пресмыкающееся", "Рыба", "Другое"];
const GENDERS = ["Мальчик", "Девочка"];

const generateUsers = (count: number) => {
  const users = [];
  for (let i = 0; i < count; i++) {
    const role = i === 0 ? 'admin' : i < 3 ? 'vet' : 'user';
    users.push({
      login: i === 0 ? 'admin' : `user${i}`,
      password: i === 0 ? 'admin123' : 'user123',
      mail: i === 0 ? 'admin@petshop.ru' : `user${i}@test.ru`,
      phone: `+7999000${String(i).padStart(4, '0')}`,
      role,
      status: 'active'
    });
  }
  return users;
};

const generateProducts = (count: number, typesMap: Map<string, any>, categoriesMap: Map<string, any>) => {
  const products = [];
  for (let i = 0; i < count; i++) {
    const type = randomItem(Array.from(typesMap.keys()));
    const category = randomItem(Array.from(categoriesMap.keys()));
    const manufacturer = randomItem(MANUFACTURERS);
    const prefix = randomItem(PRODUCT_PREFIXES);
    
    products.push({
      name: `${prefix} ${manufacturer} #${i + 1}`,
      description: `Качественный товар от ${manufacturer}. Артикул: ${Date.now()}-${i}`,
      manufacturer,
      price: randomInt(100, 5000),
      remains: randomInt(0, 100),
      discount: randomInt(0, 30),
      type: typesMap.get(type),
      category: categoriesMap.get(category),
      images: [{ 
        url: `/images/product-${i}.jpg`, 
        isMain: true, 
        altText: `${prefix} ${i + 1}` 
      }]
    });
  }
  return products;
};

const generatePets = (count: number, userIds: any[]) => {
  const pets = [];
  
  for (let i = 0; i < count; i++) {
    const animal = randomItem(ANIMAL_TYPES);
    let name = '';
    
    if (animal === 'Собака') name = `${randomItem(DOG_NAMES)}-${i}`;
    else if (animal === 'Кот') name = `${randomItem(CAT_NAMES)}-${i}`;
    else if (animal === 'Птица') name = `${randomItem(BIRD_NAMES)}-${i}`;
    else name = `${randomItem(OTHER_NAMES)}-${i}`;

    const tagsCount = randomInt(1, 3);
    const tags = [];
    for (let j = 0; j < tagsCount; j++) {
      const tag = randomItem(PET_TAGS);
      if (!tags.includes(tag)) tags.push(tag);
    }

    const documentsCount = randomInt(0, 2);
    const documents = [];
    for (let j = 0; j < documentsCount; j++) {
      documents.push({
        title: randomItem(['Ветпаспорт', 'Справка о прививках', 'Родословная', 'Карта здоровья']),
        fileUrl: `/files/doc-${i}-${j}.pdf`,
        fileType: randomItem(['pdf', 'jpg', 'png']),
        veterinaryData: {
          medicationName: randomItem(['Nobivac', 'Eurican', 'Defensor', 'Rabisin']),
          seriesNumber: `SER-${randomInt(10000, 99999)}`,
          manufacturer: randomItem(MANUFACTURERS),
          applicationDate: randomDate(new Date(2023, 0, 1), new Date())
        },
        qrCode: {
          code: `QR-${Date.now()}-${i}-${j}`,
          generatedAt: new Date(),
          scannedCount: randomInt(0, 10)
        },
        uploadedAt: new Date(),
        expiresAt: randomDate(new Date(), new Date(2027, 11, 31)),
        isVerified: Math.random() > 0.3
      });
    }

    pets.push({
      name,
      animal,
      gender: randomItem(GENDERS),
      breed: `${animal} породы #${randomInt(1, 50)}`,
      bornDate: randomDate(new Date(2015, 0, 1), new Date()),
      tags,
      owner: randomItem(userIds),
      documents
    });
  }
  return pets;
};

const generateOrders = (count: number, userIds: any[], productIds: any[], statusIds: any[]) => {
  const orders = [];
  
  for (let i = 0; i < count; i++) {
    const user = randomItem(userIds);
    const orderProducts = [];
    const productsCount = randomInt(1, 4);
    
    for (let j = 0; j < productsCount; j++) {
      const product = randomItem(productIds);
      orderProducts.push({
        product: product._id,
        quantity: randomInt(1, 3)
      });
    }

    const sum = orderProducts.reduce((acc, item) => {
      const prod = productIds.find(p => p._id.toString() === item.product.toString());
      const price = prod?.price || 0;
      const discount = prod?.discount || 0;
      return acc + price * (1 - discount / 100) * item.quantity;
    }, 0);

    orders.push({
      user,
      products: orderProducts,
      count: orderProducts.reduce((a, b) => a + b.quantity, 0),
      sum: Math.round(sum * 100) / 100,
      payed: Math.random() > 0.3,
      status: randomItem(statusIds)?._id,
      dateSending: randomDate(new Date(2024, 0, 1), new Date()),
      dateArrivedPoint: randomDate(new Date(2024, 0, 1), new Date(2025, 11, 31)),
      dateFinal: randomDate(new Date(2024, 0, 1), new Date(2025, 11, 31)),
      adressPoint: randomItem([
        'ПВЗ Москва, ул. Тверская, 1',
        'ПВЗ СПб, Невский пр., 10',
        'ПВЗ Казань, ул. Баумана, 5',
        'ПВЗ Екатеринбург, пр. Ленина, 20'
      ])
    });
  }
  return orders;
};

const generateBaskets = (userIds: any[], productIds: any[]) => {
  const baskets = [];
  
  for (const userId of userIds) {
    if (Math.random() > 0.3) continue;
    
    const itemsCount = randomInt(1, 3);
    for (let i = 0; i < itemsCount; i++) {
      baskets.push({
        user: userId,
        product: randomItem(productIds)._id,
        count: randomInt(1, 2)
      });
    }
  }
  return baskets;
};

const generateLovers = (userIds: any[], productIds: any[]) => {
  const lovers = [];
  const added = new Set<string>();
  
  for (const userId of userIds) {
    if (Math.random() > 0.6) continue;
    
    const itemsCount = randomInt(1, 5);
    for (let i = 0; i < itemsCount; i++) {
      const productId = randomItem(productIds)._id.toString();
      const key = `${userId}-${productId}`;
      
      if (!added.has(key)) {
        added.add(key);
        lovers.push({
          user: userId,
          product: productId
        });
      }
    }
  }
  return lovers;
};

const connectDB = async () => {
  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  } as mongoose.ConnectOptions);
};

const clearCollections = async () => {
  await Authorithation.deleteMany({});
  await Users.deleteMany({});
  await Roles.deleteMany({});
  await Status.deleteMany({});
  await Types.deleteMany({});
  await Category.deleteMany({});
  await Products.deleteMany({});
  await Pet.deleteMany({});
  await Orders.deleteMany({});
  await Basket.deleteMany({});
  await Lovers.deleteMany({});
};

const seedReferences = async () => {
  const ROLES = ['admin', 'user', 'vet'];
  for (const name of ROLES) {
    await Roles.findOneAndUpdate({ name }, { name }, { upsert: true, new: true });
  }

  const STATUSES = ['new', 'processing', 'shipped', 'delivered', 'cancelled'];
  for (const name of STATUSES) {
    await Status.findOneAndUpdate({ name }, { name }, { upsert: true, new: true });
  }

  const TYPES = ['Корм', 'Лакомства', 'Игрушки', 'Аксессуары', 'Ветеринария', 'Гигиена'];
  for (const name of TYPES) {
    await Types.findOneAndUpdate({ name }, { name }, { upsert: true, new: true });
  }

  const CATEGORIES = ['Для собак', 'Для кошек', 'Для птиц', 'Для грызунов', 'Для рыб', 'Универсальное'];
  for (const name of CATEGORIES) {
    await Category.findOneAndUpdate({ name }, { name }, { upsert: true, new: true });
  }
};

const seedUsersWithAuth = async (count: number) => {
  const usersData = generateUsers(count);
  const userIds = [];

  const rolesMap = new Map();
  for (const roleName of ['admin', 'user', 'vet']) {
    const role = await Roles.findOne({ name: roleName });
    if (role) rolesMap.set(roleName, role._id);
  }

  for (const userData of usersData) {
    const existingAuth = await Authorithation.findOne({ login: userData.login });
    if (existingAuth) continue;

    const roleId = rolesMap.get(userData.role);
    if (!roleId) continue;

    const user = await Users.create({
      mail: userData.mail,
      phone: userData.phone,
      role: roleId,
      status: userData.status
    });

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    await Authorithation.create({
      login: userData.login,
      password: hashedPassword,
      user: user._id,
      isVerified: true
    });

    userIds.push(user._id);
  }
  return userIds;
};

const seedProducts = async (count: number) => {
  const typesMap = new Map();
  const categoriesMap = new Map();
  
  for (const type of await Types.find()) typesMap.set(type.name, type._id);
  for (const cat of await Category.find()) categoriesMap.set(cat.name, cat._id);

  const products = generateProducts(count, typesMap, categoriesMap);
  
  for (const productData of products) {
    const existing = await Products.findOne({ name: productData.name });
    if (existing) continue;
    await Products.create(productData);
  }
  
  return await Products.find().lean();
};

const seedPets = async (count: number, userIds: any[]) => {
  if (userIds.length === 0) return;
  const pets = generatePets(count, userIds);
  for (const petData of pets) {
    await Pet.create(petData);
  }
};

const seedOrders = async (count: number, userIds: any[], productIds: any[]) => {
  if (userIds.length === 0 || productIds.length === 0) return;
  const statusIds = await Status.find().lean();
  const orders = generateOrders(count, userIds, productIds, statusIds);
  for (const orderData of orders) {
    await Orders.create(orderData);
  }
};

const seedBaskets = async (userIds: any[], productIds: any[]) => {
  if (userIds.length === 0 || productIds.length === 0) return;
  const baskets = generateBaskets(userIds, productIds);
  for (const basketData of baskets) {
    await Basket.create(basketData);
  }
};

const seedLovers = async (userIds: any[], productIds: any[]) => {
  if (userIds.length === 0 || productIds.length === 0) return;
  const lovers = generateLovers(userIds, productIds);
  for (const loverData of lovers) {
    await Lovers.create(loverData);
  }
};

const runSeed = async () => {
  try {
    await connectDB();

    if (DROP_DB) {
      await clearCollections();
    }

    await seedReferences();
    const userIds = await seedUsersWithAuth(20);
    const products = await seedProducts(50);
    await seedPets(50, userIds);
    await seedOrders(30, userIds, products);
    await seedBaskets(userIds, products);
    await seedLovers(userIds, products);

  } catch (error) {
    console.error('Ошибка при сидинге:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runSeed();