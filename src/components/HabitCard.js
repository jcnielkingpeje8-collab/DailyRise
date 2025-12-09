import React from 'react';

const categoryIcons = {
  health: '🏃',
  fitness: '💪',
  mindfulness: '🧘',
  learning: '📚',
  productivity: '⚡',
  social: '👥',
  finance: '💰',
  creativity: '🎨',
  other: '✨',
};

const HabitCard = ({ habit, onEdit }) => {
  return (
    <div className="habit-card flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="text-lg">{categoryIcons[habit.category] || '✨'}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-subheading truncate text-dark">
            {habit.name}
          </h3>
        </div>
        <p className="text-small text-gray-400 capitalize">{habit.frequency || 'Daily'}</p>
      </div>

      <button
        onClick={onEdit}
        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>
    </div>
  );
};

export default HabitCard;
