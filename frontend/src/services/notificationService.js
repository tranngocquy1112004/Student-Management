/**
 * Browser Notification Service for Chat
 * Handles browser notification permissions and display
 */

class NotificationService {
  constructor() {
    this.permission = 'default';
    this.isSupported = 'Notification' in window;
    this.notificationClickHandlers = new Map();
    
    if (this.isSupported) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Request notification permission from user
   * @returns {Promise<string>} Permission status: 'granted', 'denied', or 'default'
   */
  async requestPermission() {
    if (!this.isSupported) {
      console.warn('Browser notifications are not supported');
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      // Store permission in localStorage
      localStorage.setItem('notification_permission', permission);
      
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Check if notifications are enabled
   * @returns {boolean}
   */
  isEnabled() {
    if (!this.isSupported) return false;
    
    const storedPermission = localStorage.getItem('notification_permission');
    return this.permission === 'granted' || storedPermission === 'granted';
  }

  /**
   * Show a browser notification
   * @param {string} title - Notification title
   * @param {Object} options - Notification options
   * @param {string} options.body - Notification body text
   * @param {string} options.icon - Notification icon URL
   * @param {string} options.tag - Notification tag for grouping
   * @param {any} options.data - Custom data to pass to click handler
   * @param {Function} onClick - Click handler function
   * @returns {Notification|null}
   */
  show(title, options = {}, onClick = null) {
    if (!this.isEnabled()) {
      console.log('Notifications not enabled, skipping');
      return null;
    }

    try {
      const notification = new Notification(title, {
        body: options.body || '',
        icon: options.icon || '/logo192.png',
        tag: options.tag || 'chat-notification',
        badge: options.badge || '/logo192.png',
        requireInteraction: false,
        silent: false,
        data: options.data || {}
      });

      // Store click handler
      if (onClick) {
        const notificationId = `${Date.now()}-${Math.random()}`;
        this.notificationClickHandlers.set(notificationId, onClick);
        notification.data = { ...notification.data, notificationId };
      }

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        const notificationId = event.target.data?.notificationId;
        if (notificationId && this.notificationClickHandlers.has(notificationId)) {
          const handler = this.notificationClickHandlers.get(notificationId);
          handler(event.target.data);
          this.notificationClickHandlers.delete(notificationId);
        }
        
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  /**
   * Show a chat message notification
   * @param {Object} message - Message object
   * @param {string} senderName - Sender's name
   * @param {string} conversationId - Conversation ID
   * @param {Function} onClick - Click handler
   */
  showChatNotification(message, senderName, conversationId, onClick) {
    const title = `Tin nhắn mới từ ${senderName}`;
    const body = message.content.length > 100 
      ? message.content.substring(0, 100) + '...'
      : message.content;

    return this.show(
      title,
      {
        body,
        tag: `chat-${conversationId}`,
        data: {
          type: 'chat',
          conversationId,
          messageId: message._id,
          senderId: message.senderId
        }
      },
      onClick
    );
  }

  /**
   * Check if chat window is currently focused
   * @returns {boolean}
   */
  isChatWindowFocused() {
    return document.hasFocus() && window.location.pathname.includes('/chat');
  }

  /**
   * Clear all notification handlers
   */
  clearHandlers() {
    this.notificationClickHandlers.clear();
  }
}

// Export singleton instance
export default new NotificationService();
