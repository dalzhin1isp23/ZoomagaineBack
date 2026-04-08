require('dotenv').config();

module.exports = {
  mongodb: {
    url: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017",
    databaseName: process.env.MONGODB_URI?.split('/').pop()?.split('?')[0] || "pet_shop",
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },
  migrationsDir: "src/migrations",
  changelogCollectionName: "changelog",
  migrationFileExtension: ".ts", 
  useFileHash: false,
};