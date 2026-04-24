import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  getLivros,
  getLivroById,
  createLivro,
  updateLivro,
  deleteLivro,
  getCatalogo,
} from '../controllers/livrosControllers.js';
import { validateToken } from '../controllers/validateTokenControllers.js';
import { validateColab } from '../helpers/common.js';

const router = express.Router();

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas!'));
    }
  }
});

// GET /catalogo - retórna livros com disponibilidade dinâmica (alunos não veem livros sem estoque)
router.get('/catalogo', validateToken, getCatalogo);

// GET /livros
router.get('/', validateToken, getLivros);

// GET /livros/:id
router.get('/:id', validateToken, getLivroById);

// POST /livros
router.post('/', validateToken, validateColab, upload.single('img'), createLivro);

// PUT /livros/:id
router.put('/:id', validateToken, validateColab, upload.single('img'), updateLivro);

// DELETE /livros/:id
router.delete('/:id', validateToken, validateColab, deleteLivro);

export default router;
