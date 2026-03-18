const Project = require('../models/Project');
const vibeCodingService = require('../services/vibeCodingService');
const progressService = require('../services/projectProgressService');
const mongoose = require('mongoose');

const isValidObjectId = (id) => id && id !== 'standalone' && mongoose.Types.ObjectId.isValid(id);

exports.generateProject = async (req, res) => {
  try {
    const { projectId, userPrompt } = req.body;
    if (!userPrompt) return res.status(400).json({ success: false, message: 'Prompt required' });

    // Build rich project context from DB if available
    let projectContext = '';
    let selectedStack = null;
    let projectName = '';
    let projectDescription = '';

    if (isValidObjectId(projectId)) {
      const project = await Project.findById(projectId).lean();
      if (project) {
        projectName = project.name || '';
        projectDescription = project.description || '';
        selectedStack = project.design?.selectedStack || null;

        // Extract up to 10 functional requirements for context
        const reqs = project.requirements?.functionalRequirements
          ?.slice(0, 10)
          .map(r => `- ${r.title}: ${r.description}`)
          .join('\n') || '';

        const nonFuncReqs = project.requirements?.nonFunctionalRequirements;
        const nfReqStr = nonFuncReqs
          ? Object.entries(nonFuncReqs)
              .map(([cat, items]) => items?.slice(0, 2).map(i => `- [${cat}] ${i.description}`).join('\n'))
              .filter(Boolean).join('\n')
          : '';

        projectContext = [
          projectName ? `PROJECT NAME: ${projectName}` : '',
          projectDescription ? `PROJECT DESCRIPTION: ${projectDescription}` : '',
          reqs ? `FUNCTIONAL REQUIREMENTS:\n${reqs}` : '',
          nfReqStr ? `NON-FUNCTIONAL REQUIREMENTS:\n${nfReqStr}` : '',
          selectedStack
            ? `SELECTED TECH STACK:\n  Name: ${selectedStack.name}\n  Frontend: ${selectedStack.frontend}\n  Backend: ${selectedStack.backend}\n  Database: ${selectedStack.database}`
            : ''
        ].filter(Boolean).join('\n\n');
      }
    }

    const result = await vibeCodingService.generateProject(userPrompt, projectContext, selectedStack);

    if (isValidObjectId(projectId)) {
      await Project.findByIdAndUpdate(projectId, {
        'development.structure': result.structure,
        'development.fileCount': result.files.length,
        'development.codeFiles': result.files,
        'development.techStack': selectedStack || {},
        'development.lastPrompt': userPrompt,
        'development.updatedAt': new Date()
      });
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
    if (!userPrompt || !currentFiles) {
      return res.status(400).json({ success: false, message: 'Invalid request: userPrompt and currentFiles required' });
    }

    // Fetch the selected stack to keep generation consistent during updates
    let selectedStack = null;
    if (isValidObjectId(projectId)) {
      const project = await Project.findById(projectId).lean();
      selectedStack = project?.design?.selectedStack || null;
    }

    const updateResult = await vibeCodingService.updateProject(userPrompt, currentFiles, selectedStack);

    // Merge files: apply created/modified/deleted changes onto the existing set
    let updatedFiles = [...currentFiles];

    (updateResult.files || []).forEach(change => {
      const index = updatedFiles.findIndex(f => f.path === change.path);
      if (change.action === 'deleted') {
        if (index !== -1) updatedFiles.splice(index, 1);
      } else if (index !== -1) {
        updatedFiles[index] = { ...updatedFiles[index], code: change.code };
      } else {
        updatedFiles.push({ path: change.path, code: change.code });
      }
    });

    // Rebuild the folder tree from the merged file list
    const newStructure = vibeCodingService.buildStructureFromFiles(updatedFiles);

    if (isValidObjectId(projectId)) {
      await Project.findByIdAndUpdate(projectId, {
        'development.structure': newStructure,
        'development.fileCount': updatedFiles.length,
        'development.codeFiles': updatedFiles,
        'development.lastPrompt': userPrompt,
        'development.updatedAt': new Date()
      });
      await progressService.updateProjectProgress(projectId);
    }

    res.json({
      success: true,
      structure: newStructure,
      files: updatedFiles,
      summary: updateResult.summary,
      changes: (updateResult.files || []).length
    });
  } catch (error) {
    console.error('[VibeCoding] Update Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyApiKey = async (req, res) => {
  const key = process.env.MISTRAL_API_KEY;
  if (!key || key === '' || key.includes('your_mistral_key')) {
    return res.status(404).json({ success: false, message: 'MISTRAL_API_KEY not configured' });
  }
  res.json({ success: true });
};
