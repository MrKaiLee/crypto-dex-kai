'use client';
import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch users from Firebase Firestore
  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users: ", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Update User Balance
  const handleUpdateBalance = async (userId, currentBalance) => {
    const newBalance = prompt("Enter new balance amount:", currentBalance || 0);
    if (newBalance === null) return;

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { balance: Number(newBalance) });
      alert("Balance updated successfully!");
      fetchUsers(); // Refresh data
    } catch (error) {
      console.error("Error updating balance: ", error);
      alert("Failed to update balance.");
    }
  };

  if (loading) {
    return <div className="p-8 text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <p className="mb-6 text-gray-400">Manage registered users and update balances</p>

      <div className="overflow-x-auto bg-gray-800 rounded-lg p-4 shadow-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400">
              <th className="p-3">User (Email / ID)</th>
              <th className="p-3">Balance</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-4 text-center text-gray-500">No registered users found.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-750">
                  <td className="p-3">{user.email || user.id}</td>
                  <td className="p-3 text-green-400 font-semibold">{user.balance || 0} USD</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleUpdateBalance(user.id, user.balance)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm transition"
                    >
                      Update Balance
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}