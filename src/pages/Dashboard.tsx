import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileText, TrendingUp, Heart, Apple, AlertCircle, Calendar, Loader2 } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
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
      if (reportsRes.data) setReports(reportsRes.data);
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="diet">Diet Plan</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reports.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Health Status</CardTitle>
                    <Heart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{reports.length > 0 ? 'Monitored' : 'No Data'}</div>
                  </CardContent>
                </Card>
                <Card>
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

              <Card>
                <CardHeader>
                  <CardTitle>Your Previous Reports</CardTitle>
                  <CardDescription>Review your medical analysis history</CardDescription>
                </CardHeader>
                <CardContent>
                  {reports.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>No reports yet. Upload a medical scan to get started.</p>
                      <Button className="mt-4" onClick={() => navigate('/ai-scan')}>Go to AI Scan</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reports.map((report) => (
                        <div key={report.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium text-sm">Medical Analysis Report</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(report.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Health Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reports.length === 0 ? (
                      <p className="text-muted-foreground text-sm">Upload reports to see your health trend over time.</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Based on {reports.length} report(s), your health is being actively monitored. Continue regular checkups for better insights.</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5" /> AI Health Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Regular monitoring helps detect issues early</li>
                      <li>• Maintain a balanced diet and hydration</li>
                      <li>• Consult your doctor for any persistent symptoms</li>
                      <li>• Upload new scans periodically for trend tracking</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Diet Plan Tab */}
            <TabsContent value="diet" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700"><Apple className="h-5 w-5" /> Foods to Eat</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>✅ Fresh fruits and vegetables</li>
                      <li>✅ Whole grains and fiber-rich foods</li>
                      <li>✅ Lean proteins (fish, chicken, legumes)</li>
                      <li>✅ Plenty of water (8-10 glasses/day)</li>
                      <li>✅ Nuts and seeds in moderation</li>
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600"><AlertCircle className="h-5 w-5" /> Foods to Avoid</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>❌ Excess salt and processed foods</li>
                      <li>❌ Sugary drinks and sodas</li>
                      <li>❌ Fried and high-fat foods</li>
                      <li>❌ Excessive caffeine and alcohol</li>
                      <li>❌ Red and processed meats in excess</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Lifestyle Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>🏃 30 minutes of moderate exercise daily</li>
                    <li>😴 7-8 hours of quality sleep</li>
                    <li>🧘 Stress management through meditation or yoga</li>
                    <li>💧 Stay hydrated throughout the day</li>
                    <li>🩺 Regular health checkups every 6 months</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
