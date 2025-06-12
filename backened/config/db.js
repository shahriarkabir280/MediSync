import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

const { PGHOST,PGDATABASE,PGUSER,PGPASSWORD } = process.env;


//create a connection to the Neon database using environment variables
export const sql = neon(
    `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?sslmode=require`
)