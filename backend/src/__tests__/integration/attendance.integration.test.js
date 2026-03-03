import request from 'supertest';
import mongoose from 'mongoose';
import { default as app } from '../../index.js';
import User from '../../models/User.js';
import Student from '../../models/Student.js';
import Teacher from '../../models/Teacher.js';
import Class from '../../models/Class.js';
import Enrollment from '../../models/Enrollment.js';
import AttendanceSession from '../../models/AttendanceSession.js';
import AttendanceRecord from '../../models/AttendanceRecord.js';
import AttendanceWarning from '../../models/AttendanceWarning.js';
import jwt from 'jsonwebtoken';

describe('Attendance Integration Tests', () => {
  let adminToken, teacherToken, studentToken;
  let adminUser, teacherUser, studentUser;
  let testClass, testSubject, testSemester;
  let testStudent, testTeacher;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/school_management_test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up and close connection
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up collections before each test
    await User.deleteMany({});
    await Student.deleteMany({});
    await Teacher.deleteMany({});
    await Class.deleteMany({});
    await Enrollment.deleteMany({});
    await AttendanceSession.deleteMany({});
    await AttendanceRecord.deleteMany({});
    await AttendanceWarning.deleteMany({});

    // Create test users with complete profiles
    adminUser = await User.create({
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      status: 'active'
    });

    teacherUser = await User.create({
      email: 'teacher@test.com',
      password: 'password123',
      role: 'teacher',
      status: 'active'
    });

    studentUser = await User.create({
      email: 'student@test.com',
      password: 'password123',
      role: 'student',
      status: 'active'
    });

    // Create student and teacher profiles
    testStudent = await Student.create({
      userId: studentUser._id,
      studentCode: 'SV001',
      name: 'Test Student',
      email: 'student@test.com'
    });

    testTeacher = await Teacher.create({
      userId: teacherUser._id,
      teacherCode: 'GV001',
      name: 'Test Teacher',
      email: 'teacher@test.com'
    });

    // Create test class with proper references
    testClass = await Class.create({
      name: 'Test Class Integration',
      code: 'TCI001',
      subjectId: new mongoose.Types.ObjectId(),
      teacherId: teacherUser._id,
      semesterId: new mongoose.Types.ObjectId(),
      maxStudents: 50,
      status: 'active'
    });

    // Enroll student in class
    await Enrollment.create({
      classId: testClass._id,
      studentId: studentUser._id,
      status: 'enrolled',
      enrollmentDate: new Date()
    });

    // Generate tokens
    adminToken = jwt.sign({ userId: adminUser._id }, process.env.JWT_SECRET || 'test_secret');
    teacherToken = jwt.sign({ userId: teacherUser._id }, process.env.JWT_SECRET || 'test_secret');
    studentToken = jwt.sign({ userId: studentUser._id }, process.env.JWT_SECRET || 'test_secret');
  });

  describe('Complete Attendance Flow Integration', () => {
    test('TC-20: Complete QR check-in flow - valid QR, on time', async () => {
      // Step 1: Teacher creates attendance session
      const sessionResponse = await request(app)
        .post(`/api/classes/${testClass._id}/attendance/sessions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          date: new Date(),
          shift: 'Morning',
          room: 'Room 101'
        });

      expect(sessionResponse.status).toBe(201);
      expect(sessionResponse.body.success).toBe(true);
      const sessionId = sessionResponse.body.data._id;

      // Step 2: Teacher generates QR code
      const qrResponse = await request(app)
        .post(`/api/attendance/sessions/${sessionId}/generate-code`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ minutes: 5 });

      expect(qrResponse.status).toBe(200);
      expect(qrResponse.body.success).toBe(true);
      expect(qrResponse.body.data.code).toBeDefined();
      const { code, expiresAt } = qrResponse.body.data;

      // Step 3: Student checks in with valid QR
      const checkInResponse = await request(app)
        .post('/api/attendance/check-in')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          code: code,
          sessionId: sessionId
        });

      expect(checkInResponse.status).toBe(200);
      expect(checkInResponse.body.success).toBe(true);
      expect(checkInResponse.body.data.status).toBe('present');
      expect(checkInResponse.body.data.checkInMethod).toBe('qr');

      // Step 4: Verify attendance record
      const record = await AttendanceRecord.findOne({
        sessionId: sessionId,
        studentId: studentUser._id
      }).populate('studentId', 'name email');

      expect(record).toBeTruthy();
      expect(record.status).toBe('present');
      expect(record.checkInMethod).toBe('qr');
      expect(record.studentId.name).toBe('Test Student');
    });

    test('TC-21: QR expiration flow', async () => {
      // Step 1: Create session and generate expired QR
      const sessionResponse = await request(app)
        .post(`/api/classes/${testClass._id}/attendance/sessions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          date: new Date(),
          shift: 'Morning',
          room: 'Room 101'
        });

      const sessionId = sessionResponse.body.data._id;

      // Generate QR with 1 minute expiry
      const qrResponse = await request(app)
        .post(`/api/attendance/sessions/${sessionId}/generate-code`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ minutes: 1 });

      const { code } = qrResponse.body.data;

      // Step 2: Wait for QR to expire (simulate time passing)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Manually expire the code in database
      await AttendanceSession.findByIdAndUpdate(sessionId, {
        codeExpiredAt: new Date(Date.now() - 60 * 1000) // 1 minute ago
      });

      // Step 3: Student tries to check in with expired QR
      const checkInResponse = await request(app)
        .post('/api/attendance/check-in')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          code: code,
          sessionId: sessionId
        });

      expect(checkInResponse.status).toBe(400);
      expect(checkInResponse.body.success).toBe(false);
      expect(checkInResponse.body.message).toBe('Mã đã hết hạn');
    });

    test('TC-22: Late check-in flow', async () => {
      // Step 1: Create session for past time
      const pastTime = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago
      const sessionResponse = await request(app)
        .post(`/api/classes/${testClass._id}/attendance/sessions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          date: pastTime,
          shift: 'Morning',
          room: 'Room 101'
        });

      const sessionId = sessionResponse.body.data._id;

      // Step 2: Generate QR code
      const qrResponse = await request(app)
        .post(`/api/attendance/sessions/${sessionId}/generate-code`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ minutes: 30 });

      const { code } = qrResponse.body.data;

      // Step 3: Student checks in late
      const checkInResponse = await request(app)
        .post('/api/attendance/check-in')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          code: code,
          sessionId: sessionId
        });

      expect(checkInResponse.status).toBe(200);
      expect(checkInResponse.body.success).toBe(true);

      // Manually update to simulate late detection
      await AttendanceRecord.findOneAndUpdate(
        { sessionId: sessionId, studentId: studentUser._id },
        { status: 'late' }
      );

      // Verify late status
      const record = await AttendanceRecord.findOne({
        sessionId: sessionId,
        studentId: studentUser._id
      });

      expect(record.status).toBe('late');
    });

    test('TC-23: Duplicate check-in prevention', async () => {
      // Step 1: Create session and generate QR
      const sessionResponse = await request(app)
        .post(`/api/classes/${testClass._id}/attendance/sessions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          date: new Date(),
          shift: 'Morning',
          room: 'Room 101'
        });

      const sessionId = sessionResponse.body.data._id;

      const qrResponse = await request(app)
        .post(`/api/attendance/sessions/${sessionId}/generate-code`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ minutes: 5 });

      const { code } = qrResponse.body.data;

      // Step 2: First successful check-in
      const firstCheckIn = await request(app)
        .post('/api/attendance/check-in')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          code: code,
          sessionId: sessionId
        });

      expect(firstCheckIn.status).toBe(200);
      expect(firstCheckIn.body.success).toBe(true);

      // Step 3: Second check-in attempt (should fail)
      const secondCheckIn = await request(app)
        .post('/api/attendance/check-in')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          code: code,
          sessionId: sessionId
        });

      expect(secondCheckIn.status).toBe(400);
      expect(secondCheckIn.body.success).toBe(false);
      expect(secondCheckIn.body.message).toContain('đã điểm danh');
    });

    test('TC-24: Non-enrolled student access prevention', async () => {
      // Step 1: Create another student not enrolled
      const otherStudent = await User.create({
        email: 'other@student.com',
        password: 'password123',
        role: 'student',
        status: 'active'
      });

      const otherStudentProfile = await Student.create({
        userId: otherStudent._id,
        studentCode: 'SV002',
        name: 'Other Student',
        email: 'other@student.com'
      });

      const otherToken = jwt.sign({ userId: otherStudent._id }, process.env.JWT_SECRET || 'test_secret');

      // Step 2: Create session and generate QR
      const sessionResponse = await request(app)
        .post(`/api/classes/${testClass._id}/attendance/sessions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          date: new Date(),
          shift: 'Morning',
          room: 'Room 101'
        });

      const sessionId = sessionResponse.body.data._id;

      const qrResponse = await request(app)
        .post(`/api/attendance/sessions/${sessionId}/generate-code`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ minutes: 5 });

      const { code } = qrResponse.body.data;

      // Step 3: Non-enrolled student tries to check in
      const checkInResponse = await request(app)
        .post('/api/attendance/check-in')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          code: code,
          sessionId: sessionId
        });

      expect(checkInResponse.status).toBe(403);
      expect(checkInResponse.body.success).toBe(false);
      expect(checkInResponse.body.message).toContain('Không được ghi danh vào lớp học này');
    });

    test('TC-25: Attendance warning creation for high absence rate', async () => {
      // Step 1: Create multiple sessions with high absence rate
      const sessions = [];
      const totalSessions = 10;
      const absentSessions = 3; // 30% absence rate

      for (let i = 0; i < totalSessions; i++) {
        const sessionDate = new Date(Date.now() - (totalSessions - i) * 24 * 60 * 60 * 1000);
        
        const session = await AttendanceSession.create({
          classId: testClass._id,
          date: sessionDate,
          shift: 'Morning',
          room: 'Room 101'
        });
        sessions.push(session);

        // Create attendance records
        if (i < absentSessions) {
          // Absent for first 3 sessions
          await AttendanceRecord.create({
            sessionId: session._id,
            studentId: studentUser._id,
            status: 'absent',
            checkInMethod: 'manual',
            checkedAt: sessionDate
          });
        } else {
          // Present for remaining sessions
          await AttendanceRecord.create({
            sessionId: session._id,
            studentId: studentUser._id,
            status: 'present',
            checkInMethod: 'manual',
            checkedAt: sessionDate
          });
        }
      }

      // Step 2: Generate attendance report (this should trigger warning creation)
      const reportResponse = await request(app)
        .get(`/api/classes/${testClass._id}/attendance/report`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(reportResponse.status).toBe(200);
      expect(reportResponse.body.success).toBe(true);

      const reportData = reportResponse.body.data.report;
      const studentReport = reportData.find(r => 
        r.student._id.toString() === studentUser._id.toString()
      );

      expect(studentReport).toBeTruthy();
      expect(studentReport.absent).toBe(absentSessions);
      expect(studentReport.present).toBe(totalSessions - absentSessions);

      // Step 3: Check if attendance warning was created
      const warning = await AttendanceWarning.findOne({
        studentId: studentUser._id,
        classId: testClass._id
      });

      expect(warning).toBeTruthy();
      expect(warning.severity).toBe('medium'); // 30% should trigger medium warning
      expect(warning.reason).toContain('vắng');
    });
  });

  describe('Direct Check-in Integration', () => {
    test('should handle direct check-in without QR code', async () => {
      const response = await request(app)
        .post(`/api/classes/${testClass._id}/attendance/direct-checkin`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('present');
      expect(response.body.data.checkInMethod).toBe('manual');

      // Verify session was auto-created
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const session = await AttendanceSession.findOne({
        classId: testClass._id,
        date: { $gte: today, $lt: tomorrow }
      });

      expect(session).toBeTruthy();
      expect(session.classId.toString()).toBe(testClass._id.toString());
    });
  });

  describe('Attendance Statistics Integration', () => {
    test('should provide comprehensive attendance statistics', async () => {
      // Create test data
      const sessions = [];
      for (let i = 0; i < 5; i++) {
        const session = await AttendanceSession.create({
          classId: testClass._id,
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          shift: 'Morning'
        });
        sessions.push(session);

        await AttendanceRecord.create({
          sessionId: session._id,
          studentId: studentUser._id,
          status: i % 2 === 0 ? 'present' : 'absent',
          checkInMethod: 'manual'
        });
      }

      // Get statistics
      const statsResponse = await request(app)
        .get(`/api/attendance/statistics/${testClass._id}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body.success).toBe(true);
      expect(statsResponse.body.data).toBeDefined();

      // Get attendance rate
      const rateResponse = await request(app)
        .get(`/api/attendance/rate/${testClass._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(rateResponse.status).toBe(200);
      expect(rateResponse.body.success).toBe(true);
      expect(rateResponse.body.data.rate).toBeDefined();
      expect(typeof rateResponse.body.data.rate).toBe('number');
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle malformed requests gracefully', async () => {
      // Test missing required fields
      const response = await request(app)
        .post('/api/attendance/check-in')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({}); // Empty body

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should handle invalid ObjectId format', async () => {
      const response = await request(app)
        .post('/api/attendance/check-in')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          code: '123456',
          sessionId: 'invalid-id-format'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    test('should handle unauthorized access attempts', async () => {
      const response = await request(app)
        .post('/api/attendance/check-in')
        .send({
          code: '123456',
          sessionId: new mongoose.Types.ObjectId()
        });

      expect(response.status).toBe(401);
    });
  });
});
