# Chat Models

This directory contains MongoDB models for the chat feature:

- `Conversation.js` - Conversation model with participants and last message
- `Message.js` - Message model with content, sender, and timestamp

## Schema Overview

### Conversation
- participants: Array of { userId, unreadCount, lastReadAt }
- lastMessage: { content, senderId, timestamp }
- timestamps: createdAt, updatedAt

### Message
- conversationId: Reference to Conversation
- senderId: Reference to User
- content: String (max 1000 chars)
- timestamp: Date
