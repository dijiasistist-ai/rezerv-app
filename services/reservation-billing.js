const COMMISSION_RATE = 0.07;
const FAST_GRACE_DAYS = 15;

const PAYMENT_MODES = {
  COMMISSION_DEPOSIT: "commission_deposit",
  FULL_ONLINE: "full_online",
  VENUE_PAYMENT: "venue_payment",
};

const PAYMENT_MODE_LABELS = {
  [PAYMENT_MODES.COMMISSION_DEPOSIT]: "Kapora komisyon",
  [PAYMENT_MODES.FULL_ONLINE]: "Tam online ödeme",
  [PAYMENT_MODES.VENUE_PAYMENT]: "Sadece rezervasyon",
};

function toMoney(value = 0) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatCurrency(value = 0) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(Number(value || 0));
}

function calculateReservationBilling({ totalAmount = 0, paymentMode = PAYMENT_MODES.COMMISSION_DEPOSIT } = {}) {
  const safeTotal = toMoney(totalAmount);
  const commissionAmount = toMoney(safeTotal * COMMISSION_RATE);
  const venueNetAmount = toMoney(Math.max(safeTotal - commissionAmount, 0));

  if (paymentMode === PAYMENT_MODES.FULL_ONLINE) {
    return {
      paymentMode,
      paymentModeLabel: PAYMENT_MODE_LABELS[paymentMode],
      totalAmount: safeTotal,
      commissionRate: COMMISSION_RATE,
      commissionAmount,
      customerOnlinePayment: safeTotal,
      customerVenuePayment: 0,
      depositAmount: 0,
      platformCollectedAmount: safeTotal,
      platformCommissionCollected: commissionAmount,
      venuePayoutAmount: venueNetAmount,
      venueCommissionDebt: 0,
      settlement: "Kart ödemeleri çekilebilir olduktan sonra hakediş firmaya aktarılır.",
    };
  }

  if (paymentMode === PAYMENT_MODES.VENUE_PAYMENT) {
    return {
      paymentMode,
      paymentModeLabel: PAYMENT_MODE_LABELS[paymentMode],
      totalAmount: safeTotal,
      commissionRate: COMMISSION_RATE,
      commissionAmount,
      customerOnlinePayment: 0,
      customerVenuePayment: safeTotal,
      depositAmount: 0,
      platformCollectedAmount: 0,
      platformCommissionCollected: 0,
      venuePayoutAmount: 0,
      venueCommissionDebt: commissionAmount,
      settlement: "Rezervasyon listelenir; ay sonunda komisyon FAST ile istenir.",
    };
  }

  return {
    paymentMode: PAYMENT_MODES.COMMISSION_DEPOSIT,
    paymentModeLabel: PAYMENT_MODE_LABELS[PAYMENT_MODES.COMMISSION_DEPOSIT],
    totalAmount: safeTotal,
    commissionRate: COMMISSION_RATE,
    commissionAmount,
    customerOnlinePayment: commissionAmount,
    customerVenuePayment: venueNetAmount,
    depositAmount: commissionAmount,
    platformCollectedAmount: commissionAmount,
    platformCommissionCollected: commissionAmount,
    venuePayoutAmount: 0,
    venueCommissionDebt: 0,
    settlement: "Komisyon kapora adıyla alınır; kalan tutar işletmede tahsil edilir.",
  };
}

function getMonthEnd(date = new Date()) {
  const value = new Date(date);
  return new Date(value.getFullYear(), value.getMonth() + 1, 0, 23, 59, 59, 999);
}

function getFastCollectionStatus({ periodEnd = new Date(), notifiedAt = null, paidAt = null, now = new Date() } = {}) {
  if (paidAt) {
    return {
      status: "paid",
      dueAt: null,
      action: "Tahsil edildi.",
      shouldSuspendVenue: false,
    };
  }

  const noticeDate = notifiedAt ? new Date(notifiedAt) : getMonthEnd(periodEnd);
  const dueAt = addDays(noticeDate, FAST_GRACE_DAYS);
  const isOverdue = new Date(now) > dueAt;

  return {
    status: isOverdue ? "overdue" : "grace_period",
    dueAt: dueAt.toISOString(),
    action: isOverdue
      ? "15 gün doldu. İşletme pasife çekilmeli."
      : "Ay sonu bildirimi gönderildi. FAST ödemesi bekleniyor.",
    shouldSuspendVenue: isOverdue,
  };
}

function summarizeMonthlyCommission({ reservations = [], periodEnd = new Date(), notifiedAt = null, paidAt = null, now = new Date() } = {}) {
  const rows = reservations.map((reservation) =>
    calculateReservationBilling({
      totalAmount: reservation.totalAmount,
      paymentMode: reservation.paymentMode,
    }),
  );
  const commissionDebt = toMoney(rows.reduce((total, row) => total + row.venueCommissionDebt, 0));
  const status = getFastCollectionStatus({ periodEnd, notifiedAt, paidAt, now });

  return {
    periodEnd: getMonthEnd(periodEnd).toISOString(),
    commissionDebt,
    commissionDebtLabel: formatCurrency(commissionDebt),
    reservationCount: reservations.length,
    ...status,
  };
}

module.exports = {
  COMMISSION_RATE,
  FAST_GRACE_DAYS,
  PAYMENT_MODES,
  PAYMENT_MODE_LABELS,
  calculateReservationBilling,
  formatCurrency,
  summarizeMonthlyCommission,
};
