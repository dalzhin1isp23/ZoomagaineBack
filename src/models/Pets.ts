import mongoose from "mongoose";
const { Schema, model } = mongoose;

const petSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Имя питомца обязательно'],
    trim: true
  },
  
  photoUrl: { 
    type: String,
    default: '' 
  },
  
  folderColor: { 
    type: String,
    default: '#234cd3', 
    enum: [
      '#234cd3', 
      '#059669',
      '#7c3aed', 
      '#dc2626',
      '#d97706', 
      '#cacc3b', 
      '#f163d9', 
      '#15a0a5',
    ]
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
  }],
  personalWishlist: [{
    product: { 
      type: Schema.Types.ObjectId, 
      ref: "Products",
      required: true 
    },
  }]
  
}, { 
  timestamps: true,               
  toJSON: { virtuals: true },     
  toObject: { virtuals: true }
});


petSchema.index({ owner: 1, name: 1 }); 
petSchema.index({ animal: 1, gender: 1 }); 
petSchema.index({ 'documents.expiresAt': 1 }); 
petSchema.index({ 'documents.qrCode.code': 1 });
petSchema.index({ 'personalCart.product': 1 }); 
petSchema.index({ 'personalWishlist.product': 1 }); 

petSchema.virtual('ageYears').get(function(this: any) {
  if (!this.bornDate) return null;
  const diff = Date.now() - this.bornDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
});

petSchema.virtual('ageFormatted').get(function(this: any) {
  if (!this.bornDate) return 'Не указан';
  
  const birth = new Date(this.bornDate);
  const now = new Date();
  
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  if (years > 0) {
    return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'} ${months > 0 ? `и ${months} мес.` : ''}`.trim();
  }
  return `${months} ${months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'}`;
});

petSchema.virtual('cartItemsCount').get(function(this: any) {
  return this.personalCart?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0;
});

petSchema.methods.addToCart = function(productId: string, quantity: number = 1, note?: string) {
  const existing = this.personalCart.find((item: any) => 
    item.product.toString() === productId
  );
  
  if (existing) {
    existing.quantity += quantity;
  } else {
    this.personalCart.push({ product: productId, quantity, note });
  }
  
  return this.save();
};

petSchema.methods.removeFromCart = function(productId: string) {
  this.personalCart = this.personalCart.filter((item: any) => 
    item.product.toString() !== productId
  );
  return this.save();
};

petSchema.methods.addToWishlist = function(productId: string, reason?: string) {
  const exists = this.personalWishlist.some((item: any) => 
    item.product.toString() === productId
  );
  
  if (!exists) {
    this.personalWishlist.push({ product: productId, reason });
    return this.save();
  }
  return Promise.resolve(this);
};

petSchema.methods.removeFromWishlist = function(productId: string) {
  this.personalWishlist = this.personalWishlist.filter((item: any) => 
    item.product.toString() !== productId
  );
  return this.save();
};


petSchema.statics.findByOwner = function(ownerId: string, filters?: { animal?: string; tags?: string[] }) {
  const query: any = { owner: ownerId };
  
  if (filters?.animal) {
    query.animal = filters.animal;
  }
  
  if (filters?.tags?.length) {
    query.tags = { $in: filters.tags };
  }
  
  return this.find(query).sort({ createdAt: -1 });
};


petSchema.statics.findExpiringDocuments = function(daysAhead: number = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  
  return this.find({
    'documents.expiresAt': {
      $lte: futureDate,
      $gte: new Date()
    }
  }).populate('owner');
};

export const Pet = model('Pet', petSchema);