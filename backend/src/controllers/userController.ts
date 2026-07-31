import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Ticket from '../models/Ticket';
import { AuthRequest } from '../middleware/authMiddleware';

// @desc    Get technician leaderboard/performance
// @route   GET /api/v1/users/performance
// @access  Private/Admin
export const getTechnicianPerformance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // 1. Get all field engineers
    const engineers = await User.find({ role: 'field_engineer' }).select('-password');
    
    // 2. Fetch all tickets
    const tickets = await Ticket.find({ assignedTo: { $exists: true, $ne: null } }).lean();

    const leaderboard = engineers.map(eng => {
      // Find tickets assigned to this engineer
      const myTickets = tickets.filter(t => t.assignedTo?.toString() === eng._id.toString());
      
      const activeTickets = myTickets.filter(t => t.status !== 'Resolved').length;
      const resolvedTickets = myTickets.filter(t => t.status === 'Resolved');
      
      let totalResolutionTimeMs = 0;
      resolvedTickets.forEach(t => {
        const created = new Date(t.createdAt).getTime();
        const updated = new Date(t.updatedAt).getTime();
        totalResolutionTimeMs += (updated - created);
      });
      
      const avgResolutionTimeHours = resolvedTickets.length > 0 
        ? (totalResolutionTimeMs / resolvedTickets.length) / (1000 * 60 * 60)
        : 0;

      return {
        _id: eng._id,
        name: eng.name,
        email: eng.email,
        activeTickets,
        resolvedTickets: resolvedTickets.length,
        avgResolutionTimeHours: avgResolutionTimeHours,
        score: (resolvedTickets.length * 10) - (avgResolutionTimeHours * 2) // Simple arbitrary score
      };
    });

    // Sort by most resolved tickets, then by fastest resolution time
    leaderboard.sort((a, b) => {
      if (b.resolvedTickets !== a.resolvedTickets) {
        return b.resolvedTickets - a.resolvedTickets;
      }
      return a.avgResolutionTimeHours - b.avgResolutionTimeHours;
    });

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    next(error);
  }
};
