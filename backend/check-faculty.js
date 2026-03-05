import mongoose from 'mongoose';
import Faculty from './src/models/Faculty.js';
import Subject from './src/models/Subject.js';

async function checkFaculty() {
  try {
    await mongoose.connect('mongodb://localhost:27017/classroom_management');
    console.log('Connected to database');
    
    // Check all faculties (including deleted)
    const allFaculties = await Faculty.find({});
    console.log('\n=== ALL FACULTIES (including deleted) ===');
    allFaculties.forEach(faculty => {
      console.log(`- ${faculty.name} (${faculty.code}) - Deleted: ${faculty.isDeleted} - DeletedAt: ${faculty.deletedAt || 'N/A'}`);
    });
    
    // Check only active faculties
    const activeFaculties = await Faculty.find({ isDeleted: false });
    console.log('\n=== ACTIVE FACULTIES ===');
    activeFaculties.forEach(faculty => {
      console.log(`- ${faculty.name} (${faculty.code})`);
    });
    
    // Check subjects related to CNTT
    const cnttFaculty = await Faculty.findOne({ code: 'CNTT' });
    if (cnttFaculty) {
      const subjects = await Subject.find({ facultyId: cnttFaculty._id });
      console.log('\n=== SUBJECTS OF CNTT FACULTY ===');
      subjects.forEach(subject => {
        console.log(`- ${subject.name} (${subject.code}) - Deleted: ${subject.isDeleted}`);
      });
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Database error:', error);
  }
}

checkFaculty();
