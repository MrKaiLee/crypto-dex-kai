'use client';

import { useState, useEffect, useRef } from 'react';
import { auth, db } from '../../firebase';
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
import { useRouter } from 'next/navigation';

export default function SupportPage() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const router = useRouter();

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
      (error) => {
        console.error('Error loading support messages: ', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Scroll to the newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !user) return;

    setSending(true);
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

      setText('');
    } catch (error) {
      console.error('Error sending support message: ', error);
      alert('Failed to send message. Please try again.');
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
    <div className="min-h-screen bg-[#121212] text-white p-6 flex flex-col items-center">
      <div className="max-w-md w-full">
        <button
          onClick={() => router.push('/')}
          className="mb-6 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2 cursor-pointer"
        >
          &larr; Back
        </button>

        <div className="bg-[#181a20] p-6 rounded-2xl border border-gray-800 shadow-xl">
          <h1 className="text-xl font-bold mb-4">Customer Support</h1>

          {!authReady && (
            <p className="text-gray-400 text-sm">Loading...</p>
          )}

          {authReady && !user && (
            <p className="text-gray-400 text-sm">
              Please log in to contact our support team.
            </p>
          )}

          {authReady && user && (
            <>
              <p className="text-gray-400 text-sm mb-4">
                Send us a message. Our admin team will reply here.
              </p>

              <div className="h-72 overflow-y-auto bg-[#121212] border border-gray-800 rounded-xl p-3 mb-4 space-y-3">
                {messages.length === 0 && (
                  <p className="text-gray-500 text-sm text-center mt-8">
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
                      className={`max-w-[80%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap break-words ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-100'
                      }`}
                    >
                      {msg.sender === 'admin' && (
                        <div className="text-xs text-blue-300 mb-1">Support Team</div>
                      )}
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <textarea
                  rows="3"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type your issue here..."
                  className="w-full bg-[#121212] border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={sending || !text.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}