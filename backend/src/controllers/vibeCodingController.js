const Project = require('../models/Project');
const vibeCodingService = require('../services/vibeCodingService');
const progressService = require('../services/projectProgressService');
const mongoose = require('mongoose');

const isValidObjectId = (id) => id && id !== 'standalone' && mongoose.Types.ObjectId.isValid(id);

exports.generateProject = async (req, res) => {
  try {
    const { projectId, userPrompt } = req.body;
    if (!userPrompt) return res.status(400).json({ success: false, message: 'Prompt required' });

    const result = await vibeCodingService.generateProject(userPrompt);

    if (isValidObjectId(projectId)) {
      await Project.findByIdAndUpdate(projectId, {
        'development.structure': result.structure,
        'development.fileCount': result.files.length,
        'development.codeFiles': [], // Space optimization: don't store all code in DB
        'development.lastPrompt': userPrompt,
        'development.updatedAt': new Date()
      });

      // Auto-update progress
      await progressService.updateProjectProgress(projectId);
    }

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[VibeCoding] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { projectId, userPrompt, currentFiles } = req.body;
    if (!userPrompt || !currentFiles) return res.status(400).json({ success: false, message: 'Invalid request' });

    const updateResult = await vibeCodingService.updateProject(userPrompt, currentFiles);

    // Merge files
    let updatedFiles = [...currentFiles];

    updateResult.files.forEach(change => {
      const index = updatedFiles.findIndex(f => f.path === change.path);
      if (change.action === 'deleted') {
        if (index !== -1) updatedFiles.splice(index, 1);
      } else if (index !== -1) {
        updatedFiles[index] = { ...updatedFiles[index], code: change.code };
      } else {
        updatedFiles.push({ path: change.path, code: change.code });
      }
    });

    // Rebuild structure from the merged file list
    const newStructure = vibeCodingService.buildStructureFromFiles(updatedFiles);

    if (isValidObjectId(projectId)) {
      await Project.findByIdAndUpdate(projectId, {
        'development.structure': newStructure,
        'development.fileCount': updatedFiles.length,
        'development.codeFiles': [], // Space optimization: don't store all code in DB
        'development.lastPrompt': userPrompt,
        'development.updatedAt': new Date()
      });

      // Auto-update progress
      await progressService.updateProjectProgress(projectId);
    }


    res.json({
      success: true,
      structure: newStructure,
      files: updatedFiles,
      summary: updateResult.summary,
      changes: updateResult.files.length
    });
  } catch (error) {
    console.error('[VibeCoding] Update Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyApiKey = async (req, res) => {
  const key = process.env.MISTRAL_API_KEY;
  if (!key || key === '' || key.includes('your_mistral_key')) return res.status(404).json({ success: false });
  res.json({ success: true });
};

