const express = require('express');
const next = require('next');
const compression = require('compression');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const PORT = process.env.PORT || 8080;

const generatePrismaClient = async () => {
  try {
    console.log('Starting Prisma Client generation process...');
    
    // Validate environment variables
    const requiredEnvVars = ['DATABASE_URL', 'DIRECT_URL'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    console.log('Environment validation:', {
      databaseUrlExists: !!process.env.DATABASE_URL,
      directUrlExists: !!process.env.DIRECT_URL,
      nodeEnv: process.env.NODE_ENV,
      platform: process.platform,
      arch: process.arch
    });
    
    // Set specific environment for Prisma
    const env = {
      ...process.env,
      PRISMA_CLIENT_ENGINE_TYPE: 'binary',
      NODE_ENV: process.env.NODE_ENV || 'production'
    };

    // Generate Prisma Client
    console.log('Executing prisma generate...');
    const { stdout, stderr } = await execPromise('npx prisma generate', { env });
    if (stderr) console.warn('Prisma generation warnings:', stderr);
    if (stdout) console.log('Prisma generation output:', stdout);
    
    console.log('Prisma Client generated successfully');
    
    // Verify the client
    console.log('Verifying Prisma Client...');
    const { PrismaClient } = require('@prisma/client');
    const testClient = new PrismaClient({
      log: ['error', 'warn']
    });
    
    await testClient.$connect();
    console.log('Database connection test successful');
    await testClient.$disconnect();
    
    console.log('Prisma Client verification completed successfully');
  } catch (error) {
    console.error('Error in Prisma Client generation or verification:', error);
    console.error('Full error details:', {
      message: error.message,
      stack: error.stack,
      command: error.cmd,
      stdout: error.stdout,
      stderr: error.stderr
    });
    throw error;
  }
};

const startServer = async () => {
  try {
    // Generate Prisma Client before starting the server
    await generatePrismaClient();
    
    await app.prepare();
    const server = express();

    // Enable gzip compression
    server.use(compression());
    server.use(express.json());

    // Health check endpoint
    server.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasDbConnection: !!process.env.DATABASE_URL
        }
      });
    });

    // Handle all other routes with Next.js
    server.all('*', (req, res) => {
      return handle(req, res);
    });

    // Start listening
    server.listen(PORT, () => {
      console.log(`> Ready on port ${PORT} [${process.env.NODE_ENV}]`);
      console.log(`Health check available at: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down gracefully...');
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('Failed to start server:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

startServer();