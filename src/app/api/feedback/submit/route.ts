import { NextRequest } from 'next/server';
import { respData, respErr } from '@/shared/lib/resp';
import { getEmailService } from '@/shared/services/email';
import { getAllConfigs } from '@/shared/models/config';

/**
 * Submit feedback
 * POST /api/feedback/submit
 * Body: { email: string, message: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, message } = body || {};

    if (!email || !email.includes('@')) {
      return respErr('Invalid email address', 400);
    }

    if (!message || message.trim().length < 10) {
      return respErr('Message must be at least 10 characters', 400);
    }

    // Get email service and configs
    const configs = await getAllConfigs();
    const emailService = await getEmailService();

    // Check if email service is configured
    const hasEmailProvider = emailService.getProviderNames().length > 0;

    // Send thank you email to customer (if email service is configured)
    if (hasEmailProvider) {
      try {
        const thankYouEmailResult = await emailService.sendEmail({
          to: email,
          subject: 'Thank You for Your Feedback - Subtitle TK',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Thank You for Your Feedback</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">Thank You!</h1>
              </div>
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Dear Valued Customer,
                </p>
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Thank you for taking the time to share your feedback with us. We truly appreciate your input and are committed to continuously improving our services.
                </p>
                <p style="font-size: 16px; margin-bottom: 20px;">
                  We have received your message and our team will review it carefully. If your feedback requires a response, we will get back to you as soon as possible.
                </p>
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Your opinion matters to us, and we're grateful for your trust in Subtitle TK.
                </p>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                  <p style="font-size: 14px; color: #666; margin: 0;">
                    Best regards,<br>
                    <strong>The Subtitle TK Team</strong>
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `Thank You for Your Feedback - Subtitle TK

Dear Valued Customer,

Thank you for taking the time to share your feedback with us. We truly appreciate your input and are committed to continuously improving our services.

We have received your message and our team will review it carefully. If your feedback requires a response, we will get back to you as soon as possible.

Your opinion matters to us, and we're grateful for your trust in Subtitle TK.

Best regards,
The Subtitle TK Team`,
        });

        if (!thankYouEmailResult.success) {
          console.error('Failed to send thank you email:', thankYouEmailResult.error);
          // Continue anyway - don't fail the request
        }
      } catch (error) {
        console.error('Error sending thank you email:', error);
        // Continue anyway - don't fail the request
      }
    } else {
      console.warn('Email service not configured. Feedback saved but no email sent.');
    }

    // Send notification email to admin
    if (hasEmailProvider) {
      // Default notification email (always send)
      const defaultNotificationEmail = 'xiongjp_fr@163.com';
      
      // Get notification emails (from config or use default)
      const notificationEmails: string[] = [];
      
      // Add default notification email
      notificationEmails.push(defaultNotificationEmail);
      
      // Add configured notification email if exists
      if (configs.feedback_notification_email && configs.feedback_notification_email !== defaultNotificationEmail) {
        notificationEmails.push(configs.feedback_notification_email);
      }
      
      // Send notification to all recipients
      for (const notificationEmail of notificationEmails) {
        try {
          await emailService.sendEmail({
            to: notificationEmail,
            subject: `New Feedback Received from ${email}`,
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #667eea;">New Feedback Received</h2>
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-top: 20px;">
                  <p><strong>From:</strong> ${email}</p>
                  <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                  <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                  <p><strong>Message:</strong></p>
                  <p style="white-space: pre-wrap; background: white; padding: 15px; border-radius: 4px; border-left: 3px solid #667eea;">${message}</p>
                </div>
              </div>
            `,
            text: `New Feedback Received\n\nFrom: ${email}\nTime: ${new Date().toLocaleString()}\n\nMessage:\n${message}`,
          });
        } catch (error) {
          console.error(`Failed to send notification email to ${notificationEmail}:`, error);
          // Don't fail the request if notification email fails
        }
      }
    }

    // Log feedback (save to database or log file)
    console.log('Feedback received:', { email, message, timestamp: new Date().toISOString() });

    return respData({
      success: true,
      message: 'Feedback submitted successfully',
    });
  } catch (error: any) {
    console.error('Feedback submit error:', error);
    return respErr(error?.message || 'Failed to submit feedback', 500);
  }
}

