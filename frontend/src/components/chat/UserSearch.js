import React, { useState, useEffect, useCallback } from 'react';
import './UserSearch.css';
import OnlineStatus from './OnlineStatus';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../hooks/useChat';
import { useConversations } from '../../hooks/useConversations';
import { toast } from 'react-toastify';

/**
 * Component to search for users to chat with
 * - Search input with debounce (300ms)
 * - Display search results with name, email, role, avatar
 * - Show online status in results
 * - Filter results by current user's permissions
 * - Handle click to create/open conversation
 * - Show "Không tìm thấy người dùng" when no results
 * - Keyboard accessible with ARIA labels
 * 
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.6, 10.1, 10.2, 10.3
 */
const UserSearch = ({ onUserSelect, onClose }) => {
  const { user } = useAuth();
  const { selectConversation, loadConversations } = useChat();
  const { conversations } = useConversations();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounced search function
  const searchUsers = useCallback(async (query) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/chat/users/search', {
        params: { q: query, limit: 20 }
      });
      
      if (response.data.success) {
        setSearchResults(response.data.data.users);
      }
    } catch (err) {
      console.error('Error searching users:', err);
      setError(err.response?.data?.error?.message || 'Không thể tìm kiếm người dùng');
      toast.error('Không thể tìm kiếm người dùng');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  // Handle user click - create or open conversation
  const handleUserClick = async (selectedUser) => {
    try {
      setLoading(true);
      
      // Check if conversation already exists
      const existingConv = conversations.find(conv => 
        conv.participants.some(p => p.userId._id === selectedUser._id)
      );
      
      if (existingConv) {
        // Open existing conversation
        await selectConversation(existingConv._id);
      } else {
        // Create new conversation
        const response = await api.post('/chat/conversations', {
          participantId: selectedUser._id
        });
        
        if (response.data.success) {
          const newConversation = response.data.data.conversation;
          
          // Reload conversations to include the new one
          await loadConversations();
          
          // Select the new conversation
          await selectConversation(newConversation._id);
          
          toast.success(`Đã tạo cuộc hội thoại với ${selectedUser.name}`);
        }
      }
      
      // Call onUserSelect callback if provided
      if (onUserSelect) {
        onUserSelect(selectedUser);
      }
      
      // Close search modal if onClose provided
      if (onClose) {
        onClose();
      }
      
    } catch (err) {
      console.error('Error creating/opening conversation:', err);
      const errorMsg = err.response?.data?.error?.message || 'Không thể tạo cuộc hội thoại';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Get role display text in Vietnamese
  const getRoleDisplay = (role) => {
    const roleMap = {
      admin: 'Quản trị viên',
      teacher: 'Giáo viên',
      student: 'Học sinh'
    };
    return roleMap[role?.toLowerCase()] || role;
  };

  // Get role badge color
  const getRoleBadgeClass = (role) => {
    const roleClass = {
      admin: 'role-badge-admin',
      teacher: 'role-badge-teacher',
      student: 'role-badge-student'
    };
    return roleClass[role?.toLowerCase()] || '';
  };

  return (
    <div className="user-search" role="dialog" aria-labelledby="user-search-title">
      <div className="user-search-header">
        <h3 id="user-search-title">Tìm kiếm người dùng</h3>
        {onClose && (
          <button 
            className="close-button" 
            onClick={onClose} 
            aria-label="Đóng tìm kiếm"
          >
            ×
          </button>
        )}
      </div>

      <div className="user-search-input-wrapper">
        <input
          type="text"
          className="user-search-input"
          placeholder="Tìm theo tên hoặc email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
          aria-label="Tìm kiếm người dùng theo tên hoặc email"
          aria-describedby="search-status"
        />
        {loading && (
          <div className="search-loading-spinner" role="status" aria-label="Đang tìm kiếm"></div>
        )}
      </div>

      <div className="user-search-results" role="region" aria-live="polite">
        {error ? (
          <div className="search-error" role="alert">
            <p>{error}</p>
          </div>
        ) : loading && searchResults.length === 0 ? (
          <div className="search-loading" role="status" id="search-status">
            <div className="loading-spinner"></div>
            <p>Đang tìm kiếm...</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="search-empty" role="status" id="search-status">
            <p>Không tìm thấy người dùng</p>
          </div>
        ) : (
          <div className="search-results-list" role="list" aria-label="Kết quả tìm kiếm">
            {searchResults.map((searchUser) => (
              <div
                key={searchUser._id}
                className="search-result-item"
                onClick={() => handleUserClick(searchUser)}
                role="listitem"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleUserClick(searchUser);
                  }
                }}
                aria-label={`${searchUser.name}, ${searchUser.email}, ${getRoleDisplay(searchUser.role)}`}
              >
                <div className="search-result-avatar">
                  {searchUser.avatar && searchUser.avatar.trim() !== '' ? (
                    <>
                      <img 
                        src={`http://localhost:5000${searchUser.avatar.startsWith('/') ? '' : '/'}${searchUser.avatar}`}
                        alt={`Ảnh đại diện của ${searchUser.name}`}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextElementSibling) {
                            e.target.nextElementSibling.style.display = 'flex';
                          }
                        }}
                      />
                      <div className="avatar-placeholder" style={{ display: 'none' }} aria-hidden="true">
                        {searchUser.name?.charAt(0).toUpperCase()}
                      </div>
                    </>
                  ) : (
                    <div className="avatar-placeholder" aria-hidden="true">
                      {searchUser.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <OnlineStatus userId={searchUser._id} />
                </div>

                <div className="search-result-info">
                  <div className="search-result-name">
                    {searchUser.name}
                  </div>
                  <div className="search-result-email">
                    {searchUser.email}
                  </div>
                </div>

                <div className="search-result-role">
                  <span className={`role-badge ${getRoleBadgeClass(searchUser.role)}`}>
                    {getRoleDisplay(searchUser.role)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSearch;
