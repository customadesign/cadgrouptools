const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function renameDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const sourceDb = client.db('test');
    const targetDb = client.db('cadgroupmgt');
    
    // Get all collections from source database
    const collections = await sourceDb.listCollections().toArray();
    console.log(`\nFound ${collections.length} collections in 'test' database to migrate`);
    
    // Process each collection
    for (const collInfo of collections) {
      const collName = collInfo.name;
      console.log(`\nProcessing collection: ${collName}`);
      
      const sourceCollection = sourceDb.collection(collName);
      const targetCollection = targetDb.collection(collName);
      
      // Count documents in source
      const count = await sourceCollection.countDocuments();
      console.log(`  - Found ${count} documents`);
      
      if (count > 0) {
        // Get all documents from source
        const documents = await sourceCollection.find({}).toArray();
        
        // Check if target collection already exists and has data
        const targetCount = await targetCollection.countDocuments();
        if (targetCount > 0) {
          console.log(`  - Target collection already has ${targetCount} documents, skipping...`);
          continue;
        }
        
        // Insert into target database
        const result = await targetCollection.insertMany(documents);
        console.log(`  - Copied ${result.insertedCount} documents to cadgroupmgt.${collName}`);
      }
    }
    
    // Verify the migration
    console.log('\n=== Migration Summary ===');
    for (const collInfo of collections) {
      const collName = collInfo.name;
      const sourceCount = await sourceDb.collection(collName).countDocuments();
      const targetCount = await targetDb.collection(collName).countDocuments();
      const match = sourceCount === targetCount ? '✓' : '✗';
      console.log(`${collName}: source=${sourceCount}, target=${targetCount}, match=${match}`);
    }
    
    console.log('\n✅ Database migration completed!');
    console.log('New database name: cadgroupmgt');
    console.log('\nNext steps:');
    console.log('1. Update DB_NAME=cadgroupmgt in your .env.local file');
    console.log('2. Update DB_NAME=cadgroupmgt in Render environment variables');
    console.log('3. Optionally drop the test database after verifying everything works');
    
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await client.close();
  }
}

renameDatabase();