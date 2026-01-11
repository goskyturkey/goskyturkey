
import mongoose from 'mongoose';
import User from './models/User';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const resetAdmin = async () => {
    try {
        console.log('Connecting to DB...');
        // Force localhost for running from host machine
        const MONGO_URI = 'mongodb://localhost:27017/goskyturkey';
        console.log('MONGO_URI:', MONGO_URI);

        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const email = 'admin@goskyturkey.com';
        const password = 'Goskyturkey.2026';

        // 1. Delete existing admin
        console.log(`Deleting existing user: ${email}`);
        await User.deleteOne({ email });

        // 2. Create new admin
        console.log('Creating new admin user...');
        const admin = new User({
            name: 'Super Admin',
            email: email,
            password: password, // Pre-save hook will hash this
            role: 'admin',
            isActive: true
        });

        await admin.save();
        console.log('Admin user created successfully!');
        console.log('Email:', email);
        console.log('Password:', password);

    } catch (error) {
        console.error('ERROR OCCURRED:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

resetAdmin();
