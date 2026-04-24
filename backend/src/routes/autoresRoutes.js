import express from 'express';
import {  getAllAutores,
  getAutorById,
  createAutor,
  updateAutor,
  deleteAutor,
} from '../controllers/autoresControllers.js';
import { validateToken } from '../controllers/validateTokenControllers.js';
import { validateColab } from '../helpers/common.js';

const router = express.Router();

router.get('/', validateToken, getAllAutores); // GET /autores
router.get('/:id', validateToken, getAutorById); // GET /autores/:id
router.post('/', validateToken, validateColab, createAutor); // POST /autores
router.put('/:id', validateToken, validateColab, updateAutor); // PUT /autores/:id
router.delete('/:id', validateToken, validateColab, deleteAutor); // DELETE /autores/:id

export default router;
