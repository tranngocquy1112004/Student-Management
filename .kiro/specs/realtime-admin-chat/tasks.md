# Implementation Plan: Realtime Admin Chat

## Overview

This implementation plan converts the realtime-admin-chat feature design into actionable coding tasks. The feature enables real-time messaging between Admin, Teacher, and Student users with role-based permissions, using Socket.io for real-time communication and MongoDB for message persistence.

## Tasks

- [x] 1. Setup project structure and dependencies
  - Install required packages: socket.io, socket.io-client, fast-check, react-window
  - Create directory structure for backend chat components
  - Create directory structure for frontend chat components
  - Setup test directories for unit, property, and integration tests
  - _Requirements: 12.1, 12.2_

- [x] 2. Implement backend data models
  - [x] 2.1 Create Conversation model
    - Define schema with participants array, lastMessage, timestamps
    - Add validation rules (2 participants, unreadCount >= 0)
    - Create indexes: participants.userId + updatedAt, updatedAt, participants.userId
    - _Requirements: 1.7, 4.5_
  
  - [ ]* 2.2 Write property test for Conversation persistence
    - **Property 3: Conversation Persistence**
    - **Validates: Requirements 1.7**
  
  - [x] 2.3 Create Message model
    - Define schema with conversationId, senderId, content, timestamp
    - Add validation rules (content not empty, max 1000 chars, timestamp validation)
    - Create indexes: conversationId + timestamp, conversationId
    - _Requirements: 2.2, 2.4, 3.4_
  
  - [ ]* 2.4 Write property test for Message persistence
    - **Property 4: Message Persistence**
    - **Validates: Requirements 2.2, 2.4**

- [x] 3. Implement PermissionService
  - [x] 3.1 Create PermissionService class
    - Implement canChat(user1Role, user2Role) method
    - Implement getAvailableUsers(currentUserId, currentUserRole) method
    - Apply permission matrix logic (Admin with all, Teacher with Admin/Student, Student with Admin/Teacher)
    - _Requirements: 1.1, 1.2, 1.3, 9.3, 9.4, 9.5, 9.6_
  
  - [ ]* 3.2 Write property tests for permission matrix
    - **Property 1: Conversation Creation Based on Permissions**
    - **Property 2: User List Filtering by Role**
    - **Property 18: Chat Permission Matrix**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 9.3, 9.4, 9.5, 9.6**
  
  - [ ]* 3.3 Write unit tests for permission edge cases
    - Test Student-Student chat denial
    - Test Teacher-Teacher chat denial
    - Test Admin with all roles
    - _Requirements: 9.6_

- [x] 4. Implement ChatService
  - [x] 4.1 Implement conversation management methods
    - createOrGetConversation(userId1, userId2) with permission validation
    - getConversations(userId, page, limit) with pagination
    - getConversationById(conversationId, userId) with access control
    - _Requirements: 1.1, 1.2, 1.3, 1.7, 3.1_
  
  - [x] 4.2 Implement message management methods
    - sendMessage(conversationId, senderId, content) with validation
    - getMessages(conversationId, page, limit) with 50 message limit
    - markAsRead(conversationId, userId) to reset unread count
    - _Requirements: 2.1, 2.2, 2.5, 3.1, 3.2, 4.2_
  
  - [ ]* 4.3 Write property test for message ordering
    - **Property 5: Message Ordering**
    - **Validates: Requirements 2.5, 3.3**
  
  - [ ]* 4.4 Write property test for pagination limit
    - **Property 6: Message Pagination Limit**
    - **Validates: Requirements 3.1, 3.2**
  
  - [x] 4.5 Implement unread count methods
    - getUnreadCount(userId) to get total unread
    - incrementUnreadCount(conversationId, userId) on new message
    - resetUnreadCount(conversationId, userId) on conversation open
    - _Requirements: 4.1, 4.2, 4.5_
  
  - [ ]* 4.6 Write property test for unread count management
    - **Property 8: Unread Count Management**
    - **Property 9: Unread Count Persistence**
    - **Validates: Requirements 4.1, 4.2, 4.5**
  
  - [ ]* 4.7 Write unit tests for ChatService
    - Test empty message rejection
    - Test message length validation (max 1000 chars)
    - Test conversation not found error
    - _Requirements: 2.2, 3.4_

