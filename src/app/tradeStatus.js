// Helpers for trades whose duration has passed without an admin decision

export function getExpiryMs(trade) {
  const created =
    trade && trade.createdAt && typeof trade.createdAt.toMillis === 'function'
      ? trade.createdAt.toMillis()
      : null;
  if (created === null) return null;
  const seconds = parseInt(trade.duration, 10) || 60;
  return created + seconds * 1000;
}

// True when a pending trade has passed its duration
export function isExpiredPending(trade, now = Date.now()) {
  if (!trade || trade.status !== 'pending') return false;
  const expiry = getExpiryMs(trade);
  return expiry !== null && now >= expiry;
}

// Shows an expired pending trade as an automatic loss (display only, nothing is saved)
export function withEffectiveStatus(trade, now = Date.now()) {
  if (!isExpiredPending(trade, now)) return trade;
  const expiry = getExpiryMs(trade);
  return {
    ...trade,
    status: 'loss',
    autoClosed: true,
    closeReason: 'timeout',
    closedAt: {
      toMillis: () => expiry,
      toDate: () => new Date(expiry),
    },
  };
}