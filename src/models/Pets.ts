import mongoose from "mongoose";
const { Schema, model } = mongoose;

const petSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Имя питомца обязательно'],
    trim: true
  },
  bornDate: { type: Date },
  animal: {
    type: String,
    required: [true, 'Вид животного обязателен'],
    enum: ["Собака", "Кот", "Птица", "Грызун", "Пресмыкающееся", "Рыба", "Другое"],
    index: true 
  },
  gender: {
    type: String,
    enum: ["Мальчик", "Девочка"],
    required: [true, 'Пол обязателен'],
    index: true
  },
  breed: { type: String },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "Users",
    required: [true, 'Владелец обязателен'], 
    index: true 
  },
  tags: [{
    type: String,
    enum: [
      'Стерилизован', 'Вакцинирован', 'Чипирован', 'Аллергик', 'Хроническое заболевание',
      'Щенок', 'Взрослый', 'Сеньор', 'Беременная', 'Племенной',
      'Активный', 'Спокойный', 'Агрессивный', 'Дружелюбный', 'Шумный',
      'Домашний', 'Уличный', 'Питомник', 'Приют', 'На передержке'
    ]
  }],
  documents: [{
    title: { type: String, required: true },
    fileUrl: { type: String, required: true }, 
    fileType: { type: String, enum: ['pdf', 'jpg', 'png', 'docx'] },
    veterinaryData: {
      medicationName: String,    
      seriesNumber: String,       
      manufacturer: String,        
      applicationDate: Date,           
    },
    qrCode: {
      code: String,           
      generatedAt: Date,       
      scannedCount: { type: Number, default: 0 }
    },
    uploadedAt: { type: Date, default: Date.now },
    expiresAt: Date,         
    isVerified: { type: Boolean, default: false } 
  }]
}, { 
  timestamps: true,               
  toJSON: { virtuals: true },     
  toObject: { virtuals: true }
});

petSchema.index({ 'documents.expiresAt': 1 });
petSchema.index({ 'documents.qrCode.code': 1 });

petSchema.virtual('ageYears').get(function(this: any) {
  if (!this.bornDate) return null;
  const diff = Date.now() - this.bornDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
});

export const Pet = model('Pet', petSchema);