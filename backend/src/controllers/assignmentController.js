import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import Enrollment from '../models/Enrollment.js';
import Class from '../models/Class.js';
import Question from '../models/Question.js';
import Gradebook from '../models/Gradebook.js';
import { getSocketService } from '../socketService.js';
import path from 'path';
import fs from 'fs';
import mime from 'mime-types';

const normalizeQuestions = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  // Trường hợp frontend/axios gửi lên dạng string JSON
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};


// helper to recalc averageScore for all students in a class
const recalcClassAverages = async (classId) => {
  const quizAssignments = await Assignment.find({ classId, mode: 'quiz', isDeleted: false });
  const count = quizAssignments.length;
  if (count === 0) return;
  const ids = quizAssignments.map(a => a._id);
  const subs = await Submission.find({
    assignmentId: { $in: ids },
    status: 'graded',
    score: { $ne: null },
  });
  const enrolls = await Enrollment.find({ classId }).select('studentId');
  for (const en of enrolls) {
    const studentId = en.studentId;
    const studSubs = subs.filter(s => s.studentId.toString() === studentId.toString());
    const sum = studSubs.reduce((acc, s) => acc + (s.score || 0), 0);
    const avg = Math.round((sum / count) * 10) / 10;
    await Gradebook.findOneAndUpdate(
      { classId, studentId },
      { averageScore: avg },
      { upsert: true }
    );
  }
};

const canAccessClass = async (user, classId) => {
  const cls = await Class.findById(classId);
  if (!cls || cls.isDeleted) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'teacher' && cls.teacherId.toString() === user._id.toString()) return true;
  if (user.role === 'student') {
    const en = await Enrollment.findOne({ classId, studentId: user._id });
    return !!en;
  }
  return false;
};

