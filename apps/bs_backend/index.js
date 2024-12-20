const express = require('express');
const cors = require('cors');
// const helmet = require('helmet');

const authRoutes = require('./routes/auth.routes');
const { verifyToken, authorizeRoles } = require('./controllers/auth.controller');
const { requestLogger, logger } = require('./utils/loggingHandler');
const roleBasedLimiter = require('./utils/rateLimitHandler');
const ErrorHandler = require('./utils/ErrorHandler');

const app = express();

const PORT = process.env.PORT || 8800;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Security middleware
// app.use(helmet());
// app.use(
//     cors({
//         origin: 'http://localhost:3001',
//         methods: ['GET', 'POST', 'PUT', 'DELETE'],
//         allowedHeaders: ['Content-Type', 'Authorization'],
//     })
// );
app.use(requestLogger);

app.use('/api/auth', authRoutes);

app.get('/api/test1', roleBasedLimiter('admin'), verifyToken, authorizeRoles(['admin']), (req, res) => {
    res.send('Hello Admin!');
});
app.get('/api/test2', roleBasedLimiter('employee'), verifyToken, authorizeRoles(['employee']), (req, res) => {
    res.send('Hello Employee!');
});
app.get('/api/test3', roleBasedLimiter('customer'), verifyToken, authorizeRoles(['customer']), (req, res) => {
    res.send('Hello Customer!');
});

// Catch-All Route for Undefined Routes
app.use((req, res, next) => {
    // Create an instance of ErrorHandler for undefined routes
    throw new ErrorHandler(`Cannot ${req.method} ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND', { field: 'route' });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
    logger.warn(err.message);
    // Customize the response
    res.status(err.status || 500).json({
        statusCode: err.status,
        success: false,
        message: err.message || 'Internal Server Error',
        errorCode: err.errorCode,
        errorDetails: err.details,
    });
});

app.listen(PORT, () => {
    // console.log(`Example app listening on port ${PORT}`);
    logger.info(`Example app listening on port ${PORT}`);
});
