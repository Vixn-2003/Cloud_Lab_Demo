import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';

const API_BASE = 'http://localhost:3001';

interface Problem {
  id: string;
  title: string;
  statement: string;
  profileId: string;
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

function App() {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [code, setCode] = useState<string>('# Write your code here\nimport sys\n\n');
  const [runResult, setRunResult] = useState<any>(null);
  const [submitResult, setSubmitResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'problem' | 'run' | 'submit'>('problem');

  useEffect(() => {
    // Fetch problem "sum_two_numbers"
    axios.get(`${API_BASE}/problems/sum_two_numbers`).then(res => {
      setProblem(res.data);
      // Fetch profile
      axios.get(`${API_BASE}/profiles/${res.data.profileId}`).then(pRes => {
        setProfile(pRes.data);
      });
    });
  }, []);

  const handleRun = async () => {
    if (!problem) return;
    setLoading(true);
    setActiveTab('run');
    setSubmitResult(null); // clear submit result when running
    try {
      const res = await axios.post(`${API_BASE}/run`, {
        code,
        language: profile?.language || 'python',
        profileId: problem.profileId
      });
      setRunResult(res.data);
    } catch (err: any) {
      setRunResult({ error: err.message });
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!problem) return;
    setLoading(true);
    setActiveTab('submit');
    setRunResult(null); // clear run result when submitting
    try {
      const res = await axios.post(`${API_BASE}/submit`, {
        code,
        language: profile?.language || 'python',
        profileId: problem.profileId,
        problemId: problem.id
      });
      setSubmitResult(res.data);
    } catch (err: any) {
      setSubmitResult({ error: err.message });
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-200">
      {/* Left Panel: Problem & Results */}
      <div className="w-1/2 flex flex-col border-r border-slate-700">
        
        {/* Header Tabs */}
        <div className="flex border-b border-slate-700 bg-slate-800">
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
            Test Run Result
          </button>
          <button 
            className={`px-4 py-3 font-semibold text-sm outline-none transition-colors ${activeTab === 'submit' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
            onClick={() => setActiveTab('submit')}
          >
            Submission Result
          </button>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'problem' && (
            <div>
              <h1 className="text-2xl font-bold mb-4">{problem?.title || 'Loading...'}</h1>
              <div className="prose prose-invert max-w-none whitespace-pre-wrap mb-8">
                {problem?.statement}
              </div>

              {/* Execution Profile Summary */}
              {profile && (
                <div className="mt-8 p-4 bg-slate-800 rounded-lg border border-slate-700 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-3">Execution Profile Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-slate-500">Language:</span> <span className="font-semibold text-slate-300">{profile.displayName}</span></div>
                    <div><span className="text-slate-500">Version:</span> <span className="font-semibold text-slate-300">{profile.version}</span></div>
                    <div><span className="text-slate-500">OS Family:</span> <span className="font-semibold text-slate-300">{profile.osFamily}</span></div>
                    <div><span className="text-slate-500">Timeout:</span> <span className="font-semibold text-slate-300">{profile.timeoutMs}ms</span></div>
                    <div className="col-span-2"><span className="text-slate-500">Grading Strategy:</span> <span className="font-semibold text-slate-300">{profile.gradingStrategy}</span></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'run' && (
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                Execution Output (Mode: RUN)
              </h2>
              {loading ? (
                <div className="text-slate-400 animate-pulse">Executing code...</div>
              ) : runResult ? (
                <div className="bg-black p-4 rounded text-green-400 font-mono text-sm whitespace-pre-wrap shadow-inner overflow-x-auto">
                  {runResult.error ? (
                    <span className="text-red-500">{runResult.error}</span>
                  ) : (
                    <>
                      <div className="mb-2 text-slate-500">-- STDOUT --</div>
                      {runResult.result.stdout || <span className="text-slate-600 italic">No output</span>}
                      {runResult.result.stderr && (
                        <>
                          <div className="mt-4 mb-2 text-red-500">-- STDERR --</div>
                          <div className="text-red-400">{runResult.result.stderr}</div>
                        </>
                      )}
                      
                      <div className="mt-6 pt-4 border-t border-slate-800 text-slate-500 text-xs">
                        Execution Time: {runResult.result.executionTimeMs}ms | Exit Code: {runResult.result.exitCode}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-slate-500">Click "Run" to test your code.</div>
              )}
            </div>
          )}

          {activeTab === 'submit' && (
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                Grading Report (Mode: SUBMIT)
              </h2>
              {loading ? (
                <div className="text-slate-400 animate-pulse">Grading testcases...</div>
              ) : submitResult ? (
                <div>
                  {submitResult.error ? (
                    <div className="text-red-500">{submitResult.error}</div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800 border-l-4 border-purple-500 mb-6 shadow-sm">
                        <div>
                          <p className="text-sm text-slate-400 uppercase tracking-wide font-bold">Total Score</p>
                          <p className="text-3xl font-black text-white">{submitResult.score}/100</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-400">Passed: {submitResult.passedTests}/{submitResult.totalTests}</p>
                          <p className="text-xs text-slate-500">Status: {submitResult.status}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {submitResult.testResults?.map((tc: any) => (
                          <div key={tc.index} className={`p-4 rounded-lg border ${tc.passed ? 'border-green-800 bg-green-900/20' : 'border-red-800 bg-red-900/20'}`}>
                            <div className="flex justify-between items-center mb-3">
                              <span className="font-bold text-sm text-slate-300">Testcase {tc.index}</span>
                              {tc.passed ? (
                                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded">PASSED</span>
                              ) : (
                                <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded">FAILED</span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs font-mono mt-2">
                              <div>
                                <div className="text-slate-500 mb-1">Input:</div>
                                <div className="bg-black/50 p-2 rounded text-slate-300">{tc.input}</div>
                              </div>
                              <div>
                                <div className="text-slate-500 mb-1">Expected:</div>
                                <div className="bg-black/50 p-2 rounded text-slate-300">{tc.expectedOutput}</div>
                              </div>
                            </div>
                            <div className="mt-3 text-xs font-mono">
                              <div className="text-slate-500 mb-1">Actual Output:</div>
                              <div className={`p-2 rounded bg-black/50 ${tc.passed ? 'text-green-400' : 'text-red-400'}`}>
                                {tc.actualOutput || <span className="italic opacity-50">Empty</span>}
                                {tc.stderr && <div className="mt-2 text-red-500">STDERR: {tc.stderr}</div>}
                              </div>
                            </div>
                            <div className="mt-3 text-right text-[10px] text-slate-500">
                              Time: {tc.executionTimeMs}ms
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-slate-500">Click "Submit" to grade your code against all testcases.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Editor */}
      <div className="w-1/2 flex flex-col bg-[#1e1e1e]">
        <div className="flex justify-between items-center p-3 border-b border-slate-700 bg-slate-800">
          <div className="text-sm font-semibold flex items-center gap-2">
            <span className="text-blue-400">~/</span>
            <span className="text-slate-300">main{profile?.extension || '.py'}</span>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleRun}
              disabled={loading}
              className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Play (Run)
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              Grade (Submit)
            </button>
          </div>
        </div>
        <div className="flex-1">
          <Editor
            height="100%"
            defaultLanguage="python"
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              padding: { top: 16 }
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
