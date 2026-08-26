import { useState, useEffect } from 'react';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../components/AppShell/AppShell';
import api from '../services/api';
import {
  BookOpen,
  Upload,
  Plus,
  Search,
  FileText,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  AlertTriangle,
  Eye,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Database,
  Loader2
} from 'lucide-react';

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({ totalDocuments: 0, readyDocuments: 0, totalChunks: 0 });
  const [gaps, setGaps] = useState([]);
  const [activeTab, setActiveTab] = useState('documents'); // 'documents' | 'search' | 'gaps'
  const [isLoading, setIsLoading] = useState(true);

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadCategory, setUploadCategory] = useState('General');
  const [uploadSourceType, setUploadSourceType] = useState('faq');
  const [uploadRawText, setUploadRawText] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chunk Inspector modal state
  const [inspectDoc, setInspectDoc] = useState(null);
  const [docChunks, setDocChunks] = useState([]);

  // Semantic test search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/knowledge-base');
      if (res.data?.success) {
        setDocuments(res.data.documents || []);
        setStats(res.data.stats || { totalDocuments: 0, readyDocuments: 0, totalChunks: 0 });
      }
      setIsLoading(false);
    } catch (err) {
      console.warn('Failed to fetch documents:', err.message);
      setIsLoading(false);
    }
  };

  const fetchGaps = async () => {
    try {
      const res = await api.get('/knowledge-base/gaps');
      if (res.data?.success) {
        setGaps(res.data.gaps || []);
      }
    } catch (err) {
      console.warn('Failed to fetch gaps:', err.message);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchGaps();
  }, []);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', uploadTitle.trim());
      formData.append('description', uploadDesc.trim());
      formData.append('category', uploadCategory);
      formData.append('sourceType', uploadSourceType);
      if (uploadRawText) formData.append('rawContent', uploadRawText);
      if (uploadFile) formData.append('file', uploadFile);

      await api.post('/knowledge-base', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setIsUploadOpen(false);
      setUploadTitle('');
      setUploadDesc('');
      setUploadRawText('');
      setUploadFile(null);
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to upload document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Are you sure you want to delete "${title}" and all its vector chunks?`)) return;
    try {
      await api.delete(`/knowledge-base/${id}`);
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  const handleInspect = async (doc) => {
    try {
      setInspectDoc(doc);
      const res = await api.get(`/knowledge-base/${doc._id}/status`);
      if (res.data?.success) {
        setDocChunks(res.data.chunks || []);
      }
    } catch (err) {
      console.warn('Failed to inspect chunks:', err.message);
    }
  };

  const handleTestSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await api.post('/knowledge-base/search', { query: searchQuery.trim(), limit: 4 });
      if (res.data?.success) {
        setSearchResults(res.data.results || []);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['agent', 'admin']}>
      <AppShell title="Knowledge Base & Vector Substrate">
        <div className="space-y-6">
          {/* Header & Stats Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-display font-bold text-white flex items-center gap-2.5">
                <span>Enterprise Knowledge Base</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  RAG Substrate
                </span>
              </h2>
              <p className="text-xs md:text-sm text-gray-400 mt-0.5">
                Vectorized documentation for zero-hallucination agent retrieval
              </p>
            </div>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-glow-brand flex items-center gap-2 transition-all active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Add Knowledge Document</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl glass-card border border-dark-border flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-gray-400 font-medium">Knowledge Docs</div>
                <div className="text-xl font-display font-bold text-white mt-0.5">
                  {stats.totalDocuments}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-dark-border flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-gray-400 font-medium">Vector Chunks Indexed</div>
                <div className="text-xl font-display font-bold text-white mt-0.5">
                  {stats.totalChunks}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-dark-border flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-gray-400 font-medium">Knowledge Gaps Identified</div>
                <div className="text-xl font-display font-bold text-white mt-0.5">
                  {gaps.length}
                </div>
              </div>
            </div>
          </div>

          {/* TAB SELECTOR */}
          <div className="flex items-center gap-2 border-b border-dark-border pb-3">
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'documents'
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              All Documents ({documents.length})
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'search'
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Semantic Search Playground</span>
            </button>
            <button
              onClick={() => setActiveTab('gaps')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'gaps'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Knowledge Gaps ({gaps.length})</span>
            </button>
          </div>

          {/* TAB 1: DOCUMENTS TABLE */}
          {activeTab === 'documents' && (
            <div className="rounded-2xl glass-panel border border-dark-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-dark-card/60 border-b border-dark-border text-gray-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="p-4">Document Title</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Vector Chunks</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Uploaded</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border/60 text-gray-200">
                    {documents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-500">
                          No knowledge documents found. Click "Add Knowledge Document" to start.
                        </td>
                      </tr>
                    ) : (
                      documents.map((doc) => (
                        <tr key={doc._id} className="hover:bg-dark-hover/40 transition-colors">
                          <td className="p-4">
                            <div className="font-semibold text-white text-sm">{doc.title}</div>
                            <div className="text-[11px] text-gray-400 line-clamp-1 max-w-sm">
                              {doc.description || 'No description'}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-md bg-dark-card border border-dark-border font-medium text-gray-300">
                              {doc.category}
                            </span>
                          </td>
                          <td className="p-4 uppercase font-mono text-[10px] text-brand-300">
                            {doc.sourceType}
                          </td>
                          <td className="p-4 font-mono font-bold text-cyan-400">
                            {doc.chunkCount} chunks
                          </td>
                          <td className="p-4">
                            <span
                              className={`
                                text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border
                                ${doc.status === 'ready' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : doc.status === 'processing' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-rose-500/15 text-rose-300 border-rose-500/30'}
                              `}
                            >
                              {doc.status}
                            </span>
                          </td>
                          <td className="p-4 text-gray-400 font-mono">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => handleInspect(doc)}
                              className="p-1.5 rounded-lg bg-dark-card hover:bg-brand-600 text-gray-300 hover:text-white transition-colors"
                              title="Inspect Chunks"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(doc._id, doc.title)}
                              className="p-1.5 rounded-lg bg-dark-card hover:bg-rose-600 text-gray-300 hover:text-white transition-colors"
                              title="Delete Document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: SEMANTIC SEARCH PLAYGROUND */}
          {activeTab === 'search' && (
            <div className="space-y-6">
              <form onSubmit={handleTestSearch} className="p-5 rounded-2xl glass-panel border border-dark-border space-y-3">
                <h3 className="font-display font-semibold text-white text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-400" />
                  <span>Test Semantic Retrieval (Vector Cosine Similarity)</span>
                </h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. Can I get a refund after 20 days? or How do I reset 2FA?"
                    className="flex-1 p-3 text-sm rounded-xl glass-input placeholder-gray-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSearching || !searchQuery.trim()}
                    className="px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-xs shadow-glow-brand flex items-center gap-2 transition-all"
                  >
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>Query Vectors</span>
                  </button>
                </div>
              </form>

              {/* Results Grid */}
              <div className="space-y-3">
                {searchResults.length > 0 ? (
                  searchResults.map((result, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl glass-card border border-cyan-500/30 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-cyan-400" />
                          <span className="font-semibold text-white text-sm">
                            {result.metadata?.title || 'Knowledge Chunk'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            Chunk #{result.chunkIndex + 1}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          Relevance: {(result.similarity * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed font-mono bg-dark-bg/80 p-3 rounded-xl border border-dark-border">
                        {result.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500 text-xs rounded-2xl glass-panel border border-dark-border">
                    Enter a customer question above to inspect how the Retrieval Agent scores and pulls knowledge chunks.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: KNOWLEDGE GAPS */}
          {activeTab === 'gaps' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                These customer queries triggered low agent confidence or missing context. Upload documentation addressing these topics to improve autonomous resolution rates!
              </div>

              <div className="rounded-2xl glass-panel border border-dark-border overflow-hidden">
                <div className="divide-y divide-dark-border/60">
                  {gaps.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-xs">
                      No unresolved knowledge gaps identified! Your vector coverage is excellent.
                    </div>
                  ) : (
                    gaps.map((gap) => (
                      <div key={gap.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-brand-400 font-bold">
                              #{gap.ticketNumber}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                              {gap.escalationReason}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              Confidence: {(gap.confidenceScore * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="text-sm font-medium text-gray-200">{gap.subject}</div>
                          <p className="text-xs text-gray-400 line-clamp-2 max-w-2xl">
                            "{gap.customerQuery}"
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setUploadTitle(`FAQ: ${gap.subject}`);
                            setUploadRawText(`Query: ${gap.customerQuery}\n\nResolution Guidelines: `);
                            setIsUploadOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs shadow-glow-brand flex items-center gap-1.5 shrink-0 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Knowledge Article</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* UPLOAD DOCUMENT MODAL */}
          {isUploadOpen && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="max-w-xl w-full glass-panel rounded-3xl p-6 border border-brand-500/30 shadow-glass space-y-4">
                <div className="flex items-center justify-between border-b border-dark-border pb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-brand-400" />
                    <h3 className="font-display font-semibold text-white">
                      Add New Knowledge Document
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsUploadOpen(false)}
                    className="text-gray-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-dark-card"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleUploadSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Document Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="e.g. Return & Warranty Policy 2026"
                      className="w-full p-2.5 text-xs rounded-xl glass-input placeholder-gray-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        value={uploadCategory}
                        onChange={(e) => setUploadCategory(e.target.value)}
                        placeholder="e.g. Billing, Auth, Logistics"
                        className="w-full p-2.5 text-xs rounded-xl glass-input placeholder-gray-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Source Type
                      </label>
                      <select
                        value={uploadSourceType}
                        onChange={(e) => setUploadSourceType(e.target.value)}
                        className="w-full p-2.5 text-xs rounded-xl glass-input text-gray-200 focus:outline-none"
                      >
                        <option value="policy">Policy Document</option>
                        <option value="faq">FAQ / Knowledge Base</option>
                        <option value="macro">Canned Macro / Manual</option>
                        <option value="pdf">PDF File</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Content / Text (Or attach file below)
                    </label>
                    <textarea
                      rows={5}
                      value={uploadRawText}
                      onChange={(e) => setUploadRawText(e.target.value)}
                      placeholder="Paste full documentation text, FAQ Q&A pairs, or policy clauses here..."
                      className="w-full p-3 text-xs rounded-xl glass-input placeholder-gray-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Attach File (Optional: .pdf, .txt, .md)
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      className="w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-dark-card file:text-brand-300 hover:file:bg-dark-hover cursor-pointer"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsUploadOpen(false)}
                      className="px-4 py-2 rounded-xl bg-dark-card hover:bg-dark-hover text-gray-300 text-xs font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !uploadTitle.trim()}
                      className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-xs shadow-glow-brand flex items-center gap-2 transition-all"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      <span>Chunk & Index Vector Data</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* CHUNK INSPECTOR MODAL */}
          {inspectDoc && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="max-w-2xl w-full glass-panel rounded-3xl p-6 border border-dark-border shadow-glass space-y-4">
                <div className="flex items-center justify-between border-b border-dark-border pb-3">
                  <div>
                    <h3 className="font-display font-semibold text-white text-base">
                      {inspectDoc.title}
                    </h3>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">
                      {docChunks.length} vector chunks generated
                    </div>
                  </div>
                  <button
                    onClick={() => setInspectDoc(null)}
                    className="text-gray-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-dark-card"
                  >
                    Close
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
                  {docChunks.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 text-xs">
                      No chunks generated yet.
                    </div>
                  ) : (
                    docChunks.map((c) => (
                      <div
                        key={c._id || c.chunkIndex}
                        className="p-3.5 rounded-xl bg-dark-bg/90 border border-dark-border space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-cyan-400 font-bold">
                            Chunk #{c.chunkIndex + 1}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {c.tokens || 120} tokens
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 font-mono leading-relaxed">
                          {c.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
