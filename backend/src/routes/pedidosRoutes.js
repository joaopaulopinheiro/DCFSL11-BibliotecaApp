import express from 'express';
import {
  getAllPedidos,
  getPedidoById,
  createPedido,
  updatePedido,
  deletePedido,
  approvePedido,
  rejectPedido,
  returnPedido,
  cancelPedido
} from '../controllers/pedidosControllers.js';
import { validateToken } from '../controllers/validateTokenControllers.js';
import { validateAdmin, validateColab } from '../helpers/common.js';

const router = express.Router();

// Rotas de leitura (todos podem acessar)
router.get('/', validateToken, getAllPedidos);
router.get('/:id', validateToken, getPedidoById);

// Rotas de criação (aluno)
router.post('/', validateToken, createPedido);
router.post('/:id/cancelar', validateToken, cancelPedido);

// Rotas de aprovação/rejeição/devolução (colab/admin)
router.post('/:id/aprovar', validateToken, validateColab, approvePedido);
router.post('/:id/reprovar', validateToken, validateColab, rejectPedido);
router.post('/:id/devolver', validateToken, validateColab, returnPedido);

// Rotas legacy (admin apenas)
router.put('/:id', validateToken, validateAdmin, updatePedido);
router.delete('/:id', validateToken, validateAdmin, deletePedido);


export default router;
