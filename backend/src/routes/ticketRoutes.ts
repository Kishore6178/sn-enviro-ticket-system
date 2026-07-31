import express from 'express';
import { createTicket, getTickets, updateTicket, magicResolve, addComment, testSlaWarning } from '../controllers/ticketController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();
router.get('/test-email', async (req, res) => {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    
    // Test the Vercel Proxy
    const response = await fetch('https://jaswanth1904-snenviroticket.vercel.app/api/sendEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: process.env.SMTP_USER || 'aj19.jaswanth@gmail.com',
        subject: 'Render to Vercel Proxy Test',
        htmlContent: '<h1>It works!</h1>',
        smtpUser: process.env.SMTP_USER,
        smtpPass: process.env.SMTP_PASS,
      })
    });
    
    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ success: false, message: 'Vercel proxy failed', data });
    }
    
    res.json({ success: true, message: 'Vercel proxy works!', data, isProd });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: 'Network Error calling Vercel', 
      error: error.message
    });
  }
});

router
  .route('/')
  .post(createTicket as any)
  .get(protect as any, getTickets as any);

// Test Route
router.get('/test-sla', testSlaWarning as any);

router
  .route('/:id')
  .patch(protect as any, updateTicket as any);

router.post('/:id/comments', protect as any, addComment as any);

// Public route for engineers to resolve via magic link
router.patch('/:id/magic-resolve', magicResolve as any);

export default router;
