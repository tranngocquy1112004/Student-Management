import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import './MessageList.css';
import MessageItem from './MessageItem';
import { useMessages } from '../../hooks/useMessages';
import { useChat } from '../../hooks/useChat';
import { List } from 'react-window';

/**
 * Component to display messages in a conversation
 * - Display messages in chronological order (old to new)
 * - Implement infinite scroll (load more on scroll to top)
 * - Auto-scroll to bottom on new message
 * - Show date separators between message groups
 * - Use react-window for virtualization if > 100 messages
 * - Accessible with ARIA labels and live regions
 * 
 * Validates: Requirements 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 10.1, 10.2, 10.3
 * Performance: Virtual scrolling for large lists (Requirement 12.3)
 */
const MessageList = ({ conversationId }) => {
  const { messages, groupedMessages, hasMoreMessages, isOwnMessage, shouldShowSenderInfo, formatMessageTime } = useMessages(conversationId);
  const { loadMoreMessages, loading } = useChat();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const listRef = useRef(null);
  const [prevMessageCount, setPrevMessageCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Memoize formatTime callback (Requirement 12.2, 12.3)
  const formatTime = useCallback((timestamp) => formatMessageTime(timestamp), [formatMessageTime]);

  const scrollToBottom = useCallback(() => {
    if (listRef.current) {
      // For virtual list, scroll to last item
      listRef.current.scrollToItem(messages.length - 1, 'end');
    } else {
      // For regular list
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (messages.length > prevMessageCount && isAtBottom) {
      scrollToBottom();
    }
    setPrevMessageCount(messages.length);
  }, [messages.length, prevMessageCount, isAtBottom, scrollToBottom]);

  // Scroll to bottom initially
  useEffect(() => {
    if (conversationId) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [conversationId, scrollToBottom]);

  const handleScroll = useCallback((e) => {
    const container = e.target;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    // Check if at bottom
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAtBottom(atBottom);

    // Load more messages when scrolled to top
    if (scrollTop === 0 && hasMoreMessages && !loading) {
      const prevScrollHeight = scrollHeight;
      loadMoreMessages().then(() => {
        // Maintain scroll position after loading
        setTimeout(() => {
          if (messagesContainerRef.current) {
            const newScrollHeight = messagesContainerRef.current.scrollHeight;
            messagesContainerRef.current.scrollTop = newScrollHeight - prevScrollHeight;
          }
        }, 100);
      });
    }
  }, [hasMoreMessages, loading, loadMoreMessages]);

  // Use virtualization for large message lists (> 100 messages)
  const useVirtualization = useMemo(() => messages.length > 100, [messages.length]);

  // Memoize Row component for virtual list
  const Row = useCallback(({ index, style }) => (
    <div style={style}>
      <MessageItem
        message={messages[index]}
        isOwn={isOwnMessage(messages[index])}
        showSenderInfo={shouldShowSenderInfo(messages[index], index, messages)}
        formatTime={formatTime}
      />
    </div>
  ), [messages, isOwnMessage, shouldShowSenderInfo, formatTime]);

  if (!conversationId) {
    return (
      <div className="message-list-empty" role="status">
        <p>Chọn một cuộc hội thoại để bắt đầu nhắn tin</p>
      </div>
    );
  }

  if (messages.length === 0 && !loading) {
    return (
      <div className="message-list-empty" role="status">
        <p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
      </div>
    );
  }

  if (useVirtualization) {
    return (
      <div className="message-list" role="log" aria-live="polite" aria-label="Danh sách tin nhắn">
        {loading && hasMoreMessages && (
          <div className="load-more-indicator" role="status" aria-live="polite">
            <div className="loading-spinner-small"></div>
            <span>Đang tải thêm tin nhắn...</span>
          </div>
        )}
        
        <List
          ref={listRef}
          height={600}
          itemCount={messages.length}
          itemSize={100}
          width="100%"
          onScroll={handleScroll}
          overscanCount={5}
        >
          {Row}
        </List>
        
        <div ref={messagesEndRef} />
      </div>
    );
  }

  // Regular rendering for smaller lists
  return (
    <div 
      className="message-list" 
      ref={messagesContainerRef}
      onScroll={handleScroll}
      role="log"
      aria-live="polite"
      aria-label="Danh sách tin nhắn"
    >
      {loading && hasMoreMessages && (
        <div className="load-more-indicator" role="status" aria-live="polite">
          <div className="loading-spinner-small"></div>
          <span>Đang tải thêm tin nhắn...</span>
        </div>
      )}

      {!hasMoreMessages && messages.length > 0 && (
        <div className="no-more-messages" role="status">
          <span>Đã hết tin nhắn</span>
        </div>
      )}

      {Object.entries(groupedMessages).map(([date, msgs]) => (
        <div key={date} className="message-group">
          <div className="date-separator" role="separator" aria-label={`Ngày ${date}`}>
            <span>{date}</span>
          </div>
          
          {msgs.map((message, index) => (
            <MessageItem
              key={message._id}
              message={message}
              isOwn={isOwnMessage(message)}
              showSenderInfo={shouldShowSenderInfo(message, index, msgs)}
              formatTime={formatTime}
            />
          ))}
        </div>
      ))}

      <div ref={messagesEndRef} aria-live="polite" aria-atomic="true" />
    </div>
  );
};

export default MessageList;
