import express from 'express';
import { createServer, deleteServer, listServers } from '../controllers/serverController.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', authorizeRoles('admin', 'operator'), createServer);
router.get('/', authorizeRoles('admin', 'operator', 'viewer'), listServers);
router.delete('/:id', authorizeRoles('admin', 'operator'), deleteServer);

export default router;
