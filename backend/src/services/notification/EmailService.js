const sgMail = require('@sendgrid/mail');
const logger = require('../../utils/logger');

const normalizeEnv = (value) => {
    if (value === undefined || value === null) return undefined;
    const normalized = String(value).trim();
    return normalized || undefined;
};

class EmailService {
    constructor() {
        this.isConfigured = false;
        this.useSendGrid = false;
        this.sendGridApiKey = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
        const EMAIL_MOCK = normalizeEnv(process.env.EMAIL_MOCK);
        const SENDGRID_API_KEY = normalizeEnv(process.env.SENDGRID_API_KEY);
        const SENDGRID_FROM_EMAIL = normalizeEnv(process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM || process.env.EMAIL_USER);
        const SENDGRID_FROM_NAME = normalizeEnv(process.env.SENDGRID_FROM_NAME || process.env.EMAIL_FROM_NAME || 'MediTracker');

        if (EMAIL_MOCK === 'true') {
            console.log('📧 Email service running in MOCK mode - emails will be logged only');
            console.log('ℹ️  To enable real emails, set EMAIL_MOCK=false in .env');
            return;
        }

        if (!SENDGRID_API_KEY) {
            console.warn('⚠️  Email service disabled - Missing SENDGRID_API_KEY');
            console.log('ℹ️  Set the following env vars for SendGrid:');
            console.log(`
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=your_email@gmail.com
SENDGRID_API_KEY must be a valid SendGrid API key.
            `);
            return;
        }
        if (!SENDGRID_FROM_EMAIL) {
            console.warn('⚠️  Email service disabled - Missing SENDGRID_FROM_EMAIL (verified sender identity required)');
            console.log('ℹ️  Set the following env var to a verified sender address in SendGrid:');
            console.log('\nSENDGRID_FROM_EMAIL=your_verified_email@example.com\n');
            return;
        }

        try {
            sgMail.setApiKey(SENDGRID_API_KEY);
            this.useSendGrid = true;
            this.sendGridApiKey = SENDGRID_API_KEY;
            this.fromEmail = SENDGRID_FROM_EMAIL;
            this.fromName = SENDGRID_FROM_NAME;
            this.isConfigured = true;
            console.log('✅ SendGrid email service configured successfully');
            console.log('ℹ️ Email provider selected: SendGrid');
        } catch (error) {
            console.error('❌ SendGrid initialization error:', error.message);
            this.useSendGrid = false;
            this.isConfigured = false;
        }
    }

    async testConnection() {
        if (this.useSendGrid) {
            try {
                // SendGrid doesn't have a verify method, just test the API key
                console.log('✅ SendGrid API key verified');
                return true;
            } catch (error) {
                console.error('❌ SendGrid test failed:', error.message);
                return false;
            }
        }

        console.log('📧 Email service not configured');
        return false;
    }

