import 'dotenv/config';
import express from 'express';
import {
    getUsuarios,
    getUsuarioById,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    changeStatusUsuario
} from '../controllers/usuariosControllers.js';
import { validateToken } from '../controllers/validateTokenControllers.js';
import { validateAdmin } from '../helpers/common.js';

const router = express.Router();

router.get('/', validateToken, validateAdmin, getUsuarios); // GET /usuarios
router.post('/', validateToken, validateAdmin, createUsuario); // POST /usuarios
router.put('/:id/status', validateToken, validateAdmin, changeStatusUsuario); // PUT /usuarios/:id/status (mudar status)
router.get('/:id', validateToken, getUsuarioById); // GET /usuarios/:id
router.put('/:id', validateToken, validateAdmin, updateUsuario); // PUT /usuarios/:id
router.delete('/:id', validateToken, validateAdmin, deleteUsuario); // DELETE /usuarios/:id

export default router;
