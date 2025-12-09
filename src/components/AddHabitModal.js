import React, { useState, useEffect } from 'react';

const categories = [
  { id: 'health', name: 'Health', icon: '🏃' },
  { id: 'fitness', name: 'Fitness', icon: '💪' },
  { id: 'mindfulness', name: 'Mindfulness', icon: '🧘' },
  { id: 'learning', name: 'Learning', icon: '📚' },
  { id: 'productivity', name: 'Productivity', icon: '⚡' },
  { id: 'social', name: 'Social', icon: '👥' },
  { id: 'finance', name: 'Finance', icon: '💰' },
  { id: 'creativity', name: 'Creativity', icon: '🎨' },
  { id: 'other', name: 'Other', icon: '✨' },
];

const frequencies = ['daily', 'weekly', 'weekdays', 'weekends'];

const AddHabitModal = ({ habit, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'other',
    frequency: 'daily',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Animation state
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entry animation after mount
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (habit) {
      setFormData({
        name: habit.name || '',
        category: habit.category || 'other',
        frequency: habit.frequency || 'daily',
      });
    }
  }, [habit]);

  // Helper to handle smooth closing animation
  const animateAndClose = (callback) => {
    setIsVisible(false);
    setTimeout(() => {
      if (callback) callback();
    }, 300); // Match duration-300
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    // Animate out, then save
    animateAndClose(() => onSave(formData));
  };

  const handleCloseButton = () => {
    animateAndClose(onClose);
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      // Animate out, then delete
      animateAndClose(onDelete);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-end md:items-center justify-center overflow-hidden transition-colors duration-300 ${isVisible ? 'bg-black/50' : 'bg-black/0 pointer-events-none'}`}>
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={handleCloseButton}></div>

      <form 
        onSubmit={handleSubmit} 
        className={`bg-white w-full max-h-[85vh] rounded-t-3xl md:rounded-2xl md:max-w-md overflow-hidden flex flex-col z-10 transition-all duration-300 ease-in-out transform shadow-xl ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full md:translate-y-10 opacity-0 scale-95'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-[14px] font-medium font-[Poppins] text-dark">{habit ? 'Edit Habit' : 'Add New Habit'}</h2>
          <button 
            type="button" 
            onClick={handleCloseButton} 
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Habit Name */}
          <div className="mb-6">
            <label className="block text-[11px] font-[Roboto] text-gray-600 mb-2 font-medium">Habit Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-field w-full text-[14px]"
              placeholder="e.g., Drink 8 glasses of water"
              autoFocus
            />
          </div>

          {/* Category */}
          <div className="mb-6">
            <label className="block text-[11px] font-[Roboto] text-gray-600 mb-3 font-medium">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.id })}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    formData.category === cat.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  <span className="text-xl block mb-1">{cat.icon}</span>
                  <span className="text-[10px] font-medium font-[Roboto]">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div className="mb-8">
            <label className="block text-[11px] font-[Roboto] text-gray-600 mb-3 font-medium">Frequency</label>
            <div className="flex flex-wrap gap-2">
              {frequencies.map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setFormData({ ...formData, frequency: freq })}
                  className={`px-4 py-2 rounded-full text-[11px] font-medium font-[Roboto] transition-all ${
                    formData.frequency === freq
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons - Fixed at Bottom */}
        <div className="flex-shrink-0 bg-white border-t border-gray-100 px-4 py-4 space-y-3 pb-8 md:pb-4">
          <button 
            type="submit"
            className="btn-primary w-full py-3 rounded-lg font-medium text-white text-[11px] font-[Roboto]"
          >
            {habit ? 'Update Habit' : 'Add Habit'}
          </button>

          {habit && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="w-full py-3 rounded-lg text-[11px] font-medium font-[Roboto] transition-all bg-red-500 text-white hover:bg-red-600"
            >
              {showDeleteConfirm ? 'Confirm Delete' : 'Delete Habit'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddHabitModal;