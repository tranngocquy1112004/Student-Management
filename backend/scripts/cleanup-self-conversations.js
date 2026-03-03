import 'dotenv/config';
import mongoose from 'mongoose';
import Conversation from '../src/models/chat/Conversation.js';
import User from '../src/models/User.js';

const cleanup = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/classroom_management');
    
    console.log('Connected to MongoDB');
    console.log('Finding conversations with self...');
    
    // Find all conversations
    const conversations = await Conversation.find({}).populate('participants.userId', '_id name email');
    
    let deletedCount = 0;
    
    for (const conv of conversations) {
      if (conv.participants.length === 2) {
        const user1Id = conv.participants[0].userId._id.toString();
        const user2Id = conv.participants[1].userId._id.toString();
        
        // Check if both participants are the same user
        if (user1Id === user2Id) {
          console.log(`Found self-conversation: ${conv._id}`);
          console.log(`  User: ${conv.participants[0].userId.name} (${conv.participants[0].userId.email})`);
          
          await Conversation.deleteOne({ _id: conv._id });
          deletedCount++;
          console.log(`  ✓ Deleted`);
        }
      }
    }
    
    console.log(`\nCleanup completed!`);
    console.log(`Total conversations deleted: ${deletedCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
};

cleanup();
