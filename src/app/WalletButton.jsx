'use client';

import { useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    async function saveUserToFirestore() {
      if (isConnected && address) {
        try {
          // Saves the user's wallet address into a Firestore collection named 'users'
          await setDoc(doc(db, "users", address), {
            walletAddress: address,
            lastLogin: serverTimestamp()
          }, { merge: true });
          console.log("User successfully saved to Firestore:", address);
        } catch (error) {
          console.error("Error saving user to Firestore:", error);
        }
      }
    }

    saveUserToFirestore();
  }, [isConnected, address]);

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-green-400 bg-green-950 px-2 py-1 rounded">
          {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : ''}
        </span>
        <button
          onClick={() => disconnect()}
          className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => connect({ connector })}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold text-xs px-3 py-1 rounded"
        >
          Connect Wallet
        </button>
      ))}
    </div>
  );
}