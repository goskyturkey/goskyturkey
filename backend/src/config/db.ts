import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        const conn = await mongoose.connect(mongoUri);
        console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`MongoDB Connection Error: ${errorMessage}`);
        process.exit(1);
    }
};

export default connectDB;
