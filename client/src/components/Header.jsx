import { Link } from 'react-router-dom';

export default function Header({ roomName, code }) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-semibold text-bronze no-underline">
          LiveBoard
        </Link>
        {roomName && (
          <div className="text-right">
            <div className="text-sm text-gray-mid">{roomName}</div>
            <div className="text-xs font-mono text-bronze">{code}</div>
          </div>
        )}
      </div>
    </header>
  );
}
