import React, { memo } from 'react';
import { Sparkles, Search, FlaskConical, Calendar, ArrowRight } from "lucide-react";

const QuickActionCard = memo(({ title, subtitle, icon: Icon, onClick, colorClass }) => (
    <button
        onClick={onClick}
        className={`group p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all flex flex-col items-start text-left bg-card w-full`}
    >
        <div className={`p-2 rounded-lg ${colorClass} mb-4`}>
            <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
            <h4 className="text-base font-bold text-foreground mb-1">{title}</h4>
            <p className="text-muted-foreground text-xs">{subtitle}</p>
        </div>
        <div className="mt-6 flex items-center text-blue-600 text-[10px] font-bold uppercase tracking-wider">
            <span>Open</span>
            <ArrowRight className="w-3 h-3 ml-1" />
        </div>
    </button>
));

const QuickActions = memo(({ onNavigateToPatients }) => {
    return (
        <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <QuickActionCard
                    title="Order Templates"
                    subtitle="Reuse previous lab order configurations"
                    icon={Sparkles}
                    onClick={() => alert('Order Templates feature coming soon')}
                    colorClass="bg-blue-600"
                />
                <QuickActionCard
                    title="Find Patient"
                    subtitle="Search the complete patient database"
                    icon={Search}
                    onClick={onNavigateToPatients}
                    colorClass="bg-indigo-600"
                />
                <QuickActionCard
                    title="Lab Analytics"
                    subtitle="View trends and diagnostic data"
                    icon={FlaskConical}
                    onClick={() => { }}
                    colorClass="bg-emerald-600"
                />
                <QuickActionCard
                    title="Calendar"
                    subtitle="Schedule tests and follow-ups"
                    icon={Calendar}
                    onClick={() => { }}
                    colorClass="bg-rose-600"
                />
            </div>
        </div>
    );
});

const PendingReviews = memo(() => {
    return (
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold text-foreground">Pending Reviews</h3>
                <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-bold uppercase border border-rose-200">
                    Priority
                </span>
            </div>
            <div className="flex-1 space-y-3">
                {[
                    { id: 1, name: 'Lipid Profile Complete', time: '2 mins ago', initial: 'LP' },
                    { id: 2, name: 'Basic Metabolic Panel', time: '14 mins ago', initial: 'BM' },
                    { id: 3, name: 'Liver Function Test', time: '1 hr ago', initial: 'LF' },
                    { id: 4, name: 'Thyroid Panel (TSH)', time: '2 hrs ago', initial: 'TH' }
                ].map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl hover:bg-muted transition-colors cursor-pointer border border-transparent">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-xs">
                                {item.initial}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">{item.name}</p>
                                <p className="text-[10px] text-muted-foreground">{item.time}</p>
                            </div>
                        </div>
                        <button className="text-[10px] font-bold text-blue-600 hover:underline px-2 py-1">
                            Review
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
});

const LabratoryOverview = ({ onNavigateToPatients }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <QuickActions onNavigateToPatients={onNavigateToPatients} />
            <PendingReviews />
        </div>
    );
};

export default LabratoryOverview;
export { QuickActions, PendingReviews };
