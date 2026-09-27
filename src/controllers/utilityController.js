const cloudinaryService = require('../services/cloudinaryService');
const exportService = require('../services/exportService');

class UtilityController {
  async uploadImage(req, res) {
    try {
      const { imageBase64 } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: 'Image data is required' });
      }

      const imageUrl = await cloudinaryService.uploadImage(imageBase64);
      res.json({ imageUrl });
    } catch (error) {
      res.status(500).json({ error: 'Image upload failed' });
    }
  }

  async uploadFile(req, res) {
    try {
      const { fileBase64, filename, fileType } = req.body;

      if (!fileBase64) {
        return res.status(400).json({ error: 'File data is required' });
      }

      const resourceType = fileType === 'audio' ? 'video' : fileType === 'pdf' ? 'raw' : 'auto';
      const uploaded = await cloudinaryService.uploadFile(fileBase64, {
        resourceType,
        filename,
      });

      res.json({
        url: uploaded.url,
        publicId: uploaded.publicId,
        format: uploaded.format,
        bytes: uploaded.bytes,
        name: filename || 'file',
      });
    } catch (error) {
      res.status(500).json({ error: error.message || 'File upload failed' });
    }
  }

  async exportUserData(req, res) {
    try {
      const csv = await exportService.exportUserDataToCSV();
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=volunteer-data.csv');
      res.send(csv);
    } catch (error) {
      const errorCSV = "Error exporting data. Please try again later.";
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=export-error.csv');
      res.status(500).send(errorCSV);
    }
  }
}

module.exports = new UtilityController();
