import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { requireAdmin, requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { asyncHandler as h } from '../middlewares/error';

import * as auth from '../controllers/authController';
import * as leads from '../controllers/leadsController';
import * as clients from '../controllers/clientsController';
import * as sales from '../controllers/salesController';
import * as commissions from '../controllers/commissionsController';
import * as services from '../controllers/servicesController';
import * as materials from '../controllers/materialsController';
import * as goals from '../controllers/goalsController';
import * as sellers from '../controllers/sellersController';
import * as notifications from '../controllers/notificationsController';
import * as dashboard from '../controllers/dashboardController';
import * as ranking from '../controllers/rankingController';
import * as reports from '../controllers/reportsController';

import {
  changePasswordSchema,
  commissionActionSchema,
  commissionListQuery,
  convertLeadSchema,
  createClientSchema,
  createLeadSchema,
  createMaterialSchema,
  createSaleSchema,
  createSellerSchema,
  createServiceSchema,
  forgotPasswordSchema,
  listQuery,
  loginSchema,
  payCommissionsSchema,
  periodQuery,
  resetPasswordSchema,
  saleStatusSchema,
  updateClientSchema,
  updateLeadSchema,
  updateMaterialSchema,
  updateProfileSchema,
  updateSaleSchema,
  updateSellerSchema,
  updateServiceSchema,
  upsertGoalSchema,
} from '../schemas';

export const router = Router();

/** Limite agressivo no login para dificultar ataque de forca bruta. */
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Aguarde alguns minutos.' },
});

// ---------------------------------------------------------------------------
// Publicas
// ---------------------------------------------------------------------------

router.post('/auth/login', loginLimiter, validate(loginSchema), h(auth.login));
router.post('/auth/logout', h(auth.logout));
router.post(
  '/auth/forgot-password',
  loginLimiter,
  validate(forgotPasswordSchema),
  h(auth.forgotPassword),
);
router.post('/auth/reset-password', validate(resetPasswordSchema), h(auth.resetPassword));

// ---------------------------------------------------------------------------
// A partir daqui, tudo exige sessao valida
// ---------------------------------------------------------------------------

router.use(requireAuth);

router.get('/auth/me', h(auth.me));
router.patch('/auth/profile', validate(updateProfileSchema), h(auth.updateProfile));
router.post('/auth/change-password', validate(changePasswordSchema), h(auth.changePassword));

// Dashboards
router.get('/dashboard', validate(periodQuery, 'query'), h(dashboard.sellerDashboard));
router.get(
  '/dashboard/admin',
  requireAdmin,
  validate(periodQuery, 'query'),
  h(dashboard.adminDashboard),
);

// Leads
router.get('/leads', validate(listQuery, 'query'), h(leads.listLeads));
router.get('/leads/:id', h(leads.getLead));
router.post('/leads', validate(createLeadSchema), h(leads.createLead));
router.patch('/leads/:id', validate(updateLeadSchema), h(leads.updateLead));
router.delete('/leads/:id', h(leads.deleteLead));
router.post('/leads/:id/convert', validate(convertLeadSchema), h(leads.convertLead));

// Clientes
router.get('/clients', validate(listQuery, 'query'), h(clients.listClients));
router.get('/clients/options', h(clients.clientOptions));
router.get('/clients/:id', h(clients.getClient));
router.post('/clients', validate(createClientSchema), h(clients.createClient));
router.patch('/clients/:id', validate(updateClientSchema), h(clients.updateClient));
router.delete('/clients/:id', h(clients.deleteClient));

// Vendas
router.get('/sales', validate(listQuery, 'query'), h(sales.listSales));
router.get('/sales/:id', h(sales.getSale));
router.post('/sales', validate(createSaleSchema), h(sales.createSale));
router.patch('/sales/:id', validate(updateSaleSchema), h(sales.updateSale));
router.patch('/sales/:id/status', validate(saleStatusSchema), h(sales.updateSaleStatus));
router.delete('/sales/:id', h(sales.deleteSale));
router.post('/sales/:id/approve', requireAdmin, h(sales.approveSale));
router.post('/sales/:id/unapprove', requireAdmin, h(sales.unapproveSale));

// Comissoes
router.get('/commissions', validate(commissionListQuery, 'query'), h(commissions.listCommissions));
router.get('/commissions/tier', validate(periodQuery, 'query'), h(commissions.commissionTier));
router.get('/commissions/payments', validate(listQuery, 'query'), h(commissions.listPayments));
router.post(
  '/commissions/release',
  requireAdmin,
  validate(commissionActionSchema),
  h(commissions.releaseCommissions),
);
router.post(
  '/commissions/pay',
  requireAdmin,
  validate(payCommissionsSchema),
  h(commissions.payCommissions),
);

// Metas
router.get('/goals', validate(periodQuery, 'query'), h(goals.listGoals));
router.post('/goals', requireAdmin, validate(upsertGoalSchema), h(goals.upsertGoal));
router.delete('/goals/:id', requireAdmin, h(goals.deleteGoal));

// Ranking
router.get('/ranking', validate(periodQuery.extend({}), 'query'), h(ranking.getRanking));

// Servicos (leitura livre, escrita restrita ao admin)
router.get('/services', h(services.listServices));
router.post('/services', requireAdmin, validate(createServiceSchema), h(services.createService));
router.patch(
  '/services/:id',
  requireAdmin,
  validate(updateServiceSchema),
  h(services.updateService),
);
router.delete('/services/:id', requireAdmin, h(services.deleteService));

// Materiais
router.get('/materials', h(materials.listMaterials));
router.post('/materials', requireAdmin, validate(createMaterialSchema), h(materials.createMaterial));
router.patch(
  '/materials/:id',
  requireAdmin,
  validate(updateMaterialSchema),
  h(materials.updateMaterial),
);
router.delete('/materials/:id', requireAdmin, h(materials.deleteMaterial));

// Notificacoes
router.get('/notifications', h(notifications.listNotifications));
router.patch('/notifications/:id/read', h(notifications.markRead));
router.post('/notifications/read-all', h(notifications.markAllRead));
router.delete('/notifications/:id', h(notifications.deleteNotification));

// Vendedores (admin)
router.get('/sellers/options', h(sellers.sellerOptions));
router.get('/sellers', requireAdmin, validate(listQuery, 'query'), h(sellers.listSellers));
router.get('/sellers/:id', requireAdmin, h(sellers.getSeller));
router.post('/sellers', requireAdmin, validate(createSellerSchema), h(sellers.createSeller));
router.patch('/sellers/:id', requireAdmin, validate(updateSellerSchema), h(sellers.updateSeller));
router.delete('/sellers/:id', requireAdmin, h(sellers.deleteSeller));

// Relatorios e auditoria (admin)
router.get('/reports', requireAdmin, validate(periodQuery, 'query'), h(reports.operationReport));
router.get('/audit-logs', requireAdmin, validate(listQuery, 'query'), h(reports.listAuditLogs));