- [x] 5. Checkpoint - Ensure backend services tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement REST API endpoints
  - [x] 6.1 Create ChatController with endpoint handlers
    - GET /api/chat/conversations - list conversations with pagination
    - POST /api/chat/conversations - create new conversation
    - GET /api/chat/conversations/:id - get conversation details
    - GET /api/chat/conversations/:id/messages - get messages with pagination
    - POST /api/chat/conversations/:id/read - mark as read
    - GET /api/chat/users/search - search users by name/email
    - GET /api/chat/unread-count - get total unread count
    - _Requirements: 1.4, 1.5, 1.6, 3.1, 3.2, 4.1, 8.1, 8.3_
  
  - [x] 6.2 Add JWT authentication middleware to all endpoints
    - Validate JWT token on every request
    - Attach user info to request object
    - _Requirements: 9.1, 9.2_

  - [x] 6.3 Add permission validation middleware
    - Check conversation access permissions
    - Return 403 for unauthorized access
    - _Requirements: 9.7_
  
  - [ ]* 6.4 Write integration tests for REST API
    - Test all endpoints with valid/invalid tokens
    - Test permission denied scenarios
    - Test pagination behavior
    - _Requirements: 9.1, 9.2, 9.7_

- [x] 7. Implement Socket.io server integration
  - [x] 7.1 Setup Socket.io with JWT authentication
    - Create authentication middleware for socket handshake
    - Validate JWT token and attach userId, userRole to socket
    - Reject connections with invalid/missing tokens
    - _Requirements: 9.1, 9.2_
  
  - [ ]* 7.2 Write property test for socket authentication
    - **Property 17: Socket Authentication Validation**
    - **Validates: Requirements 9.1, 9.2**
  
  - [x] 7.3 Implement message socket events
    - Handle 'message:send' event - validate, save, broadcast
    - Emit 'message:receive' to receiver in conversation room
    - Emit 'message:sent' confirmation to sender
    - Emit 'conversation:updated' to both participants
    - _Requirements: 2.1, 2.3, 2.4_
  
  - [ ]* 7.4 Write property test for message data completeness
    - **Property 7: Message Data Completeness**
    - **Validates: Requirements 3.4**
  
  - [x] 7.5 Implement typing indicator events
    - Handle 'typing:start' event with debounce logic
    - Handle 'typing:stop' event
    - Emit typing events only to receiver (not sender)
    - Auto-stop typing after 3 seconds
    - _Requirements: 6.1, 6.2, 6.4, 6.5_
  
  - [ ]* 7.6 Write property tests for typing indicator
    - **Property 11: Typing Indicator Lifecycle**
    - **Property 12: Typing Indicator Routing**
    - **Validates: Requirements 6.1, 6.2, 6.4, 6.5**
  
  - [x] 7.7 Implement online status events
    - Emit 'user:online' on socket connection
    - Emit 'user:offline' on socket disconnection
    - Track online users in Redis or in-memory cache
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 7.8 Write property test for online status updates
    - **Property 10: Online Status Updates**
    - **Validates: Requirements 5.1, 5.2**
  
  - [x] 7.9 Implement conversation room management
    - Handle 'conversation:join' event
    - Handle 'conversation:leave' event
    - Use room-based broadcasting for efficiency
    - _Requirements: 2.1, 2.3_
  
  - [ ]* 7.10 Write integration tests for socket events
    - Test end-to-end message flow between two sockets
    - Test typing indicator flow
    - Test online/offline status updates
    - _Requirements: 2.1, 2.3, 5.1, 5.2, 6.1_

- [x] 8. Implement notification integration
  - [x] 8.1 Integrate with existing Notification System
    - Send notification on new message receive
    - Include sender name and message content
    - Respect user notification preferences
    - _Requirements: 7.1, 7.4, 7.5_
  
  - [ ]* 8.2 Write property tests for notification integration
    - **Property 13: Notification Integration**
    - **Property 14: Notification Preference Respect**
    - **Validates: Requirements 7.1, 7.4, 7.5**

- [x] 9. Checkpoint - Ensure backend integration tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement frontend ChatContext and state management
  - [x] 10.1 Create ChatContext with state
    - Define state: conversations, currentConversation, messages, onlineUsers, typingUsers, unreadCount
    - Create context provider component
    - _Requirements: 2.3, 4.1, 5.3, 6.3_
  
  - [x] 10.2 Create useChat hook
    - Implement loadConversations() action
    - Implement selectConversation(conversationId) action
    - Implement sendMessage(content) action
    - Implement loadMoreMessages() action with pagination
    - Implement markAsRead(conversationId) action
    - _Requirements: 1.1, 2.1, 3.1, 3.2, 4.2_
  
  - [x] 10.3 Create useConversations hook
    - Manage conversation list state
    - Handle conversation updates from socket
    - Sort conversations by updatedAt
    - _Requirements: 1.4, 1.5, 1.6_

  - [x] 10.4 Create useMessages hook
    - Manage messages state per conversation
    - Handle new message from socket
    - Implement infinite scroll pagination
    - _Requirements: 2.3, 3.1, 3.2_

