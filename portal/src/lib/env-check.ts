/**
 * Environment variable validation and checking
 * This ensures all required environment variables are properly set
 */

const requiredEnvVars = [
  'MONGODB_URI',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
] as const;

const optionalEnvVars = [
  'DB_NAME',
  'NODE_ENV',
  'PORT',
] as const;

export function checkEnvironmentVariables() {
  const missing: string[] = [];
  const warnings: string[] = [];
  
  // Check required variables
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  // Check for common issues
  if (process.env.NEXTAUTH_URL) {
    const url = process.env.NEXTAUTH_URL;
    
    // Check if URL is properly formatted
    try {
      new URL(url);
    } catch {
      warnings.push(`NEXTAUTH_URL is not a valid URL: ${url}`);
    }
    
    // Warn if using localhost in production
    if (process.env.NODE_ENV === 'production' && url.includes('localhost')) {
      warnings.push('NEXTAUTH_URL contains "localhost" in production environment');
    }
    
    // Check if URL matches deployment URL for Render.com
    if (process.env.NODE_ENV === 'production' && !url.includes('cadgrouptools')) {
      warnings.push('NEXTAUTH_URL might not match your deployment URL');
    }
  }
  
  // Check NEXTAUTH_SECRET strength
  if (process.env.NEXTAUTH_SECRET) {
    if (process.env.NEXTAUTH_SECRET.length < 32) {
      warnings.push('NEXTAUTH_SECRET should be at least 32 characters long for security');
    }
    if (process.env.NEXTAUTH_SECRET === 'your-secret-key-change-in-production') {
      warnings.push('NEXTAUTH_SECRET is using the default value - please change it!');
    }
  }
  
  // Check MongoDB URI
  if (process.env.MONGODB_URI) {
    if (!process.env.MONGODB_URI.startsWith('mongodb://') && 
        !process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
      warnings.push('MONGODB_URI should start with mongodb:// or mongodb+srv://');
    }
  }
  
  // Log results
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('Please set these variables in your .env.local file or deployment environment');
    
    // Provide helpful messages for each missing variable
    missing.forEach(varName => {
      switch (varName) {
        case 'NEXTAUTH_SECRET':
          console.error(`  ${varName}: Generate with: openssl rand -base64 32`);
          break;
        case 'NEXTAUTH_URL':
          console.error(`  ${varName}: Set to your deployment URL (e.g., https://cadgrouptools.onrender.com)`);
          break;
        case 'MONGODB_URI':
          console.error(`  ${varName}: Your MongoDB connection string`);
          break;
      }
    });
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️  Environment variable warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  // Log successful configuration
  if (missing.length === 0 && warnings.length === 0) {
    console.log('✅ All environment variables are properly configured');
  }
  
  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  };
}

// Run check immediately when module is imported
if (typeof window === 'undefined') {
  checkEnvironmentVariables();
}