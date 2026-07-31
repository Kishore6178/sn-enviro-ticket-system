import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import Ticket from '../models/Ticket';
import Station from '../models/Station';
import { AuthRequest } from '../middleware/authMiddleware';
import User from '../models/User';
import { getIo } from '../socket';
import { sendRegistrationAcknowledgement, sendAssignmentNotification, sendResolutionNotice, sendAdminNewTicketNotification } from '../services/emailService';

// @desc    Create a new ticket
// @route   POST /api/v1/tickets
// @access  Private
export const createTicket = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { 
      stationId, 
      manualStationName, 
      locationDetails, 
      subject, 
      description, 
      s3ImageUrl, 
      assignedTo, 
      telemetryIssueType, 
      fieldEngineerLocation, 
      contactEmail,
      remoteSoftware,
      remoteId,
      remotePassword
    } = req.body;

    let station;
    if (stationId === 'STN-999' && manualStationName) {
      station = await Station.create({
        stationNumber: `MNL-${Date.now().toString().slice(-4)}`,
        industryName: `Manual: ${manualStationName}`,
        district: locationDetails || 'Manual Entry',
        state: 'Manual Entry',
        deviceTypes: ['Manual Entry'],
        coordinates: {
          type: 'Point',
          coordinates: [0, 0]
        }
      });
    } else {
      station = await Station.findById(stationId).catch(() => null);
      if (!station) {
        // Look up by human-readable string (e.g., STN-260)
        station = await Station.findOne({ stationNumber: stationId });
        
        // If it still doesn't exist, create a dummy station to ensure the ticket never drops
        if (!station) {
          station = await Station.create({
            stationNumber: stationId,
            industryName: 'Unknown Field Location',
            district: 'Unknown',
            state: 'Unknown',
            deviceTypes: ['Unknown'],
            coordinates: {
              type: 'Point',
              coordinates: [0, 0]
            }
          });
        }
      }
    }

    const ticket = await Ticket.create({
      stationId: station._id,
      creatorId: req.user?._id || undefined,
      assignedTo: assignedTo || null,
      subject,
      description,
      s3ImageUrl,
      telemetryIssueType,
      remoteSoftware,
      remoteId,
      remotePassword,
      fieldEngineerLocation,
      contactEmail,
      activityLog: [{
        action: 'CREATED',
        performedBy: req.user?.name || 'Field Engineer (Public)',
        details: 'Ticket was created and logged into the system.',
        timestamp: new Date()
      }]
    });

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('stationId', 'stationNumber industryName location')
      .populate('creatorId', 'name email')
      .populate('assignedTo', 'name email')
      .lean();

    // Emit Socket Event
    getIo().emit('ticket:onNewTicket', populatedTicket);

    let emailSent = false;
    if (assignedTo && populatedTicket?.assignedTo) {
      const assignee: any = populatedTicket.assignedTo;
      const stationData: any = populatedTicket.stationId;
      const stationDetails = stationData ? `${stationData.stationNumber} - ${stationData.industryName}` : 'Unknown Plant';
      
      await sendAssignmentNotification(
        assignee.email, 
        ticket.ticketId, 
        subject,
        ticket.telemetryIssueType || 'General Issue',
        ticket.description,
        stationDetails,
        ticket.remoteSoftware,
        ticket.remoteId,
        ticket.remotePassword
      ).catch(console.error);
      emailSent = true;
    }

    // Always send the confirmation to the creator (Field Engineer) asynchronously
    const creator: any = populatedTicket?.creatorId;
    const recipientEmail = contactEmail || creator?.email;
    if (recipientEmail) {
      sendRegistrationAcknowledgement(
        recipientEmail, 
        ticket.ticketId, 
        subject, 
        description,
        ticket.remoteSoftware,
        ticket.remoteId,
        ticket.remotePassword
      ).catch(console.error);
    }

    // Notify all admins of the new ticket so they can review and assign
    try {
      const admins = await User.find({ role: 'admin' }).select('email');
      const stationData: any = populatedTicket?.stationId;
      const stationDetailsStr = stationData ? `${stationData.stationNumber} - ${stationData.industryName}` : 'Unknown Plant';
      
      for (const admin of admins) {
        if (admin.email) {
          sendAdminNewTicketNotification(
            admin.email,
            ticket.ticketId,
            subject,
            stationDetailsStr
          ).catch(console.error);
        }
      }
    } catch (adminNotifyErr) {
      console.error('Error notifying admins about new ticket:', adminNotifyErr);
    }

    res.status(201).json({
      success: true,
      emailSent,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tickets
// @route   GET /api/v1/tickets
// @access  Private
export const getTickets = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let query = {};

    // If not admin, only show tickets created by them or assigned to them
    if (req.user?.role !== 'admin') {
      query = {
        $or: [{ creatorId: req.user?._id }, { assignedTo: req.user?._id }],
      };
    }

    const tickets = await Ticket.find(query)
      .populate('stationId', 'stationNumber industryName location')
      .populate('creatorId', 'name email role')
      .populate('assignedTo', 'name email role')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update ticket
// @route   PATCH /api/v1/tickets/:id
// @access  Private
export const updateTicket = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, assignedTo, notes } = req.body;

    let ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      res.status(404);
      return next(new Error('Ticket not found'));
    }

    // Check permissions: 
    // Admin can update anything.
    // Assignee or Creator can update status and notes.
    if (
      req.user?.role !== 'admin' &&
      ticket.creatorId.toString() !== req.user?._id?.toString() &&
      ticket.assignedTo?.toString() !== req.user?._id?.toString()
    ) {
      res.status(403);
      return next(new Error('Not authorized to update this ticket'));
    }

    if (status && status !== ticket.status) {
      ticket.status = status;
      ticket.activityLog.push({
        action: 'STATUS_CHANGED',
        performedBy: req.user?.name || 'Unknown User',
        details: `Status updated to ${status}`,
        timestamp: new Date()
      });
    }
    
    if (notes) ticket.notes = notes;
    
    // Only admin can reassign tickets generally
    if (assignedTo && req.user?.role === 'admin') {
      let finalAssignedTo = assignedTo;
      
      // If the payload is an email address string instead of an ObjectId
      if (typeof assignedTo === 'string' && assignedTo.includes('@')) {
        let userByEmail = await User.findOne({ email: assignedTo });
        if (!userByEmail) {
          // Create dummy user for the technician
          userByEmail = await User.create({
            name: assignedTo.split('@')[0],
            email: assignedTo,
            password: 'generated-password-123',
            role: 'field_engineer'
          });
        }
        finalAssignedTo = userByEmail._id;
      }
      
      ticket.assignedTo = finalAssignedTo;
      
      // Generate a magic link token if not exists
      if (!ticket.resolutionToken) {
        ticket.resolutionToken = crypto.randomBytes(16).toString('hex');
      }

      ticket.activityLog.push({
        action: 'ASSIGNED',
        performedBy: req.user?.name || 'Admin',
        details: `Assigned ticket to a technician`,
        timestamp: new Date()
      });
    }

    const updatedTicket = await ticket.save();

    const populatedTicket = await Ticket.findById(updatedTicket._id)
      .populate('stationId', 'stationNumber industryName location')
      .populate('creatorId', 'name email')
      .populate('assignedTo', 'name email')
      .lean();

    // Emit Socket Event
    getIo().emit('ticket_updated', populatedTicket);

    let emailSent = true;
    if (assignedTo && populatedTicket?.assignedTo) {
      const assignee: any = populatedTicket.assignedTo;
      const stationData: any = populatedTicket.stationId;
      const stationDetails = stationData ? `${stationData.stationNumber} - ${stationData.industryName}` : 'Unknown Plant';
      
      sendAssignmentNotification(
        assignee.email, 
        updatedTicket.ticketId, 
        updatedTicket.subject,
        updatedTicket.telemetryIssueType || 'General Issue',
        updatedTicket.description,
        stationDetails,
        updatedTicket.remoteSoftware,
        updatedTicket.remoteId,
        updatedTicket.remotePassword,
        updatedTicket.resolutionToken
      ).catch(console.error);
    }

    if (status === 'Resolved') {
      const creator: any = populatedTicket?.creatorId;
      const recipientEmail = ticket.contactEmail || creator?.email;
      
      const created = new Date((ticket as any).createdAt).getTime();
      const now = new Date().getTime();
      const diffMs = now - created;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      let resolutionTimeStr = '';
      if (hours > 0) {
        resolutionTimeStr = `${hours} hour(s) and ${minutes} minute(s)`;
      } else {
        resolutionTimeStr = `${minutes} minute(s)`;
      }

      if (recipientEmail) {
        sendResolutionNotice(recipientEmail, updatedTicket.ticketId, resolutionTimeStr).catch(console.error);
      }
    }

    res.json({
      success: true,
      emailSent,
      data: updatedTicket,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Magic link resolution for engineers
// @route   PATCH /api/v1/tickets/:ticketId/magic-resolve
// @access  Public
export const magicResolve = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, notes } = req.body;
    
    // Find ticket by ticketId (e.g. SN-2026-1001) and ensure token matches
    // We explicitly select the resolutionToken since it's select: false in schema
    const ticket = await Ticket.findOne({ ticketId: req.params.id, resolutionToken: token }).select('+resolutionToken');
    
    if (!ticket) {
      res.status(403);
      return next(new Error('Invalid token or ticket not found'));
    }

    ticket.status = 'Pending Review';
    if (notes) {
      ticket.notes = ticket.notes ? `${ticket.notes}\n\n[Engineer Resolution Note]: ${notes}` : `[Engineer Resolution Note]: ${notes}`;
    } else {
      ticket.notes = ticket.notes ? `${ticket.notes}\n\n[Engineer marked as fixed without notes]` : `[Engineer marked as fixed without notes]`;
    }
    
    ticket.activityLog.push({
      action: 'STATUS_CHANGED',
      performedBy: 'Field Engineer (Magic Link)',
      details: 'Marked ticket as resolved and changed status to Pending Review',
      timestamp: new Date()
    });
    
    // Clear the token so it can't be reused
    ticket.resolutionToken = undefined; 
    
    const updatedTicket = await ticket.save();

    const populatedTicket = await Ticket.findById(updatedTicket._id)
      .populate('stationId', 'stationNumber industryName location')
      .populate('creatorId', 'name email')
      .populate('assignedTo', 'name email')
      .lean();

    // Emit Socket Event to alert admin instantly
    getIo().emit('ticket_updated', populatedTicket);

    res.json({
      success: true,
      data: updatedTicket,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a comment to a ticket
// @route   POST /api/v1/tickets/:id/comments
// @access  Private
export const addComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { text } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      res.status(404);
      return next(new Error('Ticket not found'));
    }

    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized'));
    }

    const comment = {
      text,
      authorName: req.user.name,
      authorRole: req.user.role,
      createdAt: new Date(),
    };

    ticket.comments.push(comment);
    ticket.activityLog.push({
      action: 'COMMENT_ADDED',
      performedBy: req.user.name,
      details: 'Added an internal discussion comment',
      timestamp: new Date()
    });
    
    await ticket.save();

    // Re-fetch or just construct the payload to emit
    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('stationId', 'stationNumber industryName location')
      .populate('creatorId', 'name email')
      .populate('assignedTo', 'name email')
      .lean();

    getIo().emit('ticket_updated', populatedTicket);

    res.status(201).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};
