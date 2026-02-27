import Score from '../models/Score.js';
import Student from '../models/Student.js';
import Subject from '../models/Subject.js';
import XLSX from 'xlsx';

export const getScores = async (req, res) => {
  try {
    const { page = 1, limit = 20, studentId, subjectId, semesterId } = req.query;
    const query = { isDeleted: false };
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (student) query.studentId = student._id;
      else query.studentId = null; // no scores
    } else if (studentId) query.studentId = studentId;
    if (subjectId) query.subjectId = subjectId;
    if (semesterId) query.semesterId = semesterId;
    const scores = await Score.find(query)
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name' } })
      .populate('subjectId', 'name code credit')
      .populate('semesterId', 'name')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    const total = await Score.countDocuments(query);
    res.json({ success: true, data: scores, pagination: { page, limit, total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createScore = async (req, res) => {
  try {
    const { studentId, subjectId, semesterId, attendance, midterm, finalExam } = req.body;
    const existing = await Score.findOne({ studentId, subjectId, semesterId, isDeleted: false });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Điểm đã tồn tại' });
    }
    const score = await Score.create({
      studentId,
      subjectId,
      semesterId,
      attendance: attendance ?? 0,
      midterm: midterm ?? 0,
      finalExam: finalExam ?? 0,
    });
    const sc = await Score.findById(score._id)
      .populate('studentId')
      .populate('subjectId', 'name code credit')
      .populate('semesterId', 'name');
    res.status(201).json({ success: true, data: sc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateScore = async (req, res) => {
  try {
    const score = await Score.findOne({ _id: req.params.id, isDeleted: false });
    if (!score) return res.status(404).json({ success: false, message: 'Không tìm thấy điểm' });
    if (score.isLocked) {
      return res.status(400).json({ success: false, message: 'Bảng điểm đã bị khóa' });
    }
    const { attendance, midterm, finalExam } = req.body;
    if (attendance !== undefined) score.attendance = attendance;
    if (midterm !== undefined) score.midterm = midterm;
    if (finalExam !== undefined) score.finalExam = finalExam;
    await score.save();
    const sc = await Score.findById(score._id)
      .populate('studentId')
      .populate('subjectId', 'name code credit')
      .populate('semesterId', 'name');
    res.json({ success: true, data: sc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteScore = async (req, res) => {
  try {
    const score = await Score.findById(req.params.id);
    if (!score || score.isDeleted) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy điểm' });
    }
    score.isDeleted = true;
    score.deletedAt = new Date();
    await score.save();
    res.json({ success: true, message: 'Xóa thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const lockScore = async (req, res) => {
  try {
    const score = await Score.findById(req.params.id);
    if (!score || score.isDeleted) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy điểm' });
    }
    score.isLocked = true;
    score.lockedAt = new Date();
    await score.save();
    res.json({ success: true, message: 'Khóa điểm thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const importScores = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Chưa chọn file' });
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);
    const { subjectId, semesterId } = req.body;
    let imported = 0, errors = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const studentCode = row['Mã SV'] || row['studentCode'] || row['studentCode'];
      const attendance = parseFloat(row['Chuyên cần'] || row['attendance'] || 0) || 0;
      const midterm = parseFloat(row['Giữa kỳ'] || row['midterm'] || 0) || 0;
      const finalExam = parseFloat(row['Cuối kỳ'] || row['finalExam'] || 0) || 0;
      const student = await Student.findOne({ studentCode });
      if (!student) {
        errors.push(`Dòng ${i + 2}: Không tìm thấy SV ${studentCode}`);
        continue;
      }
      const existing = await Score.findOne({ studentId: student._id, subjectId, semesterId });
      if (existing) {
        if (!existing.isLocked) {
          existing.attendance = attendance;
          existing.midterm = midterm;
          existing.finalExam = finalExam;
          await existing.save();
          imported++;
        }
      } else {
        await Score.create({ studentId: student._id, subjectId, semesterId, attendance, midterm, finalExam });
        imported++;
      }
    }
    res.json({ success: true, data: { imported, errors } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const exportScores = async (req, res) => {
  try {
    const { subjectId, semesterId } = req.query;
    const query = { isDeleted: false };
    if (subjectId) query.subjectId = subjectId;
    if (semesterId) query.semesterId = semesterId;
    const scores = await Score.find(query)
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name' } })
      .populate('subjectId')
      .populate('semesterId');
    const data = scores.map(s => ({
      'Mã SV': s.studentId?.studentCode,
      'Họ tên': s.studentId?.userId?.name,
      'Môn học': s.subjectId?.name,
      'Học kỳ': s.semesterId?.name,
      'Chuyên cần': s.attendance,
      'Giữa kỳ': s.midterm,
      'Cuối kỳ': s.finalExam,
      'Tổng': s.totalScore,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Scores');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'csv' });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=scores.csv');
    res.send(Buffer.from('\ufeff' + buf.toString('utf8')));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
