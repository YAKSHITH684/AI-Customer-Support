import { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Edit3,
  RefreshCw,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Send,
  HelpCircle
} from 'lucide-react';

export default function DraftReviewPanel({
  resolution,
  onApprove,
  onEditAndSend,
  onRetry,
  isLoading = false,
}) {
  if (!resolution) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(resolution.draftOutput || '');

  const confidence = Math.round((resolution.confidenceScore || 0) * 100);
  const isAwaiting = resolution.status === 'AWAITING_APPROVAL' || resolution.status === 'ESCALATED';

  if (!isAwaiting && resolution.status !== 'FAILED') {
    return (
      <div className="p-5 rounded-2xl glass-card border border-emerald-500/30 bg-emerald-950/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>AI Resolution Dispatched</span>
          </div>
          <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-mono">
            {confidence}% Confidence
          </span>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">
          {resolution.finalOutput || resolution.draftOutput}
        </p>
      </div>
    );
  }

  const handleEditSubmit = () => {
    if (!editedText.trim()) return;
    onEditAndSend(editedText.trim());
    setIsEditing(false);
  };

  return (
    <div className="rounded-2xl glass-panel border border-brand-500/30 shadow-glass overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-brand-950/60 to-purple-950/40 border-b border-dark-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-600/30 border border-brand-500/40 flex items-center justify-center text-brand-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-display font-semibold text-white text-sm">
              AI Draft Awaiting Agent Approval
            </h4>
            <div className="text-[11px] text-gray-400 flex items-center gap-2">
              <span>Provider: {resolution.aiProvider || 'Gemini'}</span>
              <span>•</span>
              <span className="font-mono">{resolution.duration || 1200}ms synthesis</span>
            </div>
          </div>
        </div>

        {/* Confidence & Reason Badges */}
        <div className="flex items-center gap-2">
          {resolution.escalationReason && (
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3 h-3" />
              <span>{resolution.escalationReason.replace('_', ' ')}</span>
            </span>
          )}
          <span
            className={`text-xs font-mono px-2.5 py-0.5 rounded-lg border font-bold ${
              confidence >= 75
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}
          >
            {confidence}% Confidence
          </span>
        </div>
      </div>

      {/* Body / Content */}
      <div className="p-4 md:p-5 space-y-4">
        {/* Retrieved Sources Header */}
        {resolution.retrievedSources && resolution.retrievedSources.length > 0 && (
          <div className="p-3 rounded-xl bg-dark-bg/60 border border-dark-border/80">
            <div className="text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-brand-400" />
              <span>RAG Retrieved Sources ({resolution.retrievedSources.length}):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {resolution.retrievedSources.map((src, i) => (
                <div
                  key={i}
                  className="text-xs bg-dark-card border border-brand-500/20 text-gray-300 px-2 py-1 rounded-lg flex items-center gap-1.5"
                >
                  <span className="text-brand-300 font-medium">{src.title}</span>
                  {src.relevanceScore && (
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {(src.relevanceScore * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Draft Text or Editor */}
        {isEditing ? (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-300 flex items-center justify-between">
              <span>Edit Draft Response:</span>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-white text-xs underline"
              >
                Cancel Edit
              </button>
            </div>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={6}
              className="w-full p-3 text-sm rounded-xl glass-input placeholder-gray-500 focus:outline-none resize-y"
            />
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-dark-card/70 border border-dark-border text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
            {resolution.draftOutput || 'No draft generated.'}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-dark-border">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onRetry && onRetry(resolution._id)}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl bg-dark-card hover:bg-dark-hover border border-dark-border text-xs text-gray-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
              <span>Retry Agent Chain</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {isEditing ? (
              <button
                onClick={handleEditSubmit}
                disabled={isLoading || !editedText.trim()}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs shadow-glow-brand flex items-center gap-2 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Save & Send Edited Response</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setEditedText(resolution.draftOutput || '');
                    setIsEditing(true);
                  }}
                  disabled={isLoading}
                  className="px-3.5 py-2 rounded-xl bg-dark-card hover:bg-dark-hover border border-brand-500/30 text-xs text-brand-300 hover:text-white font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Draft</span>
                </button>

                <button
                  onClick={() => onApprove && onApprove(resolution._id)}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-glow-emerald flex items-center gap-1.5 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Send As-Is</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
