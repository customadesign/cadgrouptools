import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME;

type CachedConnection = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: CachedConnection | undefined;
}

const globalForMongoose = global as unknown as { mongooseCache?: CachedConnection };

const cached: CachedConnection =
  globalForMongoose.mongooseCache || { conn: null, promise: null };

if (!globalForMongoose.mongooseCache) {
  globalForMongoose.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error('Missing MONGODB_URI in environment');
  }
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const uri = DB_NAME ? `${MONGODB_URI}/${DB_NAME}` : MONGODB_URI;

    cached.promise = mongoose
      .connect(uri, {
        // Mongoose 7+ uses stable defaults; keep options minimal
        maxPoolSize: 10,
        minPoolSize: 0,
        serverSelectionTimeoutMS: 5000,
      })
      .then((m) => m)
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export function getConnectionState(): 'disconnected' | 'connected' | 'connecting' | 'disconnecting' {
  switch (mongoose.connection.readyState) {
    case 0:
      return 'disconnected';
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      return 'disconnected';
  }
}


