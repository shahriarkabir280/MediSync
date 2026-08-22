import React, { memo } from 'react';
import { FileText, AlertCircle, Clock, Calendar, TrendingUp } from "lucide-react";

const StatCard = memo(({ title, value, subValue, icon: Icon, type, loading }) => {
    const getStyles = () => {
        switch (type) {
            case 'today':     return "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400";
            case 'urgent':    return "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400";
            case 'unreviewed':return "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400";
            case 'weekly':    return "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400";
            default:          return "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400";
        }
    };

    return (
        <div className="bg-card rounded-xl p-3.5 border border-border shadow-sm hover:shadow-md transition-all">
            {/* Top row: icon + live indicator */}
            <div className="flex items-center justify-between mb-2.5">
                <div className={`p-1.5 rounded-lg ${getStyles()}`}>
                    <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-1">
                    {type === 'urgent' && (
                        <span className="flex h-1.5 w-1.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
                        </span>
                    )}
                    <span className="text-[9px] uppercase font-bold text-muted-foreground/50">Live</span>
                </div>
            </div>

            {/* Title + Value */}
            <h4 className="text-[10px] font-semibold text-muted-foreground mb-0.5 uppercase tracking-wide">{title}</h4>
            <span className="text-2xl font-bold text-foreground leading-none">
                {loading ? '—' : value}
            </span>

            {/* Sub-value */}
            <div className="mt-2 pt-2 border-t border-border/50 text-[10px]">
                {subValue}
            </div>
        </div>
    );
});

const LabratoryStats = memo(({ labStats, loading }) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
                title="Today's Reports"
                value={labStats.today?.total_today || 0}
                loading={loading}
                type="today"
                icon={FileText}
                subValue={
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-orange-600">{labStats.today?.pending_today || 0} Pending</span>
                        <span className="font-medium text-emerald-600">{labStats.today?.completed_today || 0} Done</span>
                    </div>
                }
            />

            <StatCard
                title="Urgent"
                value={labStats.urgent?.urgent_count || 0}
                loading={loading}
                type="urgent"
                icon={AlertCircle}
                subValue={<p className="text-rose-600">Needs attention</p>}
            />

            <StatCard
                title="Unreviewed"
                value={labStats.unreviewed?.unreviewed_count || 0}
                loading={loading}
                type="unreviewed"
                icon={Clock}
                subValue={<p className="text-amber-600">Awaiting review</p>}
            />

            <StatCard
                title="This Week"
                value="156"
                loading={loading}
                type="weekly"
                icon={Calendar}
                subValue={
                    <div className="flex items-center font-medium text-emerald-600">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        <span>+23% <span className="text-muted-foreground">vs last week</span></span>
                    </div>
                }
            />
        </div>
    );
});

export default LabratoryStats;
export { StatCard };
