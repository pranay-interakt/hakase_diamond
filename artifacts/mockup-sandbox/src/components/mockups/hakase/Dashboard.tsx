import React, { useState } from 'react';
import { 
  FlaskConical, Search, FileText, Users, Activity,
  Calendar, AlertTriangle, GitCompare, CheckCircle, 
  XCircle, AlertCircle, UploadCloud, ChevronRight,
  Download, Copy, MapPin, BookOpen, Award, FileUp,
  BrainCircuit, LayoutDashboard, Settings, Bell,
  ChevronDown, ExternalLink, Network, Check, BriefcaseMedical
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('analytics');

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-[#0A1628] text-slate-300 flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <div className="flex items-center gap-2 text-white">
            <div className="bg-[#0EA5E9] p-1.5 rounded-md">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-lg leading-tight tracking-wide">Hakase</div>
              <div className="text-[10px] text-[#0EA5E9] font-medium tracking-widest uppercase">Clinical AI</div>
            </div>
          </div>
        </div>

        <div className="p-4 flex-1 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3 mt-4">Platform</div>
          
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'analytics' ? 'bg-[#0EA5E9]/10 text-[#0EA5E9]' : 'hover:bg-white/5 hover:text-white'}`}
          >
            <FlaskConical className="w-4 h-4" />
            Protocol Analytics
          </button>
          
          <button 
            onClick={() => setActiveTab('explorer')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'explorer' ? 'bg-[#0EA5E9]/10 text-[#0EA5E9]' : 'hover:bg-white/5 hover:text-white'}`}
          >
            <DatabaseIcon className="w-4 h-4" />
            Trial Explorer
          </button>
          
          <button 
            onClick={() => setActiveTab('drafter')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'drafter' ? 'bg-[#0EA5E9]/10 text-[#0EA5E9]' : 'hover:bg-white/5 hover:text-white'}`}
          >
            <FileText className="w-4 h-4" />
            Protocol Drafter
          </button>
          
          <button 
            onClick={() => setActiveTab('kol')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'kol' ? 'bg-[#0EA5E9]/10 text-[#0EA5E9]' : 'hover:bg-white/5 hover:text-white'}`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4" />
              KOL Dashboard
            </div>
            <div className="w-5 h-5 rounded-full bg-[#0EA5E9] text-white flex items-center justify-center text-[10px] font-bold">3</div>
          </button>
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0EA5E9] to-indigo-500 flex items-center justify-center text-white font-medium text-sm">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">Dr. Jane Doe</div>
              <div className="text-xs text-slate-500 truncate">SVP Clinical Ops</div>
            </div>
            <Settings className="w-4 h-4 text-slate-500" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-lg font-semibold text-slate-800">
            {activeTab === 'analytics' && 'Protocol Analytics'}
            {activeTab === 'explorer' && 'Trial Explorer'}
            {activeTab === 'drafter' && 'Protocol Drafter'}
            {activeTab === 'kol' && 'Key Opinion Leaders'}
          </h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </Button>
            <Button className="bg-[#0A1628] hover:bg-[#15294A] text-white text-sm h-9">
              Need Help?
            </Button>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto h-full">
            {activeTab === 'analytics' && <ProtocolAnalyticsView />}
            {activeTab === 'explorer' && <TrialExplorerView />}
            {activeTab === 'drafter' && <ProtocolDrafterView />}
            {activeTab === 'kol' && <KOLDashboardView />}
          </div>
        </main>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// SCREENS
// --------------------------------------------------------------------------

