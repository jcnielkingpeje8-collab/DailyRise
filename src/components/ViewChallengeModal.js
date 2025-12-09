import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const ViewChallengeModal = ({ isOpen, challengeId, onClose }) => {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && challengeId) {
      fetchChallenge();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, challengeId]);

  const fetchChallenge = async () => {
    try {
      const { data: challengeData, error } = await supabase
        .from('challenges')
        .select(`
          id,
          status,
          created_at,
          completed_at,
          challenger_id,
          challenged_user_id,
          habit_id,
          habits (name),
          challenger:users!challenger_id (firstname, lastname, image, age, gender),
          challengee:users!challenged_user_id (firstname, lastname, image, age, gender)
        `)
        .eq('id', challengeId)
        .single();

      if (error) throw error;
      setChallenge(challengeData);
    } catch (error) {
      console.error('Error fetching challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // --- Loading Spinner (Centered) ---
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/60 backdrop-blur-sm">
        <div className="bg-light p-5 rounded-2xl shadow-xl flex flex-col items-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-3"></div>
          <p className="text-small font-roboto text-gray-500">Loading details...</p>
        </div>
      </div>
    );
  }

  if (!challenge) return null;

  // Data Extraction
  const challengerName = `${challenge.challenger?.firstname || 'User'} ${challenge.challenger?.lastname || ''}`;
  const challengedName = `${challenge.challengee?.firstname || 'User'} ${challenge.challengee?.lastname || ''}`;
  const habitName = challenge.habits?.[0]?.name || challenge.habits?.name || 'Unknown Habit';
  const challengerImage = challenge.challenger?.image || 'https://via.placeholder.com/100?text=User';
  const challengedImage = challenge.challengee?.image || 'https://via.placeholder.com/100?text=User';

  // Helper for Status Badge using your text sizes
  const getStatusBadge = (status) => {
    const styles = {
      completed: "bg-green-100 text-green-800 border-green-200",
      accepted: "bg-blue-100 text-blue-800 border-blue-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      declined: "bg-red-100 text-red-800 border-red-200"
    };
    
    const labels = {
      completed: "Completed",
      accepted: "In Progress",
      pending: "Pending",
      declined: "Declined"
    };

    const currentStyle = styles[status] || "bg-gray-100 text-gray-600 border-gray-200";
    const label = labels[status] || status;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-small font-medium font-roboto border ${currentStyle}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Background Backdrop */}
      <div className="fixed inset-0 bg-dark/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      {/* Modal Container */}
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          
          {/* Modal Panel */}
          <div className="relative transform overflow-hidden rounded-2xl bg-light text-left shadow-2xl transition-all sm:my-8 w-full max-w-md border border-gray-100">
            
            {/* --- Header --- */}
            <div className="bg-light px-4 py-4 sm:px-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-heading font-poppins text-dark" id="modal-title">
                  Challenge Details
                </h3>
                {/* Fixed the ID slicing error */}
                <p className="text-small font-roboto text-gray-400 mt-0.5">
                  Ref: #{String(challenge.id).slice(0, 8)}
                </p>
              </div>
              <button
                type="button"
                className="rounded-full p-1 bg-transparent hover:bg-gray-50 text-gray-400 hover:text-dark transition-colors focus:outline-none"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* --- Body Content --- */}
            <div className="px-4 py-6 sm:px-6 bg-light">
              
              {/* 1. Visual Matchup */}
              <div className="relative flex items-center justify-between mb-8 px-2">
                 {/* Connection Line */}
                 <div className="absolute top-1/2 left-4 right-4 h-px bg-gray-200 -z-10"></div>

                 {/* Challenger */}
                 <div className="flex flex-col items-center z-10">
                    <div className="relative">
                      <img src={challengerImage} alt={challengerName} className="w-16 h-16 rounded-full border-4 border-light shadow-md object-cover bg-gray-50" />
                      <div className="absolute -bottom-1 -right-1 bg-primary text-light text-small font-poppins px-1.5 py-0.5 rounded-full border border-light">
                        P1
                      </div>
                    </div>
                    <span className="mt-2 text-subheading font-poppins text-dark line-clamp-1 max-w-[80px] text-center">{challengerName}</span>
                 </div>

                 {/* VS Badge */}
                 <div className="z-10">
                    <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center shadow-sm">
                      <span className="text-small font-bold font-poppins text-gray-400">VS</span>
                    </div>
                 </div>

                 {/* Receiver */}
                 <div className="flex flex-col items-center z-10">
                    <div className="relative">
                      <img src={challengedImage} alt={challengedName} className="w-16 h-16 rounded-full border-4 border-light shadow-md object-cover bg-gray-50" />
                      <div className="absolute -bottom-1 -left-1 bg-primary-light text-light text-small font-poppins px-1.5 py-0.5 rounded-full border border-light">
                        P2
                      </div>
                    </div>
                    <span className="mt-2 text-subheading font-poppins text-dark line-clamp-1 max-w-[80px] text-center">{challengedName}</span>
                 </div>
              </div>

              {/* 2. Info Cards */}
              <div className="space-y-3">
                
                {/* Habit Card */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-start gap-3">
                  <div className="p-2 bg-light rounded-lg shadow-sm text-primary">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  </div>
                  <div>
                    <h4 className="text-small font-bold font-roboto text-gray-400 uppercase tracking-wider mb-0.5">Target Habit</h4>
                    <p className="text-heading font-poppins text-primary">{habitName}</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                   {/* Status */}
                   <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-small font-bold font-roboto text-gray-400 uppercase tracking-wider mb-2">Current Status</p>
                      {getStatusBadge(challenge.status)}
                   </div>

                   {/* Date */}
                   <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-small font-bold font-roboto text-gray-400 uppercase tracking-wider mb-1">Start Date</p>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <span className="text-body font-roboto font-medium">{new Date(challenge.created_at).toLocaleDateString()}</span>
                      </div>
                   </div>
                </div>

              </div>
            </div>

            {/* --- Footer --- */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-row-reverse border-t border-gray-100">
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-lg bg-light px-3 py-2 text-subheading font-medium text-dark shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:w-auto transition-colors font-poppins"
                onClick={onClose}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewChallengeModal;