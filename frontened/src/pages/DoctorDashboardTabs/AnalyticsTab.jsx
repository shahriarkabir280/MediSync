import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Users, Calendar, Activity, RefreshCw, Download, ChevronDown, TrendingUp, TrendingDown, Clock, PieChart, BarChart3, ArrowUpRight } from "lucide-react";
import { analyticsApi, doctorApi } from "../../lib/api";
import { useDoctor } from "../../hooks/useDoctor";

const TakaIcon = ({ className }) => (
  <span className={`${className} flex items-center justify-center font-bold select-none`}>৳</span>
);

const AnalyticsTab = memo(() => {
  const { doctorId } = useDoctor();
  const [appointmentAnalytics, setAppointmentAnalytics] = useState(null);
  const [patientAnalytics, setPatientAnalytics] = useState(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTimeRange, setActiveTimeRange] = useState('month');

  // Helper to calculate date ranges for backend
  const getDateRangeParams = useCallback((range) => {
    const end = new Date();
    const start = new Date();

    switch (range) {
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
      case 'month':
      default:
        start.setMonth(end.getMonth() - 1);
        break;
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  }, []);

  // Metric Card Component
  const MetricCard = ({ title, value, subtext, icon: Icon, trend, colorClass }) => (
    <div className="bg-card rounded-3xl p-5 sm:p-6 lg:p-7 border border-border shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-24 h-24 sm:w-28 sm:h-28 lg:w-36 lg:h-36 opacity-10 dark:opacity-5 rounded-bl-full -mr-8 -mt-8 bg-${colorClass}-500 transition-transform group-hover:scale-110`}></div>
      <div className="flex items-start justify-between relative z-10 gap-4">
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-muted-foreground mb-1.5 text-[10px] sm:text-xs uppercase tracking-wider leading-tight">{title}</h4>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3">{value}</p>
          <div className="flex items-center gap-2 overflow-hidden flex-wrap">
            {trend && (
              <span className={`flex items-center text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${trend > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {trend > 0 ? <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
                {Math.abs(trend)}%
              </span>
            )}
            <span className="text-[10px] text-muted-foreground font-bold uppercase truncate">{subtext}</span>
          </div>
        </div>
        <div className={`p-4 bg-${colorClass}-500/10 rounded-[1.25rem] sm:rounded-2xl transition-colors group-hover:bg-${colorClass}-500/20 shrink-0`}>
          <Icon className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-${colorClass}-500`} />
        </div>
      </div>
    </div>
  );

  // Custom Pie Chart Component
  const ModernPieChart = ({ data, title, tagline }) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const total = data?.reduce((acc, curr) => acc + Number(curr.count), 0) || 0;
    let cumulativePercent = 0;

    const getCoordinatesForPercent = (percent) => {
      const x = Math.cos(2 * Math.PI * percent);
      const y = Math.sin(2 * Math.PI * percent);
      return [x, y];
    };

    return (
      <div className="bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-sm h-full flex flex-col h-full flex flex-col overflow-hidden">
        <div className="mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
            <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 shrink-0" />
            <span className="truncate">{title}</span>
          </h3>
          {tagline && <p className="text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 ml-1 sm:ml-7 truncate">{tagline}</p>}
        </div>
        <div className="flex flex-col items-center gap-6 sm:gap-8 flex-1 w-full">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 shrink-0">
            <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full">
              {total === 0 ? (
                <circle cx="0" cy="0" r="1" fill="currentColor" className="text-muted/20" />
              ) : data?.filter(i => Number(i.count) > 0).length === 1 ? (
                <circle cx="0" cy="0" r="1" fill={colors[data.findIndex(i => Number(i.count) > 0) % colors.length]} />
              ) : (
                data?.map((item, index) => {
                  const count = Number(item.count);
                  if (count === 0) return null;
                  const percent = count / total;
                  const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
                  cumulativePercent += percent;
                  const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
                  const largeArcFlag = percent > 0.5 ? 1 : 0;
                  const pathData = [`M ${startX} ${startY}`, `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, `L 0 0`].join(' ');
                  return (
                    <path
                      key={index}
                      d={pathData}
                      fill={colors[index % colors.length]}
                      className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                    />
                  );
                })
              )}
            </svg>
            <div className="absolute inset-4 bg-card rounded-full flex items-center justify-center flex-col shadow-inner">
              <span className="text-xl font-black text-foreground">{total}</span>
              <span className="text-[10px] uppercase text-muted-foreground font-black tracking-widest">{total === 0 ? 'Empty' : 'Total'}</span>
            </div>
          </div>
          <div className="w-full space-y-3 mt-2 sm:mt-4">
            {total === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground font-medium font-bold uppercase tracking-widest">No records</p>
              </div>
            ) : data?.map((item, index) => (
              <div key={index} className="flex items-center justify-between group gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[index % colors.length] }}></div>
                  <span className="text-[11px] sm:text-xs font-bold text-foreground capitalize leading-tight">{item.status || item.gender || item.age_group || 'Value'}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-auto">
                  <span className="text-[11px] sm:text-xs font-black text-foreground">{item.count}</span>
                  <span className="text-[10px] font-bold text-muted-foreground w-8 text-right">{total > 0 ? ((Number(item.count) / total) * 100).toFixed(0) : 0}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // SVG Area Chart
  const AreaTrendChart = ({ data, color, title, tagline }) => {
    if (!data || data.length === 0) return (
      <div className="h-full flex items-center justify-center bg-muted/30 rounded-3xl border border-dashed border-border p-8">
        <p className="text-muted-foreground text-sm italic font-medium">Insufficient performance data</p>
      </div>
    );

    const maxValue = Math.max(...data.map(d => d.value)) || 10;
    const points = data.map((d, i) => {
      const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
      const y = 100 - (d.value / maxValue) * 100;
      return `${x},${y}`;
    }).join(' ');

    const areaPoints = data.length > 1 ? `0,100 ${points} 100,100` : `0,100 50,${100 - (data[0].value / maxValue) * 100} 100,100`;

    return (
      <div className="bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-sm group h-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="font-bold text-foreground flex items-center gap-2 text-sm sm:text-base">
              <TrendingUp className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="truncate">{title}</span>
            </h3>
            {tagline && <p className="text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 ml-6">{tagline}</p>}
          </div>
          <span className="text-[9px] sm:text-[10px] font-black text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-lg uppercase tracking-widest shrink-0">Live Performance</span>
        </div>
        <div className="relative h-32 w-full mb-4">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id={`gradient-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`M ${areaPoints}`} fill={`url(#gradient-${title.replace(/\s+/g, '')})`} className="transition-all duration-1000" />
            <polyline
              points={points}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-1000"
            />
          </svg>
        </div>
        <div className="flex justify-between mt-2 px-1">
          {data.map((d, i) => {
            if (data.length > 8 && i % Math.floor(data.length / 4) !== 0 && i !== data.length - 1) return null;
            return (
              <div key={i} className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">
                {d.label}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const fetchAnalytics = useCallback(async () => {
    if (!doctorId) return;
    try {
      setLoading(true);
      const params = getDateRangeParams(activeTimeRange);
      const [appointmentData, patientData, revenueData, statsData] = await Promise.all([
        analyticsApi.getAppointmentAnalytics(doctorId, params),
        analyticsApi.getPatientAnalytics(doctorId),
        analyticsApi.getRevenueAnalytics(doctorId, params),
        doctorApi.getStats(doctorId)
      ]);

      setAppointmentAnalytics(appointmentData.data);
      setPatientAnalytics(patientData.data);
      setRevenueAnalytics(revenueData.data);
      setStats(statsData.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [doctorId, activeTimeRange, getDateRangeParams]);

  useEffect(() => {
    if (doctorId) fetchAnalytics();
  }, [doctorId, activeTimeRange, fetchAnalytics]);

  const practiceHealth = useMemo(() => {
    const cancelled = Number(appointmentAnalytics?.cancellationStats?.find(s => s.status === 'cancelled')?.count || 0);
    const completed = Number(appointmentAnalytics?.cancellationStats?.find(s => s.status === 'completed')?.count || 0);
    const total = cancelled + completed;
    const noShowRate = total > 0 ? ((cancelled / total) * 100).toFixed(1) : 0;

    const revenue = Number(revenueAnalytics?.totalRevenue || 0);
    const appointments = appointmentAnalytics?.appointmentsByStatus?.reduce((a, c) => a + Number(c.count), 0) || 1;
    const avgRevenue = (revenue / appointments).toFixed(2);

    return { noShowRate, avgRevenue };
  }, [appointmentAnalytics, revenueAnalytics]);

  if (loading) return <div className="flex items-center justify-center h-screen bg-transparent"><RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" /></div>;
  if (error) return <div className="p-12 text-center bg-rose-500/10 rounded-3xl m-8 border border-rose-500/20"><p className="text-rose-500 font-bold mb-4">Error Syncing Intelligence: {error}</p><button onClick={fetchAnalytics} className="px-8 py-3 bg-rose-500 text-white rounded-2xl font-black uppercase shadow-xl shadow-rose-500/20">Refresh Database</button></div>;

  return (
    <div className="min-h-screen bg-transparent pb-24 transition-colors duration-300">
      <div className="bg-card/80 dark:bg-card/50 backdrop-blur-xl sticky top-0 z-30 border-b border-border shadow-sm p-4 sm:p-6 transition-colors duration-300">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Practice Intelligence</span>
            </div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">Practice Insights</h1>
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <div className="bg-muted/50 p-1.5 rounded-2xl flex items-center gap-1 shadow-inner border border-border/50">
              {['week', 'month', 'year'].map(range => (
                <button
                  key={range}
                  onClick={() => setActiveTimeRange(range)}
                  className={`px-3 sm:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 min-w-[70px] sm:min-w-[95px] ${activeTimeRange === range
                    ? 'bg-card text-indigo-500 shadow-xl shadow-black/5 dark:shadow-indigo-500/10 scale-105 z-10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/50'}`}
                >
                  {range === 'week' ? 'Weekly' : range === 'month' ? 'Monthly' : 'Yearly'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-8 max-w-[1600px] mx-auto space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          <MetricCard title="Total Patients" value={patientAnalytics?.totalPatients || 0} subtext="Lifetime base" icon={Users} trend={patientAnalytics?.trend} colorClass="blue" />
          <MetricCard title="Loyal Revisit" value={appointmentAnalytics?.recurringPatients || 0} subtext="Recurring base" icon={RefreshCw} colorClass="emerald" />
          <MetricCard title="Active visits" value={appointmentAnalytics?.appointmentsByStatus?.reduce((a, c) => a + Number(c.count), 0) || 0} subtext={`Period: ${activeTimeRange}`} icon={Calendar} trend={appointmentAnalytics?.visitTrend} colorClass="indigo" />
          <MetricCard title="Invoiced Earn" value={`৳${revenueAnalytics?.totalRevenue?.toLocaleString() || '0.00'}`} subtext={`Period: ${activeTimeRange}`} icon={TakaIcon} trend={revenueAnalytics?.trend} colorClass="emerald" />
          <MetricCard title="Pending" value={stats?.pendingAppointments || 0} subtext="Needs attention" icon={Activity} colorClass="orange" />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AreaTrendChart
            title="Revenue Performance"
            tagline="Income trends over selected range"
            data={revenueAnalytics?.revenueByMonth?.map(m => ({ label: m.month.split(' ')[0], value: Number(m.total) })) || []}
            color="#8b5cf6"
          />
          <AreaTrendChart
            title="Patient Flow"
            tagline="Daily volume of patient arrivals"
            data={appointmentAnalytics?.appointmentsTrend?.map(t => ({ label: t.date.split('-')[2], value: Number(t.count) })) || []}
            color="#3b82f6"
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 transition-all">
          <div className="bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-lg transition-transform hover:scale-[1.01] h-full flex flex-col">
            <div className="mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 shrink-0" />
                <span className="truncate">Practice Mix</span>
              </h3>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 ml-1 sm:ml-7 truncate">Service distribution breakdown</p>
            </div>
            <div className="space-y-6 flex-1">
              {['consultation', 'follow-up', 'procedure', 'check-up'].map((type) => {
                const data = appointmentAnalytics?.appointmentsByType?.find(t => t.appointment_type === type);
                const count = Number(data?.count || 0);
                const totalVisits = appointmentAnalytics?.appointmentsByType?.reduce((a, c) => a + Number(c.count), 0) || 1;
                return (
                  <div key={type} className="space-y-2">
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-1">
                      <span className="text-muted-foreground">{type === 'procedure' ? 'Surgeries' : type}</span>
                      <span className="text-foreground">{count} visits</span>
                    </div>
                    <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                      <div
                        className={`h-full transition-all duration-1000 rounded-full ${type === 'consultation' ? 'bg-blue-500' : type === 'follow-up' ? 'bg-indigo-500' : type === 'procedure' ? 'bg-purple-500' : 'bg-emerald-500'}`}
                        style={{ width: `${(count / totalVisits) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-lg transition-transform hover:scale-[1.01] h-full flex flex-col">
            <div className="mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 shrink-0" />
                <span className="truncate">Age Categories</span>
              </h3>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 ml-1 sm:ml-7 truncate">Demographics by age group</p>
            </div>
            <div className="space-y-5 flex-1">
              {(patientAnalytics?.patientsByAgeGroup?.length > 0 ? patientAnalytics.patientsByAgeGroup : [{ age_group: 'N/A', count: 0 }]).map((item, index) => (
                <div key={index} className="space-y-2 group/bar">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{item.age_group}</span>
                    <span className="text-xs font-black text-foreground group-hover/bar:text-purple-500 transition-colors">{item.count}</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-1000 group-hover/bar:from-purple-600 group-hover/bar:to-indigo-600"
                      style={{ width: `${(item.count / (Math.max(...(patientAnalytics?.patientsByAgeGroup?.map(i => i.count) || [1])) || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <ModernPieChart
            title="Loyalty Profile"
            tagline="Returning vs New Admissions"
            data={[{ status: 'Returning', count: appointmentAnalytics?.recurringPatients || 0 }, { status: 'New Admissions', count: Math.max(0, (patientAnalytics?.totalPatients || 0) - (appointmentAnalytics?.recurringPatients || 0)) }]}
          />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
          <ModernPieChart
            title="Appointment Status"
            tagline="Daily session completion rate"
            data={appointmentAnalytics?.appointmentsByStatus || []}
          />
          <ModernPieChart
            title="Gender Demographics"
            tagline="Distribution by gender identity"
            data={patientAnalytics?.patientsByGender || []}
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            <div className="bg-card rounded-[2rem] p-6 sm:p-8 border border-border shadow-xl flex flex-col justify-center">
              <div className="mb-6">
                <h3 className="text-xs font-black text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
                  <Activity className="w-4 h-4 text-rose-500" />
                  Practice Health KPIs
                </h3>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tight mt-1 ml-6">Operational performance metrics</p>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-center p-6 bg-rose-500/10 border border-rose-500/20 rounded-[2rem] transition-all hover:bg-rose-500/20">
                  <div>
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-1">No-Show / Cancel</span>
                    <span className="text-4xl font-black text-rose-500 leading-none">{practiceHealth.noShowRate}%</span>
                  </div>
                  <div className="w-12 h-12 bg-card rounded-2xl shadow-sm flex items-center justify-center text-rose-500"><Activity className="w-6 h-6" /></div>
                </div>
                <div className="flex justify-between items-center p-6 bg-blue-500/10 border border-blue-500/20 rounded-[2rem] transition-all hover:bg-blue-500/20">
                  <div>
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-1">Avg Revenue / Visit</span>
                    <span className="text-4xl font-black text-blue-500 leading-none">৳{practiceHealth.avgRevenue}</span>
                  </div>
                  <div className="w-12 h-12 bg-card rounded-2xl shadow-sm flex items-center justify-center text-blue-500"><TakaIcon className="text-xl" /></div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-[2rem] p-6 sm:p-8 border border-border shadow-xl flex flex-col">
              <div className="mb-6">
                <h3 className="text-xs font-black text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
                  <PieChart className="w-4 h-4 text-emerald-500" />
                  Experience Score
                </h3>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tight mt-1 ml-6">Aggregated patient sentiment</p>
              </div>
              <div className="flex items-center justify-between mb-8 p-6 bg-emerald-500/10 rounded-[2rem] border border-emerald-500/20">
                <div>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Clinic Average</p>
                  <p className="text-4xl font-black text-foreground leading-none">
                    {appointmentAnalytics?.feedback?.averageRating || '0.0'}
                    <span className="text-sm font-bold text-emerald-500/30">/5.0</span>
                  </p>
                </div>
                <div className="w-16 h-16 bg-card rounded-3xl shadow-sm flex items-center justify-center text-4xl">
                  {Number(appointmentAnalytics?.feedback?.averageRating) >= 4.5 ? '🏆' : '⭐'}
                </div>
              </div>
              <div className="space-y-4">
                {(appointmentAnalytics?.feedback?.recent?.length > 0
                  ? appointmentAnalytics.feedback.recent
                  : [{ patient_name: "System", comment: "No feedback yet", rating: 5 }]
                ).map((f, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-muted/20">
                    <div className="text-2xl">{Number(f.rating) >= 5 ? "🤩" : Number(f.rating) >= 4 ? "😊" : "🤔"}</div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-black text-foreground truncate">{f.patient_name}</p>
                      <p className="text-[10px] text-muted-foreground italic truncate">"{f.comment}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-[2rem] p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 group-hover:scale-110 transition-transform blur-2xl"></div>
            <div className="mb-10">
              <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-blue-300">
                <Clock className="w-5 h-5" /> Efficiency Dashboard
              </h3>
              <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest mt-1 ml-7">Wait time & session analysis</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 relative z-10">
              <div className="space-y-2 border-l-2 border-blue-500/30 pl-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-300/60">Avg Consultation</p>
                <p className="text-3xl sm:text-5xl font-black tracking-tighter">
                  {appointmentAnalytics?.efficiency?.avgConsultation || '0'}
                  <span className="text-sm font-bold text-blue-400/50 ml-2">min</span>
                </p>
                <p className="text-xs text-blue-200/50 font-bold uppercase tracking-widest">Optimal Session</p>
              </div>
              <div className="space-y-2 border-l-2 border-blue-500/30 pl-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-300/60">Wait Time Index</p>
                <p className="text-3xl sm:text-5xl font-black tracking-tighter text-emerald-400">
                  {appointmentAnalytics?.efficiency?.avgWaitTime || '0'}
                  <span className="text-sm font-bold text-emerald-400/30 ml-2">min</span>
                </p>
                <p className="text-xs text-blue-200/50 font-bold uppercase tracking-widest">Top 5% Perf</p>
              </div>
            </div>
            <div className="mt-12 p-6 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-md">
              <p className="text-[11px] text-blue-100/70 italic leading-relaxed">
                {Number(appointmentAnalytics?.efficiency?.avgWaitTime) < 15
                  ? "Morning peak flow is handled exceptionally well. Wait times are well below the clinical threshold."
                  : "Peak hour congestion is slightly increasing wait times. Consider optimizing afternoon staffing."}
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-8">
          <div className="bg-card rounded-[2.5rem] p-6 sm:p-10 border border-border shadow-xl lg:col-span-3 text-left">
            <div className="mb-6 sm:mb-10">
              <h3 className="text-xl font-black text-foreground flex items-center gap-3">
                <div className="p-3 bg-purple-500/10 rounded-2xl"><Calendar className="w-6 h-6 text-purple-500" /></div>
                Weekly Demand Profile
              </h3>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 ml-16">Patient load mapped across days</p>
            </div>
            <div className="flex items-end justify-between h-56 gap-1 sm:gap-4">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                const dayData = appointmentAnalytics?.appointmentsByDay?.find(d => d.day.trim() === day);
                const count = Number(dayData?.count || 0);
                const maxCount = Math.max(...(appointmentAnalytics?.appointmentsByDay?.map(d => Number(d.count)) || [1])) || 1;
                const height = (count / maxCount) * 100;

                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-4 h-full justify-end group">
                    <div className="relative w-full flex flex-col justify-end h-full">
                      <div
                        className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-2xl transition-all duration-1000 group-hover:brightness-110 shadow-lg shadow-black/5"
                        style={{ height: `${Math.max(5, height)}%` }}
                      >
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#0f172a] text-white text-[10px] font-black px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 border border-white/10">
                          {count}
                        </div>
                      </div>
                    </div>
                    <span className="text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest">{day.substring(0, 3)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-card rounded-[2.5rem] p-6 sm:p-10 border border-border shadow-xl relative lg:col-span-2">
            <div className="mb-6 sm:mb-10">
              <h3 className="text-xl font-black text-foreground flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 rounded-2xl"><Clock className="w-6 h-6 text-blue-500" /></div>
                Traffic Matrix
              </h3>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 ml-16">Hourly arrival density heat</p>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-4">
              {appointmentAnalytics?.peakHours?.map((hour, idx) => (
                <div key={idx} className="flex flex-col items-center gap-4 group">
                  <div className="w-full h-32 bg-muted/30 rounded-[2rem] flex flex-col justify-end p-1 transition-all group-hover:bg-blue-500/10 border border-transparent group-hover:border-blue-500/20">
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-[1.5rem] shadow-lg shadow-black/5"
                      style={{ height: `${(hour.count / Math.max(...appointmentAnalytics.peakHours.map(h => h.count))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground uppercase">{hour.hour}:00</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {revenueAnalytics && (
          <section className="bg-[#0f172a] rounded-[3rem] sm:rounded-[4rem] p-8 sm:p-12 md:p-16 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full -mr-64 -mt-64"></div>
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                  <TakaIcon className="text-sm text-blue-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Financial Summary</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-none">Revenue <br /><span className="text-blue-500">Analytics.</span></h2>
                <p className="text-blue-300/60 text-sm font-bold tracking-widest uppercase">Lifetime earnings & cycle performance overview</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 font-black uppercase tracking-widest">
                <div className="bg-white/5 p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-colors">
                  <p className="text-blue-400 text-[10px] mb-4">Total Earn</p>
                  <p className="text-3xl sm:text-5xl tracking-tighter">৳{revenueAnalytics.totalRevenue?.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-colors">
                  <p className="text-emerald-400 text-[10px] mb-4">Cycle</p>
                  <p className="text-3xl sm:text-5xl tracking-tighter text-emerald-400">৳{revenueAnalytics.revenueThisMonth?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
});

export default AnalyticsTab;