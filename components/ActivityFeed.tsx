import React, { useState, useEffect } from 'react';
import NeonCard from './ui/NeonCard';
import { BoltIcon, ChartBarIcon, SparklesIcon, UserIcon, RocketLaunchIcon } from './icons/Icons';
import { supabase } from '../lib/supabaseClient';

interface ActivityItem {
    id: string;
    type: 'trade' | 'prediction' | 'achievement' | 'join';
    user_name: string;
    content: string;
    timestamp: string;
}

const ActivityFeed: React.FC = () => {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Mock data for initial load
        const mockActivities: ActivityItem[] = [
            { id: '1', type: 'trade', user_name: 'Alex D.', content: 'a acheté 500 Sonatel (SNTS)', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
            { id: '2', type: 'prediction', user_name: 'Moussa K.', content: 'a prédit une baisse du BTC à -5%', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
            { id: '3', type: 'achievement', user_name: 'Sarah L.', content: 'a débloqué le badge "Baleine de l\'UEMOA"', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
            { id: '4', type: 'join', user_name: 'Fatou N.', content: 'vient de rejoindre le simulateur', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
        ];
        
        setActivities(mockActivities);
        setIsLoading(false);

        // real-time subscription (commented out until table exists)
        /*
        const channel = supabase
            .channel('public:activities')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities' }, payload => {
                setActivities(prev => [payload.new as ActivityItem, ...prev].slice(0, 10));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        */
    }, []);

    const getIcon = (type: ActivityItem['type']) => {
        switch (type) {
            case 'trade': return <ChartBarIcon className="w-4 h-4 text-neon-cyan" />;
            case 'prediction': return <SparklesIcon className="w-4 h-4 text-neon-violet" />;
            case 'achievement': return <RocketLaunchIcon className="w-4 h-4 text-neon-green" />;
            case 'join': return <UserIcon className="w-4 h-4 text-neon-magenta" />;
            default: return <BoltIcon className="w-4 h-4 text-gray-400" />;
        }
    };

    const formatTime = (iso: string) => {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / (1000 * 60));
        if (mins < 1) return 'À l\'instant';
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h`;
        return `${Math.floor(hours / 24)}j`;
    };

    return (
        <NeonCard variant="default" className="p-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30">
                    <BoltIcon className="w-5 h-5 text-neon-cyan" />
                </div>
                Flux d'Activité
            </h3>
            
            <div className="space-y-4">
                {isLoading ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="h-12 skeleton rounded-xl" />
                    ))
                ) : (
                    activities.map((item, index) => (
                        <div 
                            key={item.id} 
                            className="flex items-start gap-3 animate-fade-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="mt-1 flex-shrink-0">
                                {getIcon(item.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-300 leading-tight">
                                    <span className="font-bold text-white">{item.user_name}</span> {item.content}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{formatTime(item.timestamp)}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/5">
                <button className="text-xs text-neon-cyan hover:underline transition-all">
                    Voir toute l'activité →
                </button>
            </div>
        </NeonCard>
    );
};

export default ActivityFeed;
