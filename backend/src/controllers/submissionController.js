import Submission from '../models/Submission.js';
import Assignment from '../models/Assignment.js';
import Enrollment from '../models/Enrollment.js';
import Class from '../models/Class.js';
import Question from '../models/Question.js';
import SubmissionAnswer from '../models/SubmissionAnswer.js';
import Gradebook from '../models/Gradebook.js';

const updateAverageScore = async ({ classId, studentId }) => {
  // Tìm tất cả bài trắc nghiệm của lớp
  // lấy tất cả bài quiz của lớp; chúng ta sẽ tính trung bình trên toàn bộ số bài (chưa nộp = 0 điểm)
  const quizAssignments = await Assignment.find({ classId, mode: 'quiz', isDeleted: false });
  if (quizAssignments.length === 0) return;
  const ids = quizAssignments.map(a => a._id);
  // chỉ quan tâm bản ghi đã chấm (graded) với điểm
  const subs = await Submission.find({
    assignmentId: { $in: ids },
    studentId,
    status: 'graded',
    score: { $ne: null },
  });
  // tổng điểm của các bài đã chấm; những bài thiếu sẽ được coi là 0
  const sum = subs.reduce((acc, s) => acc + (s.score || 0), 0);
  const avg = Math.round((sum / quizAssignments.length) * 10) / 10;
  await Gradebook.findOneAndUpdate(
    { classId, studentId },
    { averageScore: avg },
    { upsert: true }
  );
};

const checkAndCompleteClass = async ({ classId, studentId }) => {
  try {
    console.log('Checking class completion for:', { classId, studentId });
    
    // Lấy tất cả bài tập đã xuất bản của lớp
    const allAssignments = await Assignment.find({ 
      classId, 
      status: 'published', 
      isDeleted: false 
    });
    
    console.log('Found assignments:', allAssignments.length);
    
    if (allAssignments.length === 0) return;
    
    // Kiểm tra sinh viên đã nộp tất cả bài tập chưa
    const assignmentIds = allAssignments.map(a => a._id);
    const submissions = await Submission.find({
      assignmentId: { $in: assignmentIds },
      studentId,
      status: { $in: ['submitted', 'late', 'graded'] }
    });
    
    console.log('Found submissions:', submissions.length);
    
    // Nếu đã nộp tất cả bài tập, đánh dấu hoàn thành môn học
    if (submissions.length === allAssignments.length) {
      console.log('Marking class as completed');
      await Enrollment.findOneAndUpdate(
        { classId, studentId },
        { 
          isCompleted: true, 
          completedAt: new Date() 
        },
        { upsert: false }
      );
    }
  } catch (error) {
    console.error('Error checking class completion:', error);
  }
};

