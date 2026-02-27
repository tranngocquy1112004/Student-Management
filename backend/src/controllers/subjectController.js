import Subject from '../models/Subject.js';

export const getSubjects = async (req, res) => {
  try {
    const { facultyId, search, page = 1, limit = 20 } = req.query;
    const query = { isDeleted: false };
    if (facultyId) query.facultyId = facultyId;
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { code: { $regex: search, $options: 'i' } }];
    const subjects = await Subject.find(query).populate('facultyId').skip((page - 1) * limit).limit(parseInt(limit)).sort({ name: 1 });
    const total = await Subject.countDocuments(query);
    res.json({ success: true, data: subjects, pagination: { page, limit, total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSubject = async (req, res) => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json({ success: true, data: await subject.populate('facultyId') });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, isDeleted: false }).populate('facultyId');
    if (!subject) return res.status(404).json({ success: false });
    res.json({ success: true, data: subject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true }).populate('facultyId');
    if (!subject) return res.status(404).json({ success: false });
    res.json({ success: true, data: subject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject || subject.isDeleted) return res.status(404).json({ success: false });
    subject.isDeleted = true;
    subject.deletedAt = new Date();
    await subject.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
