import express from 'express';

const router = express.Router();

let businessInfo = {
  regularClosedDays: ['wed'],
  requiredBreakMinutes: 60,
  maxWorkHours: 8,
  maxConsecutiveWorkDays: 5,
  minStaff: 2,
  hours: {
    mon: { open: '10:00', close: '20:00', closed: false },
    tue: { open: '10:00', close: '20:00', closed: false },
    wed: { open: '10:00', close: '20:00', closed: true },
    thu: { open: '10:00', close: '20:00', closed: false },
    fri: { open: '10:00', close: '20:00', closed: false },
    sat: { open: '12:00', close: '20:00', closed: false },
    sun: { open: '18:00', close: '20:00', closed: false },
    holiday: { open: '10:00', close: '20:00', closed: false },
  },
  staffing: {
    mon: { normal: 2, busy: 3 },
    tue: { normal: 2, busy: 3 },
    wed: { normal: 0, busy: 0 },
    thu: { normal: 2, busy: 3 },
    fri: { normal: 3, busy: 4 },
    sat: { normal: 4, busy: 5 },
    sun: { normal: 4, busy: 5 },
    holiday: { normal: 4, busy: 5 },
  },
  timeSlotStaffing: [
    { id: '10', label: '10:00 - 11:00', weekday: 2, holiday: 3 },
    { id: '11', label: '11:00 - 12:00', weekday: 3, holiday: 4 },
    { id: '12', label: '12:00 - 13:00', weekday: 3, holiday: 4 },
    { id: '13', label: '13:00 - 14:00', weekday: 0, holiday: 0 },
    { id: '14', label: '14:00 - 15:00', weekday: 0, holiday: 0 },
    { id: '15', label: '15:00 - 16:00', weekday: 0, holiday: 0 },
    { id: '16', label: '16:00 - 17:00', weekday: 0, holiday: 0 },
    { id: '17', label: '17:00 - 18:00', weekday: 0, holiday: 0 },
    { id: '18', label: '18:00 - 19:00', weekday: 0, holiday: 0 },
    { id: '19', label: '19:00 - 20:00', weekday: 0, holiday: 0 },
  ],
  specialRules: [
    { id: 1, date: '2024-08-15', type: 'specialClosed', time: '-', note: 'お盆休み' },
    { id: 2, date: '2024-08-16', type: 'specialClosed', time: '10:00-17:00', note: '' },
    { id: 3, date: '2024-12-24', type: 'shortHours', time: '10:00-17:00', note: 'クリスマス' },
  ],
};

// GET /api/business-info - 営業設定取得
router.get('/', (_req, res) => {
  res.json(businessInfo);
});

// PUT /api/business-info - 営業設定更新
router.put('/', (req, res) => {
  businessInfo = { ...businessInfo, ...req.body };
  res.json(businessInfo);
});

export default router;
