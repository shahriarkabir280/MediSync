import React, { memo, useState, useEffect } from 'react';
import { Sparkles, Search, FlaskConical, Calendar, ArrowRight, Loader2, BookOpen, AlertCircle } from "lucide-react";
import { labApi } from '../../../lib/api';
import { toast } from 'react-hot-toast';

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

const QuickActions = memo(({ onNavigateToPatients, onNavigateToOrders }) => {
    return (
        <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <QuickActionCard
                    title="Order Templates"
                    subtitle="Reuse previous lab order configurations"
                    icon={Sparkles}
                    onClick={() => onNavigateToOrders()}
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
                    title="Test Catalog"
                    subtitle="Browse available tests and requirements"
                    icon={BookOpen}
                    onClick={() => onNavigateToOrders()}
                    colorClass="bg-emerald-600"
                />
                <QuickActionCard
                    title="Urgent Tracking"
                    subtitle="High-priority active orders"
                    icon={AlertCircle}
                    onClick={() => onNavigateToOrders('urgent')}
                    colorClass="bg-rose-600"
                />
            </div>
        </div>
    );
});

const PendingReviews = memo(({ reviews, loading, onViewReport }) => {
    if (loading) {
        return (
            <div className="bg-card rounded-2xl p-6 border border-border shadow-sm flex flex-col h-full min-h-[300px] items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
                <p className="text-sm text-muted-foreground font-medium">Loading pending reviews...</p>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold text-foreground">Pending Reviews</h3>
                <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-bold uppercase border border-rose-200">
                    Priority
                </span>
            </div>
            <div className="flex-1 space-y-3">
                {reviews.length > 0 ? (
                    reviews.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl hover:bg-muted transition-colors cursor-pointer border border-transparent">
                            <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-lg ${item.abnormal ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'} flex items-center justify-center font-bold text-xs`}>
                                    {(item.test_name || 'LT').substring(0, 2).toUpperCase()}
                                </div>
                                <div className="max-w-[180px]">
                                    <p className="text-sm font-semibold text-foreground truncate">{item.test_name}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {item.patient_name} • {new Date(item.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => onViewReport?.(item.order_id)} 
                                className={`text-[10px] font-bold px-3 py-1 rounded-lg border transition-all ${item.abnormal ? 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700' : 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700'}`}
                            >
                                Review
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                            <FlaskConical className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-bold text-foreground">All caught up!</p>
                        <p className="text-xs text-muted-foreground">No results waiting for review.</p>
                    </div>
                )}
            </div>
        </div>
    );
});

const LabratoryOverview = ({ onNavigateToPatients, onNavigateToOrders, onViewReport }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setLoading(true);
                const response = await labApi.getPendingReviews(5);
                if (response.success) {
                    setReviews(response.data);
                }
            } catch (error) {
                console.error('Error fetching pending reviews:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <QuickActions 
                onNavigateToPatients={onNavigateToPatients} 
                onNavigateToOrders={onNavigateToOrders} 
            />
            <PendingReviews reviews={reviews} loading={loading} onViewReport={onViewReport} />
        </div>
    );
};

export default LabratoryOverview;
export { QuickActions, PendingReviews };
