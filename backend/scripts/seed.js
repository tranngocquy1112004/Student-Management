import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Faculty from '../src/models/Faculty.js';
import Subject from '../src/models/Subject.js';
import Class from '../src/models/Class.js';
import Enrollment from '../src/models/Enrollment.js';

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/classroom_management');
  await User.deleteMany({});
  await Faculty.deleteMany({});
  await Subject.deleteMany({});
  await Class.deleteMany({});
  await Enrollment.deleteMany({});

  const admin = await User.create({ name: 'Admin', email: 'admin@school.vn', password: '123456', role: 'admin' });
  const teacher = await User.create({ name: 'Nguyễn Văn Giảng', email: 'giangvien@school.vn', password: '123456', role: 'teacher', teacherCode: 'GV001' });
  const student = await User.create({ name: 'Trần Văn Học', email: 'sinhvien@school.vn', password: '123456', role: 'student', studentCode: 'SV001' });

  const faculty = await Faculty.create({ name: 'Công nghệ thông tin', code: 'CNTT' });
  const subject = await Subject.create({ name: 'Lập trình Web', code: 'LTW', credits: 3, facultyId: faculty._id });
  const cls = await Class.create({
    name: 'LTW-K16',
    subjectId: subject._id,
    teacherId: teacher._id,
    semester: '1',
    year: '2024-2025',
    status: 'active',
  });
  await Enrollment.create({ classId: cls._id, studentId: student._id });

  console.log('Seed completed!');
  console.log('Admin: admin@school.vn / 123456');
  console.log('Teacher: giangvien@school.vn / 123456');
  console.log('Student: sinhvien@school.vn / 123456');
  process.exit(0);
};

seed().catch(console.error);
