import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Users, Calendar, Activity, RefreshCw, TrendingUp, TrendingDown, Clock, PieChart, ArrowUpRight } from "lucide-react";
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

  const getDateRangeParams = useCallback((range) => {
    const end = new Date();
    const start = new Date();
    switch (range) {
      case 'week': start.setDate(end.getDate() - 7); break;
      case 'year': start.setFullYear(end.getFullYear() - 1); break;
      case 'month':
      default: start.setMonth(end.getMonth() - 1); break;
    }
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  }, []);

  // Metric Card Component
  const MetricCard = ({ title, value, subtext, icon: Icon, trend, colorClass }) => (
    <div className="bg-card rounded-xl p-4 border border-border shadow-sm hover:shadow-md transition-all duration-200 group relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-muted-foreground mb-1 text-[10px] leading-tight">{title}</h4>
          <p className="text-xl font-bold text-foreground mb-2">{value}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {trend && (
              <span className={`flex items-center text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${trend > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {trend > 0 ? <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
                {Math.abs(trend)}%
              </span>
            )}
            <span className="text-[10px] text-muted-foreground truncate">{subtext}</span>
          </div>
        </div>
        <div className={`p-2 bg-${colorClass}-500/10 rounded-lg shrink-0`}>
          <Icon className={`w-5 h-5 text-${colorClass}-500`} />
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
      <div className="bg-card rounded-xl p-4 border border-border shadow-sm h-full flex flex-col overflow-hidden">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="truncate">{title}</span>
          </h3>
          {tagline && <p className="text-[10px] text-muted-foreground mt-0.5 ml-6 truncate">{tagline}</p>}
        </div>
        <div className="flex flex-col items-center gap-4 flex-1 w-full">
          <div className="relative w-28 h-28 shrink-0">
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
            <div className="absolute inset-3 bg-card rounded-full flex items-center justify-center flex-col shadow-inner">
              <span className="text-base font-bold text-foreground">{total}</span>
              <span className="text-[9px] text-muted-foreground">{total === 0 ? 'Empty' : 'Total'}</span>
            </div>
          </div>
          <div className="w-full space-y-2">
            {total === 0 ? (
              <div className="text-center py-3">
                <p className="text-xs text-muted-foreground">No records</p>
              </div>
            ) : data?.map((item, index) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors[index % colors.length] }}></div>
                  <span className="text-[11px] text-foreground capitalize leading-tight truncate">{item.status || item.gender || item.age_group || 'Value'}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-semibold text-foreground">{item.count}</span>
                  <span className="text-[10px] text-muted-foreground w-7 text-right">{total > 0 ? ((Number(item.count) / total) * 100).toFixed(0) : 0}%</span>
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
      <div className="h-full flex items-center justify-center bg-muted/30 rounded-xl border border-dashed border-border p-6">
        <p className="text-muted-foreground text-xs">Insufficient performance data</p>
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
      <div className="bg-card rounded-xl p-4 border border-border shadow-sm group h-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="truncate">{title}</span>
            </h3>
            {tagline && <p className="text-[10px] text-muted-foreground mt-0.5 ml-6">{tagline}</p>}
          </div>
          <span className="text-[9px] font-medium text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-md shrink-0">Live</span>
        </div>
        <div className="relative h-28 w-full mb-2">
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
        <div className="flex justify-between px-1">
          {data.map((d, i) => {
            if (data.length > 8 && i % Math.floor(data.length / 4) !== 0 && i !== data.length - 1) return null;
            return (
              <div key={i} className="text-[9px] text-muted-foreground">
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

  if (loading) return <div className="flex items-center justify-center h-64 bg-transparent"><RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" /></div>;
  if (error) return (
    <div className="p-6 text-center bg-rose-500/10 rounded-xl m-4 border border-rose-500/20">
      <p className="text-rose-500 font-medium text-sm mb-3">Error loading analytics: {error}</p>
      <button onClick={fetchAnalytics} className="px-4 py-2 bg-rose-500 text-white rounded-lg text-xs font-semibold hover:bg-rose-600 transition-colors">Retry</button>
    </div>
  );

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Practice insights</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Analytics and performance overview</p>
          </div>
        </div>

        {/* Time range switcher */}
        <div className="bg-muted/50 p-1 rounded-xl flex items-center gap-1 border border-border/50">
          {['week', 'month', 'year'].map(range => (
            <button
              key={range}
              onClick={() => setActiveTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 min-w-[60px] capitalize ${activeTimeRange === range
                ? 'bg-card text-indigo-500 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'}`}
            >
              {range === 'week' ? 'Weekly' : range === 'month' ? 'Monthly' : 'Yearly'}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MetricCard title="Total patients" value={patientAnalytics?.totalPatients || 0} subtext="Lifetime base" icon={Users} trend={patientAnalytics?.trend} colorClass="blue" />
        <MetricCard title="Recurring patients" value={appointmentAnalytics?.recurringPatients || 0} subtext="Loyal revisits" icon={RefreshCw} colorClass="emerald" />
        <MetricCard title="Active visits" value={appointmentAnalytics?.appointmentsByStatus?.reduce((a, c) => a + Number(c.count), 0) || 0} subtext={`Period: ${activeTimeRange}`} icon={Calendar} trend={appointmentAnalytics?.visitTrend} colorClass="indigo" />
        <MetricCard title="Total earned" value={`৳${revenueAnalytics?.totalRevenue?.toLocaleString() || '0.00'}`} subtext={`Period: ${activeTimeRange}`} icon={TakaIcon} trend={revenueAnalytics?.trend} colorClass="emerald" />
        <MetricCard title="Pending" value={stats?.pendingAppointments || 0} subtext="Needs attention" icon={Activity} colorClass="orange" />
      </section>

      {/* Area Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AreaTrendChart
          title="Revenue performance"
          tagline="Income trends over selected range"
          data={revenueAnalytics?.revenueByMonth?.map(m => ({ label: m.month.split(' ')[0], value: Number(m.total) })) || []}
          color="#8b5cf6"
        />
        <AreaTrendChart
          title="Patient flow"
          tagline="Daily volume of patient arrivals"
          data={appointmentAnalytics?.appointmentsTrend?.map(t => ({ label: t.date.split('-')[2], value: Number(t.count) })) || []}
          color="#3b82f6"
        />
      </section>

      {/* Practice Mix + Age Demographics + Loyalty */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500 shrink-0" />
              Practice mix
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5 ml-6">Service distribution breakdown</p>
          </div>
          <div className="space-y-4 flex-1">
            {['consultation', 'follow-up', 'procedure', 'check-up'].map((type) => {
              const data = appointmentAnalytics?.appointmentsByType?.find(t => t.appointment_type === type);
              const count = Number(data?.count || 0);
              const totalVisits = appointmentAnalytics?.appointmentsByType?.reduce((a, c) => a + Number(c.count), 0) || 1;
              return (
                <div key={type} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-medium">
                    <span className="text-muted-foreground capitalize">{type === 'procedure' ? 'Surgeries' : type}</span>
                    <span className="text-foreground">{count} visits</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
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

        <div className="bg-card rounded-xl p-4 border border-border shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500 shrink-0" />
              Age categories
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5 ml-6">Demographics by age group</p>
          </div>
          <div className="space-y-3 flex-1">
            {(patientAnalytics?.patientsByAgeGroup?.length > 0 ? patientAnalytics.patientsByAgeGroup : [{ age_group: 'N/A', count: 0 }]).map((item, index) => (
              <div key={index} className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] text-muted-foreground">{item.age_group}</span>
                  <span className="text-xs font-semibold text-foreground">{item.count}</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-1000"
                    style={{ width: `${(item.count / (Math.max(...(patientAnalytics?.patientsByAgeGroup?.map(i => i.count) || [1])) || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <ModernPieChart
          title="Loyalty profile"
          tagline="Returning vs new admissions"
          data={[{ status: 'Returning', count: appointmentAnalytics?.recurringPatients || 0 }, { status: 'New admissions', count: Math.max(0, (patientAnalytics?.totalPatients || 0) - (appointmentAnalytics?.recurringPatients || 0)) }]}
        />
      </section>

      {/* Appointment Status + Gender */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ModernPieChart
          title="Appointment status"
          tagline="Session completion rate"
          data={appointmentAnalytics?.appointmentsByStatus || []}
        />
        <ModernPieChart
          title="Gender demographics"
          tagline="Distribution by gender identity"
          data={patientAnalytics?.patientsByGender || []}
        />
      </section>

      {/* KPIs + Feedback + Efficiency */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Practice Health KPIs */}
          <div className="bg-card rounded-xl p-4 border border-border shadow-sm flex flex-col">
            <div className="mb-3">
              <h3 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-rose-500" />
                Practice health
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 ml-5">Operational metrics</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                <div>
                  <span className="text-[10px] text-rose-400 block mb-0.5">No-show / cancel</span>
                  <span className="text-2xl font-bold text-rose-500 leading-none">{practiceHealth.noShowRate}%</span>
                </div>
                <div className="w-8 h-8 bg-card rounded-lg flex items-center justify-center text-rose-500">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div>
                  <span className="text-[10px] text-blue-400 block mb-0.5">Avg revenue / visit</span>
                  <span className="text-2xl font-bold text-blue-500 leading-none">৳{practiceHealth.avgRevenue}</span>
                </div>
                <div className="w-8 h-8 bg-card rounded-lg flex items-center justify-center text-blue-500">
                  <TakaIcon className="text-base" />
                </div>
              </div>
            </div>
          </div>

          {/* Experience Score */}
          <div className="bg-card rounded-xl p-4 border border-border shadow-sm flex flex-col">
            <div className="mb-3">
              <h3 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-emerald-500" />
                Experience score
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 ml-5">Patient sentiment</p>
            </div>
            <div className="flex items-center justify-between mb-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <div>
                <p className="text-[10px] text-emerald-500 mb-0.5">Clinic average</p>
                <p className="text-2xl font-bold text-foreground leading-none">
                  {appointmentAnalytics?.feedback?.averageRating || '0.0'}
                  <span className="text-xs font-medium text-emerald-500/50">/5.0</span>
                </p>
              </div>
              <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center text-2xl">
                {Number(appointmentAnalytics?.feedback?.averageRating) >= 4.5 ? '🏆' : '⭐'}
              </div>
            </div>
            <div className="space-y-2 flex-1">
              {(appointmentAnalytics?.feedback?.recent?.length > 0
                ? appointmentAnalytics.feedback.recent
                : [{ patient_name: "System", comment: "No feedback yet", rating: 5 }]
              ).map((f, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-muted/20">
                  <div className="text-lg">{Number(f.rating) >= 5 ? "🤩" : Number(f.rating) >= 4 ? "😊" : "🤔"}</div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-semibold text-foreground truncate">{f.patient_name}</p>
                    <p className="text-[10px] text-muted-foreground italic truncate">"{f.comment}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Efficiency Dashboard */}
        <div className="bg-slate-900 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
          <div className="mb-5">
            <h3 className="text-xs font-semibold flex items-center gap-2 text-blue-300">
              <Clock className="w-4 h-4" /> Efficiency dashboard
            </h3>
            <p className="text-[10px] text-blue-400/70 mt-0.5 ml-6">Wait time &amp; session analysis</p>
          </div>
          <div className="grid grid-cols-2 gap-6 mb-5">
            <div className="space-y-1 border-l-2 border-blue-500/30 pl-4">
              <p className="text-[10px] text-blue-300/60">Avg consultation</p>
              <p className="text-3xl font-bold tracking-tight">
                {appointmentAnalytics?.efficiency?.avgConsultation || '0'}
                <span className="text-xs font-medium text-blue-400/50 ml-1">min</span>
              </p>
              <p className="text-[10px] text-blue-200/40">Optimal session</p>
            </div>
            <div className="space-y-1 border-l-2 border-blue-500/30 pl-4">
              <p className="text-[10px] text-blue-300/60">Wait time index</p>
              <p className="text-3xl font-bold tracking-tight text-emerald-400">
                {appointmentAnalytics?.efficiency?.avgWaitTime || '0'}
                <span className="text-xs font-medium text-emerald-400/40 ml-1">min</span>
              </p>
              <p className="text-[10px] text-blue-200/40">Top 5% perf</p>
            </div>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <p className="text-[11px] text-blue-100/60 leading-relaxed">
              {Number(appointmentAnalytics?.efficiency?.avgWaitTime) < 15
                ? "Morning peak flow is handled well. Wait times are below clinical threshold."
                : "Peak hour congestion is slightly increasing wait times. Consider optimizing staffing."}
            </p>
          </div>
        </div>
      </section>

      {/* Weekly Demand + Traffic Matrix */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border shadow-sm lg:col-span-3">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <div className="p-1.5 bg-purple-500/10 rounded-lg"><Calendar className="w-4 h-4 text-purple-500" /></div>
              Weekly demand profile
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5 ml-8">Patient load across days</p>
          </div>
          <div className="flex items-end justify-between h-44 gap-1 sm:gap-2">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
              const dayData = appointmentAnalytics?.appointmentsByDay?.find(d => d.day.trim() === day);
              const count = Number(dayData?.count || 0);
              const maxCount = Math.max(...(appointmentAnalytics?.appointmentsByDay?.map(d => Number(d.count)) || [1])) || 1;
              const height = (count / maxCount) * 100;

              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="relative w-full flex flex-col justify-end h-full">
                    <div
                      className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all duration-1000 group-hover:brightness-110 shadow-sm"
                      style={{ height: `${Math.max(5, height)}%` }}
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-medium px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                        {count}
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] text-muted-foreground">{day.substring(0, 3)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border shadow-sm lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/10 rounded-lg"><Clock className="w-4 h-4 text-blue-500" /></div>
              Traffic matrix
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5 ml-8">Hourly arrival density</p>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {appointmentAnalytics?.peakHours?.map((hour, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 group">
                <div className="w-full h-24 bg-muted/30 rounded-xl flex flex-col justify-end p-1 transition-all group-hover:bg-blue-500/10 border border-transparent group-hover:border-blue-500/20">
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-lg shadow-sm"
                    style={{ height: `${(hour.count / Math.max(...appointmentAnalytics.peakHours.map(h => h.count))) * 100}%` }}
                  ></div>
                </div>
                <span className="text-[9px] text-muted-foreground">{hour.hour}:00</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Revenue Summary */}
      {revenueAnalytics && (
        <section className="bg-slate-900 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TakaIcon className="text-xs text-blue-400" />
                <span className="text-[10px] font-medium text-blue-400">Financial summary</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight leading-tight">Revenue <span className="text-blue-400">analytics</span></h2>
              <p className="text-blue-300/50 text-xs">Lifetime earnings &amp; cycle performance overview</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                <p className="text-blue-400 text-[10px] mb-2">Total earned</p>
                <p className="text-xl font-bold tracking-tight">৳{revenueAnalytics.totalRevenue?.toLocaleString()}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                <p className="text-emerald-400 text-[10px] mb-2">This cycle</p>
                <p className="text-xl font-bold tracking-tight text-emerald-400">৳{revenueAnalytics.revenueThisMonth?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
});

export default AnalyticsTab;