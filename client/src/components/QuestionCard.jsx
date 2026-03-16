export default function QuestionCard({
  question,
  onVote,
  hasVoted,
  isHost,
  onMarkAnswered,
  onPin,
  onDelete,
}) {
  return (
    <div
      className={`rounded-lg border p-4 mb-3 transition-all ${
        question.isPinned
          ? 'border-bronze bg-bronze-50'
          : question.isAnswered
          ? 'border-gray-200 bg-gray-50 opacity-60'
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex gap-3">
        {/* Vote button */}
        <button
          onClick={() => onVote(question.id)}
          disabled={hasVoted}
          className={`flex flex-col items-center justify-center min-w-[48px] rounded-lg px-2 py-1 transition-colors ${
            hasVoted
              ? 'bg-bronze-50 text-bronze cursor-default'
              : 'bg-bg-alt text-gray-mid hover:bg-bronze-100 hover:text-bronze cursor-pointer'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          <span className="text-sm font-semibold">{question.votes}</span>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-ink leading-relaxed break-words">{question.content}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-mid">
            <span>{question.authorName || '匿名'}</span>
            {question.isPinned && (
              <span className="text-bronze font-medium">置頂</span>
            )}
            {question.isAnswered && (
              <span className="text-green-600 font-medium">已回答</span>
            )}
          </div>
        </div>

        {/* Host controls */}
        {isHost && (
          <div className="flex flex-col gap-1 ml-2">
            <button
              onClick={() => onMarkAnswered(question.id)}
              title={question.isAnswered ? '取消已回答' : '標記已回答'}
              className="p-1.5 rounded hover:bg-bg-alt text-gray-mid hover:text-green-600 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button
              onClick={() => onPin(question.id)}
              title={question.isPinned ? '取消置頂' : '置頂'}
              className="p-1.5 rounded hover:bg-bg-alt text-gray-mid hover:text-bronze cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(question.id)}
              title="刪除"
              className="p-1.5 rounded hover:bg-bg-alt text-gray-mid hover:text-red-500 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
