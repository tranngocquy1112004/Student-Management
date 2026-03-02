import Gradebook from '../models/Gradebook.js';
import Enrollment from '../models/Enrollment.js';
import Class from '../models/Class.js';
import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import ExcelJS from 'exceljs';

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

export const getGradebook = async (req, res) => {
  try {
    const allowed = await canAccessClass(req.user, req.params.classId);
    if (!allowed) return res.status(403).json({ success: false });

    const { page, limit } = req.query;
    const filter = { classId: req.params.classId, isDeleted: false };

    const { paginate } = await import('../utils/pagination.js');
    const gradebookResult = await paginate(
      Gradebook,
      filter,
      {
        page,
        limit,
        sort: { createdAt: -1 },
        populate: { path: 'studentId', select: 'name email studentCode' }
      }
    );

    // Get assignments and submissions (not paginated, needed for full context)
    const assignments = await Assignment.find({ classId: req.params.classId, isDeleted: false }).sort({ createdAt: 1 });
    const subs = await Submission.find({ assignmentId: { $in: assignments.map(a => a._id) } })
      .populate('assignmentId', 'title')
      .populate('studentId', 'name studentCode');

    res.json({
      success: true,
      data: {
        gradebook: gradebookResult.data,
        assignments,
        submissions: subs
      },
      pagination: gradebookResult.pagination
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const computeTotal = (qt, gk, ck) => Math.round(((qt ?? 0) * 0.3 + (gk ?? 0) * 0.2 + (ck ?? 0) * 0.5) * 10) / 10;

export const updateGrade = async (req, res) => {
  try {
    const allowed = await canAccessClass(req.user, req.params.classId);
    if (!allowed || (req.user.role !== 'admin' && req.user.role !== 'teacher')) return res.status(403).json({ success: false });
    const { qt, gk, ck } = req.body;
    const studentId = req.params.studentId;
    const q = qt ?? 0, g = gk ?? 0, c = ck ?? 0;
    const total = computeTotal(q, g, c);
    const gb = await Gradebook.findOneAndUpdate(
      { classId: req.params.classId, studentId },
      { qt: q, gk: g, ck: c, total },
      { new: true, upsert: true }
    ).populate('studentId', 'name email studentCode');
    res.json({ success: true, data: gb });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateGradeByStudentId = updateGrade;

export const bulkUpdate = async (req, res) => {
  try {
    const allowed = await canAccessClass(req.user, req.params.classId);
    if (!allowed || (req.user.role !== 'admin' && req.user.role !== 'teacher')) return res.status(403).json({ success: false });
    const { grades } = req.body;
    for (const g of grades) {
      const q = g.qt ?? 0, gk = g.gk ?? 0, c = g.ck ?? 0;
      await Gradebook.findOneAndUpdate(
        { classId: req.params.classId, studentId: g.studentId },
        { qt: q, gk, ck: c, total: computeTotal(q, gk, c) },
        { upsert: true }
      );
    }
    const gradebook = await Gradebook.find({ classId: req.params.classId, isDeleted: false }).populate('studentId', 'name email studentCode');
    res.json({ success: true, data: gradebook });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const exportGradebook = async (req, res) => {
  try {
    const allowed = await canAccessClass(req.user, req.params.classId);
    if (!allowed || (req.user.role !== 'admin' && req.user.role !== 'teacher')) return res.status(403).json({ success: false });
    const gradebook = await Gradebook.find({ classId: req.params.classId, isDeleted: false }).populate('studentId', 'name email studentCode');
    const cls = await Class.findById(req.params.classId).populate('subjectId');
    // fetch assignments and submissions similar to getGradebook
    const assignments = await Assignment.find({ classId: req.params.classId, isDeleted: false }).sort({ createdAt: 1 });
    const subs = await Submission.find({ assignmentId: { $in: assignments.map(a => a._id) } });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Bảng điểm');
    // base columns
    const cols = [
      { header: 'STT', key: 'stt', width: 5 },
      { header: 'Mã SV', key: 'studentCode', width: 15 },
      { header: 'Họ tên', key: 'name', width: 25 },
    ];
    // add assignment headers
    assignments.forEach((a, idx) => {
      cols.push({ header: a.title, key: `ass${idx}`, width: 15 });
    });
    cols.push({ header: 'QT (30%)', key: 'qt', width: 10 });
    cols.push({ header: 'GK (20%)', key: 'gk', width: 10 });
    cols.push({ header: 'CK (50%)', key: 'ck', width: 10 });
    cols.push({ header: 'Tổng', key: 'total', width: 10 });
    sheet.columns = cols;

    gradebook.forEach((g, i) => {
      const row = {
        stt: i + 1,
        studentCode: g.studentId?.studentCode || '-',
        name: g.studentId?.name || '-',
        qt: g.qt,
        gk: g.gk,
        ck: g.ck,
        total: g.total,
      };
      assignments.forEach((a, idx) => {
        const sub = subs.find(s => (s.studentId?.toString() || s.studentId) === (g.studentId?._id||g.studentId).toString()
          && (s.assignmentId?.toString() || s.assignmentId) === a._id.toString());
        row[`ass${idx}`] = sub ? (sub.score != null ? sub.score : (sub.status === 'late' ? 'QH' : '')) : '';
      });
      sheet.addRow(row);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=gradebook-${cls?.name || 'class'}.xlsx`);
    await workbook.xlsx.write(res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
