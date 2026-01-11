
import mongoose from 'mongoose';
import User from './models/User';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const testLogin = async () => {
    try {
        console.log('Connecting to DB...');
        // Use the connection string from docker-compose or .env
        const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/goskyturkey';
        console.log('MONGO_URI:', MONGO_URI);

        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const email = 'admin@goskyturkey.com';
        const password = 'Goskyturkey.2026';

        console.log(`Searching for user: ${email}`);
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            console.log('User not found!');
            process.exit(1);
        }

        console.log('User found:', user.email);
        console.log('Stored Password Hash:', user.password);

        console.log('Comparing password...');
        const isMatch = await user.comparePassword(password);
        console.log('Password Match Result:', isMatch);

        if (isMatch) {
            console.log('Login Successful!');
        } else {
            console.log('Login Failed: Password mismatch');
        }

    } catch (error) {
        console.error('ERROR OCCURRED:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

testLogin();
