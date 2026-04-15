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
  return `INR ${Number(amount || 0).toLocaleString('en-IN')}`;
}

function convertNumberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const scales = ['', 'Thousand', 'Lakh', 'Crore'];

  if (num === 0) return 'Zero';

  const convertBelow1000 = (n) => {
    let result = '';
    const hundreds = Math.floor(n / 100);
    const remainder = n % 100;

    if (hundreds > 0) result += ones[hundreds] + ' Hundred ';

    if (remainder >= 20) {
      result += tens[Math.floor(remainder / 10)];
      if (remainder % 10 > 0) result += ' ' + ones[remainder % 10];
    } else if (remainder >= 10) {
      result += teens[remainder - 10];
    } else if (remainder > 0) {
      result += ones[remainder];
    }

    return result.trim();
  };

  let intNum = Math.floor(num);
  let result = '';
  let scaleIndex = 0;

  while (intNum > 0 && scaleIndex < scales.length) {
    const chunk = intNum % 1000;
    if (chunk !== 0) {
      const chunkWords = convertBelow1000(chunk);
      if (scaleIndex > 0) {
        result = chunkWords + ' ' + scales[scaleIndex] + ' ' + result;
      } else {
        result = chunkWords + ' ' + result;
      }
    }
    intNum = Math.floor(intNum / 1000);
    scaleIndex++;
  }

  return result.trim() + ' Only';
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

