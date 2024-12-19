const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma-client');
const ErrorHandler = require('../utils/ErrorHandler');
const { excludeKeys } = require('../utils/excludeProps');

// Register
const registerUser = async (name, email, password, role) => {
    // Check if email already exists
    const isEmailExists = await prisma.user.findUnique({
        where: {
            email,
        },
    });

    // If email is already registered throw error
    if (isEmailExists) {
        throw new ErrorHandler('Email already exists', 409, 'EMAIL_ERROR', {
            field: 'email',
        });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role,
        },
    });

    const user = excludeKeys(['password'], newUser);

    return user;
};

// Login
const loginUser = async (email, password) => {
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        //return res.status(404).json({ message: 'User not found' });
        throw new ErrorHandler('User not found', 404, 'NOT_FOUND_ERROR', { field: 'user' });
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        // return res.status(401).json({ message: 'Invalid credentials' });
        throw new ErrorHandler('Invalid credentials', 401, 'CREDENTIALS_ERROR', { field: 'user' });
    }

    // Generate JWT
    const token = jwt.sign(
        {
            id: user.id,
            role: user.role,
            name: user.name,
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '1h' }
    );

    let data = {
        token,
        role: user.role,
    };

    return data;
};

// Middleware to verify the token
const verifyUser = (authHeader) => {
    // Check if the token is provided
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ErrorHandler('Access token is missing or invalid', 401, 'TOKEN_ERROR', { field: 'authorization' });
    }

    const token = authHeader.split(' ')[1]; // Extract the token
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        return decoded;
    } catch (error) {
        throw new ErrorHandler('Invalid access token', 401, 'TOKEN_ERROR', { field: 'authorization' });
    }
};

module.exports = { registerUser, loginUser, verifyUser };