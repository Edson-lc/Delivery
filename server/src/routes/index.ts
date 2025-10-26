import { Router } from 'express';
import restaurantsRouter from './restaurants';
import menuItemsRouter from './menu-items';
import ordersRouter from './orders';
import cartsRouter from './carts';
import customersRouter from './customers';
import entregadoresRouter from './entregadores';
import deliveriesRouter from './deliveries';
import alteracoesPerfilRouter from './alteracoes-perfil';
import usersRouter from './users';
import authRouter from './auth';
import publicRouter from './public';
import paymentsRouter from './payments';
import addressesRouter from './addresses';
import authenticate from '../middleware/authenticate';
import requireRole from '../middleware/require-role';

const router = Router();

// Rotas públicas (sem autenticação)
router.use('/public', publicRouter);
router.use('/auth', authRouter);

// Middleware de autenticação para rotas protegidas
router.use(authenticate);

// Rotas protegidas (com autenticação)
router.use('/restaurants', requireRole(['admin', 'restaurante']), restaurantsRouter);
router.use('/menu-items', requireRole(['admin', 'restaurante']), menuItemsRouter);
router.use('/orders', requireRole(['admin', 'restaurante', 'entregador', 'cliente', 'user']), ordersRouter);
router.use('/carts', requireRole(['admin']), cartsRouter);
router.use('/customers', requireRole(['admin', 'restaurante', 'cliente', 'user']), customersRouter);
router.use('/entregadores', requireRole(['admin', 'entregador']), entregadoresRouter);
router.use('/deliveries', requireRole(['admin', 'entregador']), deliveriesRouter);
router.use('/alteracoes-perfil', requireRole(['admin']), alteracoesPerfilRouter);
router.use('/users', requireRole(['admin', 'restaurante', 'entregador', 'cliente', 'user']), usersRouter);
router.use('/payments', requireRole(['admin', 'restaurante', 'entregador', 'cliente', 'user']), paymentsRouter);
router.use('/addresses', requireRole(['admin', 'cliente', 'user']), addressesRouter);

export default router;
