import cron from 'node-cron';
import Ticket from '../models/Ticket';
import User from '../models/User';
import { sendSLAWarning } from '../services/emailService';

// Run every hour
export const initSLAMonitor = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('Running SLA Monitor cron job...');
    
    try {
      // Find tickets that are not resolved, have an assignee, and haven't had a warning sent
      const openTickets = await Ticket.find({
        status: { $ne: 'Resolved' },
        assignedTo: { $exists: true, $ne: null },
        slaWarningSent: false
      }).populate('assignedTo');

      const now = new Date().getTime();
      const THIRTY_SIX_HOURS_MS = 36 * 60 * 60 * 1000;

      for (const ticket of openTickets) {
        const createdAt = new Date(ticket.createdAt).getTime();
        const ageMs = now - createdAt;

        if (ageMs > THIRTY_SIX_HOURS_MS) {
          console.log(`Ticket ${ticket.ticketId} is approaching SLA breach. Sending warning...`);
          
          const assignee = ticket.assignedTo as any;
          if (assignee && assignee.email) {
            // Build details object for the email
            const details = {
              ticketId: ticket.ticketId,
              subject: ticket.subject,
              industryName: ticket.stationId ? 'Station Facility' : 'Unknown Facility',
              stationNumber: ticket.stationId ? '01' : '00',
              resolutionToken: ticket.resolutionToken || 'N/A'
            };

            const success = await sendSLAWarning(assignee.email, details);
            
            if (success) {
              // Update ticket to indicate warning was sent
              ticket.slaWarningSent = true;
              
              // Add to activity log
              ticket.activityLog.push({
                action: 'STATUS_CHANGED',
                performedBy: 'System',
                details: 'Automated 36-hour SLA warning email dispatched to technician.',
                timestamp: new Date()
              });
              
              await ticket.save();
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in SLA Monitor cron job:', error);
    }
  });
  
  console.log('SLA Monitor cron job initialized.');
};
