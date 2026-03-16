import { Room, Question } from '../models/index.js';

export function setupSocket(io) {
  io.on('connection', (socket) => {
    // Join room
    socket.on('join-room', async (code) => {
      const room = await Room.findOne({ where: { code: code.toUpperCase(), isActive: true } });
      if (!room) return socket.emit('error', '找不到房間');
      socket.join(code);
      socket.roomCode = code;
    });

    // Submit question
    socket.on('submit-question', async ({ code, content, authorName }) => {
      try {
        const room = await Room.findOne({ where: { code: code.toUpperCase(), isActive: true } });
        if (!room) return socket.emit('error', '找不到房間');
        if (!content || !content.trim()) return socket.emit('error', '問題不能為空');

        const question = await Question.create({
          roomId: room.id,
          content: content.trim(),
          authorName: authorName?.trim() || null,
        });

        io.to(code).emit('new-question', question);
      } catch (err) {
        socket.emit('error', '提問失敗');
      }
    });

    // Vote
    socket.on('vote', async ({ questionId, visitorId }) => {
      try {
        const question = await Question.findByPk(questionId);
        if (!question) return socket.emit('error', '找不到問題');

        const voters = question.voters || [];
        if (voters.includes(visitorId)) return socket.emit('error', '已經投過票了');

        question.voters = [...voters, visitorId];
        question.votes = question.votes + 1;
        await question.save();

        io.to(socket.roomCode).emit('question-updated', question);
      } catch (err) {
        socket.emit('error', '投票失敗');
      }
    });

    // Host: mark answered
    socket.on('mark-answered', async ({ questionId, hostToken }) => {
      try {
        const question = await Question.findByPk(questionId, { include: Room });
        if (!question || question.Room.hostToken !== hostToken) return;

        question.isAnswered = !question.isAnswered;
        await question.save();
        io.to(socket.roomCode).emit('question-updated', question);
      } catch (err) {
        socket.emit('error', '操作失敗');
      }
    });

    // Host: pin question
    socket.on('pin-question', async ({ questionId, hostToken }) => {
      try {
        const question = await Question.findByPk(questionId, { include: Room });
        if (!question || question.Room.hostToken !== hostToken) return;

        question.isPinned = !question.isPinned;
        await question.save();
        io.to(socket.roomCode).emit('question-updated', question);
      } catch (err) {
        socket.emit('error', '操作失敗');
      }
    });

    // Host: delete question
    socket.on('delete-question', async ({ questionId, hostToken }) => {
      try {
        const question = await Question.findByPk(questionId, { include: Room });
        if (!question || question.Room.hostToken !== hostToken) return;

        await question.destroy();
        io.to(socket.roomCode).emit('question-deleted', questionId);
      } catch (err) {
        socket.emit('error', '操作失敗');
      }
    });

    // Host: close room
    socket.on('close-room', async ({ code, hostToken }) => {
      try {
        const room = await Room.findOne({ where: { code: code.toUpperCase() } });
        if (!room || room.hostToken !== hostToken) return;

        room.isActive = false;
        await room.save();
        io.to(code).emit('room-closed');
      } catch (err) {
        socket.emit('error', '操作失敗');
      }
    });
  });
}