function addDetailRow(doc, label, value) {
  const currentY = doc.y;
  const pageWidth = doc.page.width;
  const rightMargin = 20;
  const labelWidth = 130;
  const valueStartX = 20 + labelWidth;
  const availableWidth = pageWidth - rightMargin - valueStartX;

  // Write label
  doc.fontSize(10)
    .font('Helvetica-Bold')
    .fillColor(COLORS.darkGray)
    .text(label, 20, currentY, { width: labelWidth, continued: false });

  // Write value on same line
  doc.fontSize(10)
    .font('Helvetica')
    .fillColor(COLORS.darkGray)
    .text(value, valueStartX, currentY, { width: availableWidth, align: 'left' });

  doc.moveDown(0.6);
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
        margin: 20,
        bufferPages: true 
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const data = getReceiptData(donation);
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // Define paths for assets
      const logoPath = path.join(__dirname, '..', '..', 'assets', 'images', 'lamp.png');
      const contentWidth = pageWidth - 80; // 40 margin on each side

      // ==== WATERMARK (Faded background logo) ====
      if (fs.existsSync(logoPath)) {
        const watermarkWidth = 250;
        const watermarkHeight = 350;
        doc.opacity(0.08)
           .image(logoPath, (pageWidth - watermarkWidth) / 2, (pageHeight - watermarkHeight) / 2, {
             width: watermarkWidth,
             height: watermarkHeight,
           });
        doc.opacity(1); // Reset opacity
      }

      // ==== HEADER: Logo and Organization Details (Inline) ====
      const headerY = 20;
      const logoWidth = 35;
      const logoHeight = 50;

      // Try to embed logo on the left
      try {
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 20, headerY, { width: logoWidth, height: logoHeight });
        }
      } catch (logoErr) {
        console.warn('Logo not found at path:', logoPath, 'Error:', logoErr.message);
      }

      // Organization text to the right of logo
      const textStartX = 75;
      const textWidth = pageWidth - textStartX - 20;

      doc.fontSize(16)
        .font('Helvetica-Bold')
        .fillColor(COLORS.saffron)
        .text(data.organizationName, textStartX, headerY + 5, { width: textWidth, align: 'left' });

      doc.fontSize(8)
        .font('Helvetica')
        .fillColor(COLORS.darkGray)
        .text(data.organizationAddress, textStartX, doc.y, { width: textWidth, align: 'left' });

      doc.fontSize(7)
        .fillColor(COLORS.darkGray)
        .text(`Email: ${data.organizationEmail}`, textStartX, doc.y, { width: textWidth, align: 'left' });

      // Move down after header
      doc.y = Math.max(doc.y, headerY + logoHeight + 10);
      doc.moveDown(0.2);

      // ==== DIVIDER LINE ====
      doc.strokeColor(COLORS.saffron)
        .lineWidth(2)
        .moveTo(20, doc.y)
        .lineTo(pageWidth - 20, doc.y)
        .stroke();

      doc.moveDown(0.6);

      // ==== TITLE ====
      doc.fontSize(16)
        .font('Helvetica-Bold')
        .fillColor(COLORS.saffron)
        .text('DONATION ACKNOWLEDGEMENT SLIP', 20, doc.y, { width: pageWidth - 40, align: 'center' });

      doc.moveDown(0.6);

      // ==== DIVIDER LINE ====
      doc.strokeColor(COLORS.divider)
        .lineWidth(1)
        .moveTo(20, doc.y)
        .lineTo(pageWidth - 20, doc.y)
        .stroke();

      doc.moveDown(1.5);

      // ==== DONOR DETAILS SECTION (Left-aligned) ====
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .fillColor(COLORS.saffron)
        .text('DONOR DETAILS', 20, doc.y);

      doc.moveDown(0.2);
      addDetailRow(doc, 'Name:', data.donorName);
      addDetailRow(doc, 'Mobile:', data.donorMobile);
      addDetailRow(doc, 'Email:', data.donorEmail);
      addDetailRow(doc, 'PAN:', data.panCard);

      doc.moveDown(0.8);

      // ==== LIGHT DIVIDER LINE ====
      doc.strokeColor(COLORS.divider)
        .lineWidth(1)
        .moveTo(20, doc.y)
        .lineTo(pageWidth - 20, doc.y)
        .stroke();

      doc.moveDown(1);

      // ==== ADDRESS SECTION (Left-aligned) ====
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .fillColor(COLORS.saffron)
        .text('ADDRESS', 20, doc.y);

      doc.moveDown(0.2);
      addDetailRow(doc, 'House No:', data.houseNumber);
      addDetailRow(doc, 'Area:', data.area);
      addDetailRow(doc, 'Address:', data.address);
      addDetailRow(doc, 'City:', data.city);
      addDetailRow(doc, 'State:', data.state);
      addDetailRow(doc, 'Pincode:', data.pinCode);
      addDetailRow(doc, 'Country:', data.country);

      doc.moveDown(0.8);

      // ==== LIGHT DIVIDER LINE ====
      doc.strokeColor(COLORS.divider)
        .lineWidth(1)
        .moveTo(20, doc.y)
        .lineTo(pageWidth - 20, doc.y)
        .stroke();

      doc.moveDown(1);

      // ==== PAYMENT DETAILS SECTION (Left-aligned) ====
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .fillColor(COLORS.saffron)
        .text('PAYMENT DETAILS', 20, doc.y);

      doc.moveDown(0.2);
      addDetailRow(doc, 'Date & Time (IST):', data.paymentDateTime);
      addDetailRow(doc, 'Payment Gateway:', data.paymentGateway);
      addDetailRow(doc, 'Transaction ID:', data.transactionId);
      addDetailRow(doc, 'Order ID:', data.orderId);
      
      const amountNumeric = Number(donation.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const amountInWords = convertNumberToWords(Math.floor(donation.amount || 0));
      addDetailRow(doc, 'Amount Received:', `INR ${amountNumeric} (Indian Rupees ${amountInWords})`);
      
      addDetailRow(doc, 'Purpose:', data.purpose);

      // Position footer near the bottom of the page
      const footerStartY = pageHeight - 100; // Leave room for footer content
      if (doc.y < footerStartY) {
        doc.y = footerStartY;
      }

      doc.moveDown(0.1);

      // ==== DARK DIVIDER LINE ====
      doc.strokeColor(COLORS.saffron)
        .lineWidth(2)
        .moveTo(20, doc.y)
        .lineTo(pageWidth - 20, doc.y)
        .stroke();

      doc.moveDown(0.2);

      // ==== 80G NOTICE SECTION ====
      doc.fontSize(9)
        .font('Helvetica')
        .fillColor(COLORS.darkGray)
        .text('If your donation is eligible for 80G exemption, the 80G exemption receipt will be sent to you from our Vasai Office via WhatsApp/ Email', 20, doc.y, {
          width: pageWidth - 40,
          align: 'center'
        });

      doc.moveDown(0.2);

      // ==== THANK YOU SECTION ====
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(COLORS.darkGray)
        .text('Thank you for your generous donation!', 20, doc.y, { width: pageWidth - 40, align: 'center' });

      doc.moveDown(0.1);

      // ==== MISSION MOTTO SECTION ====
      doc.fontSize(9)
        .font('Helvetica')
        .fillColor(COLORS.darkGray)
        .text('Your contribution Supports our mission of', 20, doc.y, { width: pageWidth - 40, align: 'center' });

      doc.text('"Maximum Happiness To Maximum People For Maximum Time"', 20, doc.y, { width: pageWidth - 40, align: 'center' });

      doc.moveDown(0.15);

      // ==== ORGANIZATION NAME ====
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(COLORS.darkGray)
        .text(data.organizationName, 20, doc.y, { width: pageWidth - 40, align: 'center' });

      // ==== ORGANIZATION WEBSITE ====
      doc.fontSize(9)
        .font('Helvetica')
        .fillColor(COLORS.darkGray)
        .text(data.organizationWebsite, 20, doc.y, { width: pageWidth - 40, align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateDonationReceiptPdf,
};
