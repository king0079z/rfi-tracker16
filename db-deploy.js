const { execSync } = require('child_process');
const path = require('path');

async function deployDatabase() {
  try {
    console.log('Starting database deployment...');
    
    // Run Prisma migrations
    console.log('Running database migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    console.log('Database deployment completed successfully!');
  } catch (error) {
    console.error('Error during database deployment:', error);
    process.exit(1);
  }
}

deployDatabase();