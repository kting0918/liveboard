import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import socket from '../socket';
import Header from '../components/Header';
import QuestionCard from '../components/QuestionCard';

export default function HostPanel() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const hostToken = localStorage.getItem(`host-${code}`);
  const visitorId = useRef(
    localStorage.getItem('liveboard-visitor-id') || crypto.randomUUID()
  );

  useEffect(() => {
    if (!hostToken) {
      navigate(`/room/${code}`);
      return;
    }

    // Verify host token
    fetch(`/api/rooms/${code}/verify-host`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostToken }),
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        return fetch(`/api/rooms/${code}`);
      })
      .then((r) => r.json())
      .then(setRoom)
      .catch(() => {
        setError('驗證失敗');
        navigate(`/room/${code}`);
      });

    fetch(`/api/rooms/${code}/questions`)
      .then((r) => r.json())
      .then(setQuestions)
      .catch(() => {});

    // Connect socket
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

    return () => {
      socket.off('new-question');
      socket.off('question-updated');
      socket.off('question-deleted');
      socket.disconnect();
    };
  }, [code, hostToken, navigate]);

  const sortedQuestions = [...questions].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1;
    return b.votes - a.votes;
  });

  const handleVote = (questionId) => {
    socket.emit('vote', { questionId, visitorId: visitorId.current });
  };

  const handleMarkAnswered = (questionId) => {
    socket.emit('mark-answered', { questionId, hostToken });
  };

  const handlePin = (questionId) => {
    socket.emit('pin-question', { questionId, hostToken });
  };

  const handleDelete = (questionId) => {
    if (!confirm('確定要刪除這個問題嗎？')) return;
    socket.emit('delete-question', { questionId, hostToken });
  };

  const handleExport = () => {
    window.open(`/api/rooms/${code}/export?hostToken=${hostToken}`, '_blank');
  };

  const copyJoinLink = () => {
    const url = `${window.location.origin}/room/${code}`;
    navigator.clipboard.writeText(url);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const answeredCount = questions.filter((q) => q.isAnswered).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="min-h-screen bg-bg-alt flex flex-col">
      <Header roomName={room?.name} code={code} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
        {/* Host toolbar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">主持人控制台</h2>
              <p className="text-sm text-gray-mid">
                房間代碼：<span className="font-mono text-bronze font-semibold">{code}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyJoinLink}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-ink hover:bg-bg-alt transition-colors cursor-pointer"
              >
                複製連結
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-bronze text-white rounded-lg text-sm font-medium hover:bg-bronze-dark transition-colors cursor-pointer"
              >
                匯出 CSV
              </button>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="bg-white p-2 rounded-lg border border-gray-100">
              <QRCodeSVG
                value={`${window.location.origin}/room/${code}`}
                size={120}
                fgColor="#313131"
                level="M"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-mid mb-1">掃描 QR Code 加入提問</p>
              <p className="text-xs font-mono text-bronze break-all">
                {window.location.origin}/room/{code}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100 text-sm">
            <div>
              <span className="text-gray-mid">總問題：</span>
              <span className="font-semibold">{questions.length}</span>
            </div>
            <div>
              <span className="text-gray-mid">待回答：</span>
              <span className="font-semibold text-bronze">{unansweredCount}</span>
            </div>
            <div>
              <span className="text-gray-mid">已回答：</span>
              <span className="font-semibold text-green-600">{answeredCount}</span>
            </div>
          </div>
        </div>

        {/* Questions */}
        {sortedQuestions.length === 0 ? (
          <div className="text-center py-16 text-gray-mid">
            <p className="text-lg mb-1">等待提問中...</p>
            <p className="text-sm">分享房間代碼讓參與者加入</p>
          </div>
        ) : (
          sortedQuestions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              onVote={handleVote}
              hasVoted={(q.voters || []).includes(visitorId.current)}
              isHost={true}
              onMarkAnswered={handleMarkAnswered}
              onPin={handlePin}
              onDelete={handleDelete}
            />
          ))
        )}
      </main>
    </div>
  );
}
