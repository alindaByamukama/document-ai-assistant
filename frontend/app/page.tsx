'use client';

import { useState, useRef } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Analysis {
  filename: string;
  extracted_text: string;
  summary: string;
  title: string;
  author: string;
  main_topics: string[];
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setFile(files[0]);
      setError(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload PDF, DOCX, or TXT');
      return;
    }

    // Validate file size
    if (file.size > 50 * 1024 * 1024) {
      setError('File too large. Maximum 50MB');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_URL}/process`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setAnalysis(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to process document';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setAnalysis(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-white mb-2">Document AI Assistant</h1>
          <p className="text-slate-400">Upload your documents and get instant AI-powered analysis</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {!analysis ? (
          // Upload Section
          <div className="space-y-8">
            {/* Upload Box */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition ${
                  file
                    ? 'border-green-500 bg-green-950/20'
                    : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.docx,.txt,.doc"
                  className="hidden"
                />
                <div className="space-y-3">
                  <div className="text-5xl">📄</div>
                  {file ? (
                    <>
                      <p className="text-lg font-semibold text-green-400">{file.name}</p>
                      <p className="text-sm text-slate-400">{(file.size / 1024).toFixed(2)} KB</p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-semibold text-white">Drag and drop your document</p>
                      <p className="text-sm text-slate-400">or click to browse</p>
                      <p className="text-xs text-slate-500 mt-2">Supported: PDF, DOCX, TXT (max 50MB)</p>
                    </>
                  )}
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-950/30 border border-red-700 rounded-lg p-4 text-red-300">
                  <p className="font-semibold">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={!file || loading}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold transition ${
                    loading || !file
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Analyzing...' : 'Analyze Document'}
                </button>
              </div>

              {/* Loading Spinner */}
              {loading && (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              )}
            </form>

            {/* Feature List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="text-3xl mb-3">✨</div>
                <h3 className="font-semibold text-white mb-2">Smart Extraction</h3>
                <p className="text-slate-400 text-sm">Automatically extract text from PDFs, Word docs, and text files</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="text-3xl mb-3">🤖</div>
                <h3 className="font-semibold text-white mb-2">AI Analysis</h3>
                <p className="text-slate-400 text-sm">Get summaries and key information powered by LLMs</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="font-semibold text-white mb-2">Fast Processing</h3>
                <p className="text-slate-400 text-sm">Results in seconds, not minutes</p>
              </div>
            </div>
          </div>
        ) : (
          // Results Section
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Analysis Results</h2>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                ← Back
              </button>
            </div>

            {/* Filename */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <p className="text-slate-400 text-sm">File</p>
              <p className="text-xl font-semibold text-white mt-1">{analysis.filename}</p>
            </div>

            {/* Title */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <p className="text-slate-400 text-sm">Title</p>
              <p className="text-2xl font-bold text-white mt-2">{analysis.title}</p>
            </div>

            {/* Author */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <p className="text-slate-400 text-sm">Author</p>
              <p className="text-lg text-white mt-1">{analysis.author}</p>
            </div>

            {/* Summary */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <p className="text-slate-400 text-sm mb-3">Summary</p>
              <p className="text-white leading-relaxed">{analysis.summary}</p>
            </div>

            {/* Main Topics */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <p className="text-slate-400 text-sm mb-4">Main Topics</p>
              <div className="flex flex-wrap gap-2">
                {analysis.main_topics.map((topic, idx) => (
                  <span
                    key={idx}
                    className="bg-blue-900/50 text-blue-200 px-4 py-2 rounded-full text-sm border border-blue-700"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Extracted Text */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <p className="text-slate-400 text-sm mb-3">Extracted Text</p>
              <div className="bg-slate-900 rounded p-4 max-h-64 overflow-y-auto">
                <p className="text-slate-300 text-sm whitespace-pre-wrap">{analysis.extracted_text}</p>
              </div>
              <p className="text-slate-500 text-xs mt-2">{analysis.extracted_text.length} characters</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center text-slate-500 text-sm">
          <p>Document AI Assistant • Built with Next.js + FastAPI + LLM</p>
        </div>
      </footer>
    </div>
  );
}