export const submit = async (req, res) => {
  try {
    const a = await Assignment.findById(req.params.id);
    if (!a || a.isDeleted || a.status !== 'published') return res.status(404).json({ success: false, message: 'Bài tập không tồn tại' });
    const en = await Enrollment.findOne({ classId: a.classId, studentId: req.user._id });
    if (!en) return res.status(403).json({ success: false });
    const isLate = new Date() > new Date(a.deadline);

    // Bài nộp file / tự luận (mode = file) giữ nguyên như cũ
    if (a.mode === 'file') {
      const files = (req.files || []).map(f => ({ url: '/uploads/files/' + f.filename, name: f.originalname }));
      const content = req.body?.content || '';
      const sub = await Submission.findOneAndUpdate(
        { assignmentId: req.params.id, studentId: req.user._id },
        { content, files, status: isLate ? 'late' : 'submitted', submittedAt: new Date() },
        { new: true, upsert: true }
      );
      
      // Kiểm tra và khóa môn học nếu đã hoàn thành tất cả bài tập
      await checkAndCompleteClass({ classId: a.classId, studentId: req.user._id });
      
      return res.json({ success: true, data: sub });
    }

    // Bài trắc nghiệm (mode = quiz) – nhận đáp án dạng JSON
    const { answers } = req.body;
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ success: false, message: 'Chưa gửi đáp án' });
    }

    const questions = await Question.find({ assignmentId: a._id, isDeleted: false });
    if (questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Bài tập chưa có câu hỏi' });
    }

    const answerMap = new Map();
    for (const ans of answers) {
      if (ans?.questionId && ans?.selectedAnswer) {
        answerMap.set(String(ans.questionId), String(ans.selectedAnswer).toUpperCase());
      }
    }

    let correctCount = 0;
    const totalQuestions = questions.length;

    // Tạo/ghi Submission trước
    const sub = await Submission.findOneAndUpdate(
      { assignmentId: req.params.id, studentId: req.user._id },
      {
        status: isLate ? 'late' : 'submitted',
        submittedAt: new Date(),
      },
      { new: true, upsert: true }
    );

    // Xóa đáp án cũ để tránh trùng
    await SubmissionAnswer.deleteMany({ submissionId: sub._id });

    const answerDocs = [];
    for (const q of questions) {
      const sel = answerMap.get(String(q._id));
      const isCorrect = !!sel && sel === q.correctAnswer;
      if (isCorrect) correctCount += 1;
      answerDocs.push({
        submissionId: sub._id,
        questionId: q._id,
        selectedAnswer: sel || null,
        isCorrect,
      });
    }

    // Chỉ lưu các câu mà SV chọn (hoặc lưu hết, nhưng selectedAnswer có thể null)
    await SubmissionAnswer.insertMany(answerDocs);

    const rawScore = totalQuestions === 0 ? 0 : (correctCount / totalQuestions) * 10;
    const score = Math.round(rawScore * 10) / 10;

    sub.score = score;
    sub.status = 'graded'; // tự chấm
    sub.gradedBy = null;
    sub.gradedAt = new Date();
    await sub.save();

    // Cập nhật điểm trung bình môn (grade_book) cho SV trong lớp này
    await updateAverageScore({ classId: a.classId, studentId: req.user._id });

    // Kiểm tra và khóa môn học nếu đã hoàn thành tất cả bài tập
    await checkAndCompleteClass({ classId: a.classId, studentId: req.user._id });

    res.json({
      success: true,
      data: {
        ...sub.toObject(),
        correctCount,
        totalQuestions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resubmit = async (req, res) => {
  try {
    const a = await Assignment.findById(req.params.id);
    if (!a || a.isDeleted || a.status !== 'published') return res.status(404).json({ success: false });
    const sub = await Submission.findOne({ assignmentId: req.params.id, studentId: req.user._id });
    if (!sub || sub.status === 'graded') return res.status(400).json({ success: false, message: 'Không thể nộp lại' });
    if (new Date() > new Date(a.deadline)) return res.status(400).json({ success: false, message: 'Đã quá hạn' });
    sub.content = req.body?.content ?? sub.content;
    const newFiles = (req.files || []).map(f => ({ url: '/uploads/files/' + f.filename, name: f.originalname }));
    if (newFiles.length > 0) sub.files = newFiles;
    sub.status = 'submitted';
    sub.submittedAt = new Date();
    sub.score = undefined;
    sub.feedback = undefined;
    await sub.save();
    res.json({ success: true, data: sub });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMySubmission = async (req, res) => {
  try {
    const sub = await Submission.findOne({ assignmentId: req.params.id, studentId: req.user._id });
    res.json({ success: true, data: sub });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSubmissions = async (req, res) => {
  try {
    const a = await Assignment.findById(req.params.id).populate('classId');
    if (!a || a.isDeleted) return res.status(404).json({ success: false });
    const classId = a.classId?._id || a.classId;
    const cls = await Class.findById(classId);
    if (cls.teacherId.toString() !== req.user._id.toString() && req.user.role !== 'admin') return res.status(403).json({ success: false });
    const { status } = req.query;
    const query = { assignmentId: req.params.id };
    if (status === 'graded') query.status = 'graded';
    if (status === 'pending') query.status = { $in: ['submitted', 'late'] };
    const submissions = await Submission.find(query).populate('studentId', 'name email studentCode');
    res.json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSubmissionById = async (req, res) => {
  try {
    const sub = await Submission.findById(req.params.id).populate('assignmentId').populate('studentId', 'name email studentCode');
    if (!sub || sub.isDeleted) return res.status(404).json({ success: false });
    const a = sub.assignmentId;
    const classId = a.classId?._id || a.classId;
    const cls = await Class.findById(classId);
    if (cls.teacherId.toString() !== req.user._id.toString() && req.user.role !== 'admin') return res.status(403).json({ success: false });
    res.json({ success: true, data: sub });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const gradeSubmission = async (req, res) => {
  try {
    const sub = await Submission.findById(req.params.id).populate('assignmentId');
    if (!sub || sub.isDeleted) return res.status(404).json({ success: false });
    const classId = sub.assignmentId?.classId?._id || sub.assignmentId?.classId;
    const cls = await Class.findById(classId);
    if (cls.teacherId.toString() !== req.user._id.toString() && req.user.role !== 'admin') return res.status(403).json({ success: false });
    sub.score = req.body.score;
    sub.feedback = req.body.feedback;
    sub.status = 'graded';
    sub.gradedBy = req.user._id;
    sub.gradedAt = new Date();
    await sub.save();
    res.json({ success: true, data: sub });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Download submission files
export const downloadSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('=== DOWNLOAD SUBMISSION REQUEST ===');
    console.log('Submission ID:', id);
    console.log('User:', req.user?.email, 'Role:', req.user?.role);
    
    // Find submission
    const submission = await Submission.findById(id)
      .populate('assignmentId')
      .populate('studentId');
    
    if (!submission || submission.isDeleted) {
      console.log('❌ Submission not found');
      return res.status(404).json({ 
        success: false, 
        error: 'Submission not found' 
      });
    }
    
    console.log('Submission found:', {
      student: submission.studentId?.name,
      assignment: submission.assignmentId?.title,
      filesCount: submission.files?.length || 0
    });
    
    // Check permission: must be teacher/admin of the class OR the student who submitted
    const assignment = submission.assignmentId;
    const classId = assignment.classId;
    const cls = await Class.findById(classId);
    
    const isTeacher = req.user.role === 'teacher' && cls.teacherId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isOwner = req.user.role === 'student' && submission.studentId._id.toString() === req.user._id.toString();
    
    if (!isTeacher && !isAdmin && !isOwner) {
      console.log('❌ Permission denied');
      return res.status(403).json({ 
        success: false, 
        error: 'You do not have permission to download this submission' 
      });
    }
    
    // Check if submission has files
    if (!submission.files || submission.files.length === 0) {
      console.log('❌ No files in submission');
      return res.status(404).json({ 
        success: false, 
        error: 'This submission has no files' 
      });
    }
    
    // For now, download the first file
    // TODO: In future, create a zip file with all files
    const file = submission.files[0];
    console.log('Downloading file:', file);
    
    // Extract actual filename from URL
    let actualFilename = file.name;
    if (file.url) {
      if (file.url.startsWith('/uploads/files/')) {
        actualFilename = file.url.replace('/uploads/files/', '');
      } else if (file.url.startsWith('/uploads/misc/')) {
        actualFilename = file.url.replace('/uploads/misc/', '');
      } else if (file.url.includes('/')) {
        const parts = file.url.split('/');
        actualFilename = parts[parts.length - 1];
      }
    }
    
    console.log('Actual filename:', actualFilename);
    
    // Resolve full file path
    const path = await import('path');
    const fs = await import('fs');
    const uploadDir = path.join(process.cwd(), 'uploads');
    let fullPath = path.join(uploadDir, 'files', actualFilename);
    
    // Try misc folder if not found in files folder
    if (!fs.existsSync(fullPath)) {
      fullPath = path.join(uploadDir, 'misc', actualFilename);
    }
    
    // Normalize path
    const normalizedPath = path.normalize(fullPath);
    
    // Verify path stays within upload directory
    if (!normalizedPath.startsWith(uploadDir)) {
      console.log('❌ Invalid file path');
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid file path' 
      });
    }
    
    // Check if file exists
    if (!fs.existsSync(normalizedPath)) {
      console.log('❌ File not found at:', normalizedPath);
      return res.status(404).json({ 
        success: false, 
        error: 'File not found on server' 
      });
    }
    
    console.log('✅ File found at:', normalizedPath);
    
    // Determine MIME type
    const mime = await import('mime-types');
    const mimeType = mime.lookup(file.name) || 'application/octet-stream';
    
    // Send file
    res.sendFile(normalizedPath, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${file.name}"`,
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
    console.error('Download submission error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
