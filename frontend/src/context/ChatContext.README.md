# Chat Context and Hooks - Usage Guide

## Overview

This implementation provides a complete state management solution for the real-time chat feature using React Context API and custom hooks.

## Files Created

1. **frontend/src/context/ChatContext.js** - Main context provider with state
2. **frontend/src/hooks/useChat.js** - Hook for chat actions (load, send, select)
3. **frontend/src/hooks/useConversations.js** - Hook for conversation management
4. **frontend/src/hooks/useMessages.js** - Hook for message management

## Setup

### 1. Wrap your app with ChatProvider

```javascript
// In App.js or index.js
import { ChatProvider } from './context/ChatContext';

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        {/* Your app components */}
      </ChatProvider>
    </AuthProvider>
  );
}
```

### 2. Use the hooks in your components

```javascript
import { useChat } from '../hooks/useChat';
import { useConversations } from '../hooks/useConversations';
import { useMessages } from '../hooks/useMessages';

function ChatComponent() {
  const {
    loadConversations,
    selectConversation,
    sendMessage,
    currentConversation,
    unreadCount
  } = useChat();
  
  const {
    conversations,
    filterConversations,
    isUserOnline
  } = useConversations();
  
  const {
    messages,
    groupedMessages,
    hasMoreMessages,
    isOwnMessage
  } = useMessages(currentConversation?._id);
  
  // Your component logic
}
```

## API Integration

All hooks use the existing axios instance from `frontend/src/api/axios.js` which:
- Automatically adds JWT token to requests
- Handles token refresh on 401 errors
- Base URL: `/api/chat`

## State Structure

### ChatContext State

```javascript
{
  conversations: [],              // Array of conversation objects
  currentConversation: null,      // Currently selected conversation
  messages: {},                   // { conversationId: [messages] }
  onlineUsers: Set,              // Set of online user IDs
  typingUsers: Map,              // Map of typing users by conversation
  unreadCount: 0,                // Total unread messages count
  loading: false,                // Loading state
  error: null,                   // Error message
  messagePagination: {}          // Pagination info per conversation
}
```

## Key Features

### useChat Hook

- `loadConversations(page, limit)` - Load conversations with pagination
- `selectConversation(conversationId)` - Select and load conversation messages
- `sendMessage(content)` - Send a message (optimistic UI update)
- `loadMoreMessages()` - Load older messages with pagination
- `markAsRead(conversationId)` - Mark conversation as read

### useConversations Hook

- `conversations` - Sorted conversations (most recent first)
- `getConversationUnreadCount(id)` - Get unread count for conversation
- `handleConversationUpdate(conv)` - Update conversation (for socket events)
- `handleNewMessage(message)` - Handle new message (for socket events)
- `filterConversations(query)` - Search conversations
- `isUserOnline(userId)` - Check if user is online

### useMessages Hook

- `messages` - Messages for current conversation
- `groupedMessages` - Messages grouped by date
- `hasMoreMessages` - Whether more messages can be loaded
- `handleMessageReceive(message)` - Handle incoming message (for socket events)
- `handleMessageSent(message)` - Handle sent message confirmation (for socket events)
- `isOwnMessage(message)` - Check if message is from current user
- `shouldShowSenderInfo(message, index, msgs)` - UI helper for message grouping
- `formatMessageTime(timestamp)` - Format message time
- `getTypingIndicator()` - Get typing indicator for current conversation

## Socket Integration (Task 11)

The hooks are prepared for socket integration with handler functions:
- `handleConversationUpdate()` - Ready for socket events
- `handleNewMessage()` - Ready for socket events
- `handleMessageReceive()` - Ready for socket events
- `handleMessageSent()` - Ready for socket events

## Error Handling

- All API calls include try-catch blocks
- Errors are stored in context state
- Toast notifications for user-facing errors
- Optimistic UI updates with rollback on error

## Requirements Validated

- **Requirements 2.3, 4.1, 5.3, 6.3** - State structure for conversations, messages, online users, typing
- **Requirements 1.1, 2.1, 3.1, 3.2, 4.2** - Actions for loading, sending, pagination, marking as read
- **Requirements 1.4, 1.5, 1.6** - Conversation list management and sorting
- **Requirements 2.3, 3.1, 3.2** - Message management with pagination

## Next Steps

Task 11 will integrate Socket.io for real-time updates. The current implementation uses REST API calls and is ready for socket enhancement.
