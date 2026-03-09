import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Submission from '../src/models/Submission.js';
import Assignment from '../src/models/Assignment.js';
import User from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const fixScore = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI không được định nghĩa trong file .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Tìm submission có điểm 99
    const submissions = await Submission.find({ score: 99 })
      .populate('studentId', 'name email')
      .populate('assignmentId', 'title');

    console.log(`\n📊 Tìm thấy ${submissions.length} submission có điểm 99:`);
    
    if (submissions.length === 0) {
      console.log('❌ Không tìm thấy submission nào có điểm 99');
      process.exit(0);
    }

    for (const sub of submissions) {
      console.log(`\n📝 Submission:`);
      console.log(`   - Sinh viên: ${sub.studentId?.name || 'N/A'}`);
      console.log(`   - Bài tập: ${sub.assignmentId?.title || 'N/A'}`);
      console.log(`   - Điểm hiện tại: ${sub.score}`);
      console.log(`   - Ngày nộp: ${sub.submittedAt}`);
    }

    // Cập nhật điểm từ 99 xuống 9
    const result = await Submission.updateMany(
      { score: 99 },
      { 
        $set: { 
          score: 9,
          updatedAt: new Date()
        } 
      }
    );

    console.log(`\n✅ Đã cập nhật ${result.modifiedCount} submission từ 99 điểm xuống 9 điểm`);

    // Hiển thị kết quả sau khi cập nhật
    const updatedSubmissions = await Submission.find({ 
      _id: { $in: submissions.map(s => s._id) } 
    })
      .populate('studentId', 'name email')
      .populate('assignmentId', 'title');

    console.log(`\n📊 Kết quả sau khi cập nhật:`);
    for (const sub of updatedSubmissions) {
      console.log(`   - ${sub.studentId?.name}: ${sub.score} điểm`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
};

fixScore();