export const getAssignments = async (req, res) => {
  try {
    const allowed = await canAccessClass(req.user, req.params.classId);
    if (!allowed) return res.status(403).json({ success: false });
    const assignments = await Assignment.find({ classId: req.params.classId, isDeleted: false }).sort({ deadline: -1 });
    res.json({ success: true, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAssignment = async (req, res) => {
  try {
    const allowed = await canAccessClass(req.user, req.params.classId);
    if (!allowed || req.user.role !== 'teacher') return res.status(403).json({ success: false });

    const { questions, ...rest } = req.body;
    // debug log
    console.log('[createAssignment] body:', JSON.stringify(req.body));
    const payload = {
      ...rest,
      classId: req.params.classId,
    };

    const assignment = await Assignment.create(payload);

    // Nếu là bài trắc nghiệm và có danh sách câu hỏi thì tạo luôn Question
    const parsedQuestions = normalizeQuestions(questions);
    // lọc các câu đủ dữ liệu
    const validQuestions = parsedQuestions.filter(q =>
      q &&
      q.content &&
      q.optionA &&
      q.optionB &&
      q.optionC &&
      q.optionD &&
      q.correctAnswer
    );
    console.log('[createAssignment] mode:', assignment.mode, 'questionsRaw:', parsedQuestions.length, 'valid:', validQuestions.length);
    // nếu là quiz và có danh sách câu hỏi gửi lên thì phải đảm bảo tất cả câu hợp lệ
    if (assignment.mode === 'quiz' && parsedQuestions.length > 0 && validQuestions.length !== parsedQuestions.length) {
      // xóa assignment vừa tạo tránh dữ liệu rác
      await Assignment.findByIdAndDelete(assignment._id);
      return res.status(400).json({ success: false, message: 'Tất cả câu hỏi phải có nội dung, bốn đáp án và đáp án đúng.' });
    }
    if (assignment.mode === 'quiz' && validQuestions.length > 0) {
      const docs = validQuestions.map(q => ({
        assignmentId: assignment._id,
        content: q.content,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctAnswer: q.correctAnswer,
      }));
      await Question.insertMany(docs);
      // khi thêm bài quiz mới, cập nhật lại điểm trung bình cho tất cả sinh viên
      recalcClassAverages(assignment.classId);
    }

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAssignmentById = async (req, res) => {
  try {
    const a = await Assignment.findOne({ _id: req.params.id, isDeleted: false }).populate('classId');
    if (!a) return res.status(404).json({ success: false });
    const classId = a.classId?._id || a.classId;
    const allowed = await canAccessClass(req.user, classId);
    if (!allowed) return res.status(403).json({ success: false });

    // Nếu là bài trắc nghiệm thì trả thêm danh sách câu hỏi
    if (a.mode === 'quiz') {
      const questions = await Question.find({ assignmentId: a._id, isDeleted: false }).sort({ createdAt: 1 });
      console.log('[getAssignmentById] assignmentId:', String(a._id), 'questionsCount:', questions.length);
      let safeQuestions = questions;

      // Sinh viên không được thấy đáp án đúng
      if (req.user.role === 'student') {
        safeQuestions = questions.map(q => ({
          _id: q._id,
          assignmentId: q.assignmentId,
          content: q.content,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
        }));
      }

      return res.json({
        success: true,
        data: {
          ...a.toObject(),
          questions: safeQuestions,
        },
      });
    }

    res.json({ success: true, data: a });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAssignment = async (req, res) => {
  try {
    const a = await Assignment.findById(req.params.id);
    if (!a || a.isDeleted) return res.status(404).json({ success: false });
    const classId = a.classId?._id || a.classId;
    const allowed = await canAccessClass(req.user, classId);
    if (!allowed || req.user.role !== 'teacher') return res.status(403).json({ success: false });

    const { questions, ...rest } = req.body;
    const assignment = await Assignment.findByIdAndUpdate(req.params.id, rest, { new: true });

    // Nếu là bài trắc nghiệm và có danh sách câu hỏi gửi lên, thay thế toàn bộ bộ câu hỏi
    const parsedQuestions = normalizeQuestions(questions);
    const validQuestions = parsedQuestions.filter(q =>
      q &&
      q.content &&
      q.optionA &&
      q.optionB &&
      q.optionC &&
      q.optionD &&
      q.correctAnswer
    );
    if (assignment.mode === 'quiz' && parsedQuestions.length > 0 && validQuestions.length !== parsedQuestions.length) {
      return res.status(400).json({ success: false, message: 'Tất cả câu hỏi phải có nội dung, bốn đáp án và đáp án đúng.' });
    }
    if (assignment.mode === 'quiz') {
      await Question.deleteMany({ assignmentId: assignment._id });
      if (validQuestions.length > 0) {
        const docs = validQuestions.map(q => ({
          assignmentId: assignment._id,
          content: q.content,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
        }));
        await Question.insertMany(docs);
      }
      // after updating quiz questions maybe nothing changes averages, but if mode changed to quiz we should recalc
      recalcClassAverages(assignment.classId);
    }

    res.json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAssignment = async (req, res) => {
  try {
    const a = await Assignment.findById(req.params.id);
    if (!a || a.isDeleted) return res.status(404).json({ success: false });
    const classId = a.classId?._id || a.classId;
    const allowed = await canAccessClass(req.user, classId);
    if (!allowed || req.user.role !== 'teacher') return res.status(403).json({ success: false });
    a.isDeleted = true;
    a.deletedAt = new Date();
    await a.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const publishAssignment = async (req, res) => {
  try {
    const a = await Assignment.findById(req.params.id);
    if (!a || a.isDeleted) return res.status(404).json({ success: false });
    const classId = a.classId?._id || a.classId;
    const allowed = await canAccessClass(req.user, classId);
    if (!allowed || req.user.role !== 'teacher') return res.status(403).json({ success: false });
    a.status = 'published';
    await a.save();
    const enrollments = await Enrollment.find({ classId }).select('studentId');
    const svc = getSocketService();
    if (svc?.sendNotification) {
      for (const e of enrollments) {
        try { await svc.sendNotification(e.studentId, 'Bài tập mới', a.title || 'Có bài tập mới được công bố', 'assignment', a._id, 'Assignment'); } catch (_) {}
      }
    }
    res.json({ success: true, data: a });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addAttachment = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Chưa chọn file' });
    const a = await Assignment.findById(req.params.id);
    if (!a || a.isDeleted) return res.status(404).json({ success: false });
    const classId = a.classId?._id || a.classId;
    const allowed = await canAccessClass(req.user, classId);
    if (!allowed || req.user.role !== 'teacher') return res.status(403).json({ success: false });
    const url = '/uploads/files/' + req.file.filename;
    a.attachments = a.attachments || [];
    a.attachments.push({ url, name: req.file.originalname });
    await a.save();
    res.json({ success: true, data: a });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const closeAssignment = async (req, res) => {
  try {
    const a = await Assignment.findById(req.params.id);
    if (!a || a.isDeleted) return res.status(404).json({ success: false });
    const classId = a.classId?._id || a.classId;
    const allowed = await canAccessClass(req.user, classId);
    if (!allowed || req.user.role !== 'teacher') return res.status(403).json({ success: false });
    a.status = 'closed';
    await a.save();
    res.json({ success: true, data: a });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAssignmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log('Updating assignment status:', { id, status, user: req.user._id });
    
    // Validate status
    const validStatuses = ['draft', 'published', 'completed'];
    if (!validStatuses.includes(status)) {
      console.log('Invalid status:', status);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be draft, published, or completed' 
      });
    }
    
    // Find assignment
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      console.log('Assignment not found:', id);
      return res.status(404).json({ 
        success: false, 
        message: 'Assignment not found' 
      });
    }
    
    console.log('Found assignment:', assignment.title, 'current status:', assignment.status);
    
    // Check permissions (simplified)
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      console.log('Permission denied for user:', req.user.role);
      return res.status(403).json({ 
        success: false, 
        message: 'Only teachers can update assignment status' 
      });
    }
    
    // Update status
    assignment.status = status;
    await assignment.save();
    
    console.log('Assignment status updated successfully:', assignment.status);
    
    // Try socket emit (optional, won't fail if socket is not available)
    try {
      const socketService = getSocketService();
      if (socketService) {
        const classId = assignment.classId?._id || assignment.classId;
        socketService.emitToClass(classId, 'assignmentStatusUpdated', {
          assignmentId: assignment._id,
          status: status,
          title: assignment.title
        });
      }
    } catch (socketError) {
      console.log('Socket emit failed (non-critical):', socketError.message);
    }
    
    res.json({ 
      success: true, 
      data: assignment,
      message: 'Assignment status updated successfully' 
    });
    
  } catch (error) {
    console.error('Error updating assignment status:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};


// Download assignment attachment file
export const downloadAttachment = async (req, res) => {
  try {
    const { filename } = req.params;
    
    console.log('=== DOWNLOAD REQUEST ===');
    console.log('Requested filename:', filename);
    console.log('User:', req.user?.email, 'Role:', req.user?.role);
    
    // Validate filename doesn't contain directory traversal patterns
    if (filename.includes('../') || filename.includes('..\\')) {
      console.log('❌ Directory traversal attempt detected');
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid filename: directory traversal not allowed' 
      });
    }
    
    // Find assignment that contains this file in attachments
    const assignment = await Assignment.findOne({
      'attachments.name': filename,
      isDeleted: false
    }).populate('classId');
    
    console.log('Assignment found:', assignment ? assignment.title : 'NOT FOUND');
    if (assignment) {
      console.log('Attachments:', assignment.attachments);
    }
    
    if (!assignment) {
      console.log('❌ File not associated with any assignment');
      return res.status(404).json({ 
        success: false, 
        error: 'File not associated with any assignment' 
      });
    }
    
    // Check if user has access to the class
    const classId = assignment.classId?._id || assignment.classId;
    const allowed = await canAccessClass(req.user, classId);
    
    if (!allowed) {
      return res.status(403).json({ 
        success: false, 
        error: 'You do not have permission to access this file' 
      });
    }
    
    // Extract filename from attachment URL if it has path prefix
    let actualFilename = filename;
    const attachment = assignment.attachments.find(a => a.name === filename);
    
    console.log('Found attachment:', attachment);
    
    // Check if URL is a blob URL (temporary frontend URL) - need to search for file
    let needsFileSearch = false;
    
    if (attachment && attachment.url) {
      if (attachment.url.startsWith('blob:')) {
        // Blob URL - file was imported but not properly uploaded
        // We'll need to search for the file by original name
        console.log('⚠️ Blob URL detected - will search for file by name');
        needsFileSearch = true;
      } else if (attachment.url.startsWith('/uploads/files/')) {
        actualFilename = attachment.url.replace('/uploads/files/', '');
      } else if (attachment.url.startsWith('/uploads/misc/')) {
        actualFilename = attachment.url.replace('/uploads/misc/', '');
      } else if (attachment.url.includes('/')) {
        // Handle case like "uploads/misc/123-file.docx"
        const parts = attachment.url.split('/');
        actualFilename = parts[parts.length - 1];
      }
    }
    
    console.log('Actual filename to look for:', actualFilename);
    console.log('Needs file search:', needsFileSearch);
    
    // Resolve full file path
    const uploadDir = path.join(process.cwd(), 'uploads');
    let fullPath;
    let normalizedPath;
    
    if (needsFileSearch) {
      // Search for file in both directories
      const possiblePaths = [
        path.join(uploadDir, 'files', filename),
        path.join(uploadDir, 'misc', filename),
      ];
      
      // Also try to find files that end with the original filename
      // (in case they were renamed with timestamp prefix)
      const filesDir = path.join(uploadDir, 'files');
      const miscDir = path.join(uploadDir, 'misc');
      
      // Search in files directory
      if (fs.existsSync(filesDir)) {
        const filesInDir = fs.readdirSync(filesDir);
        for (const file of filesInDir) {
          if (file.endsWith(filename) || file.includes(filename.replace(/\.[^/.]+$/, ''))) {
            possiblePaths.push(path.join(filesDir, file));
          }
        }
      }
      
      // Search in misc directory  
      if (fs.existsSync(miscDir)) {
        const filesInDir = fs.readdirSync(miscDir);
        for (const file of filesInDir) {
          if (file.endsWith(filename) || file.includes(filename.replace(/\.[^/.]+$/, ''))) {
            possiblePaths.push(path.join(miscDir, file));
          }
        }
      }
      
      console.log('Searching in paths:', possiblePaths);
      
      // Find first existing file
      fullPath = possiblePaths.find(p => fs.existsSync(p));
      
      if (fullPath) {
        normalizedPath = path.normalize(fullPath);
        console.log('✅ Found file at:', normalizedPath);
      } else {
        console.log('❌ File not found in any location');
        normalizedPath = null;
      }
    } else {
      fullPath = path.join(uploadDir, 'files', actualFilename);
      
      // Try misc folder if not found in files folder
      if (!fs.existsSync(fullPath)) {
        fullPath = path.join(uploadDir, 'misc', actualFilename);
      }
      
      normalizedPath = path.normalize(fullPath);
    }
    // Normalize path and verify it stays within upload directory
    if (!normalizedPath || !normalizedPath.startsWith(uploadDir)) {
      console.log('❌ Invalid file path');
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid file path' 
      });
    }
    
    // Check if file exists
    if (!fs.existsSync(normalizedPath)) {
      console.log('❌ File not found at path:', normalizedPath);
      return res.status(404).json({ 
        success: false, 
        error: 'File not found on server' 
      });
    }
    
    console.log('✅ File found at:', normalizedPath);
    
    // Determine MIME type
    const mimeType = mime.lookup(filename) || 'application/octet-stream';
    
    // Get original filename from attachment
    const originalName = attachment ? attachment.name : filename;
    
    // Send file with proper headers
    res.sendFile(normalizedPath, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${originalName}"`,
      }
    }, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        if (!res.headersSent) {
          res.status(500).json({ 
            success: false, 
            error: 'Error sending file' 
          });
        }
      }
    });
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};


// Download answer key for quiz assignments
export const downloadAnswerKey = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('=== DOWNLOAD ANSWER KEY REQUEST ===');
    console.log('Assignment ID:', id);
    console.log('User:', req.user?.email, 'Role:', req.user?.role);
    
    // Find assignment
    const assignment = await Assignment.findById(id).populate('classId');
    
    if (!assignment || assignment.isDeleted) {
      console.log('❌ Assignment not found');
      return res.status(404).json({ 
        success: false, 
        error: 'Assignment not found' 
      });
    }
    
    // Check permission: must be teacher/admin of the class
    const classId = assignment.classId?._id || assignment.classId;
    const allowed = await canAccessClass(req.user, classId);
    
    if (!allowed || req.user.role === 'student') {
      console.log('❌ Permission denied - students cannot download answer keys');
      return res.status(403).json({ 
        success: false, 
        error: 'Only teachers and admins can download answer keys' 
      });
    }
    
    // Check if this is a quiz assignment
    if (assignment.mode !== 'quiz') {
      console.log('❌ Not a quiz assignment');
      return res.status(400).json({ 
        success: false, 
        error: 'Answer keys are only available for quiz assignments' 
      });
    }
    
    // Get questions with correct answers
    const questions = await Question.find({ 
      assignmentId: assignment._id, 
      isDeleted: false 
    }).sort({ createdAt: 1 });
    
    if (!questions || questions.length === 0) {
      console.log('❌ No questions found');
      return res.status(404).json({ 
        success: false, 
        error: 'No questions found for this assignment' 
      });
    }
    
    console.log(`✅ Found ${questions.length} questions`);
    
    // Generate answer key text
    let answerKeyText = `ĐÁP ÁN - ${assignment.title}\n`;
    answerKeyText += `Môn: ${assignment.classId?.name || 'N/A'}\n`;
    answerKeyText += `Số câu hỏi: ${questions.length}\n`;
    answerKeyText += `\n${'='.repeat(60)}\n\n`;
    
    questions.forEach((q, index) => {
      answerKeyText += `Câu ${index + 1}: ${q.content}\n`;
      answerKeyText += `A. ${q.optionA}\n`;
      answerKeyText += `B. ${q.optionB}\n`;
      answerKeyText += `C. ${q.optionC}\n`;
      answerKeyText += `D. ${q.optionD}\n`;
      answerKeyText += `✓ Đáp án đúng: ${q.correctAnswer}\n`;
      answerKeyText += `\n${'-'.repeat(60)}\n\n`;
    });
    
    // Send as downloadable text file
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="dap_an_${assignment.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt"`);
    res.send(answerKeyText);
    
    console.log('✅ Answer key sent successfully');
    
  } catch (error) {
    console.error('Download answer key error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
