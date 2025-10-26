const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

class QRGenerator {
  constructor() {
    this.outputDir = path.join(__dirname, '../public/qr-codes');
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateQRCode(data, options = {}) {
    const defaultOptions = {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    };

    const qrOptions = { ...defaultOptions, ...options };

    try {
      const qrCodeDataURL = await QRCode.toDataURL(data, qrOptions);
      return qrCodeDataURL;
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  async generateQRCodeFile(data, filename, options = {}) {
    const defaultOptions = {
      width: 400,
      margin: 4,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    };

    const qrOptions = { ...defaultOptions, ...options };
    const filePath = path.join(this.outputDir, `${filename}.png`);

    try {
      await QRCode.toFile(filePath, data, qrOptions);
      return filePath;
    } catch (error) {
      throw new Error(`Failed to generate QR code file: ${error.message}`);
    }
  }

  async generateQRCodeBuffer(data, options = {}) {
    const defaultOptions = {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    };

    const qrOptions = { ...defaultOptions, ...options };

    try {
      const buffer = await QRCode.toBuffer(data, qrOptions);
      return buffer;
    } catch (error) {
      throw new Error(`Failed to generate QR code buffer: ${error.message}`);
    }
  }

  // Generate QR code for restaurant menu
  async generateRestaurantQR(restaurant, frontendUrl) {
    const menuUrl = `${frontendUrl}/menu/${restaurant.slug}`;
    const filename = `${restaurant.slug}-qr-code`;
    
    try {
      // Generate data URL for web display
      const dataURL = await this.generateQRCode(menuUrl, {
        width: 200,
        margin: 2
      });

      // Generate file for download
      const filePath = await this.generateQRCodeFile(menuUrl, filename, {
        width: 400,
        margin: 4
      });

      return {
        dataURL,
        filePath,
        menuUrl,
        filename: `${filename}.png`
      };
    } catch (error) {
      throw new Error(`Failed to generate QR code for restaurant ${restaurant.name}: ${error.message}`);
    }
  }

  // Generate multiple QR codes for all restaurants
  async generateAllRestaurantQRs(restaurants, frontendUrl) {
    const results = [];
    
    for (const restaurant of restaurants) {
      try {
        const qrData = await this.generateRestaurantQR(restaurant, frontendUrl);
        results.push({
          restaurant,
          ...qrData
        });
      } catch (error) {
        console.error(`Failed to generate QR for ${restaurant.name}:`, error.message);
        results.push({
          restaurant,
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = QRGenerator;
