import mongoose from 'mongoose';
import Schedule from '../src/models/Schedule.js';
import AttendanceSession from '../src/models/AttendanceSession.js';
import AttendanceRecord from '../src/models/AttendanceRecord.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration script: dayOfWeek-based schedules to date-based schedules
 * 
 * This script:
 * 1. Finds all old schedules with dayOfWeek field
 * 2. Generates specific dates for each dayOfWeek within the date range
 * 3. Creates new date-based schedules with auto-session creation
 * 4. Marks old schedules as migrated
 * 5. Preserves all existing attendance records
 * 6. Maintains referential integrity
 */

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Generate dates for a specific day of week within a date range
 */
function generateDatesForDayOfWeek(dayOfWeek, startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  // Move to first occurrence of dayOfWeek
  while (current.getDay() !== dayOfWeek && current <= end) {
    current.setDate(current.getDate() + 1);
  }
  
  // Generate all dates for this dayOfWeek
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 7); // Next week
  }
  
  return dates;
}

/**
 * Main migration function
 */
async function migrateSchedules() {
  try {
    console.log('🚀 Starting schedule migration...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database\n');
    
    // Find all old schedules with dayOfWeek field
    const oldSchedules = await Schedule.find({
      dayOfWeek: { $exists: true },
      isMigrated: { $ne: true },
      isDeleted: false
    });
    
    console.log(`📊 Found ${oldSchedules.length} schedules to migrate\n`);
    
    if (oldSchedules.length === 0) {
      console.log('✅ No schedules to migrate. Exiting...');
      return;
    }
    
    let totalCreated = 0;
    let totalErrors = 0;
    
    // Process each old schedule
    for (const oldSchedule of oldSchedules) {
      try {
        console.log(`\n📅 Processing schedule ${oldSchedule._id}:`);
        console.log(`   Class: ${oldSchedule.classId}`);
        console.log(`   Day: ${DAYS_OF_WEEK[oldSchedule.dayOfWeek]}`);
        console.log(`   Time: ${oldSchedule.startTime} - ${oldSchedule.endTime}`);
        
        // Generate specific dates
        const dates = generateDatesForDayOfWeek(
          oldSchedule.dayOfWeek,
          oldSchedule.startDate || new Date(),
          oldSchedule.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
        );
        
        console.log(`   Generated ${dates.length} dates`);
        
        // Create new date-based schedules
        for (const date of dates) {
          const session = await mongoose.startSession();
          session.startTransaction();
          
          try {
            // Create schedule
            const newSchedule = await Schedule.create([{
              classId: oldSchedule.classId,
              date: date,
              startTime: oldSchedule.startTime,
              endTime: oldSchedule.endTime,
              room: oldSchedule.room
            }], { session });
            
            // Auto-create attendance session
            await AttendanceSession.create([{
              classId: newSchedule[0].classId,
              scheduleId: newSchedule[0]._id,
              date: newSchedule[0].date,
              startTime: newSchedule[0].startTime,
              endTime: newSchedule[0].endTime
            }], { session });
            
            await session.commitTransaction();
            totalCreated++;
          } catch (error) {
            await session.abortTransaction();
            console.error(`   ❌ Error creating schedule for ${date.toDateString()}:`, error.message);
            totalErrors++;
          } finally {
            session.endSession();
          }
        }
        
        // Mark old schedule as migrated
        oldSchedule.isMigrated = true;
        await oldSchedule.save();
        
        console.log(`   ✅ Migrated successfully`);
      } catch (error) {
        console.error(`   ❌ Error processing schedule ${oldSchedule._id}:`, error.message);
        totalErrors++;
      }
    }
    
    console.log(`\n\n📊 Migration Summary:`);
    console.log(`   Total old schedules: ${oldSchedules.length}`);
    console.log(`   New schedules created: ${totalCreated}`);
    console.log(`   Errors: ${totalErrors}`);
    
    // Verify referential integrity
    console.log(`\n🔍 Verifying referential integrity...`);
    
    const orphanedRecords = await AttendanceRecord.aggregate([
      {
        $lookup: {
          from: 'attendancesessions',
          localField: 'sessionId',
          foreignField: '_id',
          as: 'session'
        }
      },
      {
        $match: { session: { $size: 0 } }
      }
    ]);
    
    if (orphanedRecords.length > 0) {
      console.log(`   ⚠️  Found ${orphanedRecords.length} orphaned attendance records`);
    } else {
      console.log(`   ✅ No orphaned records found`);
    }
    
    console.log(`\n✅ Migration completed successfully!`);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from database');
  }
}

// Run migration
migrateSchedules()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
