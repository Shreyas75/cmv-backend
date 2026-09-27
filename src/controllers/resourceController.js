const axios = require('axios');
const Resource = require('../models/Resource');

const safeDownloadName = (name = 'resource.pdf') =>
  name.replace(/[/\\?%*:|"<>]/g, '-').replace(/"/g, '');

class ResourceController {
  async getAllResources(req, res) {
    try {
      const { search } = req.query;
      const query = {};

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const resources = await Resource.find(query).sort({ createdAt: -1 });
      res.status(200).json(resources);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch resources' });
    }
  }

  async viewPdf(req, res) {
    try {
      const { url, name, download } = req.query;
      if (!url) {
        return res.status(400).json({ error: 'url is required' });
      }

      let parsed;
      try {
        parsed = new URL(url);
      } catch {
        return res.status(400).json({ error: 'Invalid url' });
      }

      if (parsed.hostname !== 'res.cloudinary.com') {
        return res.status(400).json({ error: 'Unsupported file host' });
      }

      const filename = safeDownloadName(name || 'resource.pdf');
      const response = await axios.get(url, {
        responseType: 'stream',
        timeout: 60000,
      });

      res.setHeader('Content-Type', 'application/pdf');
      const disposition = download === '1' ? 'attachment' : 'inline';
      res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      response.data.pipe(res);
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to open PDF' });
      }
    }
  }

  async getResourceById(req, res) {
    try {
      const resource = await Resource.findById(req.params.id);
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      res.status(200).json(resource);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch resource' });
    }
  }

  async createResource(req, res) {
    try {
      const { title, description = '', audioFiles = [], pdfFiles = [] } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Title is required' });
      }

      if (!Array.isArray(audioFiles) || !Array.isArray(pdfFiles)) {
        return res.status(400).json({ error: 'audioFiles and pdfFiles must be arrays' });
      }

      if (audioFiles.length === 0 && pdfFiles.length === 0) {
        return res.status(400).json({ error: 'Add at least one audio or PDF file' });
      }

      const resource = await Resource.create({
        title: title.trim(),
        description: description.trim(),
        audioFiles,
        pdfFiles,
      });

      res.status(201).json(resource);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create resource' });
    }
  }

  async updateResource(req, res) {
    try {
      const { title, description, audioFiles, pdfFiles } = req.body;
      const resource = await Resource.findById(req.params.id);

      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      if (title !== undefined) {
        if (!title.trim()) {
          return res.status(400).json({ error: 'Title is required' });
        }
        resource.title = title.trim();
      }

      if (description !== undefined) {
        resource.description = description.trim();
      }

      if (Array.isArray(audioFiles)) {
        resource.audioFiles = audioFiles;
      }

      if (Array.isArray(pdfFiles)) {
        resource.pdfFiles = pdfFiles;
      }

      if (resource.audioFiles.length === 0 && resource.pdfFiles.length === 0) {
        return res.status(400).json({ error: 'A resource must keep at least one file' });
      }

      await resource.save();
      res.status(200).json(resource);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update resource' });
    }
  }

  async deleteResource(req, res) {
    try {
      const resource = await Resource.findByIdAndDelete(req.params.id);
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      res.status(200).json({ success: true, message: 'Resource deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete resource' });
    }
  }
}

module.exports = new ResourceController();
