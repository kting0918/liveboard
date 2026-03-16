import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../socket';
import Header from '../components/Header';
import QuestionCard from '../components/QuestionCard';
import ConnectionStatus from '../components/ConnectionStatus';

function getVisitorId() {
  let id = localStorage.getItem('liveboard-visitor-id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('liveboard-visitor-id', id);
  }
  return id;
}

const MAX_LENGTH = 500;

export default function Room() {
  const { code } = useParams();
  const [room, setRoom] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState(
    localStorage.getItem('liveboard-name') || ''
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const visitorId = useRef(getVisitorId());

  useEffect(() => {
    fetch(`/api/rooms/${code}`)
      .then((r) => r.json())
      .then(setRoom)
      .catch(() => setError('找不到房間'));

    fetch(`/api/rooms/${code}/questions`)
      .then((r) => r.json())
      .then(setQuestions)
      .catch(() => {});

    socket.connect();
    socket.emit('join-room', code);

    socket.on('new-question', (q) => {
      setQuestions((prev) => [q, ...prev]);
    });

    socket.on('question-updated', (updated) => {
      setQuestions((prev) =>
        prev.map((q) => (q.id === updated.id ? updated : q))
      );
    });

    socket.on('question-deleted', (id) => {
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    });

    socket.on('room-closed', () => {
      setRoom((prev) => prev ? { ...prev, isActive: false } : prev);
    });

    return () => {
      socket.off('new-question');
      socket.off('question-updated');
      socket.off('question-deleted');
      socket.off('room-closed');
      socket.disconnect();
    };
  }, [code]);

  // Dynamic page title
  useEffect(() => {
    if (room?.name) {
      document.title = `${room.name} | LiveBoard`;
    }
    return () => { document.title = 'LiveBoard — 即時問答互動平台'; };
  }, [room?.name]);

  const sortedQuestions = [...questions].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1;
    if (a.isAnswered !== b.isAnswered) return a.isAnswered ? 1 : -1;
    return b.votes - a.votes;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    if (authorName.trim()) {
      localStorage.setItem('liveboard-name', authorName.trim());
    }
    socket.emit('submit-question', {
      code,
      content: content.trim(),
      authorName: authorName.trim() || null,
    });
    setContent('');
    setSubmitting(false);
  };

  const handleVote = (questionId) => {
    socket.emit('vote', { questionId, visitorId: visitorId.current });
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const isActive = room?.isActive !== false;
  const remaining = MAX_LENGTH - content.length;

  return (
    <div className="min-h-screen bg-bg-alt flex flex-col">
      <ConnectionStatus />
      <Header roomName={room?.name} code={code} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
        {/* Question form */}
        {isActive ? (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="輸入你的問題..."
              rows={3}
              maxLength={MAX_LENGTH}
              className="w-full resize-none border-0 focus:outline-none text-ink placeholder-gray-400 text-base"
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="你的暱稱（選填）"
                  maxLength={50}
                  className="px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-bronze w-28 sm:w-40"
                />
                <span className={`text-xs ${remaining < 50 ? 'text-red-400' : 'text-gray-400'}`}>
                  {remaining}
                </span>
              </div>
              <button
                type="submit"
                disabled={!content.trim() || submitting}
                className="px-5 py-2 bg-bronze text-white rounded-lg text-sm font-medium hover:bg-bronze-dark disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                送出提問
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-6 text-center text-gray-mid">
            此活動已結束，無法再提問
          </div>
        )}

        {/* Questions list */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-mid">
            {questions.length} 個問題
          </h3>
        </div>

        {sortedQuestions.length === 0 ? (
          <div className="text-center py-16 text-gray-mid">
            <p className="text-lg mb-1">還沒有問題</p>
            <p className="text-sm">成為第一個提問的人吧！</p>
          </div>
        ) : (
          sortedQuestions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              onVote={handleVote}
              hasVoted={(q.voters || []).includes(visitorId.current)}
              isHost={false}
            />
          ))
        )}
      </main>
    </div>
  );
}