- [x] 11. Implement Socket.io client integration
  - [x] 11.1 Setup Socket.io client with JWT auth
    - Initialize socket with token from localStorage
    - Configure reconnection settings (5 attempts, 1-5s delay)
    - _Requirements: 9.1, 11.1_

  - [x] 11.2 Implement socket event handlers in ChatContext
    - Handle 'message:receive' - update messages state
    - Handle 'message:sent' - confirm message sent
    - Handle 'typing:start' - show typing indicator
    - Handle 'typing:stop' - hide typing indicator
    - Handle 'user:online' - update online users
    - Handle 'user:offline' - update online users
    - Handle 'conversation:updated' - refresh conversation
    - Handle 'error' - show error toast
    - _Requirements: 2.3, 5.3, 5.4, 6.3_
  
  - [x] 11.3 Implement reconnection and retry logic
    - Handle 'connect_error' and 'disconnect' events
    - Show connection status to user
    - Sync unsent messages on reconnect
    - Store unsent messages in localStorage
    - _Requirements: 11.1, 11.2, 11.3, 11.5_
  
  - [ ]* 11.4 Write property tests for reconnection
    - **Property 20: Socket Reconnection Attempt**
    - **Property 21: Unsent Message Sync**
    - **Property 22: Local Message Persistence**
    - **Validates: Requirements 11.1, 11.3, 11.5**

- [x] 12. Implement core chat UI components
  - [x] 12.1 Create ChatLayout component
    - Implement responsive layout (sidebar + chat window)
    - Desktop: 30% sidebar, 70% chat
    - Tablet: 40% sidebar, 60% chat
    - Mobile: Full screen toggle between list and chat
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [x] 12.2 Create ConversationList component
    - Display list of conversations sorted by updatedAt
    - Show last message preview
    - Show unread count badge
    - Show online status indicator
    - Handle conversation selection
    - _Requirements: 1.4, 1.5, 1.6, 4.3, 4.4, 5.3_
  
  - [x] 12.3 Create ConversationItem component
    - Display participant name and avatar
    - Display last message content and timestamp
    - Display unread count badge (red if > 0)
    - Display online status dot
    - _Requirements: 4.3, 4.4, 5.3_
  
  - [x] 12.4 Create MessageList component
    - Display messages in chronological order (old to new)
    - Implement infinite scroll (load more on scroll to top)
    - Auto-scroll to bottom on new message
    - Show date separators between message groups
    - Use react-window for virtualization if > 100 messages
    - _Requirements: 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 12.5 Create MessageItem component
    - Display message content
    - Display sender name and avatar
    - Display timestamp
    - Different styling for sent vs received messages
    - _Requirements: 3.4_
  
  - [x] 12.6 Create MessageInput component
    - Auto-resize textarea
    - Character limit (1000 chars) with counter
    - Enter to send, Shift+Enter for new line
    - Emit typing indicator (debounced 3s)
    - Disable when not connected
    - _Requirements: 2.1, 6.1, 6.2_
  
  - [x] 12.7 Create TypingIndicator component
    - Display "[Name] đang gõ..." when typing event received
    - Auto-hide after 3 seconds
    - _Requirements: 6.3_
  
  - [x] 12.8 Create OnlineStatus component
    - Display green dot for online, gray for offline
    - Update in real-time based on socket events
    - _Requirements: 5.3, 5.4_

- [x] 13. Implement user search functionality
  - [x] 13.1 Create UserSearch component
    - Search input with debounce (300ms)
    - Display search results with name, email, role, avatar
    - Show online status in results
    - Filter results by current user's permissions
    - Handle click to create/open conversation
    - Show "Không tìm thấy người dùng" when no results
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6_
  
  - [ ]* 13.2 Write property tests for user search
    - **Property 15: User Search Filtering**
    - **Property 16: Search Result Data Completeness**
    - **Validates: Requirements 8.1, 8.3, 8.6**
  
  - [ ]* 13.3 Write unit tests for UserSearch component
    - Test debounce behavior
    - Test empty query shows full list
    - Test no results message
    - _Requirements: 8.2, 8.4, 8.5_

