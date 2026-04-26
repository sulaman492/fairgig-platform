import { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Clock,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Eye,
  Award,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  Activity,
  Zap,
  Bell,
  Percent,
  Wallet
} from 'lucide-react';
import { authApi } from '../../lib/authApi';
import { useNavigate } from 'react-router-dom';

export default function DashboardOverview() {
  const navigate = useNavigate();
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentShifts, setRecentShifts] = useState([]);
  const [insights, setInsights] = useState({
    bestPlatform: '',
    worstPlatform: '',
    bestHourlyRate: 0,
    worstHourlyRate: 0,
    totalEarnings: 0,
    avgHourlyRate: 0,
    totalHours: 0,
    totalShifts: 0,
    consistencyScore: 0,
    earningTrend: 'stable',
    recommendedAction: '',
    weeklyComparison: 0,
    avgCommissionRate: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch shifts
      const shiftsRes = await authApi.get('/api/shifts/my');
      const shifts = shiftsRes.data.shifts || [];
      
      if (shifts.length === 0) {
        setLoading(false);
        return;
      }
      
      // ============================================
      // FETCH ANOMALIES FROM BACKEND
      // ============================================
      try {
        console.log('📡 Fetching anomalies from API Gateway...');
        const anomaliesRes = await authApi.get('/api/shifts/anomalies');
        console.log('✅ Anomalies received:', anomaliesRes.data);
        
        const anomalyData = anomaliesRes.data;
        
        if (anomalyData.anomalies && anomalyData.anomalies.length > 0) {
          const formattedAnomalies = anomalyData.anomalies.map((anomaly, index) => ({
            id: index,
            date: anomaly.date,
            type: anomaly.type,
            platform: anomaly.platform || 'Multiple',
            description: anomaly.description,
            severity: anomaly.severity,
            dailyTotal: anomaly.daily_total,
            expectedRange: anomaly.expected_range,
            commissionRate: anomaly.commission_rate
          }));
          setAnomalies(formattedAnomalies);
        } else {
          setAnomalies([]);
        }
        
      } catch (anomalyError) {
        console.error('❌ Failed to fetch anomalies:', anomalyError);
        setAnomalies([]);
      }
      
      // Calculate insights
      const platformStats = {};
      let totalEarnings = 0;
      let totalHours = 0;
      let totalDeductions = 0;
      let totalGross = 0;
      
      shifts.forEach(shift => {
        const net = Number(shift.net_received);
        const hours = Number(shift.hours_worked);
        const deductions = Number(shift.platform_deductions || 0);
        const gross = Number(shift.gross_earned || 0);
        
        totalEarnings += net;
        totalHours += hours;
        totalDeductions += deductions;
        totalGross += gross;
        
        if (!platformStats[shift.platform]) {
          platformStats[shift.platform] = {
            totalEarnings: 0,
            totalHours: 0,
            shifts: 0,
            hourlyRates: [],
            totalDeductions: 0,
            totalGross: 0
          };
        }
        
        platformStats[shift.platform].totalEarnings += net;
        platformStats[shift.platform].totalHours += hours;
        platformStats[shift.platform].shifts += 1;
        platformStats[shift.platform].totalDeductions += deductions;
        platformStats[shift.platform].totalGross += gross;
        if (hours > 0) {
          platformStats[shift.platform].hourlyRates.push(net / hours);
        }
      });
      
      const avgCommissionRate = totalGross > 0 ? (totalDeductions / totalGross) * 100 : 0;
      
      // Find best/worst platforms
      let bestPlatform = '';
      let bestHourlyRate = 0;
      let worstPlatform = '';
      let worstHourlyRate = Infinity;
      
      Object.keys(platformStats).forEach(platform => {
        const stats = platformStats[platform];
        const avgHourly = stats.totalHours > 0 ? stats.totalEarnings / stats.totalHours : 0;
        
        if (avgHourly > bestHourlyRate) {
          bestHourlyRate = avgHourly;
          bestPlatform = platform;
        }
        if (avgHourly < worstHourlyRate) {
          worstHourlyRate = avgHourly;
          worstPlatform = platform;
        }
      });
      
      const avgHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0;
      
      // Calculate consistency score
      const hourlyRatesArray = shifts.map(s => s.hours_worked > 0 ? Number(s.net_received) / s.hours_worked : 0);
      const mean = hourlyRatesArray.reduce((a,b) => a + b, 0) / hourlyRatesArray.length;
      const variance = hourlyRatesArray.map(x => Math.pow(x - mean, 2)).reduce((a,b) => a + b, 0) / hourlyRatesArray.length;
      const consistencyStdDev = Math.sqrt(variance);
      const consistencyScore = Math.max(0, Math.min(100, 100 - (consistencyStdDev / mean) * 100));
      
      // Calculate earning trend
      let earningTrend = 'stable';
      let weeklyComparison = 0;
      if (shifts.length >= 6) {
        const recent3 = shifts.slice(0, 3).reduce((sum, s) => sum + Number(s.net_received), 0) / 3;
        const previous3 = shifts.slice(3, 6).reduce((sum, s) => sum + Number(s.net_received), 0) / 3;
        weeklyComparison = ((recent3 - previous3) / previous3) * 100;
        if (weeklyComparison > 10) earningTrend = 'improving';
        else if (weeklyComparison < -10) earningTrend = 'declining';
        else earningTrend = 'stable';
      }
      
      // Determine recommended action
      let recommendedAction = '';
      if (bestHourlyRate > avgHourlyRate * 1.2) {
        recommendedAction = `Focus more on ${bestPlatform} - you earn ${Math.round((bestHourlyRate / avgHourlyRate - 1) * 100)}% more than average there!`;
      } else if (worstHourlyRate < avgHourlyRate * 0.5) {
        recommendedAction = `Consider reducing shifts on ${worstPlatform} - earnings are ${Math.round((1 - worstHourlyRate / avgHourlyRate) * 100)}% below average.`;
      } else if (consistencyScore < 40) {
        recommendedAction = 'Your earnings vary a lot. Try to identify which factors lead to your best days!';
      } else if (avgCommissionRate > 25) {
        recommendedAction = `Platforms are taking ${Math.round(avgCommissionRate)}% commission on average. Consider platforms with lower fees.`;
      } else {
        recommendedAction = 'Keep up the good work! Track your shifts to maintain this consistency.';
      }
      
      setInsights({
        bestPlatform,
        worstPlatform,
        bestHourlyRate,
        worstHourlyRate,
        totalEarnings,
        avgHourlyRate,
        totalHours,
        totalShifts: shifts.length,
        consistencyScore: Math.round(consistencyScore),
        earningTrend,
        recommendedAction,
        weeklyComparison,
        avgCommissionRate: Math.round(avgCommissionRate)
      });
      
      setRecentShifts(shifts.slice(0, 5));
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getAnomalyIcon = (type, severity) => {
    switch(type) {
      case 'income_drop':
        return <ThumbsDown className="h-5 w-5 text-red-600" />;
      case 'income_spike':
        return <ThumbsUp className="h-5 w-5 text-green-600" />;
      case 'unusual_deductions':
        return <Percent className="h-5 w-5 text-orange-600" />;
      case 'low_deductions':
        return <Wallet className="h-5 w-5 text-green-600" />;
      case 'high_volatility':
        return <Activity className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
    }
  };

  const getAnomalyBgColor = (type, severity) => {
    if (severity === 'high') return 'bg-red-100';
    if (type === 'income_spike' || type === 'low_deductions') return 'bg-green-100';
    return 'bg-orange-100';
  };

  const getTrendIcon = () => {
    switch(insights.earningTrend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTrendColor = () => {
    switch(insights.earningTrend) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard insights...</div>
      </div>
    );
  }

  if (insights.totalShifts === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <BarChart3 className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700">No Data Yet</h3>
        <p className="text-gray-500 mt-2">Start logging your shifts to see insights and analytics!</p>
        <button
          onClick={() => navigate('/earnings')}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Log Your First Shift
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section with Trend */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-600">Your earnings performance</p>
            <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>
                {insights.earningTrend === 'improving' && `↑ ${Math.abs(insights.weeklyComparison).toFixed(0)}% this week`}
                {insights.earningTrend === 'declining' && `↓ ${Math.abs(insights.weeklyComparison).toFixed(0)}% this week`}
                {insights.earningTrend === 'stable' && '↗ Steady earnings'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full">
          <Zap className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">Consistency Score: {insights.consistencyScore}%</span>
        </div>
      </div>

      {/* ============================================ */}
      {/* SECTION 1: PLATFORM PERFORMANCE CARDS (TOP) */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best Platform Card */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">🏆 Best Performing Platform</h3>
            </div>
            <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">Top Performer</span>
          </div>
          <div className="text-center py-2">
            <p className="text-3xl font-bold text-green-700">{insights.bestPlatform || 'N/A'}</p>
            <p className="text-sm text-gray-600 mt-1">Average Hourly Rate</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(insights.bestHourlyRate)}<span className="text-sm font-normal text-gray-500">/hr</span></p>
            {insights.bestHourlyRate > 0 && insights.avgHourlyRate > 0 && (
              <p className="text-xs text-green-600 mt-1">
                {Math.round((insights.bestHourlyRate / insights.avgHourlyRate - 1) * 100)}% above your average
              </p>
            )}
          </div>
          <button
            onClick={() => navigate('/analytics')}
            className="w-full mt-3 text-center text-sm text-green-700 hover:text-green-800 font-medium flex items-center justify-center gap-1"
          >
            View Details <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>

        {/* Worst Platform Card (Only if significantly worse) */}
        {insights.worstPlatform && insights.worstHourlyRate < insights.avgHourlyRate * 0.7 && (
          <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-200 p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-2 mb-3">
              <ThumbsDown className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-gray-900">⚠️ Needs Attention</h3>
            </div>
            <div className="text-center py-2">
              <p className="text-3xl font-bold text-red-700">{insights.worstPlatform}</p>
              <p className="text-sm text-gray-600 mt-1">Average Hourly Rate</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(insights.worstHourlyRate)}<span className="text-sm font-normal text-gray-500">/hr</span></p>
              <p className="text-xs text-red-600 mt-1">
                {Math.round((1 - insights.worstHourlyRate / insights.avgHourlyRate) * 100)}% below your average
              </p>
            </div>
            <button
              onClick={() => navigate('/earnings')}
              className="w-full mt-3 text-center text-sm text-red-700 hover:text-red-800 font-medium flex items-center justify-center gap-1"
            >
              Review Shifts <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* SECTION 2: ANOMALY ALERTS */}
      {/* ============================================ */}
      {anomalies.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="h-5 w-5 text-orange-600 animate-pulse" />
            <h3 className="font-semibold text-gray-900">⚠️ Unusual Earnings Detected</h3>
            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">
              {anomalies.length} Alert{anomalies.length > 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="space-y-3">
            {anomalies.map((anomaly) => (
              <div key={anomaly.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-100 shadow-sm hover:shadow-md transition">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${getAnomalyBgColor(anomaly.type, anomaly.severity)} rounded-full flex items-center justify-center`}>
                    {getAnomalyIcon(anomaly.type, anomaly.severity)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {anomaly.platform} - {anomaly.date}
                    </p>
                    <p className="text-sm text-gray-600">
                      {anomaly.type === 'income_drop' && '⚠️ Income Drop'}
                      {anomaly.type === 'income_spike' && '✨ Income Spike'}
                      {anomaly.type === 'unusual_deductions' && '💰 High Commission Detected'}
                      {anomaly.type === 'low_deductions' && '🎉 Low Commission (Good Day!)'}
                      {anomaly.type === 'high_volatility' && '📊 High Volatility'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {anomaly.description}
                    </p>
                    {anomaly.commissionRate && (
                      <p className="text-xs text-orange-600 mt-0.5">
                        Commission rate: {anomaly.commissionRate.toFixed(0)}%
                      </p>
                    )}
                    {anomaly.dailyTotal && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Earned: {formatCurrency(anomaly.dailyTotal)} {anomaly.expectedRange && `| Expected: ${anomaly.expectedRange}`}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => navigate('/earnings')}
                  className="text-sm bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1.5 rounded-lg font-medium transition"
                >
                  Review
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-3 text-xs text-orange-700 bg-orange-100 p-2 rounded-lg">
            💡 {anomalies.some(a => a.type === 'income_drop') 
              ? "Low earnings might indicate underpayment. Check if these shifts were recorded correctly!" 
              : anomalies.some(a => a.type === 'unusual_deductions')
              ? "High commission rates mean platforms are taking more than usual. Compare with other platforms!"
              : "High volatility means your earnings are unstable. Try to find consistent platforms."}
          </div>
        </div>
      )}

      {/* No Anomaly Message */}
      {anomalies.length === 0 && insights.totalShifts > 0 && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-green-800">✓ All Clear - No Anomalies Detected</p>
              <p className="text-sm text-green-700">Your earnings pattern looks consistent and healthy</p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* SECTION 3: AI INSIGHT & RECOMMENDATION */}
      {/* ============================================ */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Lightbulb className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">🤖 AI Insight & Recommendation</h3>
            <p className="text-gray-700 text-sm">{insights.recommendedAction}</p>
            
            <div className="mt-3 flex flex-wrap gap-2">
              {insights.bestPlatform && insights.bestHourlyRate > insights.avgHourlyRate * 1.2 && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  ⭐ {insights.bestPlatform} is your best platform
                </span>
              )}
              {insights.avgCommissionRate > 25 && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                  💰 Avg commission: {insights.avgCommissionRate}%
                </span>
              )}
              {insights.consistencyScore < 50 && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                  📊 Try to maintain consistent hours
                </span>
              )}
              {anomalies.length > 0 && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                  ⚠️ Review the {anomalies.length} alert{anomalies.length > 1 ? 's' : ''} above
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* SECTION 4: RECENT ACTIVITY */}
      {/* ============================================ */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Recent Activity</h3>
          <button
            onClick={() => navigate('/earnings')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All →
          </button>
        </div>
        
        {recentShifts.map((shift) => {
          const hourlyRate = shift.hours_worked > 0 ? Number(shift.net_received) / shift.hours_worked : 0;
          const commissionRate = shift.gross_earned > 0 ? (Number(shift.platform_deductions) / Number(shift.gross_earned)) * 100 : 0;
          const isGoodRate = hourlyRate > insights.avgHourlyRate;
          const isBadRate = hourlyRate < insights.avgHourlyRate * 0.5;
          const isHighCommission = commissionRate > 25;
          
          return (
            <div key={shift.id} className="flex justify-between items-center py-3 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{shift.platform}</p>
                  {isGoodRate && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Good rate</span>}
                  {isBadRate && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Low rate</span>}
                  {isHighCommission && <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">High fee</span>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(shift.shift_date).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}
                  {' • '}{shift.hours_worked} hrs • {commissionRate.toFixed(0)}% fee
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatCurrency(Number(shift.net_received))}</p>
                <p className={`text-xs font-medium ${hourlyRate > insights.avgHourlyRate ? 'text-green-600' : 'text-gray-500'}`}>
                  {formatCurrency(hourlyRate)}/hr
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================ */}
      {/* SECTION 5: PERFORMANCE SUMMARY */}
      {/* ============================================ */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Performance Summary</span>
          <span className="text-xs text-gray-500">Last {insights.totalShifts} shifts</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Avg per shift</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(insights.totalEarnings / insights.totalShifts)}</p>
          </div>
          <div className="w-px h-8 bg-gray-300"></div>
          <div>
            <p className="text-xs text-gray-500">Avg hours/shift</p>
            <p className="text-lg font-semibold text-gray-900">{(insights.totalHours / insights.totalShifts).toFixed(1)} hrs</p>
          </div>
          <div className="w-px h-8 bg-gray-300"></div>
          <div>
            <p className="text-xs text-gray-500">Hourly rate</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(insights.avgHourlyRate)}</p>
          </div>
          <div className="w-px h-8 bg-gray-300"></div>
          <div>
            <p className="text-xs text-gray-500">Avg commission</p>
            <p className="text-lg font-semibold text-orange-600">{insights.avgCommissionRate}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Lightbulb icon component
const Lightbulb = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);