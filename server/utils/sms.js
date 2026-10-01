const { Vonage } = require('@vonage/server-sdk');

/**
 * Sends an SMS using Vonage (Nexmo) API
 * @param {string} number - The recipient phone number
 * @param {string} message - The message to send
 */
const sendSMS = async (number, message) => {
  const apiKey = process.env.VONAGE_API_KEY;
  const apiSecret = process.env.VONAGE_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.warn('Vonage credentials not found in environment variables. SMS not sent.');
    return false;
  }

  if (!number) {
    return false;
  }

  // Ensure number has country code (e.g., +63 for Philippines) - Vonage requires it without the +
  let formattedNumber = number.trim();
  if (formattedNumber.startsWith('09') && formattedNumber.length === 11) {
    formattedNumber = '63' + formattedNumber.substring(1);
  } else if (formattedNumber.startsWith('+')) {
    formattedNumber = formattedNumber.substring(1);
  }

  const vonage = new Vonage({
    apiKey: apiKey,
    apiSecret: apiSecret
  });

  const from = "BPLO Rosario";
  const to = formattedNumber;

  try {
    const response = await vonage.sms.send({ to, from, text: message });
    
    if (response.messages[0].status === "0") {
      console.log(`SMS sent successfully to ${formattedNumber} via Vonage.`);
      return true;
    } else {
      console.error(`Vonage SMS failed with error: ${response.messages[0]['error-text']}`);
      return false;
    }
  } catch (error) {
    console.error('Error sending SMS via Vonage:', error.message);
    return false;
  }
};

module.exports = {
  sendSMS
};
