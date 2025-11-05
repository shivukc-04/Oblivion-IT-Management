import { configDotenv } from 'dotenv';
import mongoose from 'mongoose';
import Incident from '../models/incident.js';
import User from '../models/user.js';
const generateTicketId = () => {
  const prefix = 'IT';
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  const random = Math.floor(1000 + Math.random() * 9000); // 4 random digits
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * @desc    Create a new incident
 * @route   POST /api/incidents
 * @access  Private (Admin/Operator)
 */
const createIncident = async (req, res) => {
  try {
    const { title, description, priority, assignedTo } = req.body;

    // 1. Check for required fields
    if (!title || !description || !assignedTo) {
      return res.status(400).json({ message: 'Please provide title, description, and assignedTo fields' });
    }

    // 2. Validate 'assignedTo' user
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(404).json({ message: 'Assigned user not found' });
    }

    // Get creator ID from auth token
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated or invalid token' });
    }

    // Create the incident
    const incident = await Incident.create({
      title,
      description,
      priority: priority || 'medium',
      assignedTo: assignedUser._id,
      createdBy: req.user._id,
      ticketId: generateTicketId(),
      status: 'open',
    });

    if (incident) {
      // Fetch the created incident with populated fields
      const populatedIncident = await Incident.findById(incident._id)
        .populate('assignedTo', 'username email role')
        .populate('createdBy', 'username email role');
      res.status(201).json(populatedIncident);
    } else {
      res.status(400).json({ message: 'Invalid incident data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while creating incident' });
  }
};

/**
 * @desc    Get all incidents
 * @route   GET /api/incidents
 * @access  Private
 */
const getAllIncidents = async (req, res) => {
  try {
    // Find all incidents, populate user details, sort by newest first
    const incidents = await Incident.find({})
      .populate('assignedTo', 'username email role')  // Populate assigned user details
      .populate('createdBy', 'username email role')   // Populate creator details
      .sort({ createdAt: -1 });
    res.status(200).json(incidents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching incidents' });
  }
};

/**
 * @desc    Get a single incident by ID
 * @route   GET /api/incidents/:id
 * @access  Private
 */
const getIncidentById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid incident ID format' });
    }

    const incident = await Incident.findById(req.params.id)
      .populate('assignedTo', 'username email role')
      .populate('createdBy', 'username email role');

    if (incident) {
      res.status(200).json(incident);
    } else {
      res.status(404).json({ message: 'Incident not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching incident' });
  }
};

/**
 * @desc    Update an incident
 * @route   PUT /api/incidents/:id
 * @access  Private
 */
const updateIncident = async (req, res) => {
  try {
    const { title, description, status, priority, assignedTo } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid incident ID format' });
    }

    // If assignedTo is provided, validate the user exists
    if (assignedTo) {
      if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
      }
      const userExists = await User.findById(assignedTo);
      if (!userExists) {
        return res.status(404).json({ message: 'Assigned user not found' });
      }
    }

    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    // Update fields if they are provided
    if (title) incident.title = title;
    if (description) incident.description = description;
    if (priority) incident.priority = priority;
    if (assignedTo) incident.assignedTo = assignedTo;

    // Special logic for status change
    if (status && status !== incident.status) {
      incident.status = status;
      // If status is set to 'resolved', add the timestamp
      if (status === 'resolved') {
        incident.resolvedAt = Date.now();
      } else {
        // If it's changed to something else (e.g., reopened), clear the resolvedAt time
        incident.resolvedAt = null;
      }
    }

    await incident.save();
    
    // Fetch the updated incident with populated fields
    const updatedIncident = await Incident.findById(incident._id)
      .populate('assignedTo', 'username email role')
      .populate('createdBy', 'username email role');
    
    res.status(200).json(updatedIncident);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating incident' });
  }
};

/**
 * @desc    Delete an incident
 * @route   DELETE /api/incidents/:id
 * @access  Private (Admin only)
 */
const deleteIncident = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (incident) {
      await incident.deleteOne(); // or .remove() for older mongoose
      res.status(200).json({ message: 'Incident removed' });
    } else {
      res.status(404).json({ message: 'Incident not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while deleting incident' });
  }
};

export {
  createIncident,
  getAllIncidents,
  getIncidentById,
  updateIncident,
  deleteIncident,
};