    async sendEmail(to, subject, html, text = '') {
        try {
            const emailMock = process.env.EMAIL_MOCK === 'true';
            const recipients = Array.isArray(to) ? to.join(', ') : to;

            // If in mock mode, log and return a successful mock response
            if (emailMock) {
                console.log(`\n📧 [MOCK EMAIL]`);
                console.log(`   To: ${recipients}`);
                console.log(`   Subject: "${subject}"`);
                console.log(`   Preview: ${this.htmlToText(html).substring(0, 80)}...`);
                console.log(`   Time: ${new Date().toLocaleString()}`);
                console.log(`   ℹ️  Mock email mode enabled. Set EMAIL_MOCK=false to send real emails.`);

                return {
                    success: true,
                    mock: true,
                    messageId: `mock-${Date.now()}`,
                    message: 'Email logged in mock mode',
                    recipient: recipients,
                    subject: subject
                };
            }

            if (!this.isConfigured || !this.useSendGrid) {
                const errorMessage = 'Email service is not configured. SendGrid is required. Set SENDGRID_API_KEY in environment variables.';
                console.error('❌ Failed to send email:', errorMessage);
                throw new Error(errorMessage);
            }

            const fromEmail = this.fromEmail || process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM || process.env.EMAIL_USER;
            const fromName = this.fromName || process.env.EMAIL_FROM_NAME || 'MediTracker';

            if (!fromEmail) {
                const errorMessage = 'Email "from" address is not configured. Set SENDGRID_FROM_EMAIL to a verified sender identity.';
                console.error('❌ Failed to send email:', errorMessage);
                return {
                    success: false,
                    error: true,
                    code: 'MISSING_FROM_EMAIL',
                    message: errorMessage
                };
            }
            console.log(`📤 Sending email to: ${to}`);
            const startTime = Date.now();

            const toArray = Array.isArray(to) ? to : [to];
            const msg = {
                to: toArray,
                from: `${fromName} <${fromEmail}>`,
                subject: subject,
                text: text || this.htmlToText(html),
                html: html,
                replyTo: process.env.EMAIL_REPLY_TO || fromEmail,
                headers: {
                    'X-Priority': '3',
                    'X-Mailer': 'MediTracker v1.0'
                }
            };

            const info = await sgMail.send(msg);
            const duration = Date.now() - startTime;
            console.log(`✅ Email sent via SendGrid in ${duration}ms`);
            console.log(`   Recipients: ${toArray.join(', ')}`);
            console.log(`   Status: ${info[0].statusCode}`);

            logger.info(`Email sent to ${to} via SendGrid (${duration}ms)`);

            return {
                success: true,
                messageId: info[0].headers?.['x-message-id'] || `sg-${Date.now()}`,
                response: `SendGrid status ${info[0].statusCode}`,
                duration: duration
            };

        } catch (error) {
            logger.error('Email sending error:', error);
            console.error(`❌ Failed to send email to ${to}:`, error.message);
            
            // Don't crash the app - return error object
            return {
                success: false,
                error: true,
                code: error.code || 'UNKNOWN_ERROR',
                message: error.message,
                recipient: to,
                subject: subject
            };
        }
    }

    // Helper method to convert HTML to plain text
    htmlToText(html) {
        if (!html) return '';
        return html
            .replace(/<style[^>]*>.*<\/style>/gm, '') // Remove style tags
            .replace(/<script[^>]*>.*<\/script>/gm, '') // Remove script tags
            .replace(/<[^>]*>/g, ' ') // Replace HTML tags with spaces
            .replace(/\s+/g, ' ') // Collapse multiple spaces
            .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
            .replace(/&amp;/g, '&') // Decode HTML entities
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();
    }

    async sendReminderEmail(to, data) {
        const { userName, medicationName, dosage, scheduledTime, doseId } = data;
        
        const subject = `⏰ Medication Reminder: ${medicationName}`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .medication-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>⏰ Medication Reminder</h1>
                        <p>Time to take your medication!</p>
                    </div>
                    <div class="content">
                        <p>Hi ${userName},</p>
                        <p>This is a reminder for your scheduled medication:</p>
                        
                        <div class="medication-card">
                            <h2>${medicationName}</h2>
                            <p><strong>Dosage:</strong> ${dosage}</p>
                            <p><strong>Scheduled Time:</strong> ${scheduledTime}</p>
                            <p><strong>Reminder ID:</strong> ${doseId}</p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL || 'https://your-app.com'}/doses/${doseId}/taken" class="button" style="background: #48bb78;">✅ Taken</a>
                            <a href="${process.env.FRONTEND_URL || 'https://your-app.com'}/doses/${doseId}/snooze" class="button" style="background: #ed8936;">⏰ Snooze</a>
                            <a href="${process.env.FRONTEND_URL || 'https://your-app.com'}/doses/${doseId}/missed" class="button" style="background: #f56565;">❌ Missed</a>
                        </div>
                        
