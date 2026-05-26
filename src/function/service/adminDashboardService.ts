import mongoose from 'mongoose';
import { Orders } from '../../models/Orders';
import { Products } from '../../models/Products';
import { Users } from '../../models/Users';

const FALLBACK_STATUS_MAP: Record<string, string> = {
  '6a0d78968c9a243088c4b24b': 'Новый',
  '6a0d78968c9a243088c4b24c': 'В обработке',
  '6a0d78968c9a243088c4b24d': 'Доставлен',
  '6a0d78968c9a243088c4b24e': 'Отменён',
  '6a0d78968c9a243088c4b251': 'Отправлен'
};

const DELIVERY_METHOD_MAP: Record<string, string> = {
  pickup: 'Самовывоз',
  courier: 'Курьер'
};

const PAYMENT_METHOD_MAP: Record<string, string> = {
  card: 'Картой онлайн',
  cash: 'Наличными'
};

let statusCache: Map<string, string> | null = null;
let cacheExpiresAt = 0;

const getStatusMap = async (): Promise<Map<string, string>> => {
  const now = Date.now();
  if (statusCache && now < cacheExpiresAt) return statusCache;

  const map = new Map<string, string>(Object.entries(FALLBACK_STATUS_MAP));

  try {
    const Status = mongoose.models.Status || mongoose.model('Status', new mongoose.Schema({ name: String }));
    const dbStatuses = await Status.find({}).lean();
    
    dbStatuses.forEach((s: any) => {
      const id = (s._id as mongoose.Types.ObjectId).toString();
      const name = s.name || FALLBACK_STATUS_MAP[id] || id;
      map.set(id, name);
    });
  } catch {
    console.warn('[Dashboard] Коллекция Status недоступна, используется резервная карта');
  }

  statusCache = map;
  cacheExpiresAt = now + 300000;
  return map;
};

const resolveStatus = (id: string | mongoose.Types.ObjectId | undefined, map: Map<string, string>): string => {
  if (!id) return 'Не указан';
  const key = typeof id === 'string' ? id : id.toString?.() || '';
  return map.get(key) || 'Другой';
};

const formatPrice = (value: number): string => 
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);

const formatDate = (date: string | Date): string => 
  new Date(date).toLocaleString('ru-RU', { 
    day: '2-digit', month: '2-digit', year: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  });

export const getAdminDashboard = async () => {
  const statusMap = await getStatusMap();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const pendingStatusIds = Array.from(statusMap.entries())
    .filter(([_, name]) => name === 'Новый' || name === 'В обработке')
    .map(([id]) => new mongoose.Types.ObjectId(id));

  const [
    totalOrders,
    totalRevenue,
    totalUsers,
    totalProducts,
    pendingOrders,
    lowStockProducts,
    todayOrders,
    todayRevenue,
    recentOrdersRaw,
    lowStockRaw,
    statusDistributionRaw
  ] = await Promise.all([
    Orders.countDocuments(),
    Orders.aggregate([{ $group: { _id: null, total: { $sum: '$sum' } } }]).then(r => r[0]?.total || 0),
    Users.countDocuments(),
    Products.countDocuments(),
    Orders.countDocuments({ status: { $in: pendingStatusIds } }),
    Products.countDocuments({ remains: { $lte: 5, $gt: 0 } }),
    Orders.countDocuments({ createdAt: { $gte: todayStart } }),
    Orders.aggregate([
      { $match: { createdAt: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: '$sum' } } }
    ]).then(r => r[0]?.total || 0),
    Orders.find()
      .populate('user', 'login mail')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('user sum status createdAt products deliveryMethod paymentMethod payed hasVetMedicine adressPoint city')
      .lean(),
    Products.find({ remains: { $lte: 5, $gt: 0 } })
      .select('name remains price')
      .limit(5)
      .sort({ remains: 1 })
      .lean(),
    Orders.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
  ]);

  const filteredRecent = recentOrdersRaw.filter((o: any) => resolveStatus(o.status, statusMap) !== 'Другой');

  const recentOrders = filteredRecent.map((o: any) => ({
    _id: o._id.toString(),
 
    user: {
      login: o.user?.login || '—',
      mail: o.user?.mail || undefined
    },
    sum: o.sum,
    sumFormatted: formatPrice(o.sum),
    status: resolveStatus(o.status, statusMap),
    deliveryMethod: DELIVERY_METHOD_MAP[o.deliveryMethod] || o.deliveryMethod || '—',
    paymentMethod: PAYMENT_METHOD_MAP[o.paymentMethod] || o.paymentMethod || '—',
    payedStatus: o.payed ? 'Оплачен' : 'Не оплачен',
    hasVetMedicine: o.hasVetMedicine ? 'Да' : 'Нет',
    city: o.city || '—',
    addressPoint: o.adressPoint || '—',
    createdAtFormatted: formatDate(o.createdAt),
    products: (o.products || []).map((p: any) => ({
      name: p.name || p.product?.name || 'Товар',
      quantity: p.quantity || 1
    }))
  }));

  const statusDistribution = statusDistributionRaw
    .map((item: any) => ({
      statusId: item._id ? item._id.toString() : 'unknown',
      statusName: resolveStatus(item._id, statusMap),
      count: item.count
    }))
    .filter(item => item.statusName !== 'Другой')
    .sort((a, b) => b.count - a.count);

  const lowStock = lowStockRaw.map((p: any) => ({
    _id: p._id.toString(),
    name: p.name,
    remains: p.remains,
    price: p.price,
    priceFormatted: formatPrice(p.price)
  }));

  return {
    stats: {
      totalOrders,
      totalRevenue,
      totalRevenueFormatted: formatPrice(totalRevenue),
      totalUsers,
      totalProducts,
      pendingOrders,
      lowStockProducts,
      todayOrders,
      todayRevenue,
      todayRevenueFormatted: formatPrice(todayRevenue)
    },
    recentOrders,
    lowStock,
    statusDistribution
  };
};