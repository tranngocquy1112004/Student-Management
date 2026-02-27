import Faculty from '../models/Faculty.js';

export const getFaculties = async (req, res) => {
  try {
    const faculties = await Faculty.find({ isDeleted: false }).sort({ name: 1 });
    res.json({ success: true, data: faculties });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createFaculty = async (req, res) => {
  try {
    console.log('Creating faculty with data:', req.body);
    const faculty = await Faculty.create(req.body);
    console.log('Faculty created successfully:', faculty);
    res.status(201).json({ success: true, data: faculty });
  } catch (error) {
    console.error('Error creating faculty:', error);
    
    // Handle specific errors
    if (error.code === 11000) {
      // Duplicate key error
      if (error.keyPattern?.code) {
        return res.status(400).json({ 
          success: false, 
          message: 'Mã khoa đã tồn tại. Vui lòng chọn mã khác.' 
        });
      }
      if (error.keyPattern?.name) {
        return res.status(400).json({ 
          success: false, 
          message: 'Tên khoa đã tồn tại. Vui lòng chọn tên khác.' 
        });
      }
      return res.status(400).json({ 
        success: false, 
        message: 'Dữ liệu trùng lặp. Vui lòng kiểm tra lại.' 
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: messages.join(', ') 
      });
    }
    
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
    if (!faculty) return res.status(404).json({ success: false });
    res.json({ success: true, data: faculty });
  } catch (error) {
    console.error('Error updating faculty:', error);
    
    // Handle specific errors
    if (error.code === 11000) {
      // Duplicate key error
      if (error.keyPattern?.code) {
        return res.status(400).json({ 
          success: false, 
          message: 'Mã khoa đã tồn tại. Vui lòng chọn mã khác.' 
        });
      }
      if (error.keyPattern?.name) {
        return res.status(400).json({ 
          success: false, 
          message: 'Tên khoa đã tồn tại. Vui lòng chọn tên khác.' 
        });
      }
      return res.status(400).json({ 
        success: false, 
        message: 'Dữ liệu trùng lặp. Vui lòng kiểm tra lại.' 
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: messages.join(', ') 
      });
    }
    
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty || faculty.isDeleted) return res.status(404).json({ success: false });
    faculty.isDeleted = true;
    faculty.deletedAt = new Date();
    await faculty.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
