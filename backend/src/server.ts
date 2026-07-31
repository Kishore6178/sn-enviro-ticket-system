import dotenv from 'dotenv';
// Load env vars immediately
dotenv.config();

import app from './app';
import connectDB from './config/db';

// Connect to database
connectDB();

import http from 'http';
import { initSocket } from './socket';
import { initSLAMonitor } from './cron/slaMonitor';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Initialize Background Cron Jobs
initSLAMonitor();

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
