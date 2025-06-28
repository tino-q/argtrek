/**
 * SendGrid Email Utility for Google Apps Script
 *
 * Usage:
 * 1. Store your API key securely (run once in Apps Script editor):
 *    PropertiesService.getScriptProperties().setProperty('SENDGRID_KEY', 'YOUR_SENDGRID_API_KEY');
 * 2. Import and use sendViaSendGrid in your Apps Script code.
 */

/**
 * Send an email via SendGrid API
 * @param {string} to - Recipient email address
 * @param {string} from - Sender email address (must be verified in SendGrid)
 * @param {string} subject - Email subject
 * @param {string} htmlBody - HTML content
 * @param {string} textBody - Plain text content
 * @returns {boolean} - true if sent successfully, false otherwise
 */
/*
function sendViaSendGrid(to, from, subject, htmlBody, textBody) {
  var SENDGRID_API_KEY =
    PropertiesService.getScriptProperties().getProperty("SENDGRID_KEY");
  if (!SENDGRID_API_KEY) {
    throw new Error("SendGrid API key not set in Script Properties.");
  }
  var payload = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: from },
    subject: subject,
    content: [
      { type: "text/plain", value: textBody },
      { type: "text/html", value: htmlBody },
    ],
  };
  var options = {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + SENDGRID_API_KEY },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };
  var response = UrlFetchApp.fetch(
    "https://api.sendgrid.com/v3/mail/send",
    options
  );
  return response.getResponseCode() === 202;
}
*/

/**
 * Example usage:
 *
 * var sent = sendViaSendGrid(
 *   'recipient@example.com',
 *   'your_verified_sender@example.com',
 *   'Subject here',
 *   '<b>Hello HTML</b>',
 *   'Hello plain text'
 * );
 * Logger.log('Email sent: ' + sent);
 */
