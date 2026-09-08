const mongoose = require('mongoose');

// Usage: node scripts/migrate-to-atlas.js "mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/rapidfix?retryWrites=true&w=majority"

const LOCAL_URI = 'mongodb://localhost:27017/rapidfix';
const ATLAS_URI = process.argv[2] || process.env.ATLAS_URI;

if (!ATLAS_URI) {
  console.error('\n❌ ERROR: Please provide your MongoDB Atlas connection string!');
  console.error('Example: node scripts/migrate-to-atlas.js "mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/rapidfix?retryWrites=true&w=majority"\n');
  process.exit(1);
}

async function migrate() {
  console.log('🚀 Starting RapidFix Local MongoDB -> MongoDB Atlas Migration...\n');

  let localConn, atlasConn;
  try {
    // 1. Connect to Local DB
    console.log('📡 Connecting to Local MongoDB (Compass data)...');
    localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('✅ Connected to Local MongoDB.');

    // 2. Connect to Atlas DB
    console.log('\n📡 Connecting to MongoDB Atlas Cloud...');
    atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
    console.log('✅ Connected to MongoDB Atlas Cloud.');

    // 3. List of collections to migrate
    const collectionsToMigrate = [
      'users',
      'workerprofiles',
      'jobs',
      'payments',
      'reviews',
      'messages'
    ];

    console.log('\n📦 Migrating Collections...');
    let totalMigrated = 0;

    for (const colName of collectionsToMigrate) {
      const localCol = localConn.collection(colName);
      const atlasCol = atlasConn.collection(colName);

      const docs = await localCol.find({}).toArray();
      if (docs.length === 0) {
        console.log(`- ${colName}: 0 documents (skipped)`);
        continue;
      }

      // Optional: Clear existing in Atlas before fresh import
      await atlasCol.deleteMany({});

      // Insert all docs
      const result = await atlasCol.insertMany(docs);
      console.log(`- ${colName}: Migrated ${result.insertedCount} documents successfully.`);
      totalMigrated += result.insertedCount;
    }

    console.log(`\n🎉 MIGRATION COMPLETE! Total ${totalMigrated} documents migrated to MongoDB Atlas!`);

    // 4. Verify indexes in Atlas
    try {
      console.log('\n🔧 Ensuring 2dsphere indexes for geospatial search...');
      await atlasConn.collection('jobs').createIndex({ location: '2dsphere' });
      await atlasConn.collection('workerprofiles').createIndex({ location: '2dsphere' });
      console.log('✅ Geospatial indexes created.');
    } catch (idxErr) {
      console.warn('Index creation notice:', idxErr.message);
    }

  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
  } finally {
    if (localConn) await localConn.close();
    if (atlasConn) await atlasConn.close();
    console.log('\n🔒 Connections closed cleanly.');
  }
}

migrate();
