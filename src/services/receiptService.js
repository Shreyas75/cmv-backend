const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const encryptionService = require('./encryptionService');

// Chakra colors inspired by Chinmaya Mission branding
const COLORS = {
  saffron: '#E8531A',        // Primary saffron
  darkGray: '#2C2C2C',       // Dark text
  lightGray: '#F5F5F5',      // Background
  divider: '#CCCCCC',        // Divider lines
  white: '#FFFFFF'
};

function formatCurrency(amount) {
  return `Rs. ${Number(amount || 0).toLocaleString('en-IN')}`;
}

function formatDateTime(date) {
  const value = date ? new Date(date) : new Date();
  return value.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

function formatMobileNumber(phone) {
  if (!phone) return 'N/A';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

function addDetailRow(doc, label, value, startX = 50, labelWidth = 130, valueStartX = 160) {
  const currentY = doc.y;
  const pageWidth = doc.page.width;
  const rightMargin = 40;
  const availableWidth = pageWidth - rightMargin - valueStartX;

  // Write label
  doc.fontSize(10)
    .font('Helvetica-Bold')
    .fillColor(COLORS.darkGray)
    .text(label, startX, currentY, { width: labelWidth, continued: false });

  // Write value on same line
  doc.fontSize(10)
    .font('Helvetica')
    .fillColor(COLORS.darkGray)
    .text(value, valueStartX, currentY, { width: availableWidth, align: 'left' });

  doc.moveDown(0.4);
}

function getReceiptData(donation) {
  const transactionId =
    donation.mswipeTransactionRef || donation.mswipeIpgId || donation.transactionId || 'N/A';

  // Decrypt PAN if it exists and is encrypted
  let panCard = 'N/A';
  if (donation.panCardNumber) {
    const decryptedPAN = encryptionService.decryptPAN(donation.panCardNumber);
    if (decryptedPAN) {
      // Display masked PAN (XXXXXX + last 4 chars)
      panCard = encryptionService.maskPAN(decryptedPAN);
    }
  }

  // Build full address from components if available, otherwise use flat address
  const fullAddress = [
    donation.houseNumber,
    donation.area,
    donation.address
  ].filter(Boolean).join(', ') || donation.address || 'N/A';

  return {
    donorName: donation.fullName || 'N/A',
    donorMobile: formatMobileNumber(donation.phoneNumber),
    donorEmail: donation.email || 'N/A',
    panCard: panCard, // Decrypted and masked PAN
    address: fullAddress,
    houseNumber: donation.houseNumber || 'N/A',
    area: donation.area || 'N/A',
    city: donation.city || 'N/A',
    state: donation.state || 'N/A',
    pinCode: donation.pinCode || 'N/A',
    country: donation.country || 'India',
    paymentDateTime: formatDateTime(donation.updatedAt || donation.createdAt),
    paymentGateway: 'Mswipe',
    transactionId,
    orderId: donation.mswipeOrderId || 'N/A',
    amount: formatCurrency(donation.amount),
    purpose: donation.purpose || donation.reasonForDonation || 'General Donation',
    organizationName: process.env.RECEIPT_ORG_NAME || 'Chinmaya Mission Vasai',
    organizationAddress:
      process.env.RECEIPT_ORG_ADDRESS ||
      'Sai Tower, Ambadi Rd, Vasai West, Maharashtra - 401202, India',
    organizationEmail: process.env.RECEIPT_ORG_EMAIL || process.env.EMAIL_USER || 'info@chinmayamissionvasai.com',
    organizationWebsite: process.env.RECEIPT_ORG_WEBSITE || 'www.chinmayamissionvasai.com',
  };
}

function generateDonationReceiptPdf(donation) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 40,
        bufferPages: true 
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const data = getReceiptData(donation);
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // ==== WATERMARK (Faded background text) ====
      doc.opacity(0.08);
      doc.fontSize(80)
        .font('Helvetica-Bold')
        .text('ॐ', pageWidth / 2 - 50, pageHeight / 2 - 80, {
          width: 100,
          align: 'center'
        });
      doc.opacity(1); // Reset opacity

      // ==== HEADER: Logo and Organization Details ====
      const headerY = 40;
      const logoWidth = 60;
      const logoHeight = 60;

      // Try to embed logo
      const logoPath = path.join(__dirname, '../../..', 'CMV-Website-Staging/public/logo-2.png');
      try {
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, headerY, { width: logoWidth, height: logoHeight });
        }
      } catch (logoErr) {
        console.warn('Logo not found at path:', logoPath, 'Error:', logoErr.message);
      }

      // Organization text (positioned to the right of logo)
      const textStartX = 120;
      doc.fontSize(18)
        .font('Helvetica-Bold')
        .fillColor(COLORS.saffron)
        .text(data.organizationName, textStartX, headerY + 5, { width: pageWidth - textStartX - 40 });

      doc.fontSize(9)
        .font('Helvetica')
        .fillColor(COLORS.darkGray)
        .text(data.organizationAddress, textStartX, headerY + 35, { width: pageWidth - textStartX - 40 });

      doc.fontSize(8)
        .fillColor(COLORS.darkGray)
        .text(`Email: ${data.organizationEmail}`, textStartX, headerY + 50, { width: pageWidth - textStartX - 40 });

      // Move down after logo area
      doc.y = Math.max(doc.y, headerY + logoHeight + 20);
      doc.moveDown(0.3);

      // ==== DIVIDER LINE ====
      doc.strokeColor(COLORS.saffron)
        .lineWidth(2)
        .moveTo(40, doc.y)
        .lineTo(pageWidth - 40, doc.y)
        .stroke();

      doc.moveDown(0.8);

      // ==== TITLE ====
      doc.fontSize(18)
        .font('Helvetica-Bold')
        .fillColor(COLORS.saffron)
        .text('DONATION ACKNOWLEDGMENT SLIP', { align: 'center' });

      doc.moveDown(0.8);

      // ==== DIVIDER LINE ====
      doc.strokeColor(COLORS.divider)
        .lineWidth(1)
        .moveTo(40, doc.y)
        .lineTo(pageWidth - 40, doc.y)
        .stroke();

      doc.moveDown(0.8);

      // ==== DONOR DETAILS SECTION ====
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .fillColor(COLORS.saffron)
        .text('DONOR DETAILS');

      doc.moveDown(0.3);
      addDetailRow(doc, 'Name:', data.donorName);
      addDetailRow(doc, 'Mobile:', data.donorMobile);
      addDetailRow(doc, 'Email:', data.donorEmail);
      addDetailRow(doc, 'PAN:', data.panCard);

      doc.moveDown(0.8);

      // ==== ADDRESS SECTION ====
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .fillColor(COLORS.saffron)
        .text('ADDRESS');

      doc.moveDown(0.3);
      
      // Display address components if available
      if (data.houseNumber !== 'N/A') {
        addDetailRow(doc, 'House No:', data.houseNumber);
      }
      if (data.area !== 'N/A') {
        addDetailRow(doc, 'Area:', data.area);
      }
      
      addDetailRow(doc, 'Address:', data.address);
      addDetailRow(doc, 'City:', data.city);
      addDetailRow(doc, 'State:', data.state);
      addDetailRow(doc, 'Pincode:', data.pinCode);
      addDetailRow(doc, 'Country:', data.country);

      doc.moveDown(0.8);

      // ==== PAYMENT DETAILS SECTION ====
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .fillColor(COLORS.saffron)
        .text('PAYMENT DETAILS');

      doc.moveDown(0.3);
      addDetailRow(doc, 'Date & Time (IST):', data.paymentDateTime);
      addDetailRow(doc, 'Payment Gateway:', data.paymentGateway);
      addDetailRow(doc, 'Transaction ID:', data.transactionId);
      addDetailRow(doc, 'Order ID:', data.orderId);

      doc.moveDown(0.3);
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(COLORS.darkGray);
      addDetailRow(doc, 'Amount Received:', data.amount);
      
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor(COLORS.darkGray);
      addDetailRow(doc, 'Purpose:', data.purpose);

      doc.moveDown(0.8);

      // ==== DIVIDER: BOLD ====
      doc.strokeColor(COLORS.saffron)
        .lineWidth(2)
        .moveTo(40, doc.y)
        .lineTo(pageWidth - 40, doc.y)
        .stroke();

      doc.moveDown(0.8);

      // ==== 80G NOTICE ====
      const centerX = 40;
      const centerWidth = pageWidth - 80;
      
      doc.fontSize(9)
        .font('Helvetica-Bold')
        .fillColor(COLORS.saffron)
        .text('⚠️  80G DONATION RECEIPT', centerX, doc.y, {
          width: centerWidth,
          align: 'center'
        });

      doc.fontSize(8)
        .font('Helvetica')
        .fillColor(COLORS.darkGray)
        .text('80G Donation receipt will be sent from our Vasai office', centerX, doc.y, {
          width: centerWidth,
          align: 'center'
        });

      doc.moveDown(1);

      // ==== FOOTER MESSAGE ====
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(COLORS.darkGray)
        .text('Thank you for your generous donation!', { align: 'center' });

      doc.fontSize(9)
        .font('Helvetica')
        .fillColor(COLORS.darkGray)
        .text('Your contribution supports our mission of', { align: 'center' });

      doc.text('"Maximum Happiness for Maximum People"', { align: 'center' });

      doc.moveDown(0.5);

      // ==== OM SYMBOL ====
      doc.fontSize(24)
        .fillColor(COLORS.saffron)
        .text('ॐ', { align: 'center' });

      doc.moveDown(0.5);

      // ==== FOOTER: Organization Details ====
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(COLORS.darkGray)
        .text(data.organizationName, { align: 'center' });

      doc.fontSize(9)
        .font('Helvetica')
        .fillColor(COLORS.darkGray)
        .text(data.organizationWebsite, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateDonationReceiptPdf,
};
