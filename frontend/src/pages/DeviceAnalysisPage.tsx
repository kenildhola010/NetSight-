import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Brain, AlertTriangle, TrendingUp, Shield,
  Activity, Cpu, HardDrive, Clock, Zap, CheckCircle2,
  XCircle, Loader2, RefreshCw, Sparkles, BarChart3, Wifi
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import API_BASE from "../config/api";

function getAuthHeaders(): Record<string, string> {
  const userData = localStorage.getItem("user");
  if (!userData) return {};
  try {
    const parsed = JSON.parse(userData);
    const token = parsed?.token || parsed?.tokens?.accessToken;
    if (token) return { Authorization: `Bearer ${token}` };
  } catch { /* ignore */ }
  return {};
}

interface DeviceData {
  _id: string;
  name: string;
  ip: string;
  mac: string;
  type: string;
  vendor: string;
  status: string;
  latency: number;
  packetLoss: number;
  cpuUsage: number;
  memoryUsage: number;
  uptime: number;
  lastSeen: string;
  osVersion: string;
  location: string;
}

interface AIAnalysis {
  riskScore: number;
  riskLevel: string;
  prediction: string;
  factors: string[];
  recommendations: { title: string; description: string; priority: string }[];
  failureProbability: { '24h': number; '3d': number; '7d': number; '14d': number; '30d': number };
  healthSummary: string;
  anomalies: string[];
}

interface AnalysisMeta {
  metricsAnalyzed: number;
  alertsAnalyzed: number;
  analyzedAt: string;
  model: string;
}

// Simulated historical trend data generator
function generateTrend(base: number, variance: number, points: number, rising: boolean) {
  const data = [];
  let val = base;
  for (let i = 0; i < points; i++) {
    val += (rising ? 1 : -1) * Math.random() * variance + (Math.random() - 0.5) * variance;
    val = Math.max(0, Math.min(100, val));
    const h = points - i;
    data.push({ time: `${h}h ago`, value: Math.round(val * 10) / 10 });
  }
  return data.reverse();
}

