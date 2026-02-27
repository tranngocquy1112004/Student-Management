import Semester from '../models/Semester.js';

export const getSemesters = async (req, res) => {
  try {
    const { academicYearId } = req.query;
    const query = { isDeleted: false };
    if (academicYearId) query.academicYearId = academicYearId;
    const semesters = await Semester.find(query)
      .populate('academicYearId', 'name')
      .sort({ startDate: -1 });
    res.json({ success: true, data: semesters });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSemester = async (req, res) => {
  try {
    const semester = await Semester.create(req.body);
    const sem = await Semester.findById(semester._id).populate('academicYearId');
    res.status(201).json({ success: true, data: sem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSemester = async (req, res) => {
  try {
    const semester = await Semester.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true }
    ).populate('academicYearId');
    if (!semester) return res.status(404).json({ success: false, message: 'Không tìm thấy học kỳ' });
    res.json({ success: true, data: semester });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSemester = async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id);
    if (!semester || semester.isDeleted) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy học kỳ' });
    }
    semester.isDeleted = true;
    semester.deletedAt = new Date();
    await semester.save();
    res.json({ success: true, message: 'Xóa thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
