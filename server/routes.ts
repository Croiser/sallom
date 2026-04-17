import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from './db.js';
import { WhatsAppMetaService } from './whatsappMeta.js';
import { WAHAService } from './waha.js';
import { WAHA_API_URL } from './config.js';
import { JWT_SECRET } from './config.js';
import { authenticateToken, AuthRequest } from './middleware.js';
import { asaas } from './asaas.js';
import { emailService } from './email.js';
import { GoogleGenAI } from "@google/genai";
import { appointmentGuard } from './middleware/appointmentGuard.js';
import { validateRecurrenceSeries, calculateComboDuration } from './services/recurrenceService.js';

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

    // Enviar Boas-Vindas por E-mail (rodando de forma assíncrona)
    emailService.sendWelcomeEmail(email, name, shopName).catch(console.error);

    const token = jwt.sign({ id: user.id, email, role: 'barber' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name, email, shopName, role: 'barber' } });
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
    
    // Disparo real do e-mail na produção
    await emailService.sendPasswordResetEmail(email, token);

    res.json({ 
      success: true, 
      message: 'Token de recuperação gerado enviado para o seu e-mail', 
      token: token // Remova o envio do token no payload em produção verdadeira, mas para mock/teste mantemos
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
    const targetPlanId = (planId as string).toLowerCase();
    const endDate = currentPeriodEnd;
    const subscription = await prisma.subscription.upsert({
      where: { uid },
      update: {
        planId: targetPlanId,
        status: 'active',
        currentPeriodEnd,
        endDate,
        billingCycle: billingCycle as string
      },
      create: {
        uid: uid as string,
        planId: targetPlanId,
        status: 'active',
        currentPeriodEnd,
        endDate,
        billingCycle: billingCycle as string
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
      const endDate = currentPeriodEnd;
      
      const targetPlanId = (planId as string).toLowerCase();
      
      // Update Prisma
      await prisma.subscription.upsert({
        where: { uid },
        update: {
          planId: targetPlanId,
          status: 'active',
          currentPeriodEnd,
          endDate,
          billingCycle: billingCycle as string
        },
        create: {
          uid: uid as string,
          planId: targetPlanId,
          status: 'active',
          currentPeriodEnd,
          endDate,
          billingCycle: billingCycle as string
        }
      });

      // Also update user's planId for backward compatibility
      const user = await prisma.user.update({
        where: { id: uid },
        data: { planId }
      });

      if (user && user.email) {
        const planNameMap: Record<string, string> = {
          'plan_bronze': 'Bronze',
          'plan_silver': 'Prata',
          'plan_gold': 'Ouro'
        };
        const planNomeReal = planNameMap[planId as string] || (planId as string);
        emailService.sendPaymentConfirmation(user.email, user.name, planNomeReal).catch(console.error);
      }
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
        const { uid, planId, billingCycle } = JSON.parse(externalReference) as { uid: string, planId: string, billingCycle: string };
        
        const currentPeriodEnd = new Date(Date.now() + (billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000);
        const endDate = currentPeriodEnd;
        
        const targetPlanId = planId.toLowerCase();
        
        // Update Prisma
        await prisma.subscription.upsert({
          where: { uid },
          update: {
            planId: targetPlanId,
            status: 'active',
            currentPeriodEnd,
            endDate,
            billingCycle
          },
          create: {
            uid,
            planId: targetPlanId,
            status: 'active',
            currentPeriodEnd,
            endDate,
            billingCycle
          }
        });

        // Also update user's planId for backward compatibility
        const user = await prisma.user.update({
          where: { id: uid },
          data: { planId }
        });
        
        console.log(`Subscription activated via Webhook for user ${uid}`);

        // Enviar E-mail de Confirmação de Pagamento
        if (user && user.email) {
          const planNameMap: Record<string, string> = {
            'plan_bronze': 'Bronze',
            'plan_silver': 'Prata',
            'plan_gold': 'Ouro'
          };
          const planNomeReal = planNameMap[planId] || planId;
          emailService.sendPaymentConfirmation(user.email, user.name, planNomeReal).catch(console.error);
        }
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
  const userId = req.user?.id;
  const role = req.user?.role;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // For professionals, we need to fetch the owner's settings
    const targetUid = (role === 'professional' && (user as any).ownerId) 
      ? (user as any).ownerId 
      : userId;

    const settings = await prisma.setting.findUnique({ where: { uid: targetUid } }) as any;
    const ownerUser = await prisma.user.findUnique({ where: { id: targetUid }, select: { shopName: true } });
    
    let result: any = settings ? { ...settings } : { uid: targetUid };
    
    if (settings) {
      result.businessHours = settings.businessHours ? JSON.parse(settings.businessHours) : [];
      result.whatsappConfig = settings.whatsappConfig ? JSON.parse(settings.whatsappConfig) : null;
      result.holidays = settings.holidays ? JSON.parse(settings.holidays) : [];
      result.fidelityConfig = settings.fidelityConfig ? JSON.parse(settings.fidelityConfig) : null;
      result.allowProfessionalViewAllAgendas = settings.allowProfessionalViewAllAgendas;
    } else {
      // Ensure defaults if no settings found
      result.businessHours = [];
      result.whatsappConfig = null;
      result.holidays = [];
      result.fidelityConfig = null;
    }
    
    // Add shopName from target owner model as 'name'
    result.name = ownerUser?.shopName || '';
    
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings', authenticateToken, async (req: AuthRequest, res) => {
  const { 
    name, slug, address, addressNumber, neighborhood, city, state, zipCode, cnpj,
    description, phone, instagram, facebook, tiktok,
    businessHours, whatsappConfig, holidays, fidelityConfig,
    allowProfessionalViewAllAgendas, podologyAnamnesisActive,
    logoUrl
  } = req.body;

  // Update shopName and slug in User model to keep them in sync
  const userUpdateData: any = {};
  if (name !== undefined) userUpdateData.shopName = name;
  if (slug !== undefined) userUpdateData.slug = slug;

  if (Object.keys(userUpdateData).length > 0) {
    await prisma.user.update({
      where: { id: req.user?.id },
      data: userUpdateData
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
      fidelityConfig: JSON.stringify(fidelityConfig),
      allowProfessionalViewAllAgendas,
      podologyAnamnesisActive,
      logoUrl
    },
    create: {
      uid: req.user?.id as string,
      slug, address, addressNumber, neighborhood, city, state, zipCode, cnpj,
      description, phone, instagram, facebook, tiktok,
      businessHours: JSON.stringify(businessHours),
      whatsappConfig: JSON.stringify(whatsappConfig),
      holidays: JSON.stringify(holidays),
      fidelityConfig: JSON.stringify(fidelityConfig),
      allowProfessionalViewAllAgendas,
      podologyAnamnesisActive,
      logoUrl
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
  const { name, phone, commissionPercentage, active, portfolio, email, password } = req.body;
  const ownerUid = req.user?.id as string;

  try {
    // 1. Create the Staff record
    const staff = await (prisma.staff as any).create({
      data: {
        name, 
        phone, 
        commissionPercentage: Number(commissionPercentage || 0), 
        active: active !== undefined ? active : true, 
        portfolio: portfolio ? JSON.stringify(portfolio) : "[]",
        ownerUid
      }
    });

    // 2. If email/password provided, create a User record for login
    if (email && password) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Este e-mail já está sendo usado por outro usuário.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'professional',
          staffId: staff.id,
          ownerId: ownerUid,
          shopName: `Profissional: ${name}`,
          slug: `prof-${staff.id.slice(-6)}`
        } as any
      });
    }

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
    const { enabled, templates, apiKey, phoneNumberId, wabaId } = req.body;
    const uid = req.user?.id as string;
    const settings = await prisma.whatsappSettings.upsert({
      where: { uid },
      update: {
        enabled,
        templates: templates ? JSON.stringify(templates) : undefined,
        apiKey,
        phoneNumberId,
        wabaId,
        wahaInstanceName: 'default',
        status: req.body.status || 'disconnected'
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
        phoneNumberId,
        wabaId,
        wahaInstanceName: 'default',
        status: 'disconnected'
      }
    });

    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Test WhatsApp Message (Meta)
router.post('/whatsapp/test', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { number, templateName, languageCode, components } = req.body;
    const uid = req.user?.id as string;
    
    const settings = await prisma.whatsappSettings.findUnique({ where: { uid } });
    if (!settings || !settings.apiKey || !settings.phoneNumberId) {
      return res.status(400).json({ error: 'WhatsApp Meta configuration missing' });
    }

    const metaService = new WhatsAppMetaService(settings.apiKey, settings.phoneNumberId);
    const result = await metaService.sendTemplateMessage(number, templateName, languageCode, components);
    
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- WAHA WhatsApp API Routes ---

router.get('/whatsapp/waha/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const waha = new WAHAService(WAHA_API_URL);
    const status = await waha.getSessionStatus('default');
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/whatsapp/waha/qr', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const waha = new WAHAService(WAHA_API_URL);
    const qr = await waha.getQrCode('default');
    console.log('QR Code result:', qr ? 'received' : 'null');
    res.json({ qr });
  } catch (err: any) {
    console.error('QR endpoint error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/whatsapp/waha/session/start', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const waha = new WAHAService(WAHA_API_URL);
    await waha.startSession('default');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/whatsapp/waha/send', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { chatId, text, session } = req.body;
    if (!chatId || !text) {
      return res.status(400).json({ error: 'chatId and text are required' });
    }
    const waha = new WAHAService(WAHA_API_URL);
    const result = await waha.sendTextMessage(session || 'default', chatId, text);
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Error sending message:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/whatsapp/trigger', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { recipientNumber, recipientName, type, variables } = req.body;
    const uid = req.user?.id as string;
    
    const settings = await prisma.whatsappSettings.findUnique({ where: { uid } }) as any;
    if (!settings || !settings.enabled) {
      return res.json({ success: false, reason: 'WhatsApp not enabled for this tenant' });
    }

    const templates = settings.templates ? JSON.parse(settings.templates) : {};
    let templateStr = templates[type];

    if (!templateStr) {
      return res.json({ success: false, reason: `Template not found for type: ${type}` });
    }

    // Process template variables e.g. {nome_cliente} -> variables['nome_cliente']
    let text = templateStr;
    Object.keys(variables || {}).forEach(key => {
      // WAHA template keys might be wrapped in {key}
      const regex = new RegExp(`{${key}}`, 'g');
      text = text.replace(regex, variables[key]);
    });

    // Format phone number to international WAHA format (e.g. 5545999959186@c.us)
    let formattedNumber = recipientNumber.replace(/\D/g, '');
    if (!formattedNumber.startsWith('55')) formattedNumber = '55' + formattedNumber;
    const chatId = `${formattedNumber}@c.us`;

    const waha = new WAHAService(WAHA_API_URL);
    const result = await waha.sendTextMessage('default', chatId, text).catch(err => {
      console.error('Failed to dispatch to WAHA:', err.message);
      throw err;
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Trigger Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/whatsapp/chats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const waha = new WAHAService(WAHA_API_URL);
    const chats = await waha.getChats();
    res.json(chats);
  } catch (err: any) {
    console.error('Error fetching chats:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/whatsapp/messages/:chatId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { chatId } = req.params;
    const waha = new WAHAService(WAHA_API_URL);
    const messages = await waha.getChatMessages('default', chatId);
    res.json(messages);
  } catch (err: any) {
    console.error('Error fetching messages:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// WAHA Webhook - Public Endpoint
router.post('/webhooks/waha', async (req, res) => {
  try {
    const { event, data } = req.body;
    // WAHA event structure varies, usually 'message' or 'message.upsert'
    if (event === 'message' || event === 'message.upsert') {
      const message = data.message || data;
      const text = message.body || message.conversation || message.extendedTextMessage?.text;
      const from = message.from || message.key?.remoteJid;

      if (text && from) {
        // Find appointment ID in text: "Olá, ... ID: 123-abc"
        const match = text.match(/ID:\s*([a-f0-9-]+)/i);
        if (match) {
          const appointmentId = match[1];
          const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: { owner: { include: { whatsappSettings: true, wallet: true } } }
          });

          if (appointment && appointment.owner.whatsappSettings?.enabled) {
            const user = appointment.owner;
            const settings = user.whatsappSettings!;
            const wallet = user.wallet[0]; // Wallet is linked to user
            
            // Check Balance
            if (!wallet || !wallet.isActive || wallet.balance < 0.10) {
              console.log(`Wallet error: Insufficient balance for user ${user.id}`);
              return res.sendStatus(200);
            }

            const waha = new WAHAService(WAHA_API_URL);
            
            // Send Confirmation Voucher
            const templates = settings.templates ? JSON.parse(settings.templates as string) : {};
            const baseText = templates.confirmation || "✅ Seu agendamento foi confirmado!";
            const voucherText = WAHAService.applySpintax(baseText)
              .replace('{nome_cliente}', appointment.clientName)
              .replace('{shop_name}', user.shopName || user.name || 'Barbearia')
              .replace('{data}', appointment.date.toLocaleDateString('pt-BR'))
              .replace('{hora}', appointment.date.toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }).split(' ')[1] || '');
            
            await waha.sendTextMessage(settings.wahaInstanceName || 'default', from, voucherText);
            
            // DEBIT WALLET
            await prisma.wallet.update({
              where: { id: wallet.id },
              data: { balance: { decrement: 0.10 } }
            });
            await prisma.walletTransaction.create({
              data: {
                walletId: wallet.id,
                type: 'debit',
                category: 'automation_usage',
                amount: 0.10,
                description: `WhatsApp WAHA - Voucher enviado: ${appointmentId}`
              }
            });
          }
        }
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('WAHA Webhook Error:', err);
    res.sendStatus(500);
  }
});

router.post('/whatsapp/trigger', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { type, recipientNumber, recipientName, variables } = req.body;
    const uid = req.user?.id as string;
    
    const settings = await prisma.whatsappSettings.findUnique({ where: { uid } });
    if (!settings || !settings.enabled) {
      return res.status(400).json({ error: 'WhatsApp configuration missing or disabled' });
    }

    let result_final: any = null;
    let templateNameUsed = type;

    // Check if WAHA is connected
    if (settings.status === 'connected') {
      const waha = new WAHAService(WAHA_API_URL);
      
      const templates = settings.templates ? JSON.parse(settings.templates as string) : {};
      
      let baseText = '';
      if (type === 'welcome') baseText = templates.welcome || "Olá, {nome_cliente}! Bem-vindo(a) ao {shop_name}.";
      if (type === 'reminder') baseText = templates.reminder || "Olá, {nome_cliente}! Lembrando do seu horário: {data} às {hora}.";
      if (type === 'confirmation') baseText = templates.confirmation || "✅ Seu agendamento foi confirmado para {data} às {hora} em {shop_name}!";

      const voucherText = WAHAService.applySpintax(baseText)
        .replace(/{nome_cliente}/g, recipientName || 'Cliente')
        .replace(/{shop_name}/g, variables.shop_name || 'Nosso Salão')
        .replace(/{data}/g, variables.data || '')
        .replace(/{hora}/g, variables.hora || '');

      result_final = await waha.sendTextMessage(settings.wahaInstanceName || 'default', recipientNumber, voucherText);
      templateNameUsed = `WAHA (${type})`;

      // Debit Wallet for WAHA usage
      try {
        const wallet = await prisma.wallet.findUnique({ where: { ownerUid: uid } });
        if (wallet && wallet.isActive && Number(wallet.balance) >= 0.10) {
          await prisma.wallet.update({
            where: { id: wallet.id },
            data: { balance: { decrement: 0.10 } }
          });
          await prisma.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: 'debit',
              category: 'automation_usage',
              amount: 0.10,
              description: `WhatsApp (WAHA): ${type}`
            }
          });
        }
      } catch (e) { console.error('Wallet debit failed (WAHA):', e); }

    } else if (settings.apiKey && settings.phoneNumberId) {
      // Fallback to Meta API if configured but WAHA is not connected
      const metaService = new WhatsAppMetaService(settings.apiKey, settings.phoneNumberId);
      
      // Mapping internal types to Meta Template Names
      let templateName = 'hello_world'; // fallback
      if (type === 'welcome') templateName = 'welcome_message_v1';
      if (type === 'reminder') templateName = 'appointment_reminder_v1';
      if (type === 'confirmation') templateName = 'appointment_confirmation_v1';

      const components = [
        {
          type: 'body',
          parameters: Object.entries(variables).map(([key, value]) => ({
            type: 'text',
            text: String(value)
          }))
        }
      ];

      result_final = await metaService.sendTemplateMessage(recipientNumber, templateName, 'pt_BR', components);
      templateNameUsed = `Meta Template: ${templateName} (${type})`;
      
      // Debit Wallet if enabled (Meta also costs)
      try {
        const wallet = await prisma.wallet.findUnique({ where: { ownerUid: uid } });
        if (wallet && wallet.isActive && Number(wallet.balance) >= 0.10) {
          await prisma.wallet.update({
            where: { id: wallet.id },
            data: { balance: { decrement: 0.10 } }
          });
          await prisma.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: 'debit',
              category: 'automation_usage',
              amount: 0.10,
              description: `WhatsApp (Meta): ${type}`
            }
          });
        }
      } catch (e) { console.error('Wallet debit failed (Meta):', e); }
    } else {
      return res.status(400).json({ error: 'Nenhuma integração do WhatsApp configurada (QR Code ou Meta).' });
    }
    
    // Log message
    await prisma.whatsappMessage.create({
      data: {
        ownerUid: uid,
        recipientNumber,
        recipientName,
        content: templateNameUsed,
        type: 'template',
        status: 'sent',
        externalId: result_final?.messages?.[0]?.id || result_final?.messageId || 'unknown'
      }
    });

    res.json(result_final);
  } catch (err: any) {
    console.error('WhatsApp trigger error:', err.response?.data || err.message);
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

// --- WALLET ROUTES ---
router.get('/wallet/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const ownerUid = req.user?.id as string;
    let wallet = await prisma.wallet.findUnique({
      where: { ownerUid },
      include: {
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          ownerUid,
          balance: 0.00,
          isActive: true
        },
        include: {
          transactions: true
        }
      });
    }

    res.json(wallet);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/wallet/toggle', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const ownerUid = req.user?.id as string;
    const { isActive } = req.body;
    
    let wallet = await prisma.wallet.findUnique({ where: { ownerUid } });
    if (!wallet) {
       wallet = await prisma.wallet.create({
        data: { ownerUid, balance: 0, isActive: false }
       });
    }

    if (isActive && Number(wallet.balance) <= 0) {
      return res.status(400).json({ error: 'Saldo insuficiente para ativar automação. Adicione créditos.' });
    }

    const updated = await prisma.wallet.update({
      where: { ownerUid },
      data: { isActive }
    });

    res.json(updated);
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
  const { name, phone, email, notes, loyaltyPoints, loyaltyVisits, pendingDebt } = req.body;
  await prisma.client.update({
    where: { id: req.params.id },
    data: { 
      name, 
      phone, 
      email, 
      notes, 
      loyaltyPoints: loyaltyPoints !== undefined ? loyaltyPoints : undefined, 
      loyaltyVisits: loyaltyVisits !== undefined ? loyaltyVisits : undefined,
      pendingDebt: pendingDebt !== undefined ? pendingDebt : undefined
    } as any
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
  const userId = req.user?.id;
  const role = req.user?.role;
  
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let where: any = { ownerUid: user.id };
    
    // Check if it's a professional and their visibility permissions
    if (role === 'professional' && ((user as any).staffId || (user as any).ownerId)) {
      const ownerUid = (user as any).ownerId || user.id;
      const settings = await prisma.setting.findUnique({ where: { uid: ownerUid } });
      
      if (settings?.allowProfessionalViewAllAgendas) {
        // If owner allows viewing all, only filter by ownerUid
        where = { ownerUid };
      } else {
        // Default: filter by staffId only
        where = { staffId: (user as any).staffId };
      }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { date: 'asc' } // Changed to asc for better daily view flow
    });
    res.json(appointments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/appointments', authenticateToken, async (req: AuthRequest, res) => {
  const { clientId, clientName, phone, serviceId, serviceName, barberId, barberName, staffId, staffName, date, price, isFitIn } = req.body;
  
  const appointment = await prisma.appointment.create({
    data: {
      ownerUid: req.user?.id as string,
      clientId, clientName, phone, serviceId, serviceName, barberId, barberName, staffId, staffName, date: new Date(date), price, isFitIn
    }
  });

  // Wallet / Automation Logic
  try {
    const ownerUid = req.user?.id as string;
    const wallet = await prisma.wallet.findUnique({ where: { ownerUid } });
    
    if (wallet && wallet.isActive && Number(wallet.balance) >= 0.10) {
      // Simulate debit for WhatsApp automation
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: 0.10 }
        }
      });

      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'debit',
          category: 'automation_usage',
          amount: 0.10,
          description: `Débito automação WhatsApp (Agendamento #${appointment.id})`
        }
      });
      
      console.log(`[WALLET] Debited R$ 0,10 from ${ownerUid} for appointment ${appointment.id}`);
      
      // Integration with Meta API (Future)
      // triggerMessage('confirmation', phone, clientName, { shop_name: user?.shopName, data: date, hora: time });
    }
  } catch (walletErr) {
    console.error('Error processing wallet debit:', walletErr);
    // Silent fail to not block appointment creation
  }

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

// No-Show Handler (Manual mark by staff)
router.post('/appointments/:id/no-show', authenticateToken, async (req: AuthRequest, res) => {
  const ownerUid = req.user?.id as string;
  const appointmentId = req.params.id;

  try {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, ownerUid }
    });

    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    
    // Update appointment
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { 
        status: 'no_show',
        noShow: true
      } as any
    });

    // Update client debt (50% of the service price)
    const debtAmount = appointment.price * 0.5;
    await prisma.client.update({
      where: { id: appointment.clientId },
      data: {
        pendingDebt: { increment: debtAmount }
      } as any
    });

    res.json({ success: true, debtGenerated: debtAmount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- PROFESSIONAL DASHBOARD ROUTES ---

router.put('/professional/chair-status', authenticateToken, async (req: AuthRequest, res) => {
  const { status } = req.body; // Livre, Ocupado, Em Intervalo
  const userId = req.user?.id as string;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(user as any).staffId) return res.status(403).json({ error: 'Professional record not found' });

    await prisma.staff.update({
      where: { id: (user as any).staffId },
      data: { status } as any
    });

    res.json({ success: true, status });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/appointments/:id/check-in', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { 
        checkInAt: new Date(),
        status: 'in_progress'
      } as any
    });
    res.json(appointment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/appointments/:id/finish', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const appointment = await (prisma as any).appointment.update({
      where: { id: req.params.id },
      data: { 
        finishedAt: new Date(),
        status: 'completed'
      }
    });
    
    const ownerUid = appointment.ownerUid;
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

    res.json({ success: true, appointment });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/professional/earnings', authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.user?.id as string;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(user as any).staffId) return res.status(403).json({ error: 'Professional record not found' });

    const staffId = (user as any).staffId;
    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    const commissionRate = (staff?.commissionPercentage || 0) / 100;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);
    
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);

    const appointments = await prisma.appointment.findMany({
      where: {
        staffId,
        status: 'completed',
        date: { gte: startOfMonth }
      }
    });

    const todayApps = appointments.filter(a => a.date >= startOfToday);

    const totalRevenue = appointments.reduce((sum, app) => sum + (app.price || 0), 0);
    const totalCommission = totalRevenue * commissionRate;
    const totalRevenueToday = todayApps.reduce((sum, app) => sum + (app.price || 0), 0);

    res.json({
      totalRevenue,
      totalCommission,
      totalRevenueToday,
      commissionPercentage: staff?.commissionPercentage,
      count: appointments.length,
      todayCount: todayApps.length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/professional/clients/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id }
    });
    res.json(client);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/professional/clients/:id/notes', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { notes } = req.body;
    await prisma.client.update({
      where: { id: req.params.id },
      data: { notes }
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
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
  const superAdminEmails = [
    'renatadouglas739@gmail.com',
    'admin@sallonpromanager.com.br',
    'sallonpromanager@gmail.com'
  ];
  if (!req.user?.email || !superAdminEmails.includes(req.user.email)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

router.get('/superadmin/stats', authenticateToken, isSuperAdmin, async (req: AuthRequest, res) => {
  const totalUsers = await prisma.user.count();
  const activeSubscriptions = await prisma.subscription.count({ where: { status: "active" } });
  
  res.json({
    totalUsers,
    activeSubscriptions,
    monthlyRevenue: 0, // Placeholder
    churnRate: 2.4
  });
});

router.get('/superadmin/plans', authenticateToken, isSuperAdmin, async (req: AuthRequest, res) => {
  const plansData = await prisma.plan.findMany();
  const plans = plansData.map((p: any) => ({
    ...p,
    features: typeof p.features === 'string' ? JSON.parse(p.features) : {}
  }));
  res.json(plans);
});

router.put('/superadmin/plans/:id', authenticateToken, isSuperAdmin, async (req: AuthRequest, res) => {
  const { name, priceMonthly, priceYearly, features } = req.body;
  const { id } = req.params;
  
  console.log(`[SUPERADMIN] Plan Update: ${id}`, { name, priceMonthly, priceYearly, features });

  try {
    await prisma.plan.update({
      where: { id },
      data: { 
        name, 
        priceMonthly: isNaN(Number(priceMonthly)) ? 0 : Number(priceMonthly), 
        priceYearly: isNaN(Number(priceYearly)) ? 0 : Number(priceYearly), 
        features: typeof features === 'string' ? features : JSON.stringify(features) 
      }
    });
    res.json({ success: true });
  } catch (error: any) {
    console.error(`[SUPERADMIN] Error updating plan ${id}:`, error);
    res.status(500).json({ error: error.message || 'Failed to update plan' });
  }
});

router.get('/superadmin/tenants', authenticateToken, isSuperAdmin, async (req: AuthRequest, res) => {
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

router.put('/superadmin/tenants/:id', authenticateToken, isSuperAdmin, async (req: AuthRequest, res) => {
  const { planId, ...otherData } = req.body;
  const userId = req.params.id;
  console.log(`[ADMIN] Update request: User=${userId}, Plan=${planId || 'N/A'}`);
  
  try {
    // Diagnostic: Check if user exists
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      console.error(`[ADMIN] User not found: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    // Update User table with all provided data
    const updateData: any = { ...otherData };
    if (planId) {
      updateData.planId = planId.toLowerCase();
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    // If planId was provided, also update/create Subscription
    if (planId) {
      const targetPlanId = planId.toLowerCase();
      
      // Calculate dates
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
      const endDate = currentPeriodEnd;

      await (prisma.subscription as any).upsert({
        where: { uid: userId },
        update: { 
          planId: targetPlanId, 
          status: 'active', 
          currentPeriodEnd, 
          endDate 
        },
        create: { 
          uid: userId, 
          planId: targetPlanId, 
          status: 'active', 
          currentPeriodEnd, 
          endDate 
        }
      });
      console.log(`[ADMIN] Updated subscription for ${userId} to ${targetPlanId}`);
    }

    console.log(`[ADMIN] Success: Updated user ${userId}`);
    res.json(updatedUser);
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

// Webhook for Meta WhatsApp
router.get('/whatsapp/webhook', (req, res) => {
  // Meta webhook verification
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

router.post('/whatsapp/webhook', async (req, res) => {
  const { object, entry } = req.body;
  
  if (object === 'whatsapp_business_account') {
    for (const item of entry) {
      for (const change of item.changes) {
        if (change.field === 'messages') {
            const status = change.value.statuses?.[0];
            if (status) {
                const messageId = status.id;
                const statusType = status.status; // delivered, read, sent, failed

                let newStatus = 'Enviada';
                if (statusType === 'delivered') newStatus = 'Entregue';
                if (statusType === 'read') newStatus = 'Lida';
                if (statusType === 'failed') newStatus = 'Falha';

                try {
                    await prisma.whatsappMessage.updateMany({
                        where: { externalId: messageId },
                        data: { status: newStatus }
                    });
                    console.log(`Meta Webhook: Message ${messageId} status updated to ${newStatus}`);
                } catch (err) {
                    console.error('Error updating message status from Meta webhook:', err);
                }
            }
        }
      }
    }
  }
  
  res.json({ success: true });
});

// Sales & PDV
router.get('/sales', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const sales = await prisma.sale.findMany({
      where: { ownerUid: req.user?.id },
      include: {
        items: {
          include: {
            product: true,
            service: true
          }
        },
        client: true,
        staff: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(sales);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sales', authenticateToken, async (req: AuthRequest, res) => {
  const { clientId, staffId, paymentMethod, items, includeDebt } = req.body;
  const ownerUid = req.user?.id as string;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Calculate total
      let totalAmount = 0;
      const saleItemsData = [];

      for (const item of items) {
        const lineTotal = item.quantity * item.unitPrice;
        totalAmount += lineTotal;
        
        saleItemsData.push({
          productId: item.productId || null,
          serviceId: item.serviceId || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: lineTotal
        });

        // 2. Decrement stock if it's a product
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          });
        }
      }

      // 3. Handle Debt payment if requested
      if (includeDebt && clientId) {
        const client = await tx.client.findUnique({ where: { id: clientId } });
        if (client && (client as any).pendingDebt > 0) {
          totalAmount += (client as any).pendingDebt;
          await tx.client.update({
            where: { id: clientId },
            data: { pendingDebt: 0 } as any
          });
        }
      }

      // 4. Create Sale
      const sale = await tx.sale.create({
        data: {
          ownerUid,
          clientId: clientId || null,
          staffId: staffId || null,
          totalAmount,
          paymentMethod,
          items: {
            create: saleItemsData
          }
        },
        include: { items: true }
      });

      // 4. Create Financial Transaction
      await tx.transaction.create({
        data: {
          ownerUid,
          type: 'income',
          amount: totalAmount,
          description: `Venda PDV #${sale.id.split('-')[0]}`,
          date: new Date(),
          category: 'Venda de Produtos/Serviços'
        }
      });

      return sale;
    });

    res.json(result);
  } catch (err: any) {
    console.error('[SALES_ERROR]', err);
    res.status(500).json({ error: err.message });
  }
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
  const { slug } = req.params;
  console.log(`[PublicShop] Searching for slug: "${slug}"`);
  try {
    // 1. Try finding by User slug (primary tenant ID)
    let user = await prisma.user.findFirst({
      where: { 
        OR: [
          { slug: slug },
          { slug: slug.toLowerCase() }
        ]
      },
      select: { id: true, name: true, shopName: true, status: true, slug: true }
    });

    let settings;
    if (user) {
      console.log(`[PublicShop] Found user by slug: ${user.id}`);
      settings = await prisma.setting.findUnique({ where: { uid: user.id } }) as any;
    } else {
      console.log(`[PublicShop] User not found by slug, trying Setting slug...`);
      settings = await prisma.setting.findFirst({ 
        where: { 
          OR: [
            { slug: slug },
            { slug: slug.toLowerCase() }
          ]
        } 
      }) as any;
      
      if (settings) {
        console.log(`[PublicShop] Found setting by slug, finding owner: ${settings.uid}`);
        user = await prisma.user.findUnique({
          where: { id: settings.uid },
          select: { id: true, name: true, shopName: true, status: true, slug: true }
        });
      }
    }

    if (!user) {
      console.log(`[PublicShop] No user found for slug "${slug}". Returning 404.`);
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Ensure settings exists (create default if missing)
    if (!settings) {
      console.log(`[PublicShop] Settings missing for user ${user.id}, creating defaults...`);
      settings = await prisma.setting.create({
        data: {
          uid: user.id,
          slug: user.slug || slug,
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
      });
    }

    const bh = typeof settings.businessHours === 'string' ? JSON.parse(settings.businessHours) : settings.businessHours;
    console.log(`[PublicShop] Successfully returning shop data for ${user.shopName}`);
    res.json({ 
      shop: { ...settings, businessHours: bh, uid: user.id }, 
      owner: { name: user.name, shopName: user.shopName, id: user.id } 
    });
  } catch (err: any) {
    console.error('[PublicShop] Critical Error:', err);
    res.status(500).json({ error: err.message });
  }
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
  let { ownerUid, clientName, phone, serviceId, serviceName, staffId, staffName, date, price } = req.body;
  
  // Sanitize phone (keep only digits)
  phone = phone.replace(/\D/g, '');
  
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

router.post('/public/appointments/:id/cancel', async (req, res) => {
  const { id } = req.params;
  const { reason, confirmLateCancellation } = req.body;

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!appointment) return res.status(404).json({ error: 'Agendamento não encontrado' });

    const now = new Date();
    const appDate = new Date(appointment.date);
    const diffInHours = (appDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // If < 24h and not yet confirmed as late cancellation
    if (diffInHours < 24 && !confirmLateCancellation) {
      return res.status(400).json({ 
        error: 'Late cancellation', 
        message: 'Atenção: Cancelamentos a menos de 24h geram uma taxa de 50%. Deseja prosseguir?',
        penaltyAmount: appointment.price * 0.5
      });
    }

    const finalStatus = diffInHours < 24 ? 'cancelled_late' : 'cancelled_on_time';
    
    await prisma.appointment.update({
      where: { id },
      data: { 
        status: finalStatus,
        cancellationReason: reason || 'Cancelado via Portal',
        cancellationDate: now
      } as any
    });

    // Apply debt if late
    if (diffInHours < 24) {
      const penalty = appointment.price * 0.5;
      await prisma.client.update({
        where: { id: appointment.clientId },
        data: {
          pendingDebt: { increment: penalty }
        } as any
      });
    }

    res.json({ success: true, status: finalStatus });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/public/client-portal/:slug/:phone', async (req, res) => {
  let { slug, phone } = req.params;
  phone = phone.replace(/\D/g, '');
  try {
    // Find the shop owner first
    let user = await prisma.user.findUnique({ where: { slug } });
    if (!user) {
      const shop = await prisma.setting.findUnique({ where: { slug } });
      if (shop) {
        user = await prisma.user.findUnique({ where: { id: shop.uid } });
      }
    }

    if (!user) return res.status(404).json({ error: 'Shop not found' });

    const client = await prisma.client.findFirst({
      where: { ownerUid: user.id, phone },
      include: {
        appointments: {
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!client) return res.status(404).json({ error: 'Client not found' });

    res.json({
      client: {
        id: client.id,
        name: client.name,
        pendingDebt: (client as any).pendingDebt || 0
      },
      appointments: client.appointments
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- MAGIC LINK ROUTES ---

/**
 * POST /public/client-portal/:slug/magic-link
 * Generates a one-time magic link and sends it via WhatsApp (WAHA).
 */
router.post('/public/client-portal/:slug/magic-link', async (req, res) => {
  let { phone } = req.body;
  const { slug } = req.params;

  if (!phone) return res.status(400).json({ error: 'Phone is required' });
  phone = String(phone).replace(/\D/g, '');

  try {
    // Resolve shop owner by slug
    let user = await prisma.user.findUnique({ where: { slug } });
    if (!user) {
      const shop = await prisma.setting.findUnique({ where: { slug } });
      if (shop) user = await prisma.user.findUnique({ where: { id: shop.uid } });
    }
    if (!user) return res.status(404).json({ error: 'Shop not found' });

    // Find client by phone
    const client = await prisma.client.findFirst({
      where: { ownerUid: user.id, phone }
    });
    if (!client) return res.status(404).json({ error: 'Cliente não encontrado. Verifique o número.' });

    // Rate limit: max 1 token per phone per 60 seconds
    const recentToken = await (prisma as any).clientMagicToken.findFirst({
      where: {
        clientId: client.id,
        createdAt: { gte: new Date(Date.now() - 60_000) }
      }
    });
    if (recentToken) {
      return res.status(429).json({ error: 'Aguarde 1 minuto antes de solicitar um novo link.' });
    }

    // Generate JWT token (15 min expiry)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const tokenPayload = { clientId: client.id, ownerUid: user.id, type: 'magic_link' };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '15m' });

    // Persist token for single-use enforcement
    await (prisma as any).clientMagicToken.create({
      data: { token, clientId: client.id, ownerUid: user.id, expiresAt }
    });

    // Build the magic link
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const magicLink = `${appUrl}/portal/${slug}?token=${token}`;

    // Send via WAHA
    const wahaSettings = await prisma.whatsappSettings.findUnique({ where: { uid: user.id } });
    let formattedPhone = phone.startsWith('55') ? phone : `55${phone}`;
    const chatId = `${formattedPhone}@c.us`;

    const shopName = user.shopName || 'nosso salão';
    const message = `Olá, ${client.name}! 👋\n\nAcesse sua área exclusiva em *${shopName}* clicando no link abaixo:\n\n🔗 ${magicLink}\n\n_Este link é válido por 15 minutos e é de uso único._`;

    if (wahaSettings?.enabled && wahaSettings.status === 'connected') {
      const waha = new WAHAService(WAHA_API_URL);
      await waha.sendTextMessage(wahaSettings.wahaInstanceName || 'default', chatId, message).catch(err => {
        console.error('[Magic Link] WAHA send failed:', err.message);
      });
    } else {
      // Log for dev/debug when WhatsApp is not connected
      console.log(`[Magic Link] Link for ${client.name} (${phone}): ${magicLink}`);
    }

    res.json({ success: true, message: 'Link enviado via WhatsApp! Verifique suas mensagens.' });
  } catch (err: any) {
    console.error('[Magic Link] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /public/client-portal/:slug/verify-token?token=
 * Validates a magic link token and returns client + appointments data.
 * Invalidates the token after first use.
 */
router.get('/public/client-portal/:slug/verify-token', async (req, res) => {
  const { slug } = req.params;
  const { token } = req.query as { token: string };

  if (!token) return res.status(400).json({ error: 'Token is required' });

  try {
    // Verify JWT signature and expiry
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Link inválido ou expirado.' });
    }

    if (payload.type !== 'magic_link') {
      return res.status(401).json({ error: 'Token inválido.' });
    }

    // Fetch the persisted token record
    const tokenRecord = await (prisma as any).clientMagicToken.findUnique({
      where: { token }
    });

    if (!tokenRecord) return res.status(401).json({ error: 'Link não encontrado.' });
    if (tokenRecord.usedAt) return res.status(401).json({ error: 'Este link já foi utilizado. Solicite um novo.' });
    if (new Date() > tokenRecord.expiresAt) return res.status(401).json({ error: 'Link expirado. Solicite um novo.' });

    // Validate slug matches ownerUid
    let user = await prisma.user.findUnique({ where: { slug } });
    if (!user) {
      const shop = await prisma.setting.findUnique({ where: { slug } });
      if (shop) user = await prisma.user.findUnique({ where: { id: shop.uid } });
    }
    if (!user || user.id !== tokenRecord.ownerUid) {
      return res.status(401).json({ error: 'Token inválido para este salão.' });
    }

    // Mark token as used (single-use)
    await (prisma as any).clientMagicToken.update({
      where: { token },
      data: { usedAt: new Date() }
    });

    // Fetch client + appointments
    const client = await prisma.client.findUnique({
      where: { id: tokenRecord.clientId },
      include: {
        appointments: { orderBy: { date: 'desc' } }
      }
    });

    if (!client) return res.status(404).json({ error: 'Cliente não encontrado.' });

    res.json({
      client: {
        id: client.id,
        name: client.name,
        pendingDebt: (client as any).pendingDebt || 0
      },
      appointments: (client as any).appointments
    });
  } catch (err: any) {
    console.error('[Magic Link Verify] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// SuperAdmin Routes
router.get('/superadmin/stats', authenticateToken, isSuperAdmin, async (req: AuthRequest, res) => {
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

router.get('/superadmin/tenants', authenticateToken, isSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const tenants = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(tenants);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

router.get('/superadmin/plans', authenticateToken, isSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const plans = await prisma.plan.findMany();
    const parsedPlans = plans.map((p: any) => ({
      ...p,
      features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features
    }));
    res.json(parsedPlans);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

router.get('/superadmin/tenant-usage/:userId', authenticateToken, isSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const appointments = await prisma.appointment.count({ where: { ownerUid: userId } });
    const staff = await prisma.staff.count({ where: { ownerUid: userId } });
    
    // Get wallet info too
    const wallet = await prisma.wallet.findUnique({
      where: { ownerUid: userId },
      include: { transactions: { take: 5, orderBy: { createdAt: 'desc' } } }
    });

    // Get WhatsApp status
    const whatsapp = await prisma.whatsappSettings.findUnique({
      where: { uid: userId }
    });
    
    res.json({ appointments, staff, wallet, whatsapp });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
});

router.post('/superadmin/tenants/:userId/wallet/recharge', authenticateToken, isSuperAdmin, async (req: AuthRequest, res) => {
    try {
        const { userId } = req.params;
        const { amount, description } = req.body;

        const wallet = await prisma.wallet.upsert({
            where: { ownerUid: userId },
            update: {
                balance: { increment: Number(amount) }
            },
            create: {
                ownerUid: userId,
                balance: Number(amount),
                isActive: true
            }
        });

        await prisma.walletTransaction.create({
            data: {
                walletId: wallet.id,
                amount: Number(amount),
                type: 'credit',
                category: 'recharge',
                description: description || 'Recarga manual via Admin'
            }
        });

        res.json(wallet);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// End of consolidated routes

router.put('/superadmin/plans/:planId', authenticateToken, isSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { planId } = req.params;
    const data = req.body;
    const updated = await prisma.plan.update({
      where: { id: planId },
      data: {
          ...data,
          features: typeof data.features === 'object' ? JSON.stringify(data.features) : data.features
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

router.post('/superadmin/plans', authenticateToken, isSuperAdmin, async (req: AuthRequest, res) => {
    try {
        const { id, name, slug, priceMonthly, priceYearly, features } = req.body;
        const plan = await prisma.plan.create({
            data: {
                id: id || `plan_${slug || Math.random().toString(36).substring(2, 9)}`,
                name,
                slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
                priceMonthly: Number(priceMonthly),
                priceYearly: Number(priceYearly),
                features: typeof features === 'string' ? features : JSON.stringify(features)
            }
        });
        res.json(plan);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/superadmin/plans/:planId', authenticateToken, isSuperAdmin, async (req: AuthRequest, res) => {
    try {
        const { planId } = req.params;
        await prisma.plan.delete({
            where: { id: planId }
        });
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
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
        currentPeriodEnd: new Date(endDate),
        updatedAt: new Date()
      },
      create: {
        uid: req.user.id,
        planId,
        status: 'active',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        currentPeriodEnd: new Date(endDate)
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

// --- ANAMNESIS ROUTES ---
router.get('/clients/:id/anamnesis', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const list = await prisma.anamnesis.findMany({
      where: { clientId: req.params.id, ownerUid: req.user?.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(list.map(a => ({ ...a, content: JSON.parse(a.content) })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/clients/:id/anamnesis', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { procedure, content, signatureUrl } = req.body;
    const record = await prisma.anamnesis.create({
      data: {
        clientId: req.params.id,
        ownerUid: req.user?.id as string,
        procedure: procedure || "Geral",
        content: JSON.stringify(content),
        signatureUrl
      }
    });
    res.json(record);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/anamnesis/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await prisma.anamnesis.deleteMany({
      where: { id: req.params.id, ownerUid: req.user?.id }
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Podology Specific Anamnesis
router.get('/clients/:id/podology-anamnesis', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const records = await (prisma as any).podologyAnamnesis.findMany({
      where: { clientId: req.params.id, ownerUid: req.user?.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(records);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/podology-anamnesis', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const ownerUid = req.user?.id as string;
    const { clientId, ...rest } = req.body;
    
    const record = await (prisma as any).podologyAnamnesis.create({
      data: {
        ...rest,
        clientId,
        ownerUid
      }
    });

    // Also update RG/CPF on client if provided
    if (rest.rg || rest.cpf) {
      await prisma.client.update({
        where: { id: clientId },
        data: {
          rg: rest.rg || undefined,
          cpf: rest.cpf || undefined
        }
      });
    }

    res.json(record);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// AI & Assets
router.post('/ai/generate-assets', async (req, res) => {
    try {
        const { prompt, aspectRatio } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'AI API Key not configured' });
        }

        const genAI = new GoogleGenAI({ apiKey });
        
        const result = await (genAI as any).models.generateContent({
            model: 'gemini-1.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: aspectRatio || "16:9" } }
        });

        const response = result;
        // In the original frontend code, it expected inlineData (base64)
        // Since we are moving the logic, we'll return the same structure
        const imagePart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
        
        if (imagePart) {
            res.json({ data: imagePart.inlineData.data });
        } else {
            // If it's just text (because gemini-2.0-flash is text/multimodal but not always image gen)
            // We'll return the text for now or handle the error
            res.json({ text: response.text() });
        }
    } catch (error: any) {
        console.error('AI Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===========================================================
// --- COMBOS (Service Packages) ---
// ===========================================================

router.get('/combos', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const combos = await (prisma as any).serviceCombo.findMany({
      where: { ownerUid: req.user?.id },
      include: {
        items: {
          include: { service: true },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Attach computed totalDurationMin to each combo
    const result = combos.map((combo: any) => ({
      ...combo,
      totalDurationMin: combo.items.reduce(
        (acc: number, item: any) => acc + item.service.duration, 0
      )
    }));

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/combos', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, description, price, services } = req.body;
    // services = [{ serviceId: string, order: number }]

    if (!services || services.length === 0) {
      return res.status(400).json({ error: 'Um combo precisa ter ao menos 1 serviço' });
    }

    const combo = await (prisma as any).serviceCombo.create({
      data: {
        name,
        description,
        price: price ? Number(price) : null,
        ownerUid: req.user?.id as string,
        items: {
          create: services.map((s: any) => ({
            serviceId: s.serviceId,
            order: s.order
          }))
        }
      },
      include: {
        items: {
          include: { service: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    const totalDurationMin = combo.items.reduce(
      (acc: number, item: any) => acc + item.service.duration, 0
    );

    res.status(201).json({ ...combo, totalDurationMin });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/combos/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, description, price, services } = req.body;
    const comboId = req.params.id;

    // Verify ownership
    const existing = await (prisma as any).serviceCombo.findFirst({
      where: { id: comboId, ownerUid: req.user?.id }
    });
    if (!existing) return res.status(404).json({ error: 'Combo não encontrado' });

    // Delete old items and recreate
    await (prisma as any).comboItem.deleteMany({ where: { comboId } });

    const combo = await (prisma as any).serviceCombo.update({
      where: { id: comboId },
      data: {
        name,
        description,
        price: price ? Number(price) : null,
        items: {
          create: services.map((s: any) => ({
            serviceId: s.serviceId,
            order: s.order
          }))
        }
      },
      include: {
        items: {
          include: { service: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    const totalDurationMin = combo.items.reduce(
      (acc: number, item: any) => acc + item.service.duration, 0
    );

    res.json({ ...combo, totalDurationMin });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/combos/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await (prisma as any).serviceCombo.deleteMany({
      where: { id: req.params.id, ownerUid: req.user?.id }
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ===========================================================
// --- RECURRING APPOINTMENTS ---
// ===========================================================

/**
 * POST /appointments/recurring/validate
 * Batch-validates a recurring series without saving anything.
 * Returns a list of conflict dates to display in the conflict modal.
 */
router.post('/appointments/recurring/validate', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const {
      staffId,
      serviceId,
      comboId,
      startTime,        // "HH:MM"
      dayOfWeek,        // 0-6
      frequency,        // "weekly" | "biweekly"
      seriesStartDate,  // "YYYY-MM-DD"
      seriesEndDate     // "YYYY-MM-DD"
    } = req.body;

    const ownerUid = req.user?.id as string;

    // Determine duration: from combo or from single service
    let durationMin = 0;
    if (comboId) {
      durationMin = await calculateComboDuration(comboId, prisma as any);
    } else if (serviceId) {
      const svc = await prisma.service.findFirst({ where: { id: serviceId, ownerUid } });
      durationMin = svc?.duration || 60;
    } else {
      return res.status(400).json({ error: 'serviceId ou comboId é obrigatório' });
    }

    const result = await validateRecurrenceSeries(
      ownerUid,
      staffId,
      startTime,
      durationMin,
      Number(dayOfWeek),
      new Date(seriesStartDate),
      new Date(seriesEndDate),
      frequency || 'weekly',
      prisma as any
    );

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /appointments/recurring
 * Persists a validated recurring series.
 * Expects resolvedDates[] with manual overrides for conflict dates.
 */
router.post('/appointments/recurring', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const {
      staffId,
      staffName,
      clientId,
      clientName,
      clientPhone,
      serviceId,
      serviceName,
      comboId,
      price,
      frequency,
      dayOfWeek,
      seriesStartDate,
      seriesEndDate,
      resolvedDates // [{ date: 'YYYY-MM-DD', startTime: 'HH:MM', skipped?: boolean }]
    } = req.body;

    const ownerUid = req.user?.id as string;

    // Determine duration
    let durationMin = 0;
    if (comboId) {
      durationMin = await calculateComboDuration(comboId, prisma as any);
    } else if (serviceId) {
      const svc = await prisma.service.findFirst({ where: { id: serviceId, ownerUid } });
      durationMin = svc?.duration || 60;
    }

    // Create the parent RecurrenceGroup
    const group = await (prisma as any).recurrenceGroup.create({
      data: {
        ownerUid,
        staffId,
        frequency: frequency || 'weekly',
        dayOfWeek: Number(dayOfWeek),
        startDate: new Date(seriesStartDate),
        endDate: new Date(seriesEndDate),
        startTime: resolvedDates?.[0]?.startTime || '09:00',
        serviceId: serviceId || null,
        comboId: comboId || null,
      }
    });

    // Create individual appointments (skipping 'skipped' dates)
    const appointmentsToCreate = (resolvedDates || [])
      .filter((d: any) => !d.skipped)
      .map((d: any) => {
        const [h, m] = (d.startTime || '09:00').split(':').map(Number);
        const startDt = new Date(`${d.date}T00:00:00`);
        startDt.setHours(h, m, 0, 0);
        const endDt = new Date(startDt.getTime() + durationMin * 60_000);

        return {
          ownerUid,
          clientId: clientId || 'guest',
          clientName,
          phone: clientPhone || '',
          serviceId: serviceId || '',
          serviceName: serviceName || (comboId ? 'Combo' : 'Serviço'),
          barberId: staffId || ownerUid,
          barberName: staffName || '',
          staffId: staffId || null,
          staffName: staffName || null,
          date: startDt,
          startTime: startDt,
          endTime: endDt,
          totalDurationMin: durationMin,
          recurrenceGroupId: group.id,
          comboId: comboId || null,
          price: Number(price) || 0,
          status: 'scheduled'
        };
      });

    if (appointmentsToCreate.length === 0) {
      return res.status(400).json({ error: 'Nenhuma data válida para criar agendamentos' });
    }

    await (prisma.appointment as any).createMany({ data: appointmentsToCreate });

    res.status(201).json({
      success: true,
      recurrenceGroupId: group.id,
      totalCreated: appointmentsToCreate.length
    });
  } catch (err: any) {
    console.error('Error creating recurring appointments:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /appointments/recurring/:groupId
 * Cancels all future appointments for a recurring group.
 * Pass ?cancelAll=true to cancel the entire series (including past).
 */
router.delete('/appointments/recurring/:groupId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { groupId } = req.params;
    const cancelAll = req.query.cancelAll === 'true';
    const ownerUid = req.user?.id as string;

    // Verify group ownership
    const group = await (prisma as any).recurrenceGroup.findFirst({
      where: { id: groupId, ownerUid }
    });
    if (!group) return res.status(404).json({ error: 'Série não encontrada' });

    const dateFilter = cancelAll ? {} : { startTime: { gte: new Date() } };

    const updated = await (prisma.appointment as any).updateMany({
      where: {
        recurrenceGroupId: groupId,
        ownerUid,
        status: { not: 'cancelled' },
        ...dateFilter
      },
      data: { status: 'cancelled' }
    });

    // If cancelling all, mark the group as cancelled too
    if (cancelAll) {
      await (prisma as any).recurrenceGroup.update({
        where: { id: groupId },
        data: { status: 'cancelled' }
      });
    }

    res.json({ success: true, cancelledCount: updated.count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /appointments/recurring/:groupId
 * Returns all appointments for a recurrence group.
 */
router.get('/appointments/recurring/:groupId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const appointments = await (prisma.appointment as any).findMany({
      where: {
        recurrenceGroupId: req.params.groupId,
        ownerUid: req.user?.id
      },
      orderBy: { startTime: 'asc' }
    });
    res.json(appointments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

