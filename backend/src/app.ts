import express, { Application } from 'express';
import cors from 'cors';
import { errorHandler, notFound } from './middleware/errorMiddleware';

// Route Imports
import authRoutes from './routes/authRoutes';
import stationRoutes from './routes/stationRoutes';
import ticketRoutes from './routes/ticketRoutes';
import employeeRoutes from './routes/employeeRoutes';
import userRoutes from './routes/userRoutes';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/stations', stationRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/users', userRoutes);

// Base route for health check
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

export default app;
