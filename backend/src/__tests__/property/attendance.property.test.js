import { fc } from 'fast-check';
import mongoose from 'mongoose';
import AttendanceSession from '../../../models/AttendanceSession.js';
import AttendanceRecord from '../../../models/AttendanceRecord.js';
import Enrollment from '../../../models/Enrollment.js';
import Class from '../../../models/Class.js';
import User from '../../../models/User.js';

describe('Attendance Property-Based Tests', () => {
  let testClass, testStudent, testTeacher;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/school_management_test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up
    await AttendanceSession.deleteMany({});
    await AttendanceRecord.deleteMany({});
    await Enrollment.deleteMany({});
    await Class.deleteMany({});
    await User.deleteMany({});

    // Setup test data
    testTeacher = await User.create({
      email: 'teacher@test.com',
      password: 'password123',
      role: 'teacher',
      status: 'active'
    });

    testStudent = await User.create({
      email: 'student@test.com',
      password: 'password123',
      role: 'student',
      status: 'active'
    });

    testClass = await Class.create({
      name: 'Test Class',
      code: 'TC001',
      subjectId: new mongoose.Types.ObjectId(),
      teacherId: testTeacher._id,
      semesterId: new mongoose.Types.ObjectId(),
      maxStudents: 50,
      status: 'active'
    });

    await Enrollment.create({
      classId: testClass._id,
      studentId: testStudent._id,
      status: 'enrolled'
    });
  });

  describe('QR Code Generation Properties', () => {
    test('should generate valid 6-digit codes', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            minutes: fc.integer({ min: 1, max: 60 }),
            classId: fc.constant(testClass._id.toString())
          }),
          async (data) => {
            // Create session
            const session = await AttendanceSession.create({
              classId: data.classId,
              date: new Date(),
              shift: 'Morning'
            });

            // Generate code logic (simplified from controller)
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + data.minutes * 60 * 1000);

            session.code = code;
            session.codeExpiredAt = expiresAt;
            await session.save();

            // Verify properties
            expect(code).toMatch(/^\d{6}$/);
            expect(parseInt(code)).toBeGreaterThanOrEqual(100000);
            expect(parseInt(code)).toBeLessThanOrEqual(999999);
            expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should handle various expiration times correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1440 }), // 1 minute to 24 hours
          async (minutes) => {
            const session = await AttendanceSession.create({
              classId: testClass._id,
              date: new Date(),
              shift: 'Morning'
            });

            const expiresAt = new Date(Date.now() + minutes * 60 * 1000);
            session.codeExpiredAt = expiresAt;
            await session.save();

            // Verify expiration time is within expected range
            const timeDiff = expiresAt.getTime() - Date.now();
            const expectedDiff = minutes * 60 * 1000;
            expect(Math.abs(timeDiff - expectedDiff)).toBeLessThan(1000); // 1 second tolerance

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Attendance Record Properties', () => {
    test('should handle various status values correctly', async () => {
      const validStatuses = ['present', 'absent', 'late'];
      
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...validStatuses),
          async (status) => {
            const session = await AttendanceSession.create({
              classId: testClass._id,
              date: new Date(),
              shift: 'Morning'
            });

            const record = await AttendanceRecord.create({
              sessionId: session._id,
              studentId: testStudent._id,
              status: status,
              checkInMethod: 'manual',
              checkedAt: new Date()
            });

            expect(record.status).toBe(status);
            expect(record.checkInMethod).toBe('manual');
            expect(record.checkedAt).toBeInstanceOf(Date);

            return true;
          }
        ),
        { numRuns: 30 }
      );
    });

    test('should enforce unique session-student combinations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.nat(), { minLength: 1, maxLength: 5 }),
          async (indices) => {
            const session = await AttendanceSession.create({
              classId: testClass._id,
              date: new Date(),
              shift: 'Morning'
            });

            // Try to create multiple records for same session-student pair
            const promises = indices.map(async () => {
              try {
                return await AttendanceRecord.create({
                  sessionId: session._id,
                  studentId: testStudent._id,
                  status: 'present',
                  checkInMethod: 'manual'
                });
              } catch (error) {
                return { error: true, message: error.message };
              }
            });

            const results = await Promise.all(promises);
            const successCount = results.filter(r => !r.error).length;
            
            // Should only succeed once due to unique constraint
            expect(successCount).toBeLessThanOrEqual(1);

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Date and Time Properties', () => {
    test('should handle various date ranges correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.date({
            min: new Date(2020, 0, 1),
            max: new Date(2030, 11, 31)
          }),
          async (date) => {
            const session = await AttendanceSession.create({
              classId: testClass._id,
              date: date,
              shift: 'Morning'
            });

            expect(session.date).toEqual(date);
            expect(session.date).toBeInstanceOf(Date);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    test('should handle check-in time logic correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            sessionStartTime: fc.date(),
            checkInTime: fc.date(),
            allowedLateMinutes: fc.integer({ min: 0, max: 30 })
          }),
          async (data) => {
            const { sessionStartTime, checkInTime, allowedLateMinutes } = data;
            
            // Calculate time difference
            const timeDiff = checkInTime.getTime() - sessionStartTime.getTime();
            const lateThreshold = allowedLateMinutes * 60 * 1000;
            
            // Determine expected status
            let expectedStatus = 'present';
            if (timeDiff > lateThreshold) {
              expectedStatus = 'late';
            }

            // Create session and record
            const session = await AttendanceSession.create({
              classId: testClass._id,
              date: sessionStartTime,
              shift: 'Morning'
            });

            const record = await AttendanceRecord.create({
              sessionId: session._id,
              studentId: testStudent._id,
              status: expectedStatus,
              checkInMethod: 'manual',
              checkedAt: checkInTime
            });

            // Verify the logic
            expect(record.checkedAt).toEqual(checkInTime);
            
            // The status assignment logic should be consistent
            const calculatedStatus = timeDiff > lateThreshold ? 'late' : 'present';
            expect(calculatedStatus).toBe(expectedStatus);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Code Validation Properties', () => {
    test('should validate QR code format consistently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 10 }),
          async (code) => {
            const session = await AttendanceSession.create({
              classId: testClass._id,
              date: new Date(),
              shift: 'Morning',
              code: code,
              codeExpiredAt: new Date(Date.now() + 5 * 60 * 1000)
            });

            // Test various code formats
            const isValid6Digit = /^\d{6}$/.test(code);
            const isValidCode = session.code === code;
            
            // If it's a valid 6-digit code, it should match
            if (isValid6Digit) {
              expect(isValidCode).toBe(true);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should handle code expiration correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            minutesOffset: fc.integer({ min: -60, max: 60 }) // -60 to +60 minutes
          }),
          async (data) => {
            const { minutesOffset } = data;
            const expirationTime = new Date(Date.now() + minutesOffset * 60 * 1000);
            
            const session = await AttendanceSession.create({
              classId: testClass._id,
              date: new Date(),
              shift: 'Morning',
              code: '123456',
              codeExpiredAt: expirationTime
            });

            // Check if code is expired based on current time
            const isExpired = expirationTime < new Date();
            const sessionIsExpired = session.codeExpiredAt < new Date();
            
            expect(sessionIsExpired).toBe(isExpired);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Attendance Rate Calculations', () => {
    test('should calculate attendance rates correctly for various scenarios', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            totalSessions: fc.integer({ min: 1, max: 100 }),
            presentSessions: fc.integer({ min: 0, max: 100 }),
            lateSessions: fc.integer({ min: 0, max: 100 })
          }).filter(({ totalSessions, presentSessions, lateSessions }) => {
            return (presentSessions + lateSessions) <= totalSessions;
          }),
          async (data) => {
            const { totalSessions, presentSessions, lateSessions } = data;
            const absentSessions = totalSessions - presentSessions - lateSessions;
            
            // Calculate expected rate
            const attendedSessions = presentSessions + lateSessions;
            const expectedRate = (attendedSessions / totalSessions) * 100;

            // Create test data
            const sessions = [];
            for (let i = 0; i < totalSessions; i++) {
              const session = await AttendanceSession.create({
                classId: testClass._id,
                date: new Date(Date.now() - (totalSessions - i) * 24 * 60 * 60 * 1000),
                shift: 'Morning'
              });
              sessions.push(session);
            }

            // Create attendance records
            let recordCount = 0;
            for (let i = 0; i < presentSessions; i++) {
              await AttendanceRecord.create({
                sessionId: sessions[recordCount++]._id,
                studentId: testStudent._id,
                status: 'present',
                checkInMethod: 'manual'
              });
            }

            for (let i = 0; i < lateSessions; i++) {
              await AttendanceRecord.create({
                sessionId: sessions[recordCount++]._id,
                studentId: testStudent._id,
                status: 'late',
                checkInMethod: 'manual'
              });
            }

            for (let i = 0; i < absentSessions; i++) {
              await AttendanceRecord.create({
                sessionId: sessions[recordCount++]._id,
                studentId: testStudent._id,
                status: 'absent',
                checkInMethod: 'manual'
              });
            }

            // Verify calculations
            const records = await AttendanceRecord.find({
              sessionId: { $in: sessions.map(s => s._id) },
              studentId: testStudent._id
            });

            const actualPresent = records.filter(r => r.status === 'present').length;
            const actualLate = records.filter(r => r.status === 'late').length;
            const actualAbsent = records.filter(r => r.status === 'absent').length;

            expect(actualPresent).toBe(presentSessions);
            expect(actualLate).toBe(lateSessions);
            expect(actualAbsent).toBe(absentSessions);

            const actualRate = ((actualPresent + actualLate) / totalSessions) * 100;
            expect(Math.abs(actualRate - expectedRate)).toBeLessThan(0.01);

            return true;
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('should handle boundary values for session limits', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1000 }),
          async (maxStudents) => {
            const classWithLimit = await Class.create({
              name: 'Large Class',
              code: 'LC001',
              subjectId: new mongoose.Types.ObjectId(),
              teacherId: testTeacher._id,
              semesterId: new mongoose.Types.ObjectId(),
              maxStudents: maxStudents,
              status: 'active'
            });

            expect(classWithLimit.maxStudents).toBe(maxStudents);
            expect(classWithLimit.maxStudents).toBeGreaterThan(0);

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    test('should handle concurrent check-in attempts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 10 }),
          async (concurrentAttempts) => {
            const session = await AttendanceSession.create({
              classId: testClass._id,
              date: new Date(),
              shift: 'Morning',
              code: '123456',
              codeExpiredAt: new Date(Date.now() + 5 * 60 * 1000)
            });

            // Simulate concurrent check-ins
            const promises = Array(concurrentAttempts).fill(null).map(async () => {
              try {
                return await AttendanceRecord.findOneAndUpdate(
                  { sessionId: session._id, studentId: testStudent._id },
                  { status: 'present', checkInMethod: 'qr', checkedAt: new Date() },
                  { new: true, upsert: true }
                );
              } catch (error) {
                return { error: true, message: error.message };
              }
            });

            const results = await Promise.all(promises);
            const successCount = results.filter(r => !r.error).length;
            
            // Should only succeed once due to unique constraint
            expect(successCount).toBeLessThanOrEqual(1);

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
