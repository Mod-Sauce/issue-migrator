"use client";

import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Copy, Loader, Github, GitBranch } from 'lucide-react';

export default function IssueMigrator() {
  const [step, setStep] = useState(1);
  const [gitHubData, setGitHubData] = useState(null);
  const [codebergData, setCodebergData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [ghInput, setGhInput] = useState({
    owner: '',
    repo: '',
    issueNumber: '',
    token: ''
  });
  
  const [cbInput, setCbInput] = useState({
    owner: '',
    repo: '',
    token: ''
  });

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const fetchGitHubIssue = async () => {
    clearMessages();
    setLoading(true);
    try {
      const url = `https://api.github.com/repos/${ghInput.owner}/${ghInput.repo}/issues/${ghInput.issueNumber}`;
      const response = await fetch(url, {
        headers: ghInput.token ? { Authorization: `token ${ghInput.token}` } : {}
      });
      
      if (!response.ok) throw new Error('Failed to fetch GitHub issue');
      
      const data = await response.json();
      setGitHubData(data);
      setSuccess('GitHub issue fetched successfully');
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createCodebergIssue = async () => {
    clearMessages();
    setLoading(true);
    try {
      if (!gitHubData) throw new Error('GitHub issue data not found');
      const issueBody = `${gitHubData.body}\n\n---\n**Migrated from GitHub** | Originally created by [@${gitHubData.user.login}](${gitHubData.user.html_url}) on GitHub`;
      
      const createUrl = `https://codeberg.org/api/v1/repos/${cbInput.owner}/${cbInput.repo}/issues`;
      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'Authorization': `token ${cbInput.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: gitHubData.title,
          body: issueBody,
          labels: gitHubData.labels.map(l => l.name)
        })
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.message || 'Failed to create Codeberg issue');
      }

      const newIssue = await createResponse.json();
      setCodebergData(newIssue);
      setSuccess('Codeberg issue created successfully');
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const closeGitHubIssue = async () => {
    clearMessages();
    setLoading(true);
    try {
      const closeUrl = `https://api.github.com/repos/${ghInput.owner}/${ghInput.repo}/issues/${ghInput.issueNumber}`;
      const closeResponse = await fetch(closeUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `token ${ghInput.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          state: 'closed',
          state_reason: 'not_planned'
        })
      });

      if (!closeResponse.ok) throw new Error('Failed to close GitHub issue');

      await fetch(closeUrl + '/comments', {
        method: 'POST',
        headers: {
          Authorization: `token ${ghInput.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          body: `This issue has been migrated to Codeberg: ${codebergData.html_url}`
        })
      });

      setSuccess('GitHub issue closed and comment added');
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setGitHubData(null);
    setCodebergData(null);
    setGhInput({ owner: '', repo: '', issueNumber: '', token: '' });
    setCbInput({ owner: '', repo: '', token: '' });
    clearMessages();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100 p-6">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-violet-500 to-purple-600 bg-clip-text text-transparent">
              Mod-Sauce
            </h1>
          </div>
          <p className="text-gray-400 text-lg">Issue Migrator</p>
          <p className="text-gray-500 text-sm mt-2">Migrate issues from GitHub to Codeberg seamlessly</p>
        </div>

        {/* Main Card */}
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl p-8 mb-8">
          {/* Progress Steps */}
          <div className="flex gap-2 mb-10">
            {[1, 2, 3, 4].map(num => (
              <div key={num} className="flex-1">
                <div className={`h-1.5 rounded-full transition-all duration-300 ${
                  step >= num ? 'bg-gradient-to-r from-purple-500 to-violet-600' : 'bg-gray-700'
                }`} />
              </div>
            ))}
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-950/30 border border-red-900/50 rounded-xl flex gap-3 animate-in">
              <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-950/30 border border-green-900/50 rounded-xl flex gap-3 animate-in">
              <CheckCircle2 className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-green-300 text-sm">{success}</p>
            </div>
          )}

          {/* Step 1: Fetch GitHub Issue */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Github className="w-6 h-6 text-purple-500" />
                  Fetch GitHub Issue
                </h2>
              </div>
              <input
                type="text"
                placeholder="GitHub Owner"
                value={ghInput.owner}
                onChange={e => setGhInput({...ghInput, owner: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500 transition"
              />
              <input
                type="text"
                placeholder="Repository Name"
                value={ghInput.repo}
                onChange={e => setGhInput({...ghInput, repo: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500 transition"
              />
              <input
                type="text"
                placeholder="Issue Number"
                value={ghInput.issueNumber}
                onChange={e => setGhInput({...ghInput, issueNumber: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500 transition"
              />
              <input
                type="password"
                placeholder="GitHub Token (optional)"
                value={ghInput.token}
                onChange={e => setGhInput({...ghInput, token: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500 transition"
              />
              <button
                onClick={fetchGitHubIssue}
                disabled={!ghInput.owner || !ghInput.repo || !ghInput.issueNumber || loading}
                className="w-full bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 rounded-lg transition duration-200 flex items-center justify-center gap-2"
              >
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Github className="w-5 h-5" />}
                {loading ? 'Fetching...' : 'Fetch Issue'}
              </button>
            </div>
          )}

          {/* Step 2: Create Codeberg Issue */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <GitBranch className="w-6 h-6 text-red-500" />
                Create Codeberg Issue
              </h2>
              <div className="bg-gray-800/30 border border-orange-900/30 p-6 rounded-xl">
                <p className="text-sm text-gray-400 mb-3"><strong className="text-gray-300">Title:</strong></p>
                <p className="text-white font-medium mb-4">{gitHubData.title}</p>
                <p className="text-sm text-gray-400"><strong className="text-gray-300">Author:</strong> {gitHubData.user.login}</p>
              </div>
              <input
                type="text"
                placeholder="Codeberg Owner"
                value={cbInput.owner}
                onChange={e => setCbInput({...cbInput, owner: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-500 transition"
              />
              <input
                type="text"
                placeholder="Repository Name"
                value={cbInput.repo}
                onChange={e => setCbInput({...cbInput, repo: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-500 transition"
              />
              <input
                type="password"
                placeholder="Codeberg Token"
                value={cbInput.token}
                onChange={e => setCbInput({...cbInput, token: e.target.value})}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-500 transition"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition"
                >
                  Back
                </button>
                <button
                  onClick={createCodebergIssue}
                  disabled={!cbInput.owner || !cbInput.repo || !cbInput.token || loading}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 rounded-lg transition"
                >
                  {loading ? <Loader className="inline mr-2 w-5 h-5 animate-spin" /> : ''}
                  {loading ? 'Creating...' : 'Create Issue'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Close GitHub Issue */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Github className="w-6 h-6 text-orange-500" />
                Close GitHub Issue
              </h2>
              <div className="bg-green-950/30 border border-green-900/50 p-6 rounded-xl">
                <p className="text-sm text-green-300 font-medium mb-3">✓ Codeberg Issue Created</p>
                <p className="text-gray-300 text-sm break-all font-mono">{codebergData.html_url}</p>
              </div>
              <p className="text-gray-300">This will close the GitHub issue as "not planned" and add a migration link.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition"
                >
                  Back
                </button>
                <button
                  onClick={closeGitHubIssue}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 rounded-lg transition"
                >
                  {loading ? <Loader className="inline mr-2 w-5 h-5 animate-spin" /> : ''}
                  {loading ? 'Closing...' : 'Close GitHub Issue'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 4 && (
            <div className="space-y-8 animate-in fade-in">
              <div className="text-center">
                <div className="inline-block p-4 bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-full mb-6">
                  <CheckCircle2 className="w-12 h-12 text-orange-500" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Migration Complete!</h2>
                <p className="text-gray-400">Your issue has been successfully migrated to Codeberg.</p>
              </div>
              <div className="bg-gray-800/30 border border-gray-700 p-6 rounded-xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300"><strong>Codeberg Issue:</strong></span>
                  <button
                    onClick={() => window.open(codebergData.html_url, '_blank')}
                    className="text-orange-400 hover:text-orange-300 flex items-center gap-2 font-medium transition"
                  >
                    View <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300"><strong>GitHub Issue:</strong></span>
                  <span className="text-green-400 font-medium">Closed ✓</span>
                </div>
              </div>
              <button
                onClick={reset}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 rounded-lg transition"
              >
                Migrate Another Issue
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-gray-500 text-sm">
          Get your tokens from GitHub and Codeberg settings • <span className="text-orange-400">Mod-Sauce</span>
        </p>
      </div>
    </div>
  );
}
