import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors, { CorsOptions } from 'cors';  
import authRouter from './utils/router';
dotenv.config();

const app = express();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/myapp';


const corsOptions: CorsOptions = {

  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',

    ];
    
  
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  

  credentials: true,
  

  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  

  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  

  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  

  maxAge: 600, 
  
 
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


app.get('/', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    message: 'ZooBack API is running', 
    timestamp: new Date().toISOString() 
  });
});


app.use('/api/auth', authRouter);



app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`[ERROR] ${new Date().toISOString()} | ${req.method} ${req.originalUrl}`, err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Внутренняя ошибка сервера';
  const isDev = process.env.NODE_ENV === 'development';
  
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(isDev && { stack: err.stack, details: err.details })
  });
});


const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(' Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(` Server listening on port ${PORT}`);
      console.log(` API available at http://localhost:${PORT}/api`);
      console.log(` CORS allowed for: localhost:5173`);
    });

  } catch (error) {
    console.error(' Failed to start server:', error);
    
    if (error instanceof mongoose.Error || (error as any).code === 'ECONNREFUSED') {
      console.log(' Retrying MongoDB connection in 5s...');
      setTimeout(startServer, 5000);
    } else {
      process.exit(1);
    }
  }
};

startServer();