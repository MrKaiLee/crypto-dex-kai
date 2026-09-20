'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';

// UI guard only. The real protection is the Firestore security rules.
const ADMIN_EMAIL = 'maximsupport0@gmail.com';

export default function AdminSupportPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [chats, setChats] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef(null);

  const isAdmin = !!user && user.email === ADMIN_EMAIL;

  // Track the logged-in user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Listen to all support chats, newest activity first
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'supportChats'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setChats(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error('Error loading chats: ', err);
        setError('Could not load chats. Check the Firestore rules.');
      }
    );
    return () => unsubscribe();
  }, [isAdmin]);

  // Listen to the messages of the selected chat
  useEffect(() => {
    if (!isAdmin || !selectedId) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'supportChats', selectedId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setMessages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error('Error loading messages: ', err);
        setError('Could not load messages. Check the Firestore rules.');
      }
    );
    return () => unsubscribe();
  }, [isAdmin, selectedId]);

  // Scroll to the newest message
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleReply = async (e) => {
    if (e) e.preventDefault();
    const trimmed = reply.trim();
    if (!trimmed || !selectedId || !isAdmin) return;

    setSending(true);
    setError('');
    try {
      const chatRef = doc(db, 'supportChats', selectedId);
      const messageRef = doc(collection(db, 'supportChats', selectedId, 'messages'));

      const batch = writeBatch(db);
      batch.set(
        chatRef,
        {
          lastMessage: trimmed,
          status: 'answered',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      batch.set(messageRef, {
        text: trimmed,
        sender: 'admin',
        createdAt: serverTimestamp(),
      });
      await batch.commit();

      setReply('');
    } catch (err) {
      console.error('Error sending reply: ', err);
      setError('Failed to send the reply. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return '';
    return timestamp.toDate().toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const selectedChat = chats.find((c) => c.id === selectedId);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#121212] text-gray-400 p-6 text-sm">Loading...</div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#121212] text-white p-6 text-sm">
        <p className="text-gray-400 mb-4">Access denied. Please log in with the admin account.</p>
        <button
          onClick={() => router.push('/')}
          className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl cursor-pointer"
        >
          &larr; Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4 text-sm">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.push('/admin')}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            &larr; Back
          </button>
          <h1 className="text-xl font-bold">Support Inbox</h1>
        </div>

        {error && (
          <div className="bg-red-600/20 text-red-400 p-3 rounded-xl mb-4">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Chat list */}
          <div className="md:col-span-1 bg-[#181a20] border border-gray-800 rounded-2xl p-3 h-[70vh] overflow-y-auto space-y-2">
            {chats.length === 0 && (
              <p className="text-gray-500 text-center mt-8">No support chats yet.</p>
            )}

            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedId(chat.id)}
                className={`w-full text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                  selectedId === chat.id
                    ? 'border-[#f0b90b] bg-[#121212]'
                    : 'border-gray-800 hover:border-gray-600 bg-[#121212]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold truncate">{chat.userEmail || chat.id}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${
                      chat.status === 'open'
                        ? 'bg-[#f0b90b]/20 text-[#f0b90b]'
                        : 'bg-green-600/20 text-green-400'
                    }`}
                  >
                    {chat.status === 'open' ? 'Needs reply' : 'Answered'}
                  </span>
                </div>
                <p className="text-gray-400 truncate mt-1">{chat.lastMessage}</p>
                <p className="text-[10px] text-gray-500 mt-1">{formatTime(chat.updatedAt)}</p>
              </button>
            ))}
          </div>

          {/* Conversation */}
          <div className="md:col-span-2 bg-[#181a20] border border-gray-800 rounded-2xl p-4 h-[70vh] flex flex-col">
            {!selectedChat && (
              <p className="text-gray-500 text-center mt-16">
                Select a chat on the left to read and reply.
              </p>
            )}

            {selectedChat && (
              <>
                <div className="pb-3 mb-3 border-b border-gray-800">
                  <div className="font-bold">{selectedChat.userEmail || selectedChat.id}</div>
                  <div className="text-[10px] text-gray-500 break-all">
                    User ID: {selectedChat.id}
                  </div>
                </div>

                <div
                  ref={listRef}
                  className="flex-1 overflow-y-auto bg-[#121212] border border-gray-800 rounded-xl p-3 space-y-3"
                >
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.sender === 'admin' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-xl whitespace-pre-wrap break-words ${
                          msg.sender === 'admin'
                            ? 'bg-[#f0b90b] text-black'
                            : 'bg-gray-700 text-gray-100'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-gray-500 mt-1">
                        {msg.sender === 'admin' ? 'You' : 'User'} · {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleReply} className="mt-3 space-y-2">
                  <textarea
                    rows="3"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleReply();
                      }
                    }}
                    placeholder="Type your reply... (Enter to send, Shift+Enter for a new line)"
                    className="w-full bg-[#121212] border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-[#f0b90b]"
                  />
                  <button
                    type="submit"
                    disabled={sending || !reply.trim()}
                    className="w-full bg-[#f0b90b] hover:bg-[#d9a70a] text-black py-3 rounded-xl font-bold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {sending ? 'Sending...' : 'Send Reply'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}