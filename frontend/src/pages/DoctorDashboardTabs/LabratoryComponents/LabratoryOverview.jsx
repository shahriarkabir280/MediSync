import React, { memo, useState, useEffect } from 'react';
import { Sparkles, Search, FlaskConical, ArrowRight, Loader2, BookOpen, AlertCircle } from "lucide-react";
import { labApi } from '../../../lib/api';

const QuickActionCard = memo(({ title, subtitle, icon: Icon, onClick, colorClass }) => (
    <button
        onClick={onClick}
        className="group p-3.5 rounded-xl border border-border shadow-sm hover:shadow-md transition-all flex items-center gap-3 text-left bg-card w-full"
    >
        <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
            <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-foreground leading-tight">{title}</h4>
            <p className="text-muted-foreground text-[10px] mt-0.5 truncate">{subtitle}</p>
        </div>
        <ArrowRight className="w-3 h-3 text-muted-foreground/40 group-hover:text-blue-500 transition-colors flex-shrink-0" />
    </button>
));

const QuickActions = memo(({ onNavigateToPatients, onNavigateToOrders }) => {
    return (
        <div className="space-y-2.5">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <QuickActionCard
                    title="Order Templates"
                    subtitle="Reuse previous lab order configs"
                    icon={Sparkles}
                    onClick={() => onNavigateToOrders()}
                    colorClass="bg-blue-600"
                />
                <QuickActionCard
                    title="Find Patient"
                    subtitle="Search the patient database"
                    icon={Search}
                    onClick={onNavigateToPatients}
                    colorClass="bg-indigo-600"
                />
                <QuickActionCard
                    title="Test Catalog"
                    subtitle="Browse available tests"
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
            <div className="bg-card rounded-xl p-4 border border-border shadow-sm flex flex-col min-h-[200px] items-center justify-center">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin mb-2" />
                <p className="text-xs text-muted-foreground">Loading reviews...</p>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-xl p-3.5 border border-border shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-foreground">Pending Reviews</h3>
                <span className="text-[9px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full font-bold uppercase border border-rose-200">
                    Priority
                </span>
            </div>
            <div className="space-y-1.5">
                {reviews.length > 0 ? (
                    reviews.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-7 h-7 rounded-lg flex-shrink-0 ${item.abnormal ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'} flex items-center justify-center font-bold text-[9px]`}>
                                    {(item.test_name || 'LT').substring(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-foreground truncate">{item.test_name}</p>
                                    <p className="text-[9px] text-muted-foreground truncate">
                                        {item.patient_name} · {new Date(item.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => onViewReport?.(item.order_id)}
                                className={`text-[9px] font-bold px-2 py-1 rounded-md flex-shrink-0 ml-2 transition-all ${item.abnormal ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                            >
                                Review
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
                            <FlaskConical className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <p className="text-xs font-bold text-foreground">All caught up!</p>
                        <p className="text-[10px] text-muted-foreground">No results waiting for review.</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
