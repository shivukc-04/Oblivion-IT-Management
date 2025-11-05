import express from 'express';
import {
  createIncident,
  getAllIncidents,
  getIncidentById,
  updateIncident,
  deleteIncident,
} from '../controllers/incidentController.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';

// Create a new router instance
const router = express.Router();

// === Define Routes ===

/*
 * @route   /api/incidents
 */
router.route('/')
    // GET /api/incidents
  .get(verifyToken, getAllIncidents)
  
  // POST /api/incidents
  .post(verifyToken, authorizeRoles('admin', 'operator'), createIncident);

/*
 * @route   /api/incidents/:id
 */
router.route('/:id')
  // GET /api/incidents/:id
  .get(verifyToken, getIncidentById)

  // PUT /api/incidents/:id
  .put(verifyToken, authorizeRoles('admin', 'operator'), updateIncident)

  // DELETE /api/incidents/:id
  .delete(verifyToken, authorizeRoles('admin'), deleteIncident);

export default router;