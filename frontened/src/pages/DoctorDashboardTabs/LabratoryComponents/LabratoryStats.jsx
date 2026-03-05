import React, { memo } from 'react';
import { FileText, AlertCircle, Clock, Calendar, TrendingUp } from "lucide-react";

const StatCard = memo(({ title, value, subValue, icon: Icon, type, loading }) => {
    const getStyles = () => {
        switch (type) {
            case 'today':
                return "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400";
            case 'urgent':
                return "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400";
            case 'unreviewed':
                return "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400";
            case 'weekly':
                return "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400";
            default:
                return "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400";
        }
    };

    return (
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all">
            <div className="flex flex-col h-full justify-between">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg ${getStyles()}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex items-center space-x-1">
                        {type === 'urgent' && (
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                        )}
                        <span className="text-[10px] uppercase font-bold text-muted-foreground/60">Live</span>
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">{title}</h4>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-bold text-foreground">
                            {loading ? '...' : value}
                        </span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border/50">
                        {subValue}
                    </div>
                </div>
            </div>
        </div>
    );
});

const LabratoryStats = memo(({ labStats, loading }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                title="Today's Reports"
                value={labStats.today?.total_today || 0}
                loading={loading}
                type="today"
                icon={FileText}
                subValue={
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-orange-600">
                            {labStats.today?.pending_today || 0} Pending
                        </span>
                        <span className="text-xs font-medium text-emerald-600">
                            {labStats.today?.completed_today || 0} Done
                        </span>
                    </div>
                }
            />

            <StatCard
                title="Urgent Reports"
                value={labStats.urgent?.urgent_count || 0}
                loading={loading}
                type="urgent"
                icon={AlertCircle}
                subValue={<p className="text-xs text-rose-600">Requires immediate attention</p>}
            />

            <StatCard
                title="Unreviewed"
                value={labStats.unreviewed?.unreviewed_count || 0}
                loading={loading}
                type="unreviewed"
                icon={Clock}
                subValue={<p className="text-xs text-amber-600">Awaiting physician review</p>}
            />

            <StatCard
                title="Completed This Week"
                value="156"
                loading={loading}
                type="weekly"
                icon={Calendar}
                subValue={
                    <div className="flex items-center text-xs font-medium text-emerald-600">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        <span>+23% <span className="text-muted-foreground ml-1">vs last week</span></span>
                    </div>
                }
            />
        </div>
    );
});

export default LabratoryStats;
export { StatCard };
