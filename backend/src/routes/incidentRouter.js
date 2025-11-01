import express from 'express';
import {
  createIncident,
  getAllIncidents,
  getIncidentById,
  updateIncident,
  deleteIncident,
} from '../controllers/incidentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

// Create a new router instance
const router = express.Router();

// === Define Routes ===

/*
 * @route   /api/incidents
 */
router.route('/')
    // GET /api/incidents
  .get(protect, getAllIncidents)
  
  // POST /api/incidents
  .post(protect, authorize('admin', 'operator'), createIncident);

/*
 * @route   /api/incidents/:id
 */
router.route('/:id')
  // GET /api/incidents/:id
  .get(protect, getIncidentById)

  // PUT /api/incidents/:id
  .put(protect, authorize('admin', 'operator'), updateIncident)

  // DELETE /api/incidents/:id
  .delete(protect, authorize('admin'), deleteIncident);

export default router;