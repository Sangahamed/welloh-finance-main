import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { PredictionComment } from '../types';
import NeonButton from './ui/NeonButton';
import { PaperAirplaneIcon } from './icons/Icons';

interface PredictionChatProps {
    predictionId: string;
}

const PredictionChat: React.FC<PredictionChatProps> = ({ predictionId }) => {
    const { currentUser } = useAuth();
    const [comments, setComments] = useState<PredictionComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchComments = async () => {
            if (!supabase) return;
            const { data, error } = await supabase
                .from('prediction_comments')
                .select('*')
                .eq('prediction_id', predictionId)
                .order('timestamp', { ascending: true });

            if (!error && data) {
                setComments(data.map(d => ({
                    id: d.id,
                    predictionId: d.prediction_id,
                    userId: d.user_id,
                    userName: d.user_name,
                    content: d.content,
                    timestamp: d.timestamp
                })));
            }
            setIsLoading(false);
        };

        fetchComments();

        // Subscribe to real-time changes
        const channel = supabase
            ?.channel(`prediction:${predictionId}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'prediction_comments',
                filter: `prediction_id=eq.${predictionId}`
            }, payload => {
                const updated = payload.new;
                setComments(prev => [...prev, {
                    id: updated.id,
                    predictionId: updated.prediction_id,
                    userId: updated.user_id,
                    userName: updated.user_name,
                    content: updated.content,
                    timestamp: updated.timestamp
                }]);
            })
            .subscribe();

        return () => {
            if (channel) supabase?.removeChannel(channel);
        };
    }, [predictionId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [comments]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUser || !supabase) return;

        const commentData = {
            prediction_id: predictionId,
            user_id: currentUser.id,
            user_name: currentUser.fullName,
            content: newComment.trim()
        };

        const { error } = await supabase.from('prediction_comments').insert(commentData);
        if (!error) {
            setNewComment('');
        }
    };

    return (
        <div className="flex flex-col h-[400px] bg-dark-800/50 rounded-xl border border-white/10 overflow-hidden">
            <div className="p-3 border-b border-white/10 bg-white/5">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Discussion</h4>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-neon-violet border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 text-sm">
                        Aucun message. Soyez le premier à commenter !
                    </div>
                ) : (
                    comments.map(c => (
                        <div key={c.id} className={`flex flex-col ${c.userId === currentUser?.id ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-xs font-bold text-gray-400">{c.userName}</span>
                                <span className="text-[10px] text-gray-600">{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className={`
                                px-3 py-2 rounded-2xl text-sm max-w-[85%]
                                ${c.userId === currentUser?.id 
                                    ? 'bg-neon-violet text-white rounded-tr-none' 
                                    : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/5'}
                            `}>
                                {c.content}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-white/5 flex gap-2">
                <input
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Votre message..."
                    className="flex-1 bg-dark-700/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-violet focus:outline-none placeholder-gray-500"
                />
                <button 
                    type="submit" 
                    disabled={!newComment.trim()}
                    className="p-2 bg-neon-violet text-white rounded-lg hover:bg-neon-violet/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    <PaperAirplaneIcon className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
};

export default PredictionChat;
