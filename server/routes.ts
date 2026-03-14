import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from './db.js';
import { authenticateToken, AuthRequest } from './middleware.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';

// --- AUTH ROUTES ---
router.post('/auth/register', async (req, res) => {
  const { name, email, password, shopName } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        shopName,
        planId: 'plan_bronze',
        settings: {
          create: {
            slug: shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            businessHours: JSON.stringify([
              { day: 'Segunda-feira', open: '09:00', close: '18:00', closed: false },
              { day: 'Terça-feira', open: '09:00', close: '18:00', closed: false },
              { day: 'Quarta-feira', open: '09:00', close: '18:00', closed: false },
              { day: 'Quinta-feira', open: '09:00', close: '18:00', closed: false },
              { day: 'Sexta-feira', open: '09:00', close: '18:00', closed: false },
              { day: 'Sábado', open: '09:00', close: '14:00', closed: false },
              { day: 'Domingo', open: '00:00', close: '00:00', closed: true }
            ])
          }
        }
      }
    });

    const token = jwt.sign({ id: user.id, email, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name, email, shopName, role: 'admin' } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, shopName: user.shopName, role: user.role } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/auth/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { id: true, name: true, email: true, role: true, shopName: true, status: true, planId: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Usuário não encontrado' });

    // Generate a 6-digit token
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await (prisma.user as any).update({
      where: { email },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expires
      }
    });

    console.log(`[PASSWORD RESET] Token for ${email}: ${token}`);
    
    // In production, send email here. For now, returning success.
    res.json({ success: true, message: 'Token enviado para o console do servidor', token: process.env.NODE_ENV === 'development' ? token : undefined });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/reset-password', async (req, res) => {
  const { email, token, newPassword } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Usuário não encontrado' });

    if ((user as any).resetPasswordToken !== token) {
      return res.status(400).json({ error: 'Token inválido' });
    }

    if (!(user as any).resetPasswordExpires || (user as any).resetPasswordExpires < new Date()) {
      return res.status(400).json({ error: 'Token expirado' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await (prisma.user as any).update({
      where: { email },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    res.json({ success: true, message: 'Senha atualizada com sucesso' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- PROTECTED ROUTES ---

// Plans & Subscriptions
router.get('/subscription', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: { 
        subscription: {
          include: { plan: true }
        }
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.subscription) {
      const plan = user.subscription.plan as any;
      if (plan && typeof plan.features === 'string') {
        plan.features = JSON.parse(plan.features);
      }
      return res.json({ subscription: user.subscription, plan });
    } else {
      // Fallback to planId in User model
      const planId = user.planId || 'plan_bronze';
      const plan = await prisma.plan.findUnique({ where: { id: planId } }) as any;
      if (plan && typeof plan.features === 'string') {
        plan.features = JSON.parse(plan.features);
      }
      return res.json({ subscription: null, plan });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/subscription', authenticateToken, async (req: AuthRequest, res) => {
  const { planId, billingCycle } = req.body;
  const uid = req.user?.id as string;
  
  const currentPeriodEnd = new Date(Date.now() + (billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000);
  
  await prisma.subscription.upsert({
    where: { uid },
    update: { planId, status: 'active', currentPeriodEnd },
    create: { uid, planId, status: 'active', currentPeriodEnd }
  });
  
  res.json({ success: true });
});

// Settings
router.get('/settings', authenticateToken, async (req: AuthRequest, res) => {
  const settings = await prisma.setting.findUnique({ where: { uid: req.user?.id } }) as any;
  if (settings) {
    settings.businessHours = settings.businessHours ? JSON.parse(settings.businessHours) : [];
    settings.whatsappConfig = settings.whatsappConfig ? JSON.parse(settings.whatsappConfig) : null;
    settings.holidays = settings.holidays ? JSON.parse(settings.holidays) : [];
  }
  res.json(settings);
});

router.put('/settings', authenticateToken, async (req: AuthRequest, res) => {
  const { 
    slug, address, addressNumber, neighborhood, city, state, zipCode, cnpj,
    description, phone, instagram, facebook, tiktok,
    businessHours, whatsappConfig, holidays 
  } = req.body;
  await (prisma.setting as any).upsert({
    where: { uid: req.user?.id },
    update: {
      slug, address, addressNumber, neighborhood, city, state, zipCode, cnpj,
      description, phone, instagram, facebook, tiktok,
      businessHours: JSON.stringify(businessHours),
      whatsappConfig: JSON.stringify(whatsappConfig),
      holidays: JSON.stringify(holidays)
    },
    create: {
      uid: req.user?.id as string,
      slug, address, addressNumber, neighborhood, city, state, zipCode, cnpj,
      description, phone, instagram, facebook, tiktok,
      businessHours: JSON.stringify(businessHours),
      whatsappConfig: JSON.stringify(whatsappConfig),
      holidays: JSON.stringify(holidays)
    }
  });
  res.json({ success: true });
});

// Services
router.get('/services', authenticateToken, async (req: AuthRequest, res) => {
  const services = await prisma.service.findMany({ where: { ownerUid: req.user?.id } });
  res.json(services);
});

router.post('/services', authenticateToken, async (req: AuthRequest, res) => {
  const { name, duration, price } = req.body;
  const service = await prisma.service.create({
    data: { name, duration, price, ownerUid: req.user?.id as string }
  });
  res.json(service);
});

router.delete('/services/:id', authenticateToken, async (req: AuthRequest, res) => {
  await prisma.service.deleteMany({
    where: { id: req.params.id, ownerUid: req.user?.id }
  });
  res.json({ success: true });
});

// Staff
router.get('/staff', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const staffData = await prisma.staff.findMany({ where: { ownerUid: req.user?.id } });
    const staff = staffData.map((s: any) => ({
      ...s,
      portfolio: s.portfolio ? JSON.parse(s.portfolio) : []
    }));
    res.json(staff);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/staff', authenticateToken, async (req: AuthRequest, res) => {
  const { name, phone, commissionPercentage, active, portfolio } = req.body;
  try {
    const staff = await (prisma.staff as any).create({
      data: {
        name, 
        phone, 
        commissionPercentage: Number(commissionPercentage || 0), 
        active: active !== undefined ? active : true, 
        portfolio: portfolio ? JSON.stringify(portfolio) : "[]",
        ownerUid: req.user?.id as string
      }
    });
    res.json(staff);
  } catch (err: any) {
    console.error('Error creating staff:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/staff/:id', authenticateToken, async (req: AuthRequest, res) => {
  const { name, phone, commissionPercentage, active, portfolio } = req.body;
  try {
    await (prisma.staff as any).updateMany({
      where: { id: req.params.id, ownerUid: req.user?.id },
      data: {
        name,
        phone,
        commissionPercentage: commissionPercentage !== undefined ? Number(commissionPercentage) : undefined,
        active,
        portfolio: portfolio ? JSON.stringify(portfolio) : undefined
      }
    });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error updating staff:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/staff/:id', authenticateToken, async (req: AuthRequest, res) => {
  await prisma.staff.deleteMany({
    where: { id: req.params.id, ownerUid: req.user?.id }
  });
  res.json({ success: true });
});

// Clients
router.get('/clients', authenticateToken, async (req: AuthRequest, res) => {
  const clients = await prisma.client.findMany({
    where: { ownerUid: req.user?.id },
    orderBy: { name: 'asc' }
  });
  res.json(clients);
});

router.post('/clients', authenticateToken, async (req: AuthRequest, res) => {
  const { name, phone, email, notes } = req.body;
  const client = await prisma.client.create({
    data: { name, phone, email, notes, ownerUid: req.user?.id as string }
  });
  res.json(client);
});

router.delete('/clients/:id', authenticateToken, async (req: AuthRequest, res) => {
  await prisma.client.deleteMany({
    where: { id: req.params.id, ownerUid: req.user?.id }
  });
  res.json({ success: true });
});

router.put('/clients/:id', authenticateToken, async (req: AuthRequest, res) => {
  const { name, phone, email, notes, loyaltyPoints, loyaltyVisits } = req.body;
  await prisma.client.updateMany({
    where: { id: req.params.id, ownerUid: req.user?.id },
    data: { name, phone, email, notes, loyaltyPoints: loyaltyPoints || 0, loyaltyVisits: loyaltyVisits || 0 }
  });
  res.json({ success: true });
});

// Appointments
router.get('/appointments', authenticateToken, async (req: AuthRequest, res) => {
  const appointments = await prisma.appointment.findMany({
    where: { ownerUid: req.user?.id },
    orderBy: { date: 'desc' }
  });
  res.json(appointments);
});

router.post('/appointments', authenticateToken, async (req: AuthRequest, res) => {
  const { clientId, clientName, phone, serviceId, serviceName, barberId, barberName, date, price, isFitIn } = req.body;
  
  const appointment = await prisma.appointment.create({
    data: {
      ownerUid: req.user?.id as string,
      clientId, clientName, phone, serviceId, serviceName, barberId, barberName, date: new Date(date), price, isFitIn
    }
  });
  
  res.json({ id: appointment.id, clientId, clientName, serviceId, date: appointment.date, status: 'scheduled' });
});

router.put('/appointments/:id/status', authenticateToken, async (req: AuthRequest, res) => {
  const { status } = req.body;
  await prisma.appointment.updateMany({
    where: { id: req.params.id, ownerUid: req.user?.id },
    data: { status }
  });
  res.json({ success: true });
});

router.delete('/appointments/:id', authenticateToken, async (req: AuthRequest, res) => {
  await prisma.appointment.deleteMany({
    where: { id: req.params.id, ownerUid: req.user?.id }
  });
  res.json({ success: true });
});

// Finance (Transactions)
router.get('/transactions', authenticateToken, async (req: AuthRequest, res) => {
  const transactions = await prisma.transaction.findMany({
    where: { ownerUid: req.user?.id },
    orderBy: { date: 'desc' }
  });
  res.json(transactions);
});

router.post('/transactions', authenticateToken, async (req: AuthRequest, res) => {
  const { type, amount, description, date, category } = req.body;
  const transaction = await prisma.transaction.create({
    data: {
      ownerUid: req.user?.id as string,
      type, amount, description, date: new Date(date), category
    }
  });
  res.json(transaction);
});

router.delete('/transactions/:id', authenticateToken, async (req: AuthRequest, res) => {
  await prisma.transaction.deleteMany({
    where: { id: req.params.id, ownerUid: req.user?.id }
  });
  res.json({ success: true });
});

// Products
router.get('/products', authenticateToken, async (req: AuthRequest, res) => {
  const products = await prisma.product.findMany({
    where: { ownerUid: req.user?.id },
    orderBy: { name: 'asc' }
  });
  res.json(products);
});

router.post('/products', authenticateToken, async (req: AuthRequest, res) => {
  const { name, price, cost, stock, category } = req.body;
  const product = await prisma.product.create({
    data: {
      name, price, cost, stock, category, ownerUid: req.user?.id as string
    }
  });
  res.json({ id: product.id, success: true });
});

router.put('/products/:id', authenticateToken, async (req: AuthRequest, res) => {
  const { name, price, cost, stock, category } = req.body;
  await prisma.product.updateMany({
    where: { id: req.params.id, ownerUid: req.user?.id },
    data: { name, price, cost, stock, category }
  });
  res.json({ success: true });
});

router.delete('/products/:id', authenticateToken, async (req: AuthRequest, res) => {
  await prisma.product.deleteMany({
    where: { id: req.params.id, ownerUid: req.user?.id }
  });
  res.json({ success: true });
});

// Dashboard Stats
router.get('/dashboard/stats', authenticateToken, async (req: AuthRequest, res) => {
  const ownerUid = req.user?.id;
  
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const todayEnd = new Date();
  todayEnd.setHours(23,59,59,999);
  
  const appointmentsCount = await prisma.appointment.count({
    where: {
      ownerUid,
      date: {
        gte: todayStart,
        lte: todayEnd
      }
    }
  });
  
  const clientsCount = await prisma.client.count({
    where: { ownerUid }
  });
  
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0,0,0,0);
  
  const transactions = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: {
      ownerUid,
      type: "income",
      date: { gte: monthStart }
    }
  });
  const monthlyRevenue = transactions._sum.amount || 0;

  res.json({
    appointmentsToday: appointmentsCount,
    activeClients: clientsCount,
    monthlyRevenue: monthlyRevenue
  });
});

// Super Admin Routes
const isSuperAdmin = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.email !== 'renatadouglas739@gmail.com') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

router.get('/admin/stats', authenticateToken, isSuperAdmin, async (req: AuthRequest, res) => {
  const totalUsers = await prisma.user.count();
  const activeSubscriptions = await prisma.subscription.count({ where: { status: "active" } });
  
  res.json({
    totalUsers,
    activeSubscriptions,
    monthlyRevenue: 0, // Placeholder
    churnRate: 2.4
  });
});

router.get('/admin/plans', authenticateToken, isSuperAdmin, async (req: AuthRequest, res) => {
  const plansData = await prisma.plan.findMany();
  const plans = plansData.map((p: any) => ({
    ...p,
    features: typeof p.features === 'string' ? JSON.parse(p.features) : {}
  }));
  res.json(plans);
});

router.put('/admin/plans/:id', authenticateToken, isSuperAdmin, async (req: AuthRequest, res) => {
  const { name, priceMonthly, priceYearly, features } = req.body;
  await prisma.plan.update({
    where: { id: req.params.id },
    data: { name, priceMonthly, priceYearly, features: JSON.stringify(features) }
  });
  res.json({ success: true });
});

router.get('/admin/users', authenticateToken, isSuperAdmin, async (req: AuthRequest, res) => {
  const users = await prisma.user.findMany({ 
    select: { 
      id: true, 
      email: true, 
      shopName: true, 
      status: true, 
      createdAt: true,
      planId: true
    } 
  });
  res.json(users);
});

router.put('/admin/users/:id/plan', authenticateToken, isSuperAdmin, async (req: AuthRequest, res) => {
  const { planId } = req.body;
  const userId = req.params.id;
  console.log(`[ADMIN] Update request: User=${userId}, Plan=${planId}`);
  
  try {
    // Diagnostic: Check if user exists
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      console.error(`[ADMIN] User not found: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    // Diagnostic: Check if plan exists
    const planExists = await (prisma as any).plan.findUnique({ where: { id: planId } });
    if (!planExists) {
      console.error(`[ADMIN] Plan not found: "${planId}"`);
      return res.status(404).json({ error: `Plan not found: "${planId}"` });
    }

    // Update User table
    await (prisma.user as any).update({
      where: { id: userId },
      data: { planId }
    });

    // Update or Create Subscription
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);

    await (prisma.subscription as any).upsert({
      where: { uid: userId },
      update: { planId, status: 'active', currentPeriodEnd },
      create: { uid: userId, planId, status: 'active', currentPeriodEnd }
    });

    console.log(`[ADMIN] Success: Updated user and subscription for ${userId}`);
    res.json({ success: true });
  } catch (err: any) {
    console.error(`[ADMIN] FAILED for ${userId}:`, err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/admin/users/:id/status', authenticateToken, isSuperAdmin, async (req: AuthRequest, res) => {
  const { status } = req.body;
  await prisma.user.update({
    where: { id: req.params.id },
    data: { status }
  });
  res.json({ success: true });
});

// WhatsApp
router.get('/whatsapp/settings', authenticateToken, async (req: AuthRequest, res) => {
  const settings = await prisma.whatsappSettings.findUnique({ where: { uid: req.user?.id } }) as any;
  if (settings) {
    settings.templates = settings.templates ? JSON.parse(settings.templates) : null;
    res.json(settings);
  } else {
    res.json(null);
  }
});

router.put('/whatsapp/settings', authenticateToken, async (req: AuthRequest, res) => {
  const { enabled, templates, instanceName, instanceStatus, batteryLevel } = req.body;
  const uid = req.user?.id as string;
  
  await prisma.whatsappSettings.upsert({
    where: { uid },
    update: { enabled, templates: JSON.stringify(templates), instanceName, instanceStatus, batteryLevel },
    create: { uid, enabled, templates: JSON.stringify(templates), instanceName, instanceStatus, batteryLevel }
  });
  
  res.json({ success: true });
});

router.get('/whatsapp/messages', authenticateToken, async (req: AuthRequest, res) => {
  const messages = await prisma.whatsappMessage.findMany({
    where: { ownerUid: req.user?.id },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  res.json(messages);
});

router.post('/whatsapp/messages', authenticateToken, async (req: AuthRequest, res) => {
  const { recipientNumber, recipientName, content, type, status, externalId } = req.body;
  const message = await prisma.whatsappMessage.create({
    data: {
      ownerUid: req.user?.id as string,
      recipientNumber, recipientName, content, type, status, externalId
    }
  });
  res.json({ id: message.id, success: true });
});

// Webhook for Evolution API
router.post('/whatsapp/webhook', async (req, res) => {
  const { event, data } = req.body;
  
  if (event === 'messages.update' && data?.messageId && data?.status) {
    try {
      let newStatus = 'Enviada';
      if (data.status === 'DELIVERED') newStatus = 'Entregue';
      if (data.status === 'READ') newStatus = 'Lida';
      if (data.status === 'ERROR') newStatus = 'Falha';

      await prisma.whatsappMessage.updateMany({
        where: { externalId: data.messageId },
        data: { status: newStatus }
      });
        
      console.log(`Webhook received: Message ${data.messageId} status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error processing webhook:', err);
    }
  }
  
  res.json({ success: true });
});

// --- PUBLIC ROUTES (For Booking Page) ---
router.get('/public/plans', async (req, res) => {
  const plansData = await prisma.plan.findMany();
  const plans = plansData.map((p: any) => ({
    ...p,
    features: p.features ? JSON.parse(p.features) : {}
  }));
  res.json(plans);
});

router.get('/public/shop/:slug', async (req, res) => {
  const settings = await prisma.setting.findUnique({ where: { slug: req.params.slug } }) as any;
  if (!settings) return res.status(404).json({ error: 'Shop not found' });
  
  const owner = await prisma.user.findUnique({
    where: { id: settings.uid },
    select: { name: true, shopName: true }
  });
  
  settings.businessHours = settings.businessHours ? JSON.parse(settings.businessHours) : [];
  res.json({ shop: settings, owner });
});

router.get('/public/services/:uid', async (req, res) => {
  const services = await prisma.service.findMany({
    where: { ownerUid: req.params.uid },
    select: { id: true, name: true, duration: true, price: true }
  });
  res.json(services);
});

router.get('/public/staff/:uid', async (req, res) => {
  const staffData = await prisma.staff.findMany({
    where: { ownerUid: req.params.uid, active: true },
    select: { id: true, name: true, portfolio: true }
  });
  
  const staff = staffData.map(s => ({
    ...s,
    portfolio: s.portfolio ? JSON.parse(s.portfolio) : []
  }));
  
  res.json(staff);
});

router.post('/public/appointments', async (req, res) => {
  const { ownerUid, clientName, phone, serviceId, serviceName, staffId, staffName, date, price } = req.body;
  
  try {
    // Find or create client
    let client = await prisma.client.findFirst({
      where: { ownerUid, phone }
    });
    
    if (!client) {
      client = await prisma.client.create({
        data: { ownerUid, name: clientName, phone }
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        ownerUid, clientId: client.id, clientName, phone, serviceId, serviceName, barberId: staffId, barberName: staffName, date: new Date(date), price
      }
    });
    
    res.json({ success: true, appointmentId: appointment.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message, success: false });
  }
});

export default router;
