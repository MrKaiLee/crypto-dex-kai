'use client';
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';
export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const [activeTab, setActiveTab] = useState('home');
  const [modalType, setModalType] = useState(null); 
  const [searchQuery, setSearchQuery] = useState('');

  const [tradeAmount, setTradeAmount] = useState('');
  const [orderType, setOrderType] = useState('limit'); 
  const [tradePrice, setTradePrice] = useState('');

  const [leverage, setLeverage] = useState(20);
  const [futuresMarginMode, setFuturesMarginMode] = useState('Cross');

  const [spotBalance, setSpotBalance] = useState(0.00);
  const [futuresBalance, setFuturesBalance] = useState(0.00);
  
  const [userCryptoHoldings, setUserCryptoHoldings] = useState({
    BTC: 0,
    ETH: 0,
    SOL: 0,
    USDT: 0,
    XRP: 0,
    BNB: 0,
    ADA: 0,
    DOGE: 0
  });

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [copiedAddress, setCopiedAddress] = useState(false);

  const [convertFromCoin, setConvertFromCoin] = useState('USDT');
  const [convertToCoin, setConvertToCoin] = useState('BTC');
  const [convertAmount, setConvertAmount] = useState('');

  const [p2pType, setP2pType] = useState('buy');

  const [payRecipient, setPayRecipient] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payCoin, setPayCoin] = useState('USDT');

  const [swapFromCoin, setSwapFromCoin] = useState('USDT');
  const [swapToCoin, setSwapToCoin] = useState('ETH');
  const [swapAmount, setSwapAmount] = useState('');

  // Live Crypto List State
  const [cryptoList, setCryptoList] = useState([
    { name: 'Bitcoin', symbol: 'BTC', id: 'bitcoin', network: 'Bitcoin Network', depositAddress: 'bc1qkapq8t7zy6hwd3c8yvk3cdp57xvh6zr6vfu64g', price: '91,450.00', change: '+2.45%', rawPrice: 91450.00 },
    { name: 'Ethereum', symbol: 'ETH', id: 'ethereum', network: 'Ethereum (ERC20)', depositAddress: '0xC20E4F09165C3480eb1847200f2cC8CED5b7ebBd', price: '3,420.15', change: '+3.80%', rawPrice: 3420.15 },
    { name: 'Solana', symbol: 'SOL', id: 'solana', network: 'Solana Network', depositAddress: 'So11111111111111111111111111111111111111112', price: '192.80', change: '+7.12%', rawPrice: 192.80 },
    { name: 'Binance Coin', symbol: 'BNB', id: 'binancecoin', network: 'BNB Smart Chain (BEP20)', depositAddress: '0x324415b858e46955a1d7f4955b9a5444b025b44d', price: '645.40', change: '+1.25%', rawPrice: 645.40 },
    { name: 'USDT', symbol: 'USDT', id: 'tether', network: 'Tron (TRC20)', depositAddress: 'TEJgNhwBSnhXYc8vstmNnbnPKigVoa6GfF', price: '1.00', change: '+0.01%', rawPrice: 1.00 },
    { name: 'Ripple', symbol: 'XRP', id: 'ripple', network: 'Ripple Network', depositAddress: 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh', price: '1.45', change: '+4.10%', rawPrice: 1.45 },
    { name: 'Cardano', symbol: 'ADA', id: 'cardano', network: 'Cardano Network', depositAddress: 'addr1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp', price: '0.78', change: '-1.20%', rawPrice: 0.78 },
    { name: 'Dogecoin', symbol: 'DOGE', id: 'dogecoin', network: 'Dogecoin Network', depositAddress: 'D9WJ7xGj9s82jsh773hhzZss83u91jjkL', price: '0.24', change: '+8.45%', rawPrice: 0.24 }
  ]);

  const [selectedMarketCoin, setSelectedMarketCoin] = useState(cryptoList[0]);
  const [selectedWithdrawCoin, setSelectedWithdrawCoin] = useState(cryptoList[0]);
  const [tradeTabMode, setTradeTabMode] = useState('spot'); // 'spot' or 'futures'

  // Monitor Firebase Authentication State and Real-time Balance
  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        setAuthEmail(user.email);
        
        // Real-time listener for user balance from Firestore
        const userRef = doc(db, 'users', user.uid);
        unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setSpotBalance(data.balance || 0);
          }
        });
      } else {
        setIsLoggedIn(false);
        setAuthEmail('');
        setSpotBalance(0);
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  // Fetch Live Crypto Prices from CoinGecko API
  useEffect(() => {
    const fetchLivePrices = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,solana,cardano&vs_currencies=usd&include_24hr_change=true');
        const data = await response.json();

        setCryptoList(prevList => 
          prevList.map(coin => {
            if (data[coin.id]) {
              const newRawPrice = data[coin.id].usd;
              const rawChange = data[coin.id].usd_24h_change || 0;
              return {
                ...coin,
                rawPrice: newRawPrice,
                price: newRawPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                change: (rawChange >= 0 ? '+' : '') + rawChange.toFixed(2) + '%'
              };
            }
            return coin;
          })
        );
      } catch (error) {
        console.error('Failed to fetch live prices:', error);
      }
    };

    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 15000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updated = cryptoList.find(c => c.symbol === selectedMarketCoin.symbol);
    if (updated) setSelectedMarketCoin(updated);
  }, [cryptoList]);

  // Firebase Authentication Handler (Sign Up & Sign In)
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!authEmail || !authPassword) {
      setAuthError('Please enter both email and password.');
      return;
    }

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        const user = userCredential.user;

        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          balance: 0,
          createdAt: new Date()
        });

        setAuthSuccess('Successfully registered! Please sign in.');
        setAuthPassword('');
        setIsSignUp(false);
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        setAuthSuccess('Successfully signed in!');
      }
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleCopy = (address) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleDepositSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid deposit amount.');
      return;
    }

    const fiatValue = amount * selectedMarketCoin.rawPrice;
    setSpotBalance((prev) => prev + fiatValue);
    
    setUserCryptoHoldings((prev) => ({
      ...prev,
      [selectedMarketCoin.symbol]: (prev[selectedMarketCoin.symbol] || 0) + amount
    }));

    alert(`Successfully deposited ${amount} ${selectedMarketCoin.symbol}! ($${fiatValue.toFixed(2)})`);
    setDepositAmount('');
    setModalType(null);
  };

  const handleWithdrawSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (!withdrawAddress) {
      alert('Please enter a valid withdrawal address.');
      return;
    }
    if (!amount || amount <= 0) {
      alert('Please enter a valid withdrawal amount.');
      return;
    }

    const currentCoinHolding = userCryptoHoldings[selectedWithdrawCoin.symbol] || 0;
    if (currentCoinHolding < amount) {
      alert(`Insufficient ${selectedWithdrawCoin.symbol} balance.`);
      return;
    }

    const fiatDeduction = amount * selectedWithdrawCoin.rawPrice;
    
    setUserCryptoHoldings((prev) => ({
      ...prev,
      [selectedWithdrawCoin.symbol]: prev[selectedWithdrawCoin.symbol] - amount
    }));
    setSpotBalance((prev) => Math.max(0, prev - fiatDeduction));

    alert(`Withdrawal of ${amount} ${selectedWithdrawCoin.symbol} submitted successfully!`);
    setWithdrawAddress('');
    setWithdrawAmount('');
    setModalType(null);
  };

  const handleConvertSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(convertAmount);
    if (!amt || amt <= 0) {
      alert('Enter a valid amount to convert');
      return;
    }

    const fromCoinObj = cryptoList.find(c => c.symbol === convertFromCoin);
    const toCoinObj = cryptoList.find(c => c.symbol === convertToCoin);

    const availableFrom = userCryptoHoldings[convertFromCoin] || 0;
    if (availableFrom < amt) {
      alert(`Insufficient ${convertFromCoin} balance for conversion.`);
      return;
    }

    const totalUsdValue = amt * fromCoinObj.rawPrice;
    const receivedToAmount = totalUsdValue / toCoinObj.rawPrice;

    setUserCryptoHoldings(prev => ({
      ...prev,
      [convertFromCoin]: prev[convertFromCoin] - amt,
      [convertToCoin]: (prev[convertToCoin] || 0) + receivedToAmount
    }));

    alert(`Successfully converted ${amt} ${convertFromCoin} to ${receivedToAmount.toFixed(4)} ${convertToCoin}!`);
    setConvertAmount('');
    setModalType(null);
  };

  const handleSwapSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(swapAmount);
    if (!amt || amt <= 0) {
      alert('Enter a valid swap amount');
      return;
    }

    const fromCoinObj = cryptoList.find(c => c.symbol === swapFromCoin);
    const toCoinObj = cryptoList.find(c => c.symbol === swapToCoin);

    const availableFrom = userCryptoHoldings[swapFromCoin] || 0;
    if (availableFrom < amt) {
      alert(`Insufficient ${swapFromCoin} balance for swap.`);
      return;
    }

    const totalUsdValue = amt * fromCoinObj.rawPrice;
    const receivedToAmount = totalUsdValue / toCoinObj.rawPrice;

    setUserCryptoHoldings(prev => ({
      ...prev,
      [swapFromCoin]: prev[swapFromCoin] - amt,
      [swapToCoin]: (prev[swapToCoin] || 0) + receivedToAmount
    }));

    alert(`Successfully swapped ${amt} ${swapFromCoin} for ${receivedToAmount.toFixed(4)} ${swapToCoin}!`);
    setSwapAmount('');
    setModalType(null);
  };

  const handlePaySubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(payAmount);
    if (!payRecipient || !amt || amt <= 0) {
      alert('Please enter a valid recipient and amount.');
      return;
    }

    const available = userCryptoHoldings[payCoin] || 0;
    if (available < amt) {
      alert(`Insufficient ${payCoin} balance for payment.`);
      return;
    }

    const coinObj = cryptoList.find(c => c.symbol === payCoin);
    const fiatVal = amt * coinObj.rawPrice;

    setUserCryptoHoldings(prev => ({
      ...prev,
      [payCoin]: prev[payCoin] - amt
    }));
    setSpotBalance(prev => Math.max(0, prev - fiatVal));

    alert(`Successfully sent ${amt} ${payCoin} to ${payRecipient}!`);
    setPayRecipient('');
    setPayAmount('');
    setModalType(null);
  };

  const filteredCryptos = cryptoList.filter(coin => 
    coin.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isLoggedIn) {
    return (
      <div className="bg-[#181a20] text-gray-200 min-h-screen flex items-center justify-center p-4 font-sans text-xs">
        <div className="bg-[#2b313a]/30 border border-[#2b313a] p-6 rounded-2xl w-full max-w-md space-y-4 shadow-xl">
          <div className="flex items-center space-x-2 justify-center mb-2">
            <div className="w-9 h-9 rounded-full bg-[#f0b90b] flex items-center justify-center text-black font-bold text-sm">C</div>
            <span className="font-bold text-xl text-white tracking-wide">CryptoDEX</span>
          </div>

          <h2 className="text-sm font-bold text-center text-gray-200">{isSignUp ? 'Create a CryptoDEX Account' : 'Sign In to CryptoDEX'}</h2>
          
          {authError && <div className="bg-red-500/20 text-red-400 p-2.5 rounded text-center font-medium">{authError}</div>}
          {authSuccess && <div className="bg-[#0ecb81]/20 text-[#0ecb81] p-2.5 rounded text-center font-medium">{authSuccess}</div>}

          <form onSubmit={handleAuthSubmit} className="space-y-3">
            <div>
              <label className="text-gray-400 block mb-1">Email Address</label>
              <input 
                type="email" 
                value={authEmail} 
                onChange={(e) => setAuthEmail(e.target.value)} 
                required 
                className="w-full bg-[#181a20] border border-gray-700 p-2.5 rounded text-white outline-none focus:border-[#f0b90b]"
                placeholder="name@example.com"
              />
            </div>

            <div className="relative">
              <label className="text-gray-400 block mb-1">Password</label>
              <div className="flex items-center">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={authPassword} 
                  onChange={(e) => setAuthPassword(e.target.value)} 
                  required 
                  className="w-full bg-[#181a20] border border-gray-700 p-2.5 rounded text-white outline-none focus:border-[#f0b90b]"
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 bg-none border-none cursor-pointer text-base"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" className="w-full bg-[#f0b90b] hover:bg-[#d9a70a] text-black font-bold p-2.5 rounded transition cursor-pointer mt-2">
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-3">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <span 
              onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); setAuthSuccess(''); }} 
              className="text-[#f0b90b] cursor-pointer font-bold hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#181a20] text-gray-200 min-h-screen pb-28 selection:bg-[#f0b90b] selection:text-black font-sans relative text-xs">
      
      <div className="bg-[#181a20] border-b border-[#2b313a] px-4 py-3 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-[#f0b90b] flex items-center justify-center text-black font-bold text-sm">C</div>
          <span className="font-bold text-white text-base tracking-wide">CryptoDEX</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-gray-400 text-xs hidden sm:inline">{authEmail}</span>
          <button 
            onClick={handleSignOut} 
            className="bg-red-500/20 text-red-400 px-3 py-1 rounded text-xs font-semibold hover:bg-red-500/30 cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="p-4 max-w-6xl mx-auto space-y-4">
        
        {activeTab === 'home' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-[#2b313a]/50 to-[#1e2329] border border-[#2b313a] p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="space-y-2 text-center md:text-left">
                <h1 className="text-xl font-bold text-white">CryptoDEX Exchange</h1>
                <p className="text-gray-400">Buy, trade, and earn cryptocurrency with professional live tools.</p>
                <div className="text-sm font-semibold text-[#f0b90b] pt-1">Total Spot Balance: ${spotBalance.toFixed(2)} | Futures Balance: ${futuresBalance.toFixed(2)}</div>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                <button onClick={() => setActiveTab('asset')} className="bg-[#f0b90b] hover:bg-[#d9a70a] text-black font-bold px-4 py-2 rounded-xl cursor-pointer">
                  Deposit / Withdraw
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div onClick={() => setModalType('convert')} className="bg-[#2b313a]/30 hover:bg-[#2b313a] border border-[#2b313a] p-3 rounded-xl flex flex-col items-center justify-center cursor-pointer transition text-center">
                <span className="text-xl mb-1">🔄</span>
                <span className="font-bold text-white">Convert</span>
              </div>
              <div onClick={() => setModalType('p2p')} className="bg-[#2b313a]/30 hover:bg-[#2b313a] border border-[#2b313a] p-3 rounded-xl flex flex-col items-center justify-center cursor-pointer transition text-center">
                <span className="text-xl mb-1">👥</span>
                <span className="font-bold text-white">P2P</span>
              </div>
              <div onClick={() => setModalType('pay')} className="bg-[#2b313a]/30 hover:bg-[#2b313a] border border-[#2b313a] p-3 rounded-xl flex flex-col items-center justify-center cursor-pointer transition text-center">
                <span className="text-xl mb-1">💸</span>
                <span className="font-bold text-white">Pay</span>
              </div>
              <div onClick={() => setModalType('swap')} className="bg-[#2b313a]/30 hover:bg-[#2b313a] border border-[#2b313a] p-3 rounded-xl flex flex-col items-center justify-center cursor-pointer transition text-center">
                <span className="text-xl mb-1">💱</span>
                <span className="font-bold text-white">Swap</span>
              </div>
            </div>

            <div className="bg-[#2b313a]/20 border border-[#2b313a] rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-white text-sm">Market Trend & Live Prices</h3>
                <button onClick={() => setActiveTab('market')} className="text-[#f0b90b] hover:underline font-semibold cursor-pointer">View All →</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {cryptoList.slice(0, 3).map((coin) => (
                  <div key={coin.symbol} onClick={() => { setSelectedMarketCoin(coin); setActiveTab('market'); }} className="bg-[#181a20] border border-gray-800 p-4 rounded-xl cursor-pointer hover:border-[#f0b90b] transition">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-white text-sm">{coin.name} ({coin.symbol})</span>
                      <span className={coin.change.startsWith('+') ? 'text-[#0ecb81]' : 'text-red-400'}>{coin.change}</span>
                    </div>
                    <div className="text-lg font-bold text-white">${coin.price}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'market' && (
          <div className="space-y-4">
            <div className="bg-[#2b313a]/20 border border-[#2b313a] p-4 rounded-2xl space-y-3">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h2 className="font-bold text-white text-base">Cryptocurrency Markets</h2>
                <input 
                  type="text" 
                  placeholder="Search coin..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#181a20] border border-gray-700 p-2 rounded text-white outline-none focus:border-[#f0b90b] text-xs w-48"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {filteredCryptos.map(coin => (
                  <button 
                    key={coin.symbol}
                    onClick={() => setSelectedMarketCoin(coin)}
                    className={`px-4 py-2 rounded-xl font-bold flex items-center space-x-2 shrink-0 cursor-pointer transition ${selectedMarketCoin.symbol === coin.symbol ? 'bg-[#f0b90b] text-black' : 'bg-[#181a20] border border-gray-800 text-gray-300 hover:border-[#f0b90b]'}`}
                  >
                    <span>{coin.name}</span>
                    <span className="text-[10px] opacity-80">({coin.symbol})</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-[#2b313a]/20 border border-[#2b313a] p-4 rounded-xl space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-white text-base">{selectedMarketCoin.name} ({selectedMarketCoin.symbol}) Live Data</h3>
                    <div className="text-[10px] text-gray-400">{selectedMarketCoin.network}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-[#0ecb81]">${selectedMarketCoin.price}</div>
                    <div className={selectedMarketCoin.change.startsWith('+') ? 'text-[#0ecb81] text-xs' : 'text-red-400 text-xs'}>{selectedMarketCoin.change} (24h)</div>
                  </div>
                </div>

                <div className="bg-[#181a20] h-72 rounded-xl flex flex-col items-center justify-center border border-gray-800 relative p-4 overflow-hidden">
                  <div className="absolute top-3 left-3 flex gap-2 text-[10px] text-gray-400">
                    <span className="bg-[#2b313a] px-2 py-0.5 rounded text-white font-bold">1H</span>
                    <span className="hover:text-white cursor-pointer">4H</span>
                    <span className="hover:text-white cursor-pointer">1D</span>
                    <span className="hover:text-white cursor-pointer">1W</span>
                  </div>
                  <div className="absolute top-3 right-3 text-[10px] text-[#0ecb81] font-mono animate-pulse">● LIVE CANDLE FEED</div>
                  
                  <div className="flex items-end justify-center space-x-2 w-full h-40 pt-6">
                    {[45, 60, 52, 68, 55, 75, 70, 88, 80, 95, 90, 105, 100, 115, 110, 125, 120, 135].map((val, idx) => {
                      const isGreen = idx % 2 === 0;
                      return (
                        <div key={idx} className="flex flex-col items-center h-full justify-end group relative">
                          <div className={`w-0.5 ${isGreen ? 'bg-[#0ecb81]' : 'bg-red-500'} h-full absolute`}></div>
                          <div style={{ height: `${val}px` }} className={`w-3 rounded-sm z-10 ${isGreen ? 'bg-[#0ecb81]' : 'bg-red-500'}`}></div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-3">Real-time Candlestick Chart for {selectedMarketCoin.symbol}/USDT</div>
                </div>
              </div>

              <div className="bg-[#2b313a]/20 border border-[#2b313a] p-4 rounded-xl space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="font-bold text-white text-sm">Quick Spot Trade ({selectedMarketCoin.symbol})</h3>
                  <div>
                    <label className="text-gray-400 block mb-1">Amount ({selectedMarketCoin.symbol})</label>
                    <input 
                      type="number" 
                      step="any" 
                      value={tradeAmount} 
                      onChange={(e) => setTradeAmount(e.target.value)} 
                      placeholder="0.00" 
                      className="w-full bg-[#181a20] border border-gray-700 p-2 rounded text-white outline-none focus:border-[#f0b90b]" 
                    />
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Avail USDT: <span className="text-white font-bold">{(userCryptoHoldings['USDT'] || 0).toFixed(2)} USDT</span>
                  </div>
                </div>
                <button 
                  onClick={() => alert(`Successfully bought ${tradeAmount || 0} ${selectedMarketCoin.symbol}!`)} 
                  className="w-full bg-[#0ecb81] hover:bg-[#0bb875] text-black font-bold p-2.5 rounded cursor-pointer"
                >
                  Buy {selectedMarketCoin.symbol}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trade' && (
          <div className="space-y-4">
            <div className="bg-[#2b313a]/20 border border-[#2b313a] p-4 rounded-2xl flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <span className="font-bold text-white text-base">{selectedMarketCoin.symbol}/USDT</span>
                <span className="text-[#0ecb81] font-bold">${selectedMarketCoin.price}</span>
              </div>
              <div className="flex bg-[#181a20] p-1 rounded-xl">
                <button onClick={() => setTradeTabMode('spot')} className={`px-4 py-1.5 rounded-lg font-bold text-xs cursor-pointer ${tradeTabMode === 'spot' ? 'bg-[#f0b90b] text-black' : 'text-gray-400'}`}>Spot</button>
                <button onClick={() => setTradeTabMode('futures')} className={`px-4 py-1.5 rounded-lg font-bold text-xs cursor-pointer ${tradeTabMode === 'futures' ? 'bg-[#f0b90b] text-black' : 'text-gray-400'}`}>Futures</button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-[#2b313a]/20 border border-[#2b313a] p-4 rounded-xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-white text-sm">Advanced Trading Chart ({selectedMarketCoin.symbol})</h3>
                  <div className="flex gap-2">
                    {cryptoList.slice(0, 4).map(c => (
                      <button 
                        key={c.symbol} 
                        onClick={() => setSelectedMarketCoin(c)}
                        className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${selectedMarketCoin.symbol === c.symbol ? 'bg-[#f0b90b] text-black' : 'bg-[#181a20] text-gray-300'}`}
                      >
                        {c.symbol}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#181a20] h-80 rounded-xl flex flex-col items-center justify-center border border-gray-800 relative p-4">
                  <div className="absolute top-3 right-3 text-[10px] text-[#0ecb81] font-mono animate-pulse">● LIVE TRADING FEED</div>
                  <div className="flex items-end justify-center space-x-2 w-full h-48 pt-6">
                    {[50, 65, 58, 72, 60, 80, 75, 92, 85, 98, 94, 110, 105, 120, 115, 130, 125, 140].map((val, idx) => {
                      const isGreen = idx % 2 === 0;
                      return (
                        <div key={idx} className="flex flex-col items-center h-full justify-end group relative">
                          <div className={`w-0.5 ${isGreen ? 'bg-[#0ecb81]' : 'bg-red-500'} h-full absolute`}></div>
                          <div style={{ height: `${val}px` }} className={`w-3 rounded-sm z-10 ${isGreen ? 'bg-[#0ecb81]' : 'bg-red-500'}`}></div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-3">{tradeTabMode.toUpperCase()} Order Execution Engine Active</div>
                </div>
              </div>

              <div className="bg-[#2b313a]/20 border border-[#2b313a] p-4 rounded-xl space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white text-sm">{tradeTabMode === 'futures' ? 'Futures Order' : 'Spot Order'}</h3>
                    {tradeTabMode === 'futures' && (
                      <span className="text-[#f0b90b] font-bold text-[10px] bg-[#181a20] px-2 py-1 rounded border border-gray-800">
                        {leverage}x | {futuresMarginMode}
                      </span>
                    )}
                  </div>

                  {tradeTabMode === 'futures' && (
                    <div className="space-y-2 bg-[#181a20] p-3 rounded-xl border border-gray-800">
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span>Adjust Leverage</span>
                        <span className="text-white font-bold">{leverage}x</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="100" 
                        value={leverage} 
                        onChange={(e) => setLeverage(e.target.value)} 
                        className="w-full accent-[#f0b90b] cursor-pointer"
                      />
                    </div>
                  )}

                  <div className="flex bg-[#181a20] p-1 rounded-xl">
                    <button onClick={() => setOrderType('limit')} className={`flex-1 py-1 rounded-lg font-bold text-[10px] cursor-pointer ${orderType === 'limit' ? 'bg-[#2b313a] text-white' : 'text-gray-400'}`}>Limit</button>
                    <button onClick={() => setOrderType('market')} className={`flex-1 py-1 rounded-lg font-bold text-[10px] cursor-pointer ${orderType === 'market' ? 'bg-[#2b313a] text-white' : 'text-gray-400'}`}>Market</button>
                  </div>

                  {orderType === 'limit' && (
                    <div>
                      <label className="text-gray-400 block mb-1 text-[10px]">Price (USDT)</label>
                      <input type="number" value={tradePrice} onChange={(e) => setTradePrice(e.target.value)} placeholder={selectedMarketCoin.price} className="w-full bg-[#181a20] border border-gray-700 p-2 rounded text-white outline-none text-xs" />
                    </div>
                  )}

                  <div>
                    <label className="text-gray-400 block mb-1 text-[10px]">Amount ({selectedMarketCoin.symbol})</label>
                    <input type="number" step="any" value={tradeAmount} onChange={(e) => setTradeAmount(e.target.value)} placeholder="0.00" className="w-full bg-[#181a20] border border-gray-700 p-2 rounded text-white outline-none text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button onClick={() => alert(`Successfully placed Long/Buy order for ${selectedMarketCoin.symbol}!`)} className="bg-[#0ecb81] hover:bg-[#0bb875] text-black font-bold p-2.5 rounded text-xs cursor-pointer">
                    Buy / Long
                  </button>
                  <button onClick={() => alert(`Successfully placed Short/Sell order for ${selectedMarketCoin.symbol}!`)} className="bg-red-500 hover:bg-red-600 text-black font-bold p-2.5 rounded text-xs cursor-pointer">
                    Sell / Short
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'asset' && (
          <div className="space-y-6">
            <div className="bg-[#2b313a]/20 border border-[#2b313a] p-6 rounded-2xl space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="font-bold text-white text-base">Asset Portfolio & Wallet</h2>
                <div className="flex gap-2">
                  <button onClick={() => setModalType('deposit')} className="bg-[#f0b90b] hover:bg-[#d9a70a] text-black font-bold px-4 py-2 rounded-xl cursor-pointer">
                    Deposit
                  </button>
                  <button onClick={() => setModalType('withdraw')} className="bg-[#2b313a] hover:bg-[#363c4e] text-white font-bold px-4 py-2 rounded-xl cursor-pointer">
                    Withdraw
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#181a20] p-4 rounded-xl border border-gray-800">
                  <div className="text-gray-400 text-xs">Spot Wallet Balance</div>
                  <div className="text-xl font-bold text-white mt-1">${spotBalance.toFixed(2)}</div>
                </div>
                <div className="bg-[#181a20] p-4 rounded-xl border border-gray-800">
                  <div className="text-gray-400 text-xs">Futures Wallet Balance</div>
                  <div className="text-xl font-bold text-white mt-1">${futuresBalance.toFixed(2)}</div>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <h3 className="font-bold text-white text-sm">Crypto Holdings</h3>
                {cryptoList.map(coin => {
                  const holding = userCryptoHoldings[coin.symbol] || 0;
                  return (
                    <div key={coin.symbol} className="bg-[#181a20] border border-gray-800 p-3 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="font-bold text-white">{coin.name} ({coin.symbol})</span>
                        <div className="text-[10px] text-gray-500">{coin.network}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">{holding.toFixed(4)} {coin.symbol}</div>
                        <div className="text-[10px] text-gray-400">≈ ${(holding * coin.rawPrice).toFixed(2)} USD</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>

      {modalType === 'deposit' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2329] border border-[#2b313a] p-6 rounded-2xl w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base">Deposit Cryptocurrency</h3>
              <button onClick={() => setModalType(null)} className="text-gray-400 hover:text-white cursor-pointer font-bold">✕</button>
            </div>
            <form onSubmit={handleDepositSubmit} className="space-y-3">
              <div>
                <label className="text-gray-400 block mb-1">Select Coin</label>
                <select 
                  value={selectedMarketCoin.symbol} 
                  onChange={(e) => {
                    const found = cryptoList.find(c => c.symbol === e.target.value);
                    if (found) setSelectedMarketCoin(found);
                  }}
                  className="w-full bg-[#181a20] border border-gray-700 p-2.5 rounded text-white outline-none"
                >
                  {cryptoList.map(coin => (
                    <option key={coin.symbol} value={coin.symbol}>{coin.name} ({coin.symbol})</option>
                  ))}
                </select>
              </div>
              <div className="bg-[#181a20] p-3 rounded-xl border border-gray-800 space-y-1">
                <div className="text-[10px] text-gray-400">Deposit Address ({selectedMarketCoin.network})</div>
                <div className="font-mono text-xs text-[#f0b90b] break-all">{selectedMarketCoin.depositAddress}</div>
                <button type="button" onClick={() => handleCopy(selectedMarketCoin.depositAddress)} className="text-xs bg-[#2b313a] hover:bg-[#363c4e] text-white px-3 py-1 rounded mt-2 cursor-pointer">
                  {copiedAddress ? 'Copied!' : 'Copy Address'}
                </button>
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Amount Deposited</label>
                <input 
                  type="number" 
                  step="any" 
                  value={depositAmount} 
                  onChange={(e) => setDepositAmount(e.target.value)} 
                  placeholder="0.00" 
                  className="w-full bg-[#181a20] border border-gray-700 p-2.5 rounded text-white outline-none" 
                  required
                />
              </div>
              <button type="submit" className="w-full bg-[#f0b90b] hover:bg-[#d9a70a] text-black font-bold p-2.5 rounded cursor-pointer">
                Confirm Deposit
              </button>
            </form>
          </div>
        </div>
      )}

      {modalType === 'withdraw' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2329] border border-[#2b313a] p-6 rounded-2xl w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base">Withdraw Cryptocurrency</h3>
              <button onClick={() => setModalType(null)} className="text-gray-400 hover:text-white cursor-pointer font-bold">✕</button>
            </div>
            <form onSubmit={handleWithdrawSubmit} className="space-y-3">
              <div>
                <label className="text-gray-400 block mb-1">Select Coin</label>
                <select 
                  value={selectedWithdrawCoin.symbol} 
                  onChange={(e) => {
                    const found = cryptoList.find(c => c.symbol === e.target.value);
                    if (found) setSelectedWithdrawCoin(found);
                  }}
                  className="w-full bg-[#181a20] border border-gray-700 p-2.5 rounded text-white outline-none"
                >
                  {cryptoList.map(coin => (
                    <option key={coin.symbol} value={coin.symbol}>{coin.name} ({coin.symbol})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Recipient Address</label>
                <input 
                  type="text" 
                  value={withdrawAddress} 
                  onChange={(e) => setWithdrawAddress(e.target.value)} 
                  placeholder="Enter wallet address" 
                  className="w-full bg-[#181a20] border border-gray-700 p-2.5 rounded text-white outline-none" 
                  required
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Amount (Avail: {(userCryptoHoldings[selectedWithdrawCoin.symbol] || 0).toFixed(4)} {selectedWithdrawCoin.symbol})</label>
                <input 
                  type="number" 
                  step="any" 
                  value={withdrawAmount} 
                  onChange={(e) => setWithdrawAmount(e.target.value)} 
                  placeholder="0.00" 
                  className="w-full bg-[#181a20] border border-gray-700 p-2.5 rounded text-white outline-none" 
                  required
                />
              </div>
              <button type="submit" className="w-full bg-[#f0b90b] hover:bg-[#d9a70a] text-black font-bold p-2.5 rounded cursor-pointer">
                Confirm Withdrawal
              </button>
            </form>
          </div>
        </div>
      )}

      {modalType === 'convert' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2329] border border-[#2b313a] p-6 rounded-2xl w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base">Quick Convert</h3>
              <button onClick={() => setModalType(null)} className="text-gray-400 hover:text-white cursor-pointer font-bold">✕</button>
            </div>
            <form onSubmit={handleConvertSubmit} className="space-y-3">
              <div>
                <label className="text-gray-400 block mb-1">From Coin (Avail: {(userCryptoHoldings[convertFromCoin] || 0).toFixed(4)})</label>
                <select value={convertFromCoin} onChange={(e) => setConvertFromCoin(e.target.value)} className="w-full bg-[#181a20] border border-gray-700 p-2.5 rounded text-white outline-none">
                  {cryptoList.map(c => <option key={c.symbol} value={c.symbol}>{c.symbol}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-400 block mb-1">To Coin</label>
                <select value={convertToCoin} onChange={(e) => setConvertToCoin(e.target.value)} className="w-full bg-[#181a20] border border-gray-700 p-2.5 rounded text-white outline-none">
                  {cryptoList.map(c => <option key={c.symbol} value={c.symbol}>{c.symbol}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Amount</label>
                <input type="number" step="any" value={convertAmount} onChange={(e) => setConvertAmount(e.target.value)} placeholder="0.00" className="w-full bg-[#181a20] border border-gray-700 p-2.5 rounded text-white outline-none" required />
              </div>
              <button type="submit" className="w-full bg-[#f0b90b] hover:bg-[#d9a70a] text-black font-bold p-2.5 rounded cursor-pointer">Convert Now</button>
            </form>
          </div>
        </div>
      )}

      {modalType === 'swap' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2329] border border-[#2b313a] p-6 rounded-2xl w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base">Token Swap</h3>
              <button onClick={() => setModalType(null)} className="text-gray-400 hover:text-white cursor-pointer font-bold">✕</button>
            </div>
            <form onSubmit={handleSwapSubmit} className="space-y-3">
              <div>
                <label className="text-gray-400 block mb-1">Swap From (Avail: {(userCryptoHoldings[swapFromCoin] || 0).toFixed(4)})</label>
                <select value={swapFromCoin} onChange={(e) => setSwapFromCoin(e.target.value)} className="w-full bg-[#181a20] border border-gray-700 p-2.5 rounded text-white outline-none">
                  {cryptoList.map(c => <option key={c.symbol} value={c.symbol}>{c.symbol}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Swap To</label>
                <select value={swapToCoin} onChange={(e) => setSwapToCoin(e.target.value)} className="w-full bg-[#181a20] border border-gray-700 p-2.5 rounded text-white outline-none">
                  {cryptoList.map(c => <option key={c.symbol} value={c.symbol}>{c.symbol}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Amount</label>
                <input type="number" step="any" value={swapAmount} onChange={(e) => setSwapAmount(e.target.value)} placeholder="0.00" className="w-full bg-[#181a20] border border-gray-700 p-2.5 rounded text-white outline-none" required />
              </div>
              <button type="submit" className="w-full bg-[#f0b90b] hover:bg-[#d9a70a] text-black font-bold p-2.5 rounded cursor-pointer">Swap Now</button>
            </form>
          </div>
        </div>
      )}

      {modalType === 'pay' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2329] border border-[#2b313a] p-6 rounded-2xl w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base">Crypto Pay</h3>
              <button onClick={() => setModalType(null)} className="text-gray-400 hover:text-white cursor-pointer font-bold">✕</button>
            </div>
            <form onSubmit={handlePaySubmit} className="space-y-3">
              <div>
                <label className="text-gray-400 block mb-1">Recipient Email / ID</label>
                <input type="text" value={payRecipient} onChange={(e) => setPayRecipient(e.target.value)} placeholder="recipient@example.com" className="w-full bg-[#181a20] border border-gray-700 p-2.5 rounded text-white outline-none" required />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Select Coin</label>
                <select value={payCoin} onChange={(e) => setPayCoin(e.target.value)} className="w-full bg-[#181a20] border border-gray-700 p-2.5 rounded text-white outline-none">
                  {cryptoList.map(c => <option key={c.symbol} value={c.symbol}>{c.symbol} (Avail: {(userCryptoHoldings[c.symbol] || 0).toFixed(4)})</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Amount</label>
                <input type="number" step="any" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0.00" className="w-full bg-[#181a20] border border-gray-700 p-2.5 rounded text-white outline-none" required />
              </div>
              <button type="submit" className="w-full bg-[#f0b90b] hover:bg-[#d9a70a] text-black font-bold p-2.5 rounded cursor-pointer">Send Payment</button>
            </form>
          </div>
        </div>
      )}

      {modalType === 'p2p' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2329] border border-[#2b313a] p-6 rounded-2xl w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base">P2P Express Trading</h3>
              <button onClick={() => setModalType(null)} className="text-gray-400 hover:text-white cursor-pointer font-bold">✕</button>
            </div>
            <div className="flex bg-[#181a20] p-1 rounded-xl">
              <button onClick={() => setP2pType('buy')} className={`flex-1 py-2 rounded-lg font-bold text-xs cursor-pointer ${p2pType === 'buy' ? 'bg-[#0ecb81] text-black' : 'text-gray-400'}`}>Buy USDT</button>
              <button onClick={() => setP2pType('sell')} className={`flex-1 py-2 rounded-lg font-bold text-xs cursor-pointer ${p2pType === 'sell' ? 'bg-red-500 text-black' : 'text-gray-400'}`}>Sell USDT</button>
            </div>
            <div className="space-y-3">
              <div className="bg-[#181a20] p-3 rounded-xl border border-gray-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">Merchant: CryptoExpress_VIP</span>
                  <span className="text-[#0ecb81]">99.8% Completion</span>
                </div>
                <div className="text-gray-400 text-[10px]">Price: <span className="text-white font-bold">1.00 USD / USDT</span></div>
                <div className="text-gray-400 text-[10px]">Limits: <span className="text-white">10 - 5,000 USD</span></div>
                <button onClick={() => { alert(`P2P order initiated successfully!`); setModalType(null); }} className={`w-full font-bold p-2.5 rounded cursor-pointer mt-2 ${p2pType === 'buy' ? 'bg-[#0ecb81] text-black' : 'bg-red-500 text-black'}`}>
                  {p2pType === 'buy' ? 'Buy USDT Now' : 'Sell USDT Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-[#181a20] border-t border-[#2b313a] flex justify-around p-3 z-40 max-w-6xl mx-auto">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center cursor-pointer ${activeTab === 'home' ? 'text-[#f0b90b]' : 'text-gray-400'}`}>
          <span className="text-lg">🏠</span>
          <span className="text-[10px]">Home</span>
        </button>
        <Link href="/market" className="flex flex-col items-center">
  <span className="text-lg">📊</span>
  <span className="text-[10px]">Markets</span>
</Link>
        <Link href="/trade" className="flex flex-col items-center">
  <span className="text-lg">🔄</span>
  <span className="text-[10px]">Trade</span>
</Link>
        <button onClick={() => setActiveTab('asset')} className={`flex flex-col items-center cursor-pointer ${activeTab === 'asset' ? 'text-[#f0b90b]' : 'text-gray-400'}`}>
          <span className="text-lg">💰</span>
          <span className="text-[10px]">Assets</span>
        </button>
      </div>

    </div>
  );
}