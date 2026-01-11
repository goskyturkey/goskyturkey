
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Hardcoded connection string for reliability
const MONGO_URI = 'mongodb://127.0.0.1:27017/goskyturkey';

const resetAdmin = async () => {
    try {
        console.log('Connecting to DB at:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const email = 'admin@goskyturkey.com';
        const rawPassword = 'Goskyturkey.2026';

        // 1. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(rawPassword, salt);
        console.log('Password hashed.');

        // 2. Access collection directly
        const db = mongoose.connection.db;
        const users = db.collection('users');

        // 3. Delete existing
        console.log(`Deleting existing user: ${email}`);
        await users.deleteOne({ email: email });

        // 4. Insert new
        console.log('Creating new admin user...');
        const newUser = {
            name: 'Super Admin',
            email: email,
            password: hashedPassword,
            role: 'admin',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            __v: 0
        };

        await users.insertOne(newUser);
        console.log('SUCCESS: Admin user reset completed!');

    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

resetAdmin();
