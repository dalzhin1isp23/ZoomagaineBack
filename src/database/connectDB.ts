import mongoose from 'mongoose';

export const connectDB = async (uri: string) => {
  try {
    await mongoose.connect(uri);
    console.log('MongoDB подключена');
    return mongoose.connection;
  } catch (error) {
    console.error('Ошибка подключения:', error);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  console.log('отключена');
};