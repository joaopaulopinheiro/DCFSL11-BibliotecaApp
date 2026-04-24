import express from 'express';
import {  getAllCategorias,
  getCategoriaById,
  createCategoria,
  updateCategoria,
  deleteCategoria
} from '../controllers/categoriasControllers.js';
import { validateToken } from '../controllers/validateTokenControllers.js';
import { validateColab } from '../helpers/common.js';


const router = express.Router();

router.get('/', validateToken, getAllCategorias); // GET /categorias
router.get('/:id', validateToken, getCategoriaById); // GET /categorias/:id
router.post('/', validateToken, validateColab, createCategoria); // POST /categorias
router.put('/:id', validateToken, validateColab, updateCategoria); // PUT /categorias/:id
router.delete('/:id', validateToken, validateColab, deleteCategoria); // DELETE /categorias/:id

export default router;
