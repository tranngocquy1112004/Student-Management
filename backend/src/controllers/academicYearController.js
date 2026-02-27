import AcademicYear from '../models/AcademicYear.js';

export const getAcademicYears = async (req, res) => {
  try {
    const years = await AcademicYear.find({ isDeleted: false }).sort({ startDate: -1 });
    res.json({ success: true, data: years });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAcademicYear = async (req, res) => {
  try {
    const year = await AcademicYear.create(req.body);
    res.status(201).json({ success: true, data: year });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAcademicYear = async (req, res) => {
  try {
    const year = await AcademicYear.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true }
    );
    if (!year) return res.status(404).json({ success: false, message: 'Không tìm thấy năm học' });
    res.json({ success: true, data: year });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAcademicYear = async (req, res) => {
  try {
    const year = await AcademicYear.findById(req.params.id);
    if (!year || year.isDeleted) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy năm học' });
    }
    year.isDeleted = true;
    year.deletedAt = new Date();
    await year.save();
    res.json({ success: true, message: 'Xóa thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
