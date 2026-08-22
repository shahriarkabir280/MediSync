# 🔧 Environment Setup Guide

## ⚠️ IMPORTANT: You need to create a `.env` file!

The error you're seeing happens because the database credentials are missing.

---

## 📝 Step-by-Step Setup

### 1. Create `.env` File

In the project root directory, create a file named `.env`:

```bash
# In the project root (/Users/macbook/Documents/Projects/MediSync/)
touch .env
```

Or create it manually in your editor.

---

### 2. Get Your Database Credentials

#### Option A: Using Neon (Recommended - Free Tier Available)

1. Go to https://console.neon.tech/
2. Sign up or log in
3. Create a new project
4. Click "Connection Details"
5. Copy the connection string

It will look like:
```
postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

#### Option B: Using Another PostgreSQL Database

If you have your own PostgreSQL database, use those credentials.

---

### 3. Fill in Your `.env` File

Open the `.env` file and add:

```env
# Server Configuration
PORT=5000

# PostgreSQL Database Credentials
PGHOST=ep-cool-name-123456.us-east-2.aws.neon.tech
PGDATABASE=neondb
PGUSER=your_username
PGPASSWORD=your_password

# Arcjet Security Key
ARCJET_KEY=ajkey_test_your_key_here
```

**Replace with your actual values from Neon!**

---

### 4. Get Arcjet Key (Optional for Testing)

For development, you can use a test key or get a real one:

1. Go to https://app.arcjet.com/
2. Sign up for free
3. Create a new app
4. Copy your API key

Or temporarily use: `ajkey_test_development_key`

---

### 5. Example `.env` File

Here's a complete example (with fake values):

```env
PORT=5000

PGHOST=ep-cool-name-123456.us-east-2.aws.neon.tech
PGDATABASE=neondb
PGUSER=neondb_owner
PGPASSWORD=npg_abc123XYZ456def789

ARCJET_KEY=ajkey_test_abc123def456
```

---

## ✅ Verify Your Setup

After creating the `.env` file:

### 1. Test Database Connection
```bash
node -e "require('dotenv').config(); console.log('DB Host:', process.env.PGHOST)"
```

Should output your database host, not `undefined`.

### 2. Try Running the Server
```bash
npm run dev
```

Should start without connection errors.

### 3. Seed the Database
```bash
npm run seed
```

Should create sample data successfully.

---

## 🐛 Common Issues

### Issue 1: "ENOTFOUND undefined"
**Problem:** `.env` file doesn't exist or isn't in the right location  
**Solution:** Create `.env` in project root (same folder as `package.json`)

### Issue 2: "Authentication failed"
**Problem:** Wrong database credentials  
**Solution:** Double-check your Neon connection details

### Issue 3: "Cannot find module 'dotenv'"
**Problem:** Dependencies not installed  
**Solution:** Run `npm install`

---

## 📁 File Structure

Make sure your `.env` file is here:

```
MediSync/
├── .env                  👈 CREATE THIS FILE HERE
├── .env.example          (template provided)
├── package.json
├── backend/
│   ├── server.js
│   └── ...
└── frontend/
    └── ...
```

---

## 🔒 Security Notes

- ✅ `.env` is already in `.gitignore` (won't be committed to Git)
- ❌ Never share your `.env` file or commit it to GitHub
- ✅ Use `.env.example` as a template for others
- ✅ Keep your database password secure

---

## 🚀 Quick Start After Setup

Once your `.env` is configured:

```bash
# 1. Start the backend
npm run dev

# 2. In another terminal, seed data
npm run seed

# 3. In another terminal, start frontend
cd frontend && npm run dev
```

---

## 📞 Need Help?

If you're still having issues:

1. Make sure `.env` exists: `ls -la .env`
2. Check the file contents: `cat .env` (be careful not to share this!)
3. Verify Node.js version: `node --version` (should be v18+)
4. Check if dependencies are installed: `ls node_modules`

---

## 🎯 Next Steps

After creating your `.env` file:

1. ✅ Run `npm run dev` to start backend
2. ✅ Run `npm run seed` to create sample data
3. ✅ Start the frontend and test
4. 🎉 Enjoy your working dashboard!

