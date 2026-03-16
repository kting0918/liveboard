import { Router } from 'express';
import { customAlphabet } from 'nanoid';
import { Room, Question } from '../models/index.js';

const router = Router();
const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);
const generateToken = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 32);

// Create room
router.post('/rooms', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: '請輸入活動名稱' });
    }
    const room = await Room.create({
      code: generateCode(),
      name: name.trim(),
      hostToken: generateToken(),
    });
    res.json({
      code: room.code,
      name: room.name,
      hostToken: room.hostToken,
    });
  } catch (err) {
    res.status(500).json({ error: '建立房間失敗' });
  }
});

// Get room by code
router.get('/rooms/:code', async (req, res) => {
  try {
    const room = await Room.findOne({
      where: { code: req.params.code.toUpperCase() },
    });
    if (!room) return res.status(404).json({ error: '找不到房間' });
    res.json({
      code: room.code,
      name: room.name,
      isActive: room.isActive,
    });
  } catch (err) {
    res.status(500).json({ error: '查詢失敗' });
  }
});

// Verify host token
router.post('/rooms/:code/verify-host', async (req, res) => {
  try {
    const { hostToken } = req.body;
    const room = await Room.findOne({
      where: { code: req.params.code.toUpperCase() },
    });
    if (!room) return res.status(404).json({ error: '找不到房間' });
    if (room.hostToken !== hostToken) return res.status(403).json({ error: '驗證失敗' });
    res.json({ valid: true });
  } catch (err) {
    res.status(500).json({ error: '驗證失敗' });
  }
});

// Get questions for a room
router.get('/rooms/:code/questions', async (req, res) => {
  try {
    const room = await Room.findOne({
      where: { code: req.params.code.toUpperCase(), isActive: true },
    });
    if (!room) return res.status(404).json({ error: '找不到房間' });
    const questions = await Question.findAll({
      where: { roomId: room.id },
      order: [
        ['isPinned', 'DESC'],
        ['votes', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: '查詢失敗' });
  }
});

// Export questions as CSV
router.get('/rooms/:code/export', async (req, res) => {
  try {
    const { hostToken } = req.query;
    const room = await Room.findOne({
      where: { code: req.params.code.toUpperCase() },
    });
    if (!room) return res.status(404).json({ error: '找不到房間' });
    if (room.hostToken !== hostToken) return res.status(403).json({ error: '驗證失敗' });

    const questions = await Question.findAll({
      where: { roomId: room.id },
      order: [['votes', 'DESC'], ['createdAt', 'ASC']],
    });

    const BOM = '\uFEFF';
    const header = '排名,問題內容,提問者,票數,已回答,置頂,提問時間\n';
    const rows = questions.map((q, i) =>
      [
        i + 1,
        `"${q.content.replace(/"/g, '""')}"`,
        q.authorName || '匿名',
        q.votes,
        q.isAnswered ? '是' : '否',
        q.isPinned ? '是' : '否',
        q.createdAt.toISOString(),
      ].join(',')
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${room.name}-questions.csv"`);
    res.send(BOM + header + rows.join('\n'));
  } catch (err) {
    res.status(500).json({ error: '匯出失敗' });
  }
});

export default router;