- [x] 14. Implement error handling and user feedback
  - [x] 14.1 Add error handling to API calls
    - Implement axios interceptor for error responses
    - Handle 401 (redirect to login)
    - Handle 403 (show permission denied message)
    - Handle 404 (show not found message)
    - Handle 500 (show server error message)
    - _Requirements: 9.7, 11.4_
  
  - [x] 14.2 Add error handling to socket events
    - Handle socket errors with toast notifications
    - Handle connection errors with status indicator
    - Handle disconnect with reconnection UI
    - _Requirements: 11.1, 11.2_
  
  - [x] 14.3 Implement message retry with exponential backoff
    - Retry failed messages up to 3 times
    - Save to localStorage if all retries fail
    - Show retry status in UI
    - _Requirements: 11.3, 11.5_
  
  - [ ]* 14.4 Write unit tests for error handling
    - Test all error scenarios
    - Test retry logic
    - Test localStorage persistence
    - _Requirements: 11.1, 11.3, 11.5_

- [x] 15. Implement notification integration on frontend
  - [x] 15.1 Handle notification click to open chat
    - Listen for notification click events
    - Open Chat page and select conversation
    - Mark conversation as read
    - _Requirements: 7.3_
  
  - [x] 15.2 Show browser notifications when chat not open
    - Request notification permission
    - Show notification with sender name and message preview
    - Only show if user has notifications enabled
    - _Requirements: 7.2, 7.4, 7.5_

- [x] 16. Checkpoint - Ensure frontend components render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Implement performance optimizations
  - [x] 17.1 Add memoization to components
    - Memoize MessageItem, ConversationItem components
    - Memoize expensive computations (timestamp formatting)
    - Memoize callbacks with useCallback
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [x] 17.2 Implement virtual scrolling for large message lists
    - Use react-window for MessageList when > 100 messages
    - Configure proper item sizing
    - _Requirements: 12.3_
  
  - [x] 17.3 Add database query optimizations
    - Use .lean() for read-only queries
    - Use projection to select only needed fields
    - Verify all indexes are created
    - _Requirements: 12.3, 12.5_
  
  - [x] 17.4 Implement caching strategy
    - Cache online users in Redis
    - Cache unread count with 5-minute TTL
    - Use in-memory cache for typing indicators
    - _Requirements: 12.1, 12.2_

- [x] 18. Implement accessibility features
  - [x] 18.1 Add keyboard navigation
    - Tab through conversations
    - Arrow keys to navigate messages
    - Enter to select conversation
    - Escape to close chat
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [x] 18.2 Add ARIA labels and roles
    - Label all interactive elements
    - Use proper semantic HTML
    - Add role="log" to message list
    - Add aria-live for new messages
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [x] 18.3 Ensure color contrast and focus indicators
    - Verify contrast ratio >= 4.5:1
    - Add visible focus indicators
    - Test with screen reader
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 19. Write remaining property-based tests
  - [ ]* 19.1 Write property test for unauthorized access
    - **Property 19: Unauthorized Access Error**
    - **Validates: Requirements 9.7**
  
  - [ ]* 19.2 Run all property tests with 100 iterations
    - Verify all 22 properties pass
    - Fix any failing tests
    - Document any edge cases found

- [x] 20. Integration and final wiring
  - [x] 20.1 Create main Chat page component
    - Wire ChatContext provider
    - Render ChatLayout with all child components
    - Add route to App.js
    - _Requirements: All_
  
  - [x] 20.2 Add chat link to navigation
    - Add chat icon to main navigation
    - Show unread count badge on icon
    - _Requirements: 4.3, 4.4_
  
  - [x] 20.3 Test end-to-end user flows
    - Admin creates conversation with Student
    - Teacher sends message to Admin
    - Student searches and chats with Teacher
    - Verify all permissions work correctly
    - _Requirements: 1.1, 1.2, 1.3, 8.1, 9.3, 9.4, 9.5, 9.6_
  
  - [ ]* 20.4 Write E2E tests for critical user journeys
    - Test complete message flow
    - Test permission scenarios
    - Test reconnection scenarios
    - _Requirements: All_

- [ ] 21. Final checkpoint - Ensure all tests pass and feature is complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with 100 iterations each
- Unit tests validate specific examples and edge cases
- Integration tests validate component interactions
- Checkpoints ensure incremental validation at key milestones
- All 22 correctness properties from the design document are covered in property test tasks
- Implementation follows MERN stack with Socket.io for real-time communication
- Testing uses Jest for unit/integration tests and fast-check for property-based tests
