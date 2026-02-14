import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, TrendingUp, Heart, Apple, AlertCircle, Calendar, Loader2, Activity, Shield, User } from 'lucide-react';
import { getRiskLevel, cleanText } from '@/lib/sanitizeText';

interface ReportData {
  diagnosis?: string;
  confidence?: number;
  findings?: any;
  recommendations?: string;
  report_id?: string;
  referral_id?: string;
  patient_name?: string;
  uploaded_at?: string;
}

interface HealthReport {
  id: string;
  created_at: string;
  report_data: ReportData;
  session_id: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [loading, setLoading] = useState(true);

  const defaultTab = searchParams.get('tab') || 'overview';

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/auth', { replace: true });
        return;
      }
      setUser(session.user);

      const [profileRes, reportsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', session.user.id).maybeSingle(),
        supabase.from('health_reports').select('*, scan_sessions!inner(user_id)').order('created_at', { ascending: false }),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (reportsRes.data) setReports(reportsRes.data as unknown as HealthReport[]);
      setLoading(false);
    };
    init();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = profile?.full_name && profile.full_name !== 'User' ? profile.full_name : user?.email?.split('@')[0];
  const latestReport = reports[0]?.report_data;
  const latestRisk = latestReport?.diagnosis ? getRiskLevel(latestReport.diagnosis, latestReport.confidence || 0) : null;

  // Get diet recommendations based on latest risk level
  const getDietRecommendations = () => {
    if (!latestRisk || !latestReport) return null;
    const level = latestRisk.level;
    if (level === 'high') {
      return {
        eat: [
          'Low-sodium vegetables (cabbage, cauliflower, bell peppers)',
          'Egg whites and lean chicken (limited portions)',
          'Cranberries, blueberries, red grapes',
          'Olive oil and garlic-based cooking',
          'Low-potassium fruits (apples, berries)',
        ],
        avoid: [
          'High-sodium foods (pickles, chips, canned goods)',
          'High-potassium foods (bananas, oranges, potatoes)',
          'High-phosphorus foods (dairy, nuts, cola)',
          'Red and processed meats',
          'Excessive fluids (as advised by nephrologist)',
        ],
        lifestyle: [
          'Follow strict renal diet as prescribed by your doctor',
          'Monitor fluid intake daily',
          'Track weight daily for fluid retention',
          'Attend all dialysis/nephrology appointments',
          'Avoid over-the-counter painkillers (NSAIDs)',
        ],
      };
    }
    if (level === 'moderate') {
      return {
        eat: [
          'Fresh fruits and vegetables (moderate potassium)',
          'Whole grains and fiber-rich foods',
          'Lean proteins (fish, chicken, tofu)',
          'Plenty of water (6-8 glasses/day)',
          'Omega-3 rich foods (salmon, flaxseeds)',
        ],
        avoid: [
          'Excessive salt and processed foods',
          'Sugary drinks and sodas',
          'Fried and high-fat foods',
          'Excessive alcohol and caffeine',
          'Canned and preserved foods',
        ],
        lifestyle: [
          '30 minutes of moderate exercise daily',
          '7-8 hours of quality sleep',
          'Regular kidney function monitoring every 3 months',
          'Stress management through meditation',
          'Stay well hydrated throughout the day',
        ],
      };
    }
    return {
      eat: [
        'Balanced diet with fresh fruits and vegetables',
        'Whole grains and fiber-rich foods',
        'Lean proteins (fish, chicken, legumes)',
        'Plenty of water (8-10 glasses/day)',
        'Nuts and seeds in moderation',
      ],
      avoid: [
        'Excess salt and ultra-processed foods',
        'Sugary drinks and sodas',
        'Excessive fried foods',
        'Heavy alcohol consumption',
        'Excessive red and processed meats',
      ],
      lifestyle: [
        '30 minutes of exercise daily',
        '7-8 hours of quality sleep',
        'Annual health checkups',
        'Stay hydrated and manage stress',
        'Maintain a healthy BMI',
      ],
    };
  };

  const diet = getDietRecommendations();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-12 px-4">
        <div className="container max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Welcome back, {displayName}</h1>
            <p className="text-muted-foreground mt-1">Your personal health dashboard</p>
          </div>

          <Tabs defaultValue={defaultTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="diet">Diet Plan</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-card to-muted/30 border-border/60">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reports.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {reports.length > 0 ? `Last: ${new Date(reports[0].created_at).toLocaleDateString()}` : 'No reports yet'}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-card to-muted/30 border-border/60">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Health Status</CardTitle>
                    <Heart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {latestRisk ? (
                      <span className={`inline-block px-2 py-0.5 rounded text-sm font-semibold border ${latestRisk.color}`}>
                        {latestRisk.label}
                      </span>
                    ) : (
                      <div className="text-sm text-muted-foreground">No Data</div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {latestReport?.diagnosis ? cleanText(latestReport.diagnosis).substring(0, 50) + '...' : 'Upload a report'}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-card to-muted/30 border-border/60">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Member Since</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              {reports.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-50 text-muted-foreground" />
                    <p className="text-muted-foreground">No reports yet. Upload a medical scan to get started.</p>
                    <Button className="mt-4" onClick={() => navigate('/ai-scan')}>Go to AI Scan</Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Latest Analysis Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {latestReport?.patient_name && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-primary" />
                        <span className="font-medium">Patient:</span>
                        <span className="text-muted-foreground">{latestReport.patient_name}</span>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {latestReport?.diagnosis ? cleanText(latestReport.diagnosis) : 'No diagnosis available'}
                    </p>
                    {latestReport?.confidence !== undefined && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Confidence</span>
                          <span>{(latestReport.confidence * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={latestReport.confidence * 100} className="h-1.5" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Report History</CardTitle>
                  <CardDescription>All your medical analysis reports, sorted by most recent</CardDescription>
                </CardHeader>
                <CardContent>
                  {reports.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>No reports yet.</p>
                      <Button className="mt-4" onClick={() => navigate('/ai-scan')}>Upload a Scan</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reports.map((report) => {
                        const rd = report.report_data;
                        const risk = rd?.diagnosis ? getRiskLevel(rd.diagnosis, rd.confidence || 0) : null;
                        return (
                          <div key={report.id} className="p-4 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                                <div>
                                  <p className="font-medium text-sm">
                                    {rd?.patient_name || 'Medical Analysis Report'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(report.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                              {risk && (
                                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${risk.color}`}>
                                  {risk.label}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                              {rd?.report_id && <span>ID: {rd.report_id}</span>}
                              {rd?.referral_id && <span>Ref: {rd.referral_id}</span>}
                              {rd?.confidence !== undefined && <span>Confidence: {(rd.confidence * 100).toFixed(1)}%</span>}
                              {rd?.diagnosis && <span className="truncate">{cleanText(rd.diagnosis).substring(0, 40)}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              {reports.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-50 text-muted-foreground" />
                    <p className="text-muted-foreground">Upload reports to see health analytics.</p>
                    <Button className="mt-4" onClick={() => navigate('/ai-scan')}>Upload a Scan</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="bg-gradient-to-br from-card to-muted/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg"><TrendingUp className="h-5 w-5" /> Risk Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {reports.slice(0, 5).reverse().map((report, idx) => {
                        const rd = report.report_data;
                        const risk = rd?.diagnosis ? getRiskLevel(rd.diagnosis, rd.confidence || 0) : null;
                        return (
                          <div key={report.id} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {rd?.patient_name || `Report ${idx + 1}`} — {new Date(report.created_at).toLocaleDateString()}
                            </span>
                            {risk && (
                              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${risk.color}`}>
                                {risk.label}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-card to-muted/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg"><Shield className="h-5 w-5" /> AI Health Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="text-primary font-bold mt-0.5">•</span>
                          <span>You have {reports.length} report(s) on file for trend tracking</span>
                        </li>
                        {latestRisk && (
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-bold mt-0.5">•</span>
                            <span>Current risk level: {latestRisk.label}</span>
                          </li>
                        )}
                        <li className="flex items-start gap-2">
                          <span className="text-primary font-bold mt-0.5">•</span>
                          <span>Upload new scans periodically for comprehensive trend analysis</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary font-bold mt-0.5">•</span>
                          <span>Consult your doctor for any persistent symptoms or concerns</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Diet Plan Tab */}
            <TabsContent value="diet" className="space-y-6">
              {!diet ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Apple className="h-10 w-10 mx-auto mb-3 opacity-50 text-muted-foreground" />
                    <p className="text-muted-foreground">Upload a report to get personalized diet recommendations.</p>
                    <Button className="mt-4" onClick={() => navigate('/ai-scan')}>Upload a Scan</Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {latestRisk && (
                    <div className={`p-4 rounded-lg border ${latestRisk.color} text-sm`}>
                      <p className="font-semibold mb-1">Diet plan personalized for: {latestRisk.label}</p>
                      <p>Based on your latest report{latestReport?.patient_name ? ` for ${latestReport.patient_name}` : ''}. Recommendations update automatically with new reports.</p>
                    </div>
                  )}
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card className="bg-gradient-to-br from-emerald-50/50 to-card border-emerald-200/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg text-emerald-700">
                          <Apple className="h-5 w-5" /> Foods to Eat
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2.5">
                          {diet.eat.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <span className="text-emerald-600 font-bold mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-red-50/50 to-card border-red-200/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg text-red-600">
                          <AlertCircle className="h-5 w-5" /> Foods to Avoid
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2.5">
                          {diet.avoid.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <span className="text-red-500 font-bold mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                  <Card className="bg-gradient-to-br from-card to-muted/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Activity className="h-5 w-5" /> Lifestyle Suggestions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2.5">
                        {diet.lifestyle.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-primary font-bold mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
