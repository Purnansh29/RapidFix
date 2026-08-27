import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SIZES } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { socketService } from '../services/socket';
import { useAuthStore } from '../store/authStore';

interface Message {
  _id: string;
  jobId: string;
  senderId: {
    _id: string;
    name?: string;
  };
  receiverId: string;
  message: string;
  createdAt: string;
}

export default function ChatScreen() {
  const { jobId, receiverId, otherUserName } = useLocalSearchParams<{ jobId: string; receiverId: string; otherUserName: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchChatHistory();
    setupSocket();
    markMessagesAsRead();

    return () => {
      if (socketService.socket) {
        socketService.socket.off('chat:messageReceived');
        socketService.socket.off('chat:typingStatus');
        socketService.socket.emit('chat:stopTyping', { jobId });
      }
    };
  }, []);

  const fetchChatHistory = async () => {
    try {
      const response = await api.get(`/chat/${jobId}`);
      if (response.data?.success) {
        setMessages(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching chat history:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch conversation history');
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await api.put(`/chat/${jobId}/read`);
    } catch (error) {
      console.warn('Failed to mark messages as read:', error);
    }
  };

  const setupSocket = async () => {
    const socket = await socketService.connect();
    if (socket) {
      // Join Room
      socket.emit('chat:joinRoom', { jobId });

      // Receive Messages
      socket.on('chat:messageReceived', (msg: Message) => {
        setMessages((prev) => [...prev, msg]);
        markMessagesAsRead();
        // Scroll to end
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      });

      // Typing indicators
      socket.on('chat:typingStatus', (data: { jobId: string; userId: string; isTyping: boolean }) => {
        if (data.userId !== user?.id) {
          setIsTyping(data.isTyping);
        }
      });
    }
  };

  const handleSend = () => {
    if (!text.trim() || !socketService.socket) return;

    // Send via socket
    socketService.socket.emit('chat:sendMessage', {
      jobId,
      receiverId,
      message: text.trim(),
    });

    // Stop typing immediately on send
    socketService.socket.emit('chat:stopTyping', { jobId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    setText('');
  };

  const handleTextChange = (val: string) => {
    setText(val);
    if (!socketService.socket) return;

    // Emit typing status
    socketService.socket.emit('chat:typing', { jobId });

    // Debounce typing status stop
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketService.socket?.emit('chat:stopTyping', { jobId });
    }, 2000);
  };

  const renderBubble = ({ item }: { item: Message }) => {
    const isMe = item.senderId._id === user?.id;

    return (
      <View style={[styles.bubbleWrapper, isMe ? styles.myBubbleWrapper : styles.theirBubbleWrapper]}>
        <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
            {item.message}
          </Text>
          <Text style={[styles.timeText, isMe ? styles.myTimeText : styles.theirTimeText]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{otherUserName || 'Chat'}</Text>
          <Text style={styles.headerSubtitle}>{isTyping ? 'typing...' : 'Active Job'}</Text>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderBubble}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Keyboard Input Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={text}
            onChangeText={handleTextChange}
            placeholderTextColor={COLORS.textLight}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Ionicons name="send" size={20} color={COLORS.surface} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
    elevation: 2,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  myBubbleWrapper: {
    justifyContent: 'flex-end',
  },
  theirBubbleWrapper: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.5,
  },
  myBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 2,
  },
  theirBubble: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  myMessageText: {
    color: COLORS.surface,
  },
  theirMessageText: {
    color: COLORS.text,
  },
  timeText: {
    fontSize: 9,
    marginTop: 4,
    textAlign: 'right',
  },
  myTimeText: {
    color: 'rgba(255,255,255,0.7)',
  },
  theirTimeText: {
    color: COLORS.textLight,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.text,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textLight,
  },
});
