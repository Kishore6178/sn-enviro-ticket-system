import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Trophy, Clock, CheckCircle, Activity, Award, Medal } from 'lucide-react';
import { motion } from 'framer-motion';

export const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const response = await api.get('/users/performance');
        if (response.data.success) {
          setLeaderboard(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, []);

  const getRankBadge = (index: number) => {
    if (index === 0) return <Trophy className="w-8 h-8 text-yellow-400 drop-shadow-md" />;
    if (index === 1) return <Medal className="w-7 h-7 text-gray-300 drop-shadow-md" />;
    if (index === 2) return <Medal className="w-7 h-7 text-amber-700 drop-shadow-md" />;
    return <span className="text-xl font-bold text-muted-foreground w-8 text-center">{index + 1}</span>;
  };

  const getRankBg = (index: number) => {
    if (index === 0) return 'bg-yellow-50/50 border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/20';
    if (index === 1) return 'bg-gray-50/50 border-gray-200 dark:bg-gray-500/10 dark:border-gray-500/20';
    if (index === 2) return 'bg-amber-50/50 border-amber-200 dark:bg-amber-700/10 dark:border-amber-700/20';
    return 'bg-card border-border hover:bg-secondary/50';
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Activity className="w-10 h-10 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center">
            <Award className="w-8 h-8 mr-3 text-primary" />
            Technician Leaderboard
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">Performance rankings based on resolution speed and ticket volume.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {leaderboard.length > 0 ? (
          leaderboard.map((tech, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={tech._id}
              className={`rounded-2xl border p-6 flex flex-col md:flex-row items-center justify-between gap-6 transition-all shadow-sm ${getRankBg(index)}`}
            >
              <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="flex items-center justify-center w-12 h-12 shrink-0">
                  {getRankBadge(index)}
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-xl font-bold text-primary shadow-sm shrink-0">
                    {tech.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{tech.name}</h3>
                    <p className="text-sm text-muted-foreground font-medium">{tech.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                <div className="flex flex-col items-center justify-center min-w-[120px] p-3 rounded-xl bg-background/50 border border-border/50">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center"><CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Resolved</span>
                  <span className="text-2xl font-extrabold text-foreground">{tech.resolvedTickets}</span>
                </div>
                
                <div className="flex flex-col items-center justify-center min-w-[120px] p-3 rounded-xl bg-background/50 border border-border/50">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center"><Clock className="w-3.5 h-3.5 mr-1 text-blue-500" /> Avg Time</span>
                  <span className="text-2xl font-extrabold text-foreground">
                    {tech.avgResolutionTimeHours > 0 ? `${tech.avgResolutionTimeHours.toFixed(1)}h` : '--'}
                  </span>
                </div>
                
                <div className="flex flex-col items-center justify-center min-w-[120px] p-3 rounded-xl bg-background/50 border border-border/50">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center"><Activity className="w-3.5 h-3.5 mr-1 text-amber-500" /> Active Now</span>
                  <span className="text-2xl font-extrabold text-foreground">{tech.activeTickets}</span>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-20 bg-card rounded-2xl border border-border">
            <Trophy className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground">No Performance Data</h3>
            <p className="text-muted-foreground">Assign and resolve tickets to generate rankings.</p>
          </div>
        )}
      </div>
    </div>
  );
};