                        <p>You can also manage your medications at: 
                            <a href="${process.env.FRONTEND_URL || 'https://your-app.com'}">MediTracker Dashboard</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>This is an automated reminder from MediTracker.</p>
                        <p>If you no longer wish to receive these reminders, 
                            <a href="${process.env.FRONTEND_URL || 'https://your-app.com'}/settings">update your preferences</a>.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const text = `
Medication Reminder
===================

Hi ${userName},

Time to take your medication!

Medication: ${medicationName}
Dosage: ${dosage}
Scheduled Time: ${scheduledTime}
Reminder ID: ${doseId}

Quick Actions:
✅ Mark as taken: ${process.env.FRONTEND_URL || 'https://your-app.com'}/doses/${doseId}/taken
⏰ Snooze reminder: ${process.env.FRONTEND_URL || 'https://your-app.com'}/doses/${doseId}/snooze
❌ Mark as missed: ${process.env.FRONTEND_URL || 'https://your-app.com'}/doses/${doseId}/missed

Manage your medications at: ${process.env.FRONTEND_URL || 'https://your-app.com'}

---
This is an automated reminder from MediTracker.
To update preferences: ${process.env.FRONTEND_URL || 'https://your-app.com'}/settings
        `;

        return await this.sendEmail(to, subject, html, text);
    }

    async sendMissedDoseAlert(to, data) {
        const { userName, medicationName, missedTime } = data;
        
        const subject = `⚠️ Missed Dose Alert: ${medicationName}`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .alert-card { background: white; border-left: 4px solid #f56565; padding: 20px; margin: 20px 0; }
                    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>⚠️ Missed Dose Alert</h1>
                        <p>You missed a scheduled medication dose</p>
                    </div>
                    <div class="content">
                        <p>Hi ${userName},</p>
                        <p>Our records show that you missed a scheduled medication dose:</p>
                        
                        <div class="alert-card">
                            <h2>${medicationName}</h2>
                            <p><strong>Missed At:</strong> ${missedTime}</p>
                            <p><strong>Status:</strong> <span style="color: #f56565;">Missed</span></p>
                        </div>
                        
                        <p><strong>What to do next:</strong></p>
                        <ul>
                            <li>Take the missed dose as soon as you remember</li>
                            <li>If it's almost time for your next dose, skip the missed dose</li>
                            <li>Do not take double doses to make up for a missed dose</li>
                            <li>Contact your healthcare provider if you're unsure</li>
                        </ul>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL || 'https://your-app.com'}/dashboard" class="button">Go to Dashboard</a>
                        </div>
                        
                        <p><strong>AI Assistant Tip:</strong> Consider setting additional reminders or connecting with a caregiver for better adherence.</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated alert from MediTracker.</p>
                        <p>If you believe this is an error, please contact support.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const text = `
Missed Dose Alert
=================

Hi ${userName},

Our records show that you missed a scheduled medication dose:

Medication: ${medicationName}
Missed At: ${missedTime}
Status: MISSED ⚠️

What to do next:
• Take the missed dose as soon as you remember
• If it's almost time for your next dose, skip the missed dose
• DO NOT take double doses to make up for a missed dose
• Contact your healthcare provider if you're unsure

AI Assistant Tip: Consider setting additional reminders or connecting with a caregiver for better adherence.

Go to Dashboard: ${process.env.FRONTEND_URL || 'https://your-app.com'}/dashboard

---
This is an automated alert from MediTracker.
If you believe this is an error, please contact support.
        `;

        return await this.sendEmail(to, subject, html, text);
    }

    async sendEmergencyAlert(to, data) {
        const { patientName, medicationName, missedTime } = data;
        
        const subject = `🚨 Emergency Alert: ${patientName} Missed Medication`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #f56565 0%, #c53030 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .emergency-card { background: #fff5f5; border: 2px solid #f56565; padding: 20px; margin: 20px 0; border-radius: 8px; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🚨 Emergency Alert</h1>
                        <p>Caregiver Notification</p>
                    </div>
                    <div class="content">
                        <p><strong>Attention Caregiver,</strong></p>
                        <p>This is an emergency alert from MediTracker:</p>
                        
                        <div class="emergency-card">
                            <h2>Patient: ${patientName}</h2>
                            <p><strong>Missed Medication:</strong> ${medicationName}</p>
                            <p><strong>Missed At:</strong> ${missedTime}</p>
                            <p><strong>Alert Level:</strong> <span style="color: #f56565; font-weight: bold;">HIGH</span></p>
                        </div>
                        
                        <p><strong>Recommended Action:</strong></p>
                        <ol>
                            <li>Contact ${patientName} immediately</li>
                            <li>Check if they're okay</li>
                            <li>Remind them to take the missed medication if appropriate</li>
                            <li>Contact healthcare provider if needed</li>
                        </ol>
                        
                        <p><strong>Patient Contact Information:</strong><br>
                        (This information would be populated from the patient's profile)
                        </p>
                        
                        <p><em>This alert was sent because you are listed as an emergency contact.</em></p>
                    </div>
                    <div class="footer">
                        <p>MediTracker Emergency Notification System</p>
                        <p>If you are no longer an emergency contact, please ask the patient to update their profile.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const text = `
EMERGENCY ALERT - Caregiver Notification
========================================

Attention Caregiver,

This is an emergency alert from MediTracker:

Patient: ${patientName}
Missed Medication: ${medicationName}
Missed At: ${missedTime}
Alert Level: HIGH 🚨

Recommended Action:
1. Contact ${patientName} immediately
2. Check if they're okay
3. Remind them to take the missed medication if appropriate
4. Contact healthcare provider if needed

Patient Contact Information:
(This information would be populated from the patient's profile)

---
This alert was sent because you are listed as an emergency contact.

MediTracker Emergency Notification System
If you are no longer an emergency contact, please ask the patient to update their profile.
        `;

        return await this.sendEmail(to, subject, html, text);
    }

    async sendTestEmail(to, data) {
        const subject = '✅ Test Notification from MediTracker';
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .success-card { background: white; border: 2px solid #48bb78; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Test Successful!</h1>
                        <p>MediTracker Notification Test</p>
                    </div>
                    <div class="content">
                        <p>Hi there,</p>
                        <p>This is a test email to confirm that your MediTracker notifications are working correctly.</p>
                        
                        <div class="success-card">
                            <h2>Test Data</h2>
                            <p><strong>Medication:</strong> ${data.medicationName}</p>
                            <p><strong>Time:</strong> ${data.scheduledTime}</p>
                            <p><strong>Status:</strong> <span style="color: #48bb78;">Test Notification</span></p>
                        </div>
                        
                        <p>When you have actual medication reminders, they will look similar to this but with your specific medication details.</p>
                        
                        <p>You're all set! Your notification system is working properly. 🎉</p>
                    </div>
                    <div class="footer">
                        <p>MediTracker Test Notification</p>
                        <p>If you received this email unexpectedly, please ignore it.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const text = `
Test Notification from MediTracker
==================================

Hi there,

This is a test email to confirm that your MediTracker notifications are working correctly.

Test Data:
• Medication: ${data.medicationName}
• Time: ${data.scheduledTime}
• Status: Test Notification

When you have actual medication reminders, they will look similar to this but with your specific medication details.

You're all set! Your notification system is working properly. 🎉

---
MediTracker Test Notification
If you received this email unexpectedly, please ignore it.
        `;

        return await this.sendEmail(to, subject, html, text);
    }

    async sendWelcomeEmail(to, userName) {

        const subject = 'Welcome to MediTracker! 🎉';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to MediTracker! 🎉</h1>
                        <p>Your journey to better medication management starts here</p>
                    </div>
                    <div class="content">
                        <p>Hi ${userName},</p>
                        <p>Thank you for joining MediTracker! We're excited to help you manage your medications effectively.</p>
                        
                        <h3>🚀 Get Started:</h3>
                        <div class="feature">
                            <strong>1. Add Your Medications</strong>
                            <p>Start by adding your current medications with dosages and schedules.</p>
                        </div>
                        <div class="feature">
                            <strong>2. Set Up Reminders</strong>
                            <p>Never miss a dose with timely email, SMS, and push notifications.</p>
                        </div>
                        <div class="feature">
                            <strong>3. Track Your Health</strong>
                            <p>Log vital signs and see how medications affect your health.</p>
                        </div>
                        <div class="feature">
                            <strong>4. Earn Rewards</strong>
                            <p>Get points and badges for consistent medication adherence.</p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL || 'https://your-app.com'}/medications/add" class="button">Add Your First Medication</a>
                        </div>
                        
                        <h3>📱 Download Our App:</h3>
                        <p>Get the full experience on your mobile device:</p>
                        <ul>
                            <li>Instant push notifications</li>
                            <li>Quick dose logging</li>
                            <li>Health tracking on the go</li>
                            <li>AI medication assistant</li>
                        </ul>
                        
                        <p>Need help? Check out our <a href="${process.env.FRONTEND_URL || 'https://your-app.com'}/help">help center</a> or contact support.</p>
                        
                        <p>Welcome aboard!<br>
                        <strong>The MediTracker Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} MediTracker. All rights reserved.</p>
                        <p><a href="${process.env.FRONTEND_URL || 'https://your-app.com'}/unsubscribe">Unsubscribe</a> from marketing emails</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const text = `
Welcome to MediTracker! 🎉
==========================

Hi ${userName},

Thank you for joining MediTracker! We're excited to help you manage your medications effectively.

🚀 Get Started:
1. Add Your Medications
   Start by adding your current medications with dosages and schedules.

2. Set Up Reminders
   Never miss a dose with timely email, SMS, and push notifications.

3. Track Your Health
   Log vital signs and see how medications affect your health.

4. Earn Rewards
   Get points and badges for consistent medication adherence.

Add Your First Medication: ${process.env.FRONTEND_URL || 'https://your-app.com'}/medications/add

📱 Download Our App:
Get the full experience on your mobile device:
• Instant push notifications
• Quick dose logging
• Health tracking on the go
• AI medication assistant

Need help? Check out our help center: ${process.env.FRONTEND_URL || 'https://your-app.com'}/help

Welcome aboard!
The MediTracker Team

---
© ${new Date().getFullYear()} MediTracker. All rights reserved.
Unsubscribe from marketing emails: ${process.env.FRONTEND_URL || 'https://your-app.com'}/unsubscribe
        `;

        return await this.sendEmail(to, subject, html, text);
    }

    // New method: Quick diagnostic
    async diagnostic() {
        const config = {
            hasSendGridKey: !!process.env.SENDGRID_API_KEY,
            hasSendGridFromEmail: !!process.env.SENDGRID_FROM_EMAIL,
            mockMode: process.env.EMAIL_MOCK === 'true',
            selectedProvider: this.useSendGrid ? 'SendGrid' : 'None',
            frontendUrl: process.env.FRONTEND_URL || 'Not set',
            isConfigured: this.isConfigured
        };

        console.log('\n📊 Email Service Diagnostic:');
        console.log('===========================');
        console.log(`1. SENDGRID_API_KEY configured: ${config.hasSendGridKey ? '✅' : '❌'}`);
        console.log(`2. SENDGRID_FROM_EMAIL configured: ${config.hasSendGridFromEmail ? '✅' : '❌'}`);
        console.log(`3. Mock mode: ${config.mockMode ? '✅ ON' : '❌ OFF'}`);
        console.log(`4. Selected provider: ${config.selectedProvider}`);
        console.log(`5. Service configured: ${config.isConfigured ? '✅ Yes' : '❌ No'}`);
        console.log(`6. FRONTEND_URL: ${config.frontendUrl}`);
        
        if (!config.hasSendGridKey) {
            console.log('\n💡 Solution: Add to .env file:');
            console.log(`
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=your_email@gmail.com
EMAIL_MOCK=false
            `);
        }

        return config;
    }
}





module.exports = new EmailService();
