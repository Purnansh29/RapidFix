const mongoose = require('mongoose');

async function inspect() {
  try {
    await mongoose.connect('mongodb://localhost:27017/rapidfix');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Local MongoDB Collections:');
    let totalDocs = 0;
    for (const c of collections) {
      const count = await mongoose.connection.db.collection(c.name).countDocuments();
      console.log(`- ${c.name}: ${count} documents`);
      totalDocs += count;
    }
    console.log(`TOTAL DOCUMENTS ACROSS ALL COLLECTIONS: ${totalDocs}`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Connection error:', err.message);
  }
}

inspect();
