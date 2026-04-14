import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';

const API_BASE = 'http://localhost:3001';

interface Faculty {
  id: string;
  title: string;
}

interface Subject {
  id: string;
  title: string;
  facultyId: string;
}

interface LabSummary {
  id: string;
  title: string;
  subjectId: string;
  profileId: string;
}

interface Lab {
  id: string;
  title: string;
  statement: string;
  profileId: string;
  environmentType: string;
  toolset?: string[];
}

interface ProfileSummary {
  id: string;
  displayName: string;
  osFamily: string;
  language: string;
  version: string;
  timeoutMs: number;
  gradingStrategy: string;
}

const DEFAULT_CODE: Record<string, string> = {
  python: 'import sys\n\n# Read from stdin\n# for line in sys.stdin:\n#     print(line)\n\nprint("Hello World")',
  javascript: 'const fs = require("fs");\n\n// Read from stdin\n// const input = fs.readFileSync(0, "utf8");\n\nconsole.log("Hello Node.js");',
  cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello C++" << std::endl;\n    return 0;\n}',
  java: 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello Java");\n    }\n}'
};

function App() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [labs, setLabs] = useState<LabSummary[]>([]);
  
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedLabId, setSelectedLabId] = useState<string>('');
  
  const [lab, setLab] = useState<Lab | null>(null);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  
  const [code, setCode] = useState<string>('');
  const [stdin, setStdin] = useState<string>('');
  const [runResult, setRunResult] = useState<any>(null);
  const [submitResult, setSubmitResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'problem' | 'run' | 'submit'>('problem');

  // Load faculties on mount
  useEffect(() => {
    axios.get(`${API_BASE}/faculties`).then(res => {
      setFaculties(res.data);
      if (res.data.length > 0) {
        setSelectedFacultyId(res.data[0].id);
      }
    });
  }, []);

  // Load subjects when faculty changes
  useEffect(() => {
    if (!selectedFacultyId) return;
    axios.get(`${API_BASE}/subjects?facultyId=${selectedFacultyId}`).then(res => {
      setSubjects(res.data);
      if (res.data.length > 0) {
        setSelectedSubjectId(res.data[0].id);
      } else {
        setSelectedSubjectId('');
      }
    });
  }, [selectedFacultyId]);

  // Load labs when subject changes
  useEffect(() => {
    if (!selectedSubjectId) {
      setLabs([]);
      setSelectedLabId('');
      return;
    }
    axios.get(`${API_BASE}/labs?subjectId=${selectedSubjectId}`).then(res => {
      setLabs(res.data);
      if (res.data.length > 0) {
        setSelectedLabId(res.data[0].id);
      } else {
        setSelectedLabId('');
      }
    });
  }, [selectedSubjectId]);

  // Load Lab details and profile when Lab changes
  useEffect(() => {
    if (!selectedLabId) {
      setLab(null);
      setProfile(null);
      return;
    }

    setLoading(true);
    axios.get(`${API_BASE}/labs/${selectedLabId}`).then(res => {
      setLab(res.data);
      axios.get(`${API_BASE}/profiles/${res.data.profileId}`).then(pRes => {
        const prof = pRes.data;
        setProfile(prof);
        setCode(DEFAULT_CODE[prof.language] || '');
        setLoading(false);
      });
    }).catch(() => setLoading(false));
  }, [selectedLabId]);

  const handleRun = async () => {
    if (!lab) return;
    setLoading(true);
    setActiveTab('run');
    setSubmitResult(null);
    try {
      const res = await axios.post(`${API_BASE}/run`, {
        code,
        profileId: lab.profileId,
        stdin
      });
      setRunResult(res.data);
    } catch (err: any) {
      setRunResult({ error: err.response?.data?.error || err.message });
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!lab) return;
    setLoading(true);
    setActiveTab('submit');
    setRunResult(null);
    try {
      const res = await axios.post(`${API_BASE}/submit`, {
        code,
        profileId: lab.profileId,
        labId: lab.id
      });
      setSubmitResult(res.data);
    } catch (err: any) {
      setSubmitResult({ error: err.response?.data?.error || err.message });
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-200 overflow-hidden">
      {/* Left Panel: Lab & Results */}
      <div className="w-1/2 flex flex-col border-r border-slate-700">
        
        {/* Header Tabs with Cascading Dropdowns */}
        <div className="border-b border-slate-700 bg-slate-800">
          <div className="flex items-center justify-between pr-4">
            <div className="flex">
              <button 
                className={`px-4 py-3 font-semibold text-sm outline-none transition-colors ${activeTab === 'problem' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
                onClick={() => setActiveTab('problem')}
              >
                Description
              </button>
              <button 
                className={`px-4 py-3 font-semibold text-sm outline-none transition-colors ${activeTab === 'run' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
                onClick={() => setActiveTab('run')}
              >
                Test Run
              </button>
              <button 
                className={`px-4 py-3 font-semibold text-sm outline-none transition-colors ${activeTab === 'submit' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
                onClick={() => setActiveTab('submit')}
              >
                Grading Result
              </button>
            </div>
            {/* Hierarchical Controls */}
            <div className="flex items-center gap-3">
              <select 
                value={selectedFacultyId}
                onChange={(e) => setSelectedFacultyId(e.target.value)}
                className="bg-slate-700 text-slate-300 text-[10px] px-2 py-1 rounded border border-slate-600 outline-none focus:ring-1 focus:ring-blue-500 w-32"
              >
                <option value="" disabled>Select Faculty</option>
                {faculties.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
              </select>
              <select 
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="bg-slate-700 text-slate-300 text-[10px] px-2 py-1 rounded border border-slate-600 outline-none focus:ring-1 focus:ring-blue-500 w-32"
                disabled={!selectedFacultyId}
              >
                <option value="" disabled>Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
              <select 
                value={selectedLabId}
                onChange={(e) => setSelectedLabId(e.target.value)}
                className="bg-slate-700 text-slate-200 text-[10px] px-2 py-1 rounded border border-slate-600 outline-none focus:ring-1 focus:ring-blue-500 w-32"
                disabled={!selectedSubjectId}
              >
                <option value="" disabled>Select Lab</option>
                {labs.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-auto p-6 scrollbar-thin scrollbar-thumb-slate-700">
          {activeTab === 'problem' && (
            <div>
              <h1 className="text-2xl font-black mb-4">{lab?.title || 'Loading...'}</h1>
              <div className="prose prose-invert max-w-none whitespace-pre-wrap mb-8 text-slate-300 leading-relaxed">
                {lab?.statement}
              </div>

              {profile && lab && (
                <div className="mt-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Execution Environment</h3>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs font-medium">
                    <div className="flex justify-between border-b border-slate-700/50 pb-1">
                      <span className="text-slate-500 italic">Category</span> 
                      <span className="text-purple-400">
                        {lab.environmentType === 'single_runtime' && 'Single-runtime Environment'}
                        {lab.environmentType === 'single_machine' && 'Single-machine Lab'}
                        {lab.environmentType === 'multi_node' && 'Multi-node Cyber Range'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-700/50 pb-1">
                      <span className="text-slate-500 italic">Language</span> 
                      <span className="text-blue-300">{profile.displayName}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-700/50 pb-1 col-span-2">
                      <span className="text-slate-500 italic">Required Tools</span> 
                      <span className="text-slate-300">{lab.toolset?.join(', ') || 'Standard Runtime'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-700/50 pb-1">
                      <span className="text-slate-500 italic">Policy</span> 
                      <span className="text-slate-300">Local isolation</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-700/50 pb-1">
                      <span className="text-slate-500 italic">Time Limit</span> 
                      <span className="text-slate-300">{profile.timeoutMs}ms</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'run' && (
            <div className="flex flex-col h-full">
              <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wide">Manual Stdin Input</h3>
                <textarea 
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder="Enter input data here to test your code..."
                  className="w-full h-24 bg-slate-950 border border-slate-700 rounded p-3 text-sm font-mono text-slate-300 focus:border-blue-500 outline-none transition-all placeholder:text-slate-700 shadow-inner"
                />
              </div>

              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                Console Output
              </h2>
              
              {loading ? (
                <div className="text-slate-500 animate-pulse font-mono text-sm italic">Executing process...</div>
              ) : runResult ? (
                <div className="bg-black p-5 rounded-lg border border-slate-800 text-green-400 font-mono text-sm whitespace-pre-wrap shadow-2xl relative overflow-x-auto">
                  {runResult.error ? (
                    <span className="text-red-500">{runResult.error}</span>
                  ) : (
                    <>
                      <div className="opacity-30 mb-2 select-none"># stdout</div>
                      {runResult.result.stdout || <span className="text-slate-700 italic opacity-50">Empty stdout</span>}
                      
                      {runResult.result.stderr && (
                        <>
                          <div className="mt-4 mb-2 opacity-30 select-none text-red-500"># stderr</div>
                          <div className="text-red-400/90">{runResult.result.stderr}</div>
                        </>
                      )}
                      
                      <div className="mt-8 pt-4 border-t border-slate-900 flex justify-between items-center text-[10px] text-slate-600 tracking-wider">
                        <span>TIME: {runResult.result.executionTimeMs}ms</span>
                        <span>STATUS: {runResult.result.exitCode === 0 ? 'SUCCESS' : `EXIT ${runResult.result.exitCode}`}</span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-slate-600 italic text-sm">No output yet. Click "Play" in the code editor to run.</div>
              )}
            </div>
          )}

          {activeTab === 'submit' && (
            <div>
              <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span>
                Evaluation Result
              </h2>
              {loading ? (
                <div className="text-slate-500 animate-pulse italic font-mono text-sm">Grading binary...</div>
              ) : submitResult ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {submitResult.error ? (
                    <div className="p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
                      <span className="font-bold">Error:</span> {submitResult.error}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between p-6 rounded-xl bg-slate-800 border border-slate-700 mb-8 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-1 opacity-5 group-hover:opacity-10 transition-opacity">
                          <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        </div>
                        <div className="relative">
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1">Session Performance</p>
                          <p className="text-5xl font-black text-white">{submitResult.score}<span className="text-xl text-slate-600">/100</span></p>
                        </div>
                        <div className="text-right relative">
                          <p className="text-lg font-black text-slate-300">{submitResult.passedTests} <span className="text-slate-600 font-medium">OF</span> {submitResult.totalTests}</p>
                          <p className="text-[10px] text-purple-400 font-bold tracking-widest uppercase">Verified Cases</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {submitResult.testResults?.map((tc: any) => (
                          <div key={tc.index} className={`p-4 rounded-lg border transition-all ${tc.passed ? 'border-green-900/40 bg-green-900/10' : 'border-red-900/40 bg-red-900/10'}`}>
                            <div className="flex justify-between items-center mb-4">
                              <span className="font-black text-xs text-slate-500 tracking-wider">CASE #{tc.index}</span>
                              {tc.passed ? (
                                <span className="text-[10px] font-black text-green-500 border border-green-500/50 px-2 py-0.5 rounded uppercase">Passed</span>
                              ) : (
                                <span className="text-[10px] font-black text-red-500 border border-red-500/50 px-2 py-0.5 rounded uppercase">Failed</span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs font-mono mb-4">
                              <div className="space-y-1">
                                <div className="text-[10px] text-slate-600 font-bold">INPUT</div>
                                <div className="bg-black/60 p-2 rounded text-slate-400 overflow-x-auto">{tc.input}</div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-[10px] text-slate-600 font-bold">EXPECTED</div>
                                <div className="bg-black/60 p-2 rounded text-slate-400 overflow-x-auto">{tc.expectedOutput}</div>
                              </div>
                            </div>
                            <div className="space-y-1 font-mono text-xs">
                              <div className="text-[10px] text-slate-600 font-bold">PROCESS OUTPUT</div>
                              <div className={`p-3 rounded bg-black/80 ${tc.passed ? 'text-green-500/90' : 'text-red-400/90'} border-l-2 ${tc.passed ? 'border-green-500' : 'border-red-500'}`}>
                                {tc.actualOutput || <span className="italic opacity-30 select-none">null_ptr</span>}
                                {tc.stderr && <div className="mt-3 pt-3 border-t border-red-900/50 text-[10px] text-red-500/80 leading-relaxed font-sans">{tc.stderr}</div>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-slate-600 italic text-sm">Grading binary not yet evaluated. Click "Submit" to benchmark.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Editor */}
      <div className="w-1/2 flex flex-col bg-[#1e1e1e]">
        <div className="flex justify-between items-center p-3 border-b border-slate-700 bg-slate-800">
          <div className="text-xs font-bold font-mono flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/50 border border-red-500/20"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500/50 border border-yellow-500/20"></span>
              <span className="w-3 h-3 rounded-full bg-green-500/50 border border-green-500/20"></span>
            </div>
            <span className="opacity-40 text-slate-500">PROJECT</span>
            <span className="text-blue-400/80">Main{profile?.extension || '.py'}</span>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleRun}
              disabled={loading}
              className="px-5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-lg"
            >
              Play
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-500/20"
            >
              Benchmark
            </button>
          </div>
        </div>
        <div className="flex-1 relative">
          <Editor
            height="100%"
            language={profile?.language || 'python'}
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'Fira Code', 'Monaco', monospace",
              padding: { top: 20 },
              cursorBlinking: 'smooth',
              smoothScrolling: true,
              scrollbar: {
                vertical: 'hidden',
                horizontal: 'hidden'
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