function ProtocolAnalyticsView() {
  const [showUpload, setShowUpload] = useState(false);

  if (showUpload) {
    return (
      <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Upload Clinical Protocol</h2>
          <p className="text-slate-500">Our AI will analyze your protocol against 328,000+ historical trials to predict success probability, estimate timelines, and identify risk factors.</p>
        </div>
        
        <div className="w-full bg-white border-2 border-dashed border-slate-300 rounded-2xl p-16 flex flex-col items-center justify-center transition-all hover:border-[#0EA5E9] hover:bg-[#0EA5E9]/5 cursor-pointer">
          <div className="w-16 h-16 bg-[#0EA5E9]/10 rounded-full flex items-center justify-center mb-6">
            <FileUp className="w-8 h-8 text-[#0EA5E9]" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">Drag & drop your protocol here</h3>
          <p className="text-sm text-slate-500 mb-6">Supports PDF, DOCX (Max 50MB)</p>
          <Button onClick={() => setShowUpload(false)} className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white px-8">
            Browse Files
          </Button>
        </div>
        
        <div className="mt-8 flex items-center gap-2 text-sm text-slate-400">
          <DatabaseIcon className="w-4 h-4" />
          <span>Powered by Hakase Clinical Engine v2.4</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-slate-800">ONCO-2024-Phase2.pdf</h2>
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-0 flex gap-1 items-center">
              <CheckCircle className="w-3 h-3" /> Analysis Complete
            </Badge>
          </div>
          <p className="text-sm text-slate-500">Analyzed today at 09:42 AM • Oncology • Phase II</p>
        </div>
        <Button onClick={() => setShowUpload(true)} variant="outline" className="border-slate-300">
          <UploadCloud className="w-4 h-4 mr-2" />
          New Analysis
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-slate-500">Success Probability</p>
              <Activity className="w-4 h-4 text-[#0EA5E9]" />
            </div>
            <div className="flex items-end gap-3">
              <div className="text-4xl font-bold text-slate-800">73<span className="text-2xl">%</span></div>
              <div className="flex flex-col gap-1 w-full pb-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>Phase II Avg: 42%</span>
                  <span className="text-emerald-600">+31%</span>
                </div>
                <Progress value={73} className="h-2 bg-slate-100" indicatorClassName="bg-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-slate-500">Est. Timeline</p>
              <Calendar className="w-4 h-4 text-[#0EA5E9]" />
            </div>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold text-slate-800">28<span className="text-lg font-semibold text-slate-500 ml-1">mo</span></div>
            </div>
            <p className="text-xs text-amber-600 mt-2 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> 4 mo longer than avg
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-slate-500">Risk Flags</p>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-bold text-slate-800">3</div>
            <p className="text-xs text-slate-500 mt-2">1 High • 2 Medium</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-slate-500">Similar Trials</p>
              <GitCompare className="w-4 h-4 text-[#0EA5E9]" />
            </div>
            <div className="text-3xl font-bold text-slate-800">47</div>
            <p className="text-xs text-slate-500 mt-2">Historical baselines found</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="border-t-4 border-t-amber-500 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Protocol Vulnerabilities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: "Eligibility criteria too narrow", level: "High Risk", desc: "Exclusion criteria around prior immunotherapies will exclude 68% of target patient pool based on current SoC." },
              { title: "Safety monitoring gap detected", level: "Medium", desc: "Frequency of cardiac monitoring (Q12W) is lower than 85% of similar trials with this mechanism." },
              { title: "Enrollment timeline underestimated", level: "Medium", desc: "Predicted site activation delays in EU region will push timeline out by approx 4 months." }
            ].map((vuln, i) => (
              <div key={i} className="flex gap-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="shrink-0 mt-0.5">
                  {vuln.level === 'High Risk' ? 
                    <XCircle className="w-5 h-5 text-red-500" /> : 
                    <AlertTriangle className="w-5 h-5 text-amber-500" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-800 text-sm">{vuln.title}</h4>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border-0 ${vuln.level === 'High Risk' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {vuln.level}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{vuln.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-emerald-500 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Design Strengths
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: "CDISC-aligned endpoint structure", desc: "All secondary endpoints map cleanly to SDTM standards." },
              { title: "Appropriate phase II sample size", desc: "N=120 provides 90% power for the primary endpoint based on historical effect sizes." },
              { title: "Clear primary endpoint definition", desc: "ORR assessment timing aligns perfectly with RECIST 1.1 guidelines." }
            ].map((strength, i) => (
              <div key={i} className="flex gap-4 p-3 rounded-lg bg-emerald-50/50 border border-emerald-100/50">
                <div className="shrink-0 mt-0.5">
                  <Check className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm mb-1">{strength.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{strength.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">AI Site Recommendations</CardTitle>
            <CardDescription>Predicted best performing sites based on protocol criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead>Site Name</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead>TA Experience</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { name: "MD Anderson Cancer Center", region: "Texas, USA", score: 98, exp: "Very High" },
                  { name: "Dana-Farber Cancer Institute", region: "Mass, USA", score: 95, exp: "Very High" },
                  { name: "Mayo Clinic", region: "Minn, USA", score: 89, exp: "High" },
                  { name: "Memorial Sloan Kettering", region: "NY, USA", score: 88, exp: "Very High" },
                  { name: "UCSF Medical Center", region: "Calif, USA", score: 84, exp: "High" },
                ].map((site, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-slate-800">{site.name}</TableCell>
                    <TableCell className="text-slate-500">{site.region}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={site.score > 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}>
                        {site.score}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">{site.exp}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-[#0EA5E9] hover:text-[#0284C7] hover:bg-[#0EA5E9]/10">Details</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Comparator Trials</CardTitle>
            <CardDescription>Highest similarity score</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { nct: "NCT04561234", match: 94, status: "Completed", phase: "Phase 2", pop: 110 },
              { nct: "NCT05128892", match: 88, status: "Recruiting", phase: "Phase 2", pop: 145 },
              { nct: "NCT03984421", match: 81, status: "Terminated", phase: "Phase 2/3", pop: 85 }
            ].map((trial, i) => (
              <div key={i} className="p-3 border border-slate-200 rounded-lg hover:border-[#0EA5E9] transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-semibold text-[#0EA5E9] group-hover:underline">{trial.nct}</span>
                  <Badge variant="outline" className="bg-slate-50 text-xs text-slate-600">{trial.match}% Match</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                  <Badge className={`px-1.5 py-0 text-[10px] ${trial.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : trial.status === 'Recruiting' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                    {trial.status}
                  </Badge>
                  <span>•</span>
                  <span>{trial.phase}</span>
                </div>
                <div className="text-xs text-slate-500">
                  <Users className="w-3 h-3 inline mr-1" /> N={trial.pop}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TrialExplorerView() {
  const [selectedTrial, setSelectedTrial] = useState<string | null>(null);

  const trials = [
    { id: "NCT04381122", title: "Study of Pembrolizumab plus Chemotherapy in Advanced Non-Small Cell Lung Cancer", phase: "Phase 3", status: "Recruiting", sponsor: "Merck Sharp & Dohme LLC", enrollment: 850, duration: "36 mos", summary: "A randomized, double-blind, phase 3 study evaluating pembrolizumab in combination with standard of care chemotherapy versus placebo plus chemotherapy." },
    { id: "NCT03928441", title: "Pembrolizumab with Lenvatinib in Advanced Solid Tumors", phase: "Phase 2", status: "Completed", sponsor: "Eisai Inc.", enrollment: 142, duration: "24 mos", summary: "Evaluating the safety and efficacy of the combination therapy in previously treated patients with advanced solid tumors." },
    { id: "NCT04839910", title: "Adjuvant Pembrolizumab vs Placebo in High-Risk Melanoma", phase: "Phase 3", status: "Recruiting", sponsor: "Merck Sharp & Dohme LLC", enrollment: 1050, duration: "48 mos", summary: "Global trial assessing recurrence-free survival in patients with resected high-risk stage II melanoma receiving pembrolizumab." },
    { id: "NCT03112234", title: "Biomarker Study of Pembrolizumab in Gastric Cancer", phase: "Phase 2", status: "Terminated", sponsor: "National Cancer Institute", enrollment: 45, duration: "12 mos", summary: "Study halted early due to slow accrual. Aimed to identify predictive biomarkers for response in advanced gastric or gastroesophageal junction adenocarcinoma." },
    { id: "NCT05663321", title: "Pembrolizumab + Novel Agent X in Refractory NSCLC", phase: "Phase 1/2", status: "Active, not recruiting", sponsor: "BioPharma Innovations", enrollment: 80, duration: "18 mos", summary: "Dose escalation and expansion study of a novel combination approach in patients who progressed on prior PD-1/L1 therapy." }
  ];

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      <div className={`flex flex-col h-full transition-all duration-300 ${selectedTrial ? 'w-1/2' : 'w-full'}`}>
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input 
              className="w-full pl-12 pr-4 py-6 text-lg rounded-xl border-slate-200 shadow-sm focus-visible:ring-[#0EA5E9]" 
              placeholder="Search by drug name, NCT number, or therapeutic area..."
              defaultValue="pembrolizumab"
            />
            <Button className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#0A1628] hover:bg-[#15294A]">Search</Button>
          </div>
          
          <div className="flex gap-3">
            <select className="h-10 px-3 py-2 rounded-md border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-[#0EA5E9]">
              <option>Phase (All)</option>
              <option>Phase 1</option>
              <option>Phase 2</option>
              <option>Phase 3</option>
            </select>
            <select className="h-10 px-3 py-2 rounded-md border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-[#0EA5E9]">
              <option>Status (All)</option>
              <option>Recruiting</option>
              <option>Completed</option>
              <option>Active</option>
            </select>
            <select className="h-10 px-3 py-2 rounded-md border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-[#0EA5E9]">
              <option>Therapeutic Area</option>
              <option>Oncology</option>
              <option>Cardiology</option>
              <option>Neurology</option>
            </select>
            <Button variant="outline" className="text-slate-600 border-slate-200">More Filters</Button>
          </div>
        </div>

        <div className="mb-4 text-sm text-slate-500 font-medium">
          Showing 1,247 results for <span className="text-slate-800">"pembrolizumab"</span>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-10">
          {trials.map((trial) => (
            <Card 
              key={trial.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${selectedTrial === trial.id ? 'border-[#0EA5E9] ring-1 ring-[#0EA5E9]' : 'border-slate-200'}`}
              onClick={() => setSelectedTrial(trial.id === selectedTrial ? null : trial.id)}
            >
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm font-medium text-slate-500 mb-1">{trial.id}</div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-slate-50">{trial.phase}</Badge>
                    <Badge className={
                      trial.status === 'Recruiting' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : 
                      trial.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 
                      'bg-red-100 text-red-800 hover:bg-red-200'
                    }>{trial.status}</Badge>
                  </div>
                </div>
                <h3 className="text-base font-semibold text-slate-800 mb-3 leading-tight">{trial.title}</h3>
                
                <div className="flex flex-wrap gap-4 text-xs text-slate-500 mb-4">
                  <div className="flex items-center gap-1"><BriefcaseMedical className="w-3.5 h-3.5" /> {trial.sponsor}</div>
                  <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> N={trial.enrollment}</div>
                  <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {trial.duration}</div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <BrainCircuit className="w-3.5 h-3.5 text-[#0EA5E9]" />
                    <span className="text-xs font-semibold text-[#0EA5E9]">AI Brief</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{trial.summary}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Right Detail Panel */}
      {selectedTrial && (
        <div className="w-1/2 h-full bg-white border border-slate-200 rounded-xl shadow-lg flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-300">
          <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
            <div>
              <div className="text-sm font-medium text-[#0EA5E9] mb-1">{selectedTrial}</div>
              <h2 className="text-lg font-bold text-slate-800 leading-tight pr-8">
                {trials.find(t => t.id === selectedTrial)?.title}
              </h2>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedTrial(null)} className="shrink-0 -mr-2 -mt-2 text-slate-400 hover:text-slate-600">
              <XCircle className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Study Type</div>
                <div className="font-medium text-slate-800">Interventional</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Allocation</div>
                <div className="font-medium text-slate-800">Randomized</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Primary Purpose</div>
                <div className="font-medium text-slate-800">Treatment</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Masking</div>
                <div className="font-medium text-slate-800">Double Blind</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">AI Trial Analysis</h3>
              <div className="prose prose-sm max-w-none text-slate-600 space-y-3">
                <p>This phase 3 trial investigates the efficacy of pembrolizumab in combination with standard chemotherapy compared to placebo + chemotherapy. <strong>Historical success rate for similar designs is approximately 45%.</strong></p>
                <p><strong>Key Strengths:</strong> The robust double-blind randomized design minimizes bias. The sample size of 850 provides sufficient statistical power ({'>'}90%) for the primary endpoints of PFS and OS.</p>
                <p><strong>Potential Risks:</strong> Enrollment timeline (36 months) may be optimistic based on competing trials in the same indication. The inclusion criteria requiring specific biomarker thresholds (PD-L1 TPS ≥1%) may limit the available patient pool.</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Primary Endpoints</h3>
              <ul className="space-y-3">
                <li className="flex gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</div>
                  <div>
                    <div className="font-medium text-slate-800">Progression-Free Survival (PFS)</div>
                    <div className="text-slate-500 text-xs mt-1">Time Frame: Up to ~35 months</div>
                  </div>
                </li>
                <li className="flex gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</div>
                  <div>
                    <div className="font-medium text-slate-800">Overall Survival (OS)</div>
                    <div className="text-slate-500 text-xs mt-1">Time Frame: Up to ~50 months</div>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="pt-4 border-t border-slate-100 flex gap-3">
              <Button className="flex-1 bg-[#0A1628] hover:bg-[#15294A]">View Full Protocol</Button>
              <Button variant="outline" className="flex-1"><ExternalLink className="w-4 h-4 mr-2" /> Open ClinicalTrials.gov</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProtocolDrafterView() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isGenerated, setIsGenerated] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    let current = 0;
    const interval = setInterval(() => {
      current += 5;
      setProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        setIsGenerating(false);
        setIsGenerated(true);
      }
    }, 100);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-8">
      {/* Form Panel */}
      <div className="w-[450px] shrink-0 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <h2 className="text-lg font-bold text-slate-800">Protocol Parameters</h2>
          <p className="text-xs text-slate-500 mt-1">Define study parameters to generate a draft</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Therapeutic Area</label>
            <select className="w-full h-10 px-3 py-2 rounded-md border border-slate-200 bg-white text-sm focus:border-[#0EA5E9] focus:ring-1 focus:ring-[#0EA5E9] outline-none">
              <option>Oncology</option>
              <option>Immunology</option>
              <option>Neurology</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Intervention / Drug Name</label>
            <Input placeholder="e.g. HK-204" defaultValue="HK-204" className="border-slate-200 focus-visible:ring-[#0EA5E9]" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Trial Phase</label>
            <div className="grid grid-cols-4 gap-2">
              {['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4'].map((phase, i) => (
                <div key={phase} className={`text-center py-2 border rounded-md text-xs font-medium cursor-pointer ${i === 1 ? 'border-[#0EA5E9] bg-[#0EA5E9]/10 text-[#0EA5E9]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {phase}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Target Population</label>
            <textarea className="w-full h-20 px-3 py-2 rounded-md border border-slate-200 bg-white text-sm focus:border-[#0EA5E9] focus:ring-1 focus:ring-[#0EA5E9] outline-none resize-none" placeholder="Describe patient population...">Adult patients with previously untreated advanced or metastatic non-small cell lung cancer.</textarea>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Primary Endpoint</label>
            <Input placeholder="e.g. Progression-Free Survival" defaultValue="Progression-Free Survival (PFS)" className="border-slate-200 focus-visible:ring-[#0EA5E9]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Est. Enrollment</label>
              <Input type="number" defaultValue="120" className="border-slate-200 focus-visible:ring-[#0EA5E9]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Study Duration</label>
              <div className="flex gap-2">
                <Input type="number" defaultValue="24" className="w-16 border-slate-200 focus-visible:ring-[#0EA5E9]" />
                <select className="flex-1 h-9 px-2 py-1 rounded-md border border-slate-200 bg-white text-sm outline-none focus:border-[#0EA5E9]">
                  <option>Months</option>
                  <option>Weeks</option>
                  <option>Years</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 bg-white shrink-0 space-y-4">
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>Synthesizing literature...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-slate-100" indicatorClassName="bg-[#0EA5E9]" />
            </div>
          )}
          <Button 
            className="w-full bg-[#0EA5E9] hover:bg-[#0284C7] text-white py-6 text-base shadow-md"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating Draft...' : 'Generate Protocol Draft'}
            {!isGenerating && <ChevronRight className="w-5 h-5 ml-2" />}
          </Button>
        </div>
      </div>

      {/* Output Panel */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
        {!isGenerated && !isGenerating ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <FileText className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">No draft generated yet</p>
            <p className="text-sm">Fill out parameters and click generate.</p>
          </div>
        ) : (
          <>
            <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-slate-800">Generated Protocol Draft</h3>
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-0 flex gap-1 items-center font-medium">
                  <CheckCircle className="w-3 h-3" /> CDISC Aligned
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 text-xs"><Download className="w-3.5 h-3.5 mr-1.5" /> DOCX</Button>
                <Button variant="outline" size="sm" className="h-8 text-xs"><Download className="w-3.5 h-3.5 mr-1.5" /> PDF</Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-12 bg-slate-100/50">
              <div className="max-w-3xl mx-auto bg-white border border-slate-200 shadow-sm rounded-lg p-10 font-serif">
                <div className="text-center mb-10 border-b pb-8 border-slate-200">
                  <h1 className="text-2xl font-bold text-slate-900 mb-4 uppercase">Clinical Study Protocol</h1>
                  <p className="text-lg text-slate-700 font-medium">A Phase 2 Study of HK-204 in Adult Patients with Advanced Non-Small Cell Lung Cancer</p>
                </div>

                <div className="space-y-8 text-slate-800 text-sm leading-relaxed">
                  <section className="relative group">
                    <Button size="icon" variant="ghost" className="absolute -left-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-[#0EA5E9] h-8 w-8"><Copy className="w-4 h-4" /></Button>
                    <h2 className="text-lg font-bold mb-3 font-sans uppercase tracking-wide text-[#0A1628]">1. Study Objectives</h2>
                    <p className="mb-2"><strong>1.1 Primary Objective</strong><br/>To evaluate the efficacy of HK-204 in patients with advanced non-small cell lung cancer (NSCLC) as measured by Progression-Free Survival (PFS) according to RECIST 1.1 criteria.</p>
                    <p><strong>1.2 Secondary Objectives</strong><br/>- To evaluate Overall Survival (OS).<br/>- To assess the Objective Response Rate (ORR) and Duration of Response (DoR).<br/>- To characterize the safety and tolerability profile of HK-204 in this patient population.</p>
                  </section>

                  <section className="relative group">
                    <Button size="icon" variant="ghost" className="absolute -left-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-[#0EA5E9] h-8 w-8"><Copy className="w-4 h-4" /></Button>
                    <h2 className="text-lg font-bold mb-3 font-sans uppercase tracking-wide text-[#0A1628]">2. Study Design</h2>
                    <p>This is a Phase 2, multi-center, open-label, single-arm study designed to evaluate the efficacy and safety of HK-204 in adult patients with previously untreated advanced or metastatic NSCLC. Approximately 120 patients will be enrolled globally. Patients will receive HK-204 intravenously on Day 1 of each 21-day cycle until disease progression, unacceptable toxicity, or withdrawal of consent.</p>
                  </section>

                  <section className="relative group">
                    <Button size="icon" variant="ghost" className="absolute -left-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-[#0EA5E9] h-8 w-8"><Copy className="w-4 h-4" /></Button>
                    <h2 className="text-lg font-bold mb-3 font-sans uppercase tracking-wide text-[#0A1628]">3. Eligibility Criteria</h2>
                    <p className="mb-2"><strong>3.1 Inclusion Criteria</strong><br/>1. Male or female patients aged ≥ 18 years.<br/>2. Histologically or cytologically confirmed diagnosis of advanced or metastatic NSCLC.<br/>3. Measurable disease per RECIST v1.1.<br/>4. ECOG Performance Status of 0 or 1.</p>
                    <p><strong>3.2 Exclusion Criteria</strong><br/>1. Prior systemic therapy for metastatic disease.<br/>2. Known active CNS metastases.<br/>3. Active autoimmune disease requiring systemic immunosuppression.</p>
                  </section>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function KOLDashboardView() {
  const [selectedKol, setSelectedKol] = useState<number | null>(null);

  const kols = [
    { id: 1, name: "Dr. Sarah Chen", institution: "Memorial Sloan Kettering", loc: "New York, USA", initial: "SC", color: "from-blue-500 to-indigo-600", tags: ["Thoracic Oncology", "Immunotherapy", "Biomarkers"], pubs: 245, hindex: 84, trials: 32, influence: 98, outreach: "High" },
    { id: 2, name: "Dr. James Wilson", institution: "Dana-Farber Cancer Institute", loc: "Boston, USA", initial: "JW", color: "from-emerald-500 to-teal-600", tags: ["Targeted Therapy", "Lung Cancer", "Phase 1 Trials"], pubs: 188, hindex: 72, trials: 45, influence: 95, outreach: "Medium" },
    { id: 3, name: "Dr. Elena Rossi", institution: "Institut Gustave Roussy", loc: "Paris, France", initial: "ER", color: "from-purple-500 to-pink-600", tags: ["Translational Oncology", "Immune Evasion"], pubs: 156, hindex: 65, trials: 18, influence: 91, outreach: "High" },
    { id: 4, name: "Dr. Michael Chang", institution: "MD Anderson Cancer Center", loc: "Houston, USA", initial: "MC", color: "from-amber-500 to-orange-600", tags: ["Radiotherapy", "Combined Modalities"], pubs: 310, hindex: 92, trials: 50, influence: 99, outreach: "Low" },
    { id: 5, name: "Dr. Anna Kowalski", institution: "Charité - Universitätsmedizin", loc: "Berlin, Germany", initial: "AK", color: "from-rose-500 to-red-600", tags: ["Precision Medicine", "Oncology Genomics"], pubs: 142, hindex: 58, trials: 22, influence: 85, outreach: "High" },
    { id: 6, name: "Dr. David Smith", institution: "Royal Marsden Hospital", loc: "London, UK", initial: "DS", color: "from-cyan-500 to-blue-600", tags: ["Gastrointestinal Cancers", "Novel Therapeutics"], pubs: 215, hindex: 78, trials: 28, influence: 93, outreach: "Medium" }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="bg-[#0A1628] rounded-xl p-8 text-white mb-6 relative overflow-hidden shrink-0">
        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-[#0EA5E9]/20 to-transparent pointer-events-none"></div>
        <Network className="absolute right-12 top-1/2 -translate-y-1/2 w-32 h-32 text-white/5 pointer-events-none" />
        
        <h2 className="text-2xl font-bold mb-2">Find Key Opinion Leaders</h2>
        <p className="text-slate-400 mb-6 max-w-lg">Identify and evaluate leading global experts based on publication history, trial involvement, and scientific network influence.</p>
        
        <div className="flex gap-4 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input 
              className="w-full pl-12 pr-4 h-12 text-base rounded-lg border-white/20 bg-white/10 text-white placeholder:text-slate-400 focus-visible:ring-[#0EA5E9] focus-visible:bg-white focus-visible:text-slate-900 focus-visible:placeholder:text-slate-500 transition-colors" 
              placeholder="Search by specialty, location, or name..."
              defaultValue="Oncology NSCLC"
            />
          </div>
          <Button className="h-12 px-8 bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-base">Search</Button>
        </div>
      </div>

      <div className="flex items-center gap-6 mb-6 px-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Total Found</div>
          <div className="text-xl font-bold text-slate-800">142</div>
        </div>
        <div className="w-px h-6 bg-slate-200"></div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-slate-500 uppercase tracking-wider font-semibold">High Influence ({'>'}90)</div>
          <div className="text-xl font-bold text-[#0EA5E9]">23</div>
        </div>
        <div className="w-px h-6 bg-slate-200"></div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Geo Spread</div>
          <div className="text-xl font-bold text-slate-800">12 Countries</div>
        </div>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        <div className={`flex-1 overflow-y-auto pr-2 grid gap-4 transition-all duration-300 ${selectedKol ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {kols.map((kol) => (
            <Card 
              key={kol.id} 
              className={`hover:border-[#0EA5E9]/50 transition-all cursor-pointer shadow-sm group ${selectedKol === kol.id ? 'border-[#0EA5E9] ring-1 ring-[#0EA5E9]' : ''}`}
              onClick={() => setSelectedKol(kol.id === selectedKol ? null : kol.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${kol.color} text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0 group-hover:scale-105 transition-transform`}>
                    {kol.initial}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 leading-tight">{kol.name}</h3>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><BookOpen className="w-3 h-3" /> {kol.institution}</div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" /> {kol.loc}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-5">
                  {kol.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">{tag}</span>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4 text-center divide-x divide-slate-100 border-y border-slate-100 py-3">
                  <div>
                    <div className="text-lg font-bold text-slate-800">{kol.pubs}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Pubs</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-slate-800">{kol.hindex}</div>
                    <div className="text-[10px] text-slate-500 uppercase">h-index</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-[#0EA5E9]">{kol.trials}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Trials</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1.5">
                      <span className="text-slate-600">Influence Score</span>
                      <span className="text-slate-900">{kol.influence}</span>
                    </div>
                    <Progress value={kol.influence} className="h-1.5" indicatorClassName={kol.influence > 90 ? 'bg-indigo-500' : 'bg-blue-400'} />
                  </div>
                  <Button variant="outline" className="w-full text-xs h-8 bg-slate-50 hover:bg-slate-100">View Profile</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedKol && (
          <div className="w-[400px] bg-white border border-slate-200 rounded-xl shadow-lg flex flex-col overflow-hidden shrink-0 animate-in slide-in-from-right-4 duration-300">
            {kols.filter(k => k.id === selectedKol).map(kol => (
              <React.Fragment key={kol.id}>
                <div className="p-6 border-b border-slate-100 relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${kol.color} opacity-10`}></div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedKol(null)} className="absolute right-2 top-2 text-slate-400 hover:text-slate-700">
                    <XCircle className="w-5 h-5" />
                  </Button>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-tr ${kol.color} text-white flex items-center justify-center font-bold text-2xl shadow-md`}>
                      {kol.initial}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">{kol.name}</h2>
                      <div className="text-sm font-medium text-[#0EA5E9]">{kol.institution}</div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="p-6 space-y-8">
                    <section>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-500" /> Key Focus Areas
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {kol.tags.map(tag => (
                          <Badge key={tag} className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-normal">{tag}</Badge>
                        ))}
                        <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-normal">Clinical Trial Design</Badge>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500" /> Recent High-Impact Pubs
                      </h3>
                      <div className="space-y-4">
                        <div className="text-sm">
                          <a href="#" className="font-semibold text-[#0EA5E9] hover:underline block leading-tight mb-1">Efficacy of Novel Immunotherapies in Advanced NSCLC</a>
                          <div className="text-xs text-slate-500">New England Journal of Medicine • 2023 • 142 Citations</div>
                        </div>
                        <div className="text-sm">
                          <a href="#" className="font-semibold text-[#0EA5E9] hover:underline block leading-tight mb-1">Biomarker-Driven Adaptive Trial Designs in Oncology</a>
                          <div className="text-xs text-slate-500">Lancet Oncology • 2022 • 89 Citations</div>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Network className="w-4 h-4 text-indigo-500" /> Collaboration Network
                      </h3>
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-sm space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-slate-700">Dr. Michael Chang</span>
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">8 Co-authored</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-slate-700">Dr. James Wilson</span>
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">5 Co-authored</span>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50">
                  <div className="mb-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Outreach Notes</label>
                    <textarea className="w-full h-20 px-3 py-2 text-sm border border-slate-200 rounded-md focus:border-[#0EA5E9] focus:ring-1 focus:ring-[#0EA5E9] outline-none resize-none" placeholder="Add notes for engagement strategy..."></textarea>
                  </div>
                  <Button className="w-full bg-[#0A1628] hover:bg-[#15294A]">Add to Target List</Button>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-component for simple icons missing from direct import
function DatabaseIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}
