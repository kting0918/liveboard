import { useState, useEffect } from 'react';
import socket from '../socket';

export default function ConnectionStatus() {
  const [disconnected, setDisconnected] = useState(false);

  useEffect(() => {
    const onDisconnect = () => setDisconnected(true);
    const onConnect = () => setDisconnected(false);

    socket.on('disconnect', onDisconnect);
    socket.on('connect', onConnect);

    return () => {
      socket.off('disconnect', onDisconnect);
      socket.off('connect', onConnect);
    };
  }, []);

  if (!disconnected) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white text-center py-2 text-sm">
      連線中斷，重新連線中...
    </div>
  );
}
