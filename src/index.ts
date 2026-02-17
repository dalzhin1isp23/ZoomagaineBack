import express from 'express';
import mongoose from 'mongoose';
import * as Models from './models'; 

const app = express();
app.use(express.json());

const PORT = 3000;

app.get('/api/:modelName', async (req, res) => {
    try {
        const { modelName } = req.params;
        

        const Model = (Models as any)[modelName];
        
        if (!Model) {
            return res.status(404).json({ error: `Модель ${modelName} не найдена` });
        }

        const data = await Model.find().lean();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

async function startApp() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/pet_shop');
        console.log(" База данных подключена");

        app.listen(PORT, () => {
            console.log(`API запущен на http://localhost:${PORT}`);
            console.log(`Доступные модели: ${Object.keys(Models).join(', ')}`);
        });
    } catch (error) {
        console.error("Ошибка запуска:", error);
    }
}

startApp();