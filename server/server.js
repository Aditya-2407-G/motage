import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import renderRoutes from './routes/render.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Increase timeout for large renders
app.timeout = 300000; // 5 minutes

// Middleware
app.use(cors({
  origin: [
    'https://motage.onrender.com',     // Your production frontend URL
    'http://localhost:5173',           // Your local development frontend URL
    'https://motage.vercel.app'        // If you're also deploying frontend to Vercel
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/render', renderRoutes);

// Serve rendered videos with appropriate headers
app.use('/rendered', express.static(path.join(__dirname, 'rendered'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Cross-Origin-Embedder-Policy', 'require-corp');
    res.set('Cross-Origin-Opener-Policy', 'same-origin');
  }
}));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


