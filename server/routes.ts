import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from './db.js';
import { JWT_SECRET } from './config.js';
import { authenticateToken, AuthRequest } from './middleware.js';
import { asaas } from './asaas.js';

const router = express.Router();

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
        slug: shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
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
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, shopName: user.shopName, role: user.role, slug: user.slug } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tenant/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const user = await prisma.user.findUnique({
      where: { slug },
      select: { id: true, name: true, shopName: true, slug: true, status: true }
    });
    if (!user) return res.status(404).json({ error: 'Tenant not found' });
    res.json({ tenant: user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/auth/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { id: true, name: true, email: true, role: true, shopName: true, status: true, planId: true, slug: true }
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

    await prisma.user.update({
      where: { email },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expires
      }
    });

    console.log(`[PASSWORD RESET] Token for ${email}: ${token}`);
    
    // In production, send email here. For now, returning success.
    // We return the token in the response so the user can actually use it in this preview environment.
    res.json({ 
      success: true, 
      message: 'Token de recuperação gerado', 
      token: token 
    });
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
    await prisma.user.update({
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

// Tenants
router.get('/tenants/:slug', async (req, res) => {
  try {
    const settings = await prisma.setting.findFirst({
      where: { slug: req.params.slug }
    }) as any;

    if (!settings) return res.status(404).json({ error: 'Tenant not found' });

    // Parse JSON fields
    settings.businessHours = settings.businessHours ? JSON.parse(settings.businessHours) : [];
    settings.whatsappConfig = settings.whatsappConfig ? JSON.parse(settings.whatsappConfig) : null;
    settings.holidays = settings.holidays ? JSON.parse(settings.holidays) : [];
    settings.fidelityConfig = settings.fidelityConfig ? JSON.parse(settings.fidelityConfig) : null;

    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Plans & Subscriptions
router.get('/plans', async (req, res) => {
  try {
    const plans = await prisma.plan.findMany();
    const parsedPlans = plans.map((p: any) => ({
      ...p,
      features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features
    }));
    res.json(parsedPlans);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/subscription', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.id as string;
    
    const user = await prisma.user.findUnique({
      where: { id: uid },
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
  
  try {
    const subscription = await prisma.subscription.upsert({
      where: { uid },
      update: {
        planId,
        status: 'active',
        currentPeriodEnd,
        billingCycle
      },
      create: {
        uid,
        planId,
        status: 'active',
        currentPeriodEnd,
        billingCycle
      }
    });

    // Also update user's planId for backward compatibility
    await prisma.user.update({
      where: { id: uid },
      data: { planId }
    });

    res.json({ subscription, success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Asaas Payments
router.post('/asaas/pix', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { planId, billingCycle, amount, customerInfo } = req.body;
    const uid = req.user?.id as string;
    const email = req.user?.email as string;

    const customerId = await asaas.getOrCreateCustomer(
      customerInfo.name,
      customerInfo.cpfCnpj,
      email,
      customerInfo.phone
    );

    const externalReference = JSON.stringify({ uid, planId, billingCycle });
    const payment = await asaas.createPixPayment(customerId, amount, externalReference);

    res.json(payment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/asaas/card', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { planId, billingCycle, amount, customerInfo, card, holderInfo } = req.body;
    const uid = req.user?.id as string;
    const email = req.user?.email as string;

    const customerId = await asaas.getOrCreateCustomer(
      customerInfo.name,
      customerInfo.cpfCnpj,
      email,
      customerInfo.phone
    );

    const externalReference = JSON.stringify({ uid, planId, billingCycle });
    const payment = await asaas.createCardPayment(customerId, amount, externalReference, card, holderInfo);

    // For card, if it's CONFIRMED or RECEIVED, we can activate immediately
    if (payment.status === 'CONFIRMED' || payment.status === 'RECEIVED') {
      const currentPeriodEnd = new Date(Date.now() + (billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000);
      
      // Update Prisma
      await prisma.subscription.upsert({
        where: { uid },
        update: {
          planId,
          status: 'active',
          currentPeriodEnd,
          billingCycle
        },
        create: {
          uid,
          planId,
          status: 'active',
          currentPeriodEnd,
          billingCycle
        }
      });

      // Also update user's planId for backward compatibility
      await prisma.user.update({
        where: { id: uid },
        data: { planId }
      });
    }

    res.json(payment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Webhook for Asaas (Public)
router.post('/asaas/webhook', async (req, res) => {
  try {
    const { event, payment } = req.body;
    console.log(`Asaas Webhook Received: ${event}`, payment.id);

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      const { externalReference } = payment;
      if (externalReference) {
        const { uid, planId, billingCycle } = JSON.parse(externalReference);
        
        const currentPeriodEnd = new Date(Date.now() + (billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000);
        
        // Update Prisma
        await prisma.subscription.upsert({
          where: { uid },
          update: {
            planId,
            status: 'active',
            currentPeriodEnd,
            billingCycle
          },
          create: {
            uid,
            planId,
            status: 'active',
            currentPeriodEnd,
            billingCycle
          }
        });

        // Also update user's planId for backward compatibility
        await prisma.user.update({
          where: { id: uid },
          data: { planId }
        });
        
        console.log(`Subscription activated via Webhook for user ${uid}`);
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('Webhook Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Settings
router.get('/settings', authenticateToken, async (req: AuthRequest, res) => {
  const settings = await prisma.setting.findUnique({ where: { uid: req.user?.id } }) as any;
  if (settings) {
    settings.businessHours = settings.businessHours ? JSON.parse(settings.businessHours) : [];
    settings.whatsappConfig = settings.whatsappConfig ? JSON.parse(settings.whatsappConfig) : null;
    settings.holidays = settings.holidays ? JSON.parse(settings.holidays) : [];
    settings.fidelityConfig = settings.fidelityConfig ? JSON.parse(settings.fidelityConfig) : null;
  }
  res.json(settings);
});

router.put('/settings', authenticateToken, async (req: AuthRequest, res) => {
  const { 
    slug, address, addressNumber, neighborhood, city, state, zipCode, cnpj,
    description, phone, instagram, facebook, tiktok,
    businessHours, whatsappConfig, holidays, fidelityConfig 
  } = req.body;

  // Update slug in User model as well to keep them in sync
  if (slug) {
    await prisma.user.update({
      where: { id: req.user?.id },
      data: { slug }
    });
  }

  await (prisma.setting as any).upsert({
    where: { uid: req.user?.id },
    update: {
      slug, address, addressNumber, neighborhood, city, state, zipCode, cnpj,
      description, phone, instagram, facebook, tiktok,
      businessHours: JSON.stringify(businessHours),
      whatsappConfig: JSON.stringify(whatsappConfig),
      holidays: JSON.stringify(holidays),
      fidelityConfig: JSON.stringify(fidelityConfig)
    },
    create: {
      uid: req.user?.id as string,
      slug, address, addressNumber, neighborhood, city, state, zipCode, cnpj,
      description, phone, instagram, facebook, tiktok,
      businessHours: JSON.stringify(businessHours),
      whatsappConfig: JSON.stringify(whatsappConfig),
      holidays: JSON.stringify(holidays),
      fidelityConfig: JSON.stringify(fidelityConfig)
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

// WhatsApp Settings
router.get('/whatsapp-settings', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.id as string;
    let settings = await prisma.whatsappSettings.findUnique({
      where: { uid }
    }) as any;

    if (!settings) {
      settings = await prisma.whatsappSettings.create({
        data: {
          uid,
          enabled: false,
          templates: JSON.stringify({
            welcome: "Olá {nome_cliente}, bem-vindo à {shop_name}! É um prazer ter você conosco.",
            reminder: "Lembrete: Você tem um agendamento na {shop_name} dia {data} às {hora}. Até logo!",
            confirmation: "Confirmado! Seu agendamento na {shop_name} foi marcado para {data} às {hora}. Obrigado!"
          })
        }
      });
    }

    if (settings.templates) {
      settings.templates = JSON.parse(settings.templates);
    }

    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/whatsapp-settings', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { enabled, templates, apiKey, instanceName, instanceStatus, batteryLevel } = req.body;
    const uid = req.user?.id as string;
    const settings = await prisma.whatsappSettings.upsert({
      where: { uid },
      update: {
        enabled,
        templates: templates ? JSON.stringify(templates) : undefined,
        apiKey,
        instanceName,
        instanceStatus,
        batteryLevel
      },
      create: {
        uid,
        enabled: enabled ?? false,
        templates: templates ? JSON.stringify(templates) : JSON.stringify({
          welcome: "Olá {nome_cliente}, bem-vindo à {shop_name}! É um prazer ter você conosco.",
          reminder: "Lembrete: Você tem um agendamento na {shop_name} dia {data} às {hora}. Até logo!",
          confirmation: "Confirmado! Seu agendamento na {shop_name} foi marcado para {data} às {hora}. Obrigado!"
        }),
        apiKey,
        instanceName,
        instanceStatus,
        batteryLevel
      }
    });

    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// WhatsApp Messages
router.get('/whatsapp-messages', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const messages = await prisma.whatsappMessage.findMany({
      where: { ownerUid: req.user?.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/whatsapp-messages', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { recipientNumber, recipientName, content, type, status, externalId } = req.body;
    const message = await prisma.whatsappMessage.create({
      data: {
        ownerUid: req.user?.id as string,
        recipientNumber, recipientName, content, type, status, externalId
      }
    });
    res.json({ id: message.id, success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
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
  await prisma.client.update({
    where: { id: req.params.id },
    data: { 
      name, 
      phone, 
      email, 
      notes, 
      loyaltyPoints: loyaltyPoints !== undefined ? loyaltyPoints : undefined, 
      loyaltyVisits: loyaltyVisits !== undefined ? loyaltyVisits : undefined 
    }
  });
  res.json({ success: true });
});

router.post('/clients/:id/redeem', authenticateToken, async (req: AuthRequest, res) => {
  const ownerUid = req.user?.id as string;
  const clientId = req.params.id;

  try {
    const client = await prisma.client.findFirst({
      where: { id: clientId, ownerUid }
    });

    if (!client) return res.status(404).json({ error: 'Client not found' });

    const settings = await prisma.setting.findUnique({ where: { uid: ownerUid } }) as any;
    const fidelityConfig = settings?.fidelityConfig ? JSON.parse(settings.fidelityConfig) : null;

    if (!fidelityConfig?.enabled) {
      return res.status(400).json({ error: 'Fidelity program is disabled' });
    }

    if (client.loyaltyPoints < fidelityConfig.minPointsToRedeem) {
      return res.status(400).json({ error: 'Insufficient points' });
    }

    // Deduct points
    await prisma.client.update({
      where: { id: clientId },
      data: {
        loyaltyPoints: { decrement: fidelityConfig.minPointsToRedeem }
      }
    });

    // Create transaction for the discount
    await prisma.transaction.create({
      data: {
        ownerUid,
        type: 'expense',
        amount: fidelityConfig.redeemValue,
        description: `Resgate de Fidelidade - Cliente: ${client.name}`,
        date: new Date(),
        category: 'Fidelidade'
      }
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
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
  const { clientId, clientName, phone, serviceId, serviceName, barberId, barberName, staffId, staffName, date, price, isFitIn } = req.body;
  
  const appointment = await prisma.appointment.create({
    data: {
      ownerUid: req.user?.id as string,
      clientId, clientName, phone, serviceId, serviceName, barberId, barberName, staffId, staffName, date: new Date(date), price, isFitIn
    }
  });
  
  res.json({ id: appointment.id, clientId, clientName, serviceId, date: appointment.date, status: 'scheduled' });
});

router.put('/appointments/:id/status', authenticateToken, async (req: AuthRequest, res) => {
  const { status } = req.body;
  const ownerUid = req.user?.id as string;
  const appointmentId = req.params.id;

  try {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, ownerUid }
    });

    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

    const oldStatus = appointment.status;
    
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status }
    });

    // Handle loyalty points and transactions when marked as completed
    if (status === 'completed' && oldStatus !== 'completed') {
      // 1. Create Transaction
      await prisma.transaction.create({
        data: {
          ownerUid,
          type: 'income',
          amount: appointment.price,
          description: `Serviço: ${appointment.serviceName} - Cliente: ${appointment.clientName}`,
          date: new Date(),
          category: 'Serviços'
        }
      });

      // 2. Update Client Loyalty
      if (appointment.clientId) {
        const settings = await prisma.setting.findUnique({ where: { uid: ownerUid } }) as any;
        const fidelityConfig = settings?.fidelityConfig ? JSON.parse(settings.fidelityConfig) : null;

        let pointsToAdd = 0;
        if (fidelityConfig?.enabled) {
          pointsToAdd += (fidelityConfig.pointsPerVisit || 0);
          pointsToAdd += Math.floor((appointment.price || 0) * (fidelityConfig.pointsPerCurrency || 0));
        }

        await prisma.client.update({
          where: { id: appointment.clientId },
          data: {
            loyaltyPoints: { increment: pointsToAdd },
            loyaltyVisits: { increment: 1 }
          }
        });
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
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

// Admin: Get user usage metrics
router.get('/admin/users/:id/usage', authenticateToken, isSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const userId = req.params.id;
    const [appointmentsCount, staffCount] = await Promise.all([
      prisma.appointment.count({ where: { ownerUid: userId } }),
      prisma.staff.count({ where: { ownerUid: userId } })
    ]);
    res.json({ appointments: appointmentsCount, staff: staffCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch usage metrics' });
  }
});

// Admin: Update user profile
router.put('/admin/users/:id', authenticateToken, isSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { shopName, email, phone, name, slug } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { shopName, email, phone, name, slug }
    });

    // Sync slug with Setting model if provided
    if (slug) {
      await (prisma.setting as any).upsert({
        where: { uid: req.params.id },
        update: { slug },
        create: { uid: req.params.id, slug }
      });
    }

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user profile' });
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

// SuperAdmin Routes
router.get('/superadmin/stats', authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const totalUsers = await prisma.user.count();
    const activeSubscriptions = await prisma.subscription.count({ where: { status: 'active' } });
    // This is a mock for now, in a real app you'd sum up payments
    const monthlyRevenue = 12450.00; 
    
    res.json({ totalUsers, activeSubscriptions, monthlyRevenue, churnRate: 2.4 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/superadmin/tenants', authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const tenants = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(tenants);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

router.get('/superadmin/plans', authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const plans = await prisma.plan.findMany();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

router.get('/superadmin/tenant-usage/:userId', authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const { userId } = req.params;
    const appointments = await prisma.appointment.count({ where: { ownerUid: userId } });
    const staff = await prisma.staff.count({ where: { ownerUid: userId } });
    res.json({ appointments, staff });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
});

router.put('/superadmin/tenants/:userId', authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const { userId } = req.params;
    const data = req.body;
    const updated = await prisma.user.update({
      where: { id: userId },
      data
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

router.put('/superadmin/plans/:planId', authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const { planId } = req.params;
    const data = req.body;
    const updated = await prisma.plan.update({
      where: { id: planId },
      data
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// Subscription Routes
router.post('/subscriptions', authenticateToken, async (req: any, res) => {
  try {
    const { planId, billingCycle, startDate, endDate } = req.body;
    const subscription = await (prisma.subscription as any).upsert({
      where: { uid: req.user.id },
      update: {
        planId,
        status: 'active',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        updatedAt: new Date()
      },
      create: {
        uid: req.user.id,
        planId,
        status: 'active',
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      }
    });

    // Also update user's planId
    await prisma.user.update({
      where: { id: req.user.id },
      data: { planId }
    });

    res.json(subscription);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

export default router;
