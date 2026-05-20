import dotenv from 'dotenv';
dotenv.config();

import './models';

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors, { CorsOptions } from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import Router from './utils/router';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27018/zoodb';

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'null'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Request-Headers'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'ZooBack API is running', timestamp: new Date().toISOString() });
});

app.use('/api/', Router);

app.use((req: Request, res: Response) => {
  res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.originalUrl} not found` });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`[ERROR] ${new Date().toISOString()} | ${req.method} ${req.originalUrl}`, err);
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Внутренняя ошибка сервера';
  const isDev = process.env.NODE_ENV === 'development';
  res.status(statusCode).json({ status: 'error', message, ...(isDev && { stack: err.stack, details: err.details }) });
});

const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    console.log('Registered models:', Object.keys(mongoose.models));
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
      console.log(`CORS allowed for: localhost:5173, 127.0.0.1:5173`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    if (error instanceof mongoose.Error || (error as any).code === 'ECONNREFUSED') {
      console.log('Retrying MongoDB connection in 5s...');
      setTimeout(startServer, 5000);
    } else {
      process.exit(1);
    }
  }
};

startServer();