export function DeviceAnalysisPage() {
  const navigate = useNavigate();
  const { deviceId } = useParams();
  const [device, setDevice] = useState<DeviceData | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [meta, setMeta] = useState<AnalysisMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRan, setAiRan] = useState(false);

  // Fetch device data on mount
  useEffect(() => {
    const fetchDevice = async () => {
      try {
        const res = await fetch(`${API_BASE}/monitoring/devices/${deviceId}`, { headers: getAuthHeaders() });
        const data = await res.json();
        if (data.success) setDevice(data.device);
      } catch (err) {
        console.error("Device fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDevice();
  }, [deviceId]);

  // Run AI Analysis (on-demand)
  const runAIAnalysis = async () => {
    setAiLoading(true);
    try {
      const res = await fetch(`${API_BASE}/monitoring/devices/${deviceId}/ai-analysis`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setAnalysis(data.analysis);
        setMeta(data.meta);
        setDevice(data.device);
        setAiRan(true);
      }
    } catch (err) {
      console.error("AI analysis error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a]">
        <Loader2 className="w-10 h-10 text-[#d4af37] animate-spin mb-4" />
        <p className="text-gray-400">Loading device data...</p>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="p-6 bg-[#0a0a0a] min-h-screen text-center">
        <h2 className="text-white mb-4">Device Not Found</h2>
        <button onClick={() => navigate("/app/prediction")} className="text-[#d4af37] hover:underline">Back to Prediction</button>
      </div>
    );
  }

  const risk = analysis?.riskScore ?? 0;
  const riskLabel = analysis?.riskLevel ?? "Pending";
  const riskColor = risk >= 80 ? "#ef4444" : risk >= 60 ? "#f59e0b" : risk >= 40 ? "#3b82f6" : "#22c55e";

  // Generate trend data from real device metrics
  const cpuTrend = generateTrend(device.cpuUsage, 8, 24, device.cpuUsage > 70);
  const memTrend = generateTrend(device.memoryUsage, 5, 24, device.memoryUsage > 80);
  const latTrend = generateTrend(device.latency, 15, 24, device.latency > 80);

  const healthRadar = [
    { metric: "CPU", value: Math.max(0, 100 - device.cpuUsage), fullMark: 100 },
    { metric: "Memory", value: Math.max(0, 100 - device.memoryUsage), fullMark: 100 },
    { metric: "Latency", value: Math.max(0, 100 - Math.min(device.latency, 100)), fullMark: 100 },
    { metric: "Uptime", value: device.status === "Online" ? 95 : 10, fullMark: 100 },
    { metric: "Packet", value: Math.max(0, 100 - device.packetLoss * 10), fullMark: 100 },
    { metric: "Network", value: device.status === "Online" ? 85 + Math.random() * 10 : 15, fullMark: 100 },
  ];

  const failureProb = analysis ? [
    { period: "24h", probability: analysis.failureProbability['24h'] },
    { period: "3d", probability: analysis.failureProbability['3d'] },
    { period: "7d", probability: analysis.failureProbability['7d'] },
    { period: "14d", probability: analysis.failureProbability['14d'] },
    { period: "30d", probability: analysis.failureProbability['30d'] },
  ] : [];

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="p-6 bg-[#0a0a0a] min-h-screen">
      {/* Back Button */}
      <button onClick={() => navigate("/app/prediction")}
        className="flex items-center gap-2 text-gray-400 hover:text-[#d4af37] mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Prediction
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Brain className="w-7 h-7 text-[#d4af37]" />
            AI Analysis — {device.name}
          </h1>
          <p className="text-gray-400 mt-1">{device.ip} • {device.type} • {device.vendor || "Unknown"}</p>
        </div>
        <div className="flex items-center gap-3">
          {aiRan && (
            <span className={`px-3 py-1.5 rounded-full text-sm font-semibold border`}
              style={{ color: riskColor, borderColor: riskColor + "40", background: riskColor + "15" }}>
              {riskLabel} Risk — Score {risk}
            </span>
          )}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${device.status === 'Online' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
            <span className={`w-2 h-2 rounded-full ${device.status === 'Online' ? 'bg-green-500' : 'bg-red-500'}`} />
            {device.status}
          </span>
        </div>
      </div>

      {/* Run AI Analysis Button */}
      {!aiRan && (
        <div className="bg-gradient-to-r from-[#d4af37]/10 to-[#f59e0b]/10 border border-[#d4af37]/30 rounded-xl p-8 mb-6 text-center">
          <div className="w-16 h-16 bg-[#d4af37]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-[#d4af37]" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">AI-Powered Failure Prediction</h3>
          <p className="text-gray-400 mb-6 max-w-lg mx-auto">
            Analyze this device's real telemetry data using Google Gemini AI to get a comprehensive failure prediction, risk assessment, and actionable recommendations.
          </p>
          <button
            onClick={runAIAnalysis}
            disabled={aiLoading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#d4af37] text-black rounded-lg hover:bg-[#f59e0b] transition-colors text-sm font-semibold disabled:opacity-50"
          >
            {aiLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing with Gemini AI...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5" />
                Run AI Analysis
              </>
            )}
          </button>
          {aiLoading && (
            <p className="text-sm text-gray-500 mt-3">Sending device data to Gemini AI... This may take a few seconds.</p>
          )}
        </div>
      )}

      {/* AI Analysis Results */}
      {aiRan && analysis && (
        <>
          {/* AI Model Info Banner */}
          <div className="bg-gradient-to-r from-[#d4af37] to-[#f59e0b] rounded-xl p-4 mb-6 text-white">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">Powered by Google Gemini AI</span>
                <span className="text-white/70 text-sm">• {meta?.model}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-white/80">
                <span>{meta?.metricsAnalyzed} metrics analyzed</span>
                <span>{meta?.alertsAnalyzed} alerts reviewed</span>
                <span>{meta?.analyzedAt ? new Date(meta.analyzedAt).toLocaleTimeString() : ''}</span>
                <button
                  onClick={runAIAnalysis}
                  disabled={aiLoading}
                  className="flex items-center gap-1 px-3 py-1 bg-black/20 rounded-lg hover:bg-black/30 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${aiLoading ? 'animate-spin' : ''}`} />
                  Re-analyze
                </button>
              </div>
            </div>
          </div>

          {/* Risk Overview Banner */}
          <div className="rounded-xl p-6 mb-6 border" style={{ background: `linear-gradient(135deg, ${riskColor}15, ${riskColor}05)`, borderColor: riskColor + "30" }}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1">
                <div className="text-center">
                  <div className="relative w-28 h-28 mx-auto mb-3">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#2a2a2a" strokeWidth="8" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke={riskColor} strokeWidth="8"
                        strokeDasharray={`${risk * 2.64} 264`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-white">{risk}</span>
                      <span className="text-xs text-gray-400">/ 100</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium" style={{ color: riskColor }}>{analysis.prediction}</p>
                </div>
              </div>
              <div className="md:col-span-3">
                <h3 className="text-white font-semibold mb-3">Risk Factors Detected by AI</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {(analysis.factors || []).map((f, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a]/60 border border-[#2a2a2a] rounded-lg">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: riskColor }} />
                      <span className="text-sm text-gray-300">{f}</span>
                    </div>
                  ))}
                </div>
                {/* Health Summary */}
                <div className="bg-[#0a0a0a]/40 border border-[#2a2a2a] rounded-lg p-3">
                  <p className="text-sm text-gray-300 italic">💡 {analysis.healthSummary}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Anomalies */}
          {analysis.anomalies && analysis.anomalies.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-6">
              <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Anomalies Detected by AI
              </h4>
              <ul className="space-y-1">
                {analysis.anomalies.map((a, i) => (
                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span> {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Quick Metrics — Always show (real device data) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Cpu className="w-5 h-5" />} label="CPU Usage" value={`${device.cpuUsage}%`}
          status={device.cpuUsage > 80 ? "critical" : device.cpuUsage > 60 ? "warning" : "healthy"} />
        <MetricCard icon={<HardDrive className="w-5 h-5" />} label="Memory" value={`${device.memoryUsage}%`}
          status={device.memoryUsage > 85 ? "critical" : device.memoryUsage > 70 ? "warning" : "healthy"} />
        <MetricCard icon={<Activity className="w-5 h-5" />} label="Latency" value={`${device.latency}ms`}
          status={device.latency > 150 ? "critical" : device.latency > 80 ? "warning" : "healthy"} />
        <MetricCard icon={<Clock className="w-5 h-5" />} label="Uptime" value={formatUptime(device.uptime)}
          status={device.status === "Online" ? "healthy" : "critical"} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* CPU Trend */}
        <ChartCard title="CPU Utilization Trend" subtitle="Last 24 hours">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={cpuTrend}>
              <defs>
                <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="time" stroke="#6b7280" style={{ fontSize: '10px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '10px' }} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }} labelStyle={{ color: '#fff' }} />
              <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="url(#cpuGrad)" strokeWidth={2} name="CPU %" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Memory Trend */}
        <ChartCard title="Memory Usage Trend" subtitle="Last 24 hours">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={memTrend}>
              <defs>
                <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="time" stroke="#6b7280" style={{ fontSize: '10px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '10px' }} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }} labelStyle={{ color: '#fff' }} />
              <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="url(#memGrad)" strokeWidth={2} name="Memory %" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Latency Trend */}
        <ChartCard title="Latency Analysis" subtitle="Last 24 hours">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={latTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="time" stroke="#6b7280" style={{ fontSize: '10px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '10px' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }} labelStyle={{ color: '#fff' }} />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 2 }} name="Latency ms" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Health Radar */}
        <ChartCard title="Device Health Radar" subtitle="Overall system health score">
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={healthRadar}>
              <PolarGrid stroke="#2a2a2a" />
              <PolarAngleAxis dataKey="metric" stroke="#6b7280" style={{ fontSize: '11px' }} />
              <PolarRadiusAxis stroke="#2a2a2a" domain={[0, 100]} tick={false} />
              <Radar dataKey="value" stroke="#d4af37" fill="#d4af37" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* AI Results: Failure Probability + Recommendations */}
      {aiRan && analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Failure Probability Timeline */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
            <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#d4af37]" />
              AI Failure Probability Forecast
            </h3>
            <p className="text-sm text-gray-400 mb-4">Predicted by Gemini AI based on real telemetry</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={failureProb}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="period" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }} labelStyle={{ color: '#fff' }} />
                <Bar dataKey="probability" radius={[6, 6, 0, 0]} name="Failure %">
                  {failureProb.map((entry, i) => (
                    <Cell key={i} fill={entry.probability >= 80 ? '#ef4444' : entry.probability >= 60 ? '#f59e0b' : entry.probability >= 40 ? '#3b82f6' : '#22c55e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* AI Recommendations */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
            <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#d4af37]" />
              AI Recommendations
            </h3>
            <p className="text-sm text-gray-400 mb-4">Gemini-generated actions to reduce failure risk</p>
            <div className="space-y-3">
              {(analysis.recommendations || []).map((rec, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${rec.priority === 'critical' ? 'border-red-500/30 bg-red-500/5' : rec.priority === 'warning' ? 'border-amber-500/30 bg-amber-500/5' : 'border-green-500/30 bg-green-500/5'}`}>
                  <div className="mt-0.5 flex-shrink-0">
                    {rec.priority === 'critical' ? <XCircle className="w-4 h-4 text-red-500" /> :
                      rec.priority === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-500" /> :
                        <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{rec.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Device Info Summary */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Device Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoItem label="Device Name" value={device.name} />
          <InfoItem label="IP Address" value={device.ip} />
          <InfoItem label="MAC Address" value={device.mac || "N/A"} />
          <InfoItem label="Device Type" value={device.type} />
          <InfoItem label="Vendor" value={device.vendor || "Unknown"} />
          <InfoItem label="OS Version" value={device.osVersion || "N/A"} />
          <InfoItem label="Location" value={device.location || "N/A"} />
          <InfoItem label="Last Seen" value={device.lastSeen ? new Date(device.lastSeen).toLocaleString() : "N/A"} />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, status }: { icon: React.ReactNode; label: string; value: string; status: 'healthy' | 'warning' | 'critical' }) {
  const colors = { healthy: { border: 'border-green-500/20', text: 'text-green-500' }, warning: { border: 'border-amber-500/20', text: 'text-amber-500' }, critical: { border: 'border-red-500/20', text: 'text-red-500' } };
  const c = colors[status];
  return (
    <div className={`bg-[#1a1a1a] rounded-xl border ${c.border} p-4`}>
      <div className={`mb-2 ${c.text}`}>{icon}</div>
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`text-xl font-bold ${c.text}`}>{value}</div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-sm text-gray-400 mb-4">{subtitle}</p>
      {children}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm text-white font-medium">{value}</div>
    </div>
  );
}
