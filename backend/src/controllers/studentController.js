import Gradebook from '../models/Gradebook.js';
import Enrollment from '../models/Enrollment.js';
import Class from '../models/Class.js';

export const getMyGrades = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ studentId: req.user._id }).distinct('classId');
    const gradebook = await Gradebook.find({ classId: { $in: enrollments }, studentId: req.user._id, isDeleted: false })
      .populate({ path: 'classId', populate: 'subjectId' });
    res.json({ success: true, data: gradebook });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyGradesByClass = async (req, res) => {
  try {
    const en = await Enrollment.findOne({ classId: req.params.classId, studentId: req.user._id });
    if (!en) return res.status(403).json({ success: false });
    const gb = await Gradebook.findOne({ classId: req.params.classId, studentId: req.user._id });
    res.json({ success: true, data: gb || { qt: 0, gk: 0, ck: 0, total: 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
