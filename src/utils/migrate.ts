import 'dotenv/config';
import mongoose from 'mongoose';
import migrate from 'migrate-mongo';
import config from '../../migrate-mongo-config';

async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI!, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

async function disconnectDB() {
  await mongoose.disconnect();
}

async function run(direction: 'up' | 'down' | 'status') {
  await connectDB();
  
  try {
    if (direction === 'up') {
      await migrate.up(config);
      console.log(' Миграции применены');
    } else if (direction === 'down') {
      await migrate.down(config);
      console.log(' Последняя миграция откатана');
    } else if (direction === 'status') {
      const { db, client } = await migrate.connect(config);
      const status = await migrate.status(config);
      status.forEach((m: any) => {
        console.log(`${m.applied ? '1' : '0'} ${m.fileName}`);
      });
      await migrate.close(db, client);
    }
  } catch (err) {
    console.error('Ошибка:', err);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

const command = process.argv[2] as 'up' | 'down' | 'status' || 'up';
run(command);