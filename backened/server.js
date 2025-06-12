//const express = require('express');
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { sql } from './config/db.js'; // Import the database connection
import productRoutes from './routes/productRoutes.js';


import { aj } from './lib/arcjet.js'; // Import Arcjet middleware

dotenv.config();// Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 3000; // Default to port 3000 if not specified in .env 


// Middleware setup
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

//apply arcjet rate limiting to all routes
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

app.use('/api/products', productRoutes);


async function initDB() {
  try{
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
    ;
    console.log('Database initialized successfully');
  }catch (error) {
    console.error('Error initializing the database:', error);
  }
}

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to initialize the database:', error);
  process.exit(1); // Exit the process if database initialization fails
});