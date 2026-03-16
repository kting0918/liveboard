import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: roomName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Store host token and navigate to host panel
      localStorage.setItem(`host-${data.code}`, data.hostToken);
      navigate(`/room/${data.code}/host`);
    } catch (err) {
      setError(err.message || '建立失敗');
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (e) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/rooms/${code}`);
      if (!res.ok) throw new Error('找不到房間');
      navigate(`/room/${code}`);
    } catch (err) {
      setError(err.message || '加入失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-semibold text-bronze">LiveBoard</h1>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-lg w-full py-16">
          <h2 className="text-4xl font-bold text-ink text-center mb-2">
            即時問答互動
          </h2>
          <p className="text-gray-mid text-center mb-12">
            讓每一個問題都被聽見
          </p>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          {/* Create Room */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-mid uppercase tracking-wider mb-3">
              建立活動
            </h3>
            <form onSubmit={createRoom} className="flex gap-2">
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="輸入活動名稱"
                maxLength={200}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-bronze text-ink"
              />
              <button
                type="submit"
                disabled={loading || !roomName.trim()}
                className="px-6 py-3 bg-bronze text-white rounded-lg font-medium hover:bg-bronze-dark disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                建立
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-mid">或</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Join Room */}
          <div>
            <h3 className="text-sm font-medium text-gray-mid uppercase tracking-wider mb-3">
              加入活動
            </h3>
            <form onSubmit={joinRoom} className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="輸入房間代碼"
                maxLength={6}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-bronze text-ink font-mono text-center tracking-widest text-lg"
              />
              <button
                type="submit"
                disabled={loading || !joinCode.trim()}
                className="px-6 py-3 border-2 border-bronze text-bronze rounded-lg font-medium hover:bg-bronze-50 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                加入
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-mid">
        LiveBoard &mdash; 即時問答互動平台
      </footer>
    </div>
  );
}
