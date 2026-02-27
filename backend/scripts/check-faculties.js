import 'dotenv/config';
import mongoose from 'mongoose';
import Faculty from '../src/models/Faculty.js';

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/classroom_management')
  .then(async () => {
    const faculties = await Faculty.find({});
    console.log('Existing faculties:', faculties.length);
    faculties.forEach(f => console.log(`- ${f.name} (${f.code})`));
    process.exit(0);
  })
  .catch(console.error);
