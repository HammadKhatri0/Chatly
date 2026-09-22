import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

export const connectDB = async () => {
  const { connection } = await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 15000,
  });
  console.log(`MongoDB connected: ${connection.host}/${connection.name}`);
  return connection;
};

export const disconnectDB = () => mongoose.disconnect();
