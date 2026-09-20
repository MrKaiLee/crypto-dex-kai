'use client';
import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
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

export default function SupportComponent({ onBack }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [messages, setMessages] = useState([]);
  const [supportMessage, setSupportMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef(null);

  // Track the logged-in user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Listen to this user's chat in realtime
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'supportChats', user.uid, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setMessages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error('Error loading support messages: ', err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Scroll the chat box to the newest message
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    const trimmed = supportMessage.trim();
    if (!trimmed || !user) return;

    setSending(true);
    setError('');
    try {
      const chatRef = doc(db, 'supportChats', user.uid);
      const messageRef = doc(collection(db, 'supportChats', user.uid, 'messages'));

      const batch = writeBatch(db);
      batch.set(
        chatRef,
        {
          userEmail: user.email || '',
          lastMessage: trimmed,
          status: 'open',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      batch.set(messageRef, {
        text: trimmed,
        sender: 'user',
        createdAt: serverTimestamp(),
      });
      await batch.commit();

      setSupportMessage('');
    } catch (err) {
      console.error('Error sending support message: ', err);
      setError('Failed to send message. Please try again.');
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

  return (
    <div className="max-w-md mx-auto bg-[#181a20] p-6 rounded-2xl border border-gray-800 shadow-xl space-y-4 mt-6 text-xs">
      {onBack && (
        <button
          onClick={onBack}
          className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl transition-colors cursor-pointer"
        >
          &larr; Back
        </button>
      )}

      <h1 className="text-xl font-bold text-white">Customer Support</h1>

      {!authReady && <p className="text-gray-400">Loading...</p>}

      {authReady && !user && (
        <p className="text-gray-400">Please log in to contact our support team.</p>
      )}

      {authReady && user && (
        <>
          <p className="text-gray-400">
            Send us a message. Our support team will reply here.
          </p>

          <div
            ref={listRef}
            className="h-64 overflow-y-auto bg-[#121212] border border-gray-800 rounded-xl p-3 space-y-3"
          >
            {messages.length === 0 && (
              <p className="text-gray-500 text-center mt-8">
                No messages yet. Write your first message below.
              </p>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl whitespace-pre-wrap break-words ${
                    msg.sender === 'user'
                      ? 'bg-[#f0b90b] text-black'
                      : 'bg-gray-700 text-gray-100'
                  }`}
                >
                  {msg.sender === 'admin' && (
                    <div className="text-[10px] text-[#f0b90b] mb-1">Support Team</div>
                  )}
                  {msg.text}
                </div>
                <span className="text-[10px] text-gray-500 mt-1">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-600/20 text-red-400 p-3 rounded-xl text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSupportSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-2">Your Message</label>
              <textarea
                rows="3"
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                placeholder="Type your issue or question here..."
                className="w-full bg-[#121212] border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-[#f0b90b]"
              />
            </div>
            <button
              type="submit"
              disabled={sending || !supportMessage.trim()}
              className="w-full bg-[#f0b90b] hover:bg-[#d9a70a] text-black py-3 rounded-xl font-bold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}