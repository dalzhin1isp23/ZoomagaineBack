import 'dotenv/config';
import { glob } from 'glob';
import { dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { connectDB, disconnectDB } from './connectDB.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
  const MONGODB_URI = process.env.MONGODB_URI;
  
  try {
    await connectDB(MONGODB_URI);
    const db = (await import('mongoose')).default.connection.db;
    if (!db) throw new Error('Нет подключения к БД');

    const migrationsCollection = db.collection('migrations');

    const executedMigrations = await migrationsCollection.find().toArray();
    const executedNames = new Set(executedMigrations.map((m: any) => m.name));


    const migrationFiles = await glob('src/database/migrations/*.{ts,js}', {
      windowsPathsNoEscape: true 
    }).then(files => files.sort());

    console.log(` Найдено миграций: ${migrationFiles.length}`);
    console.log(` Уже выполнено: ${executedNames.size}`);

    let appliedCount = 0;


    for (const filePath of migrationFiles) {

      const fileName = filePath.split('/').pop()?.split('\\').pop();
      if (!fileName) continue;

      if (executedNames.has(fileName)) {
        console.log(` Пропущено: ${fileName}`);
        continue;
      }

      console.log(`Выполнение: ${fileName}`);
      

      const migrationUrl = pathToFileURL(filePath).href;
      
      try {

        const migration = await import(migrationUrl);
        
 
        await migration.up(db);

        await migrationsCollection.insertOne({
          name: fileName,
          executedAt: new Date()
        });
        
        appliedCount++;
        console.log(`   → Успешно`);
      } catch (err) {
        console.error(`   ❌ Ошибка в миграции ${fileName}:`, err);
        throw err;
      }
    }

    console.log(`\nМиграции завершены. Применено: ${appliedCount}`);

  } catch (error) {
    console.error(' Ошибка миграций:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

runMigrations();