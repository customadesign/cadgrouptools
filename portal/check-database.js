const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    // List all databases
    const adminDb = client.db().admin();
    const dbList = await adminDb.listDatabases();
    
    console.log('\nAvailable databases:');
    dbList.databases.forEach(db => {
      console.log(`- ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // Check cadtools database collections
    const db = client.db('cadtools');
    const collections = await db.listCollections().toArray();
    
    console.log('\nCollections in cadtools database:');
    for (const coll of collections) {
      const collection = db.collection(coll.name);
      const count = await collection.countDocuments();
      console.log(`- ${coll.name}: ${count} documents`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkDatabase();