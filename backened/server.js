

//const express = require('express');
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
// import { sql } from './config/db.js'; // REMOVED: Using Supabase SDK
import productRoutes from './routes/productRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import labRoutes from './routes/labRoutes.js';
import websiteRoutes from './routes/websiteRoutes.js';
import authRoutes from './routes/authRoutes.js';
import helpRoutes from './routes/helpRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import { initializeWebSocket } from './lib/websocketServer.js';
// import { createChatSchema } from './schemas/chatSchema.js'; // REMOVED: Managed via schema.sql
// import { initWebsiteTables } from './sampleData/websiteTables.js'; // Disabled to prevent auto-adding data

// import { aj } from './lib/arcjet.js'; // Import Arcjet middleware - DISABLED FOR DEVELOPMENT

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the backened folder
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000; // Default to port 3000 if not specified in .env 

// Configure CORS to allow frontend requests
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175'
];

// Add Railway frontend URL from environment variable
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list or matches Railway pattern
    if (allowedOrigins.includes(origin) || (origin && origin.includes('.railway.app'))) {
      return callback(null, true);
    }

    // Log rejected origins for debugging
    console.log('CORS rejected origin:', origin);
    callback(null, true); // TEMPORARY: Allow all for debugging
    // callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Configure helmet with CSP
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      "frame-ancestors": ["'self'", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5175", "http://localhost:3001"],
      "img-src": ["'self'", "data:", "blob:", "http://localhost:3001", "http://localhost:5173"],
      "font-src": ["'self'", "data:", "http://localhost:3001", "http://localhost:5173"],
      "connect-src": ["'self'", "http://localhost:3001", "ws://localhost:3001", "wss://localhost:3001", "http://localhost:5173", "ws://localhost:5173"],
    },
  },
}));

app.use(morgan('dev'));

// Middleware setup
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve uploaded files statically with absolute path
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

//apply arcjet rate limiting to all routes - DISABLED FOR DEVELOPMENT
/*
app.use(async (req, res, next) => {
  try {
    const decision = await aj.protect(req,{
      requested:1
    })
   
    if(decision.isDenied()){
      if(decision.reason.isRateLimit()){
        res.status(429).json({
          error:"Too many requests, please try again later.",
        });
      }
      else if(decision.reason.isBot()){
        res.status(403).json({
          error:"Bot access denied.",
        });
      }
      else{
        res.status(403).json({
          error:"Forbidden access.",
        });
      }
      return;
    }
    if(decision.results.some((result)=> result.reason.isBot() && result.reason.isSpoofed())){
      res.status(403).json({
        error: "Spoofed bot detected, access denied.",  
      });
      return;
    }

     next();
  }
  catch(error){
    console.log("Arcjet error:", error);
    next(error); // Pass the error to the next middleware
  }
});
*/


app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Product routes
app.use('/api/products', productRoutes);

// Doctor Dashboard routes
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/prescriptions', prescriptionRoutes);

// File upload routes
app.use('/api', fileRoutes);

// Laboratory routes
app.use('/api/lab', labRoutes);

// Website/Profile routes
app.use('/api/website', websiteRoutes);

// Authentication routes
app.use('/api/auth', authRoutes);

// Help & Support routes
app.use('/api/help', helpRoutes);

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ CareConnect server running on http://localhost:${PORT}`);
});

// Initialize WebSocket for real-time chat
initializeWebSocket(server);