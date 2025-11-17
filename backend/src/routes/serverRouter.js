import express from 'express';
import { createServer, deleteServer, listServers } from '../controllers/serverController.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';

const router = express.Router();

// All routes here are admin-only
router.use(verifyToken);
router.use(authorizeRoles('admin','operator'));

router.post('/', createServer);
router.get('/', listServers);
router.delete('/:id', deleteServer);

export default router;
