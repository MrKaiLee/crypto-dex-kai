'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleBalanceUpdate = async (userId, currentBalance) => {
    const amountStr = prompt(`Current Balance is $${currentBalance !== undefined ? currentBalance : 0}. Enter new exact balance amount:`);
    if (amountStr === null) return;
    
    const newBalance = parseFloat(amountStr);
    if (isNaN(newBalance)) {
      alert("Please enter a valid number");
      return;
    }

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        balance: newBalance
      });
      alert("Balance updated successfully!");
    } catch (error) {
      console.error("Error updating balance: ", error);
      alert("Failed to update balance");
    }
  };

  return (
    <div className="p-8 text-white min-h-screen bg-slate-950">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard - User Management</h1>

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
            <div key={user.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
              <div>
                <p><strong>Email:</strong> {user.email || 'N/A'}</p>
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Balance:</strong> ${user.balance !== undefined ? user.balance : 0}</p>
              </div>
              <div>
                <button
                  onClick={() => handleBalanceUpdate(user.id, user.balance)}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-bold"
                >
                  Update Balance
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}