import mongoose from 'mongoose';
import { config } from 'dotenv';
config();

const MONGODB_URI = process.env.MONGODB_URI;

export async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a MongoDB - Base de datos: cinar');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
}

export default mongoose;
