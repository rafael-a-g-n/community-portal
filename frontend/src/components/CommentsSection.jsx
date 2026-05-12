import { useEffect, useState } from 'react';
import { reportService } from '../services/reportService';
import { MessageSquare, Send, Loader2, User, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

export default function CommentsSection({ reportId }) {
  const { t } = useTranslation();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);
  const [form, setForm] = useState({ author_name: '', body: '' });

  useEffect(() => {
    if (!reportId) return;
    async function loadComments() {
      try {
        setLoading(true);
        const data = await reportService.getComments(reportId);
        const results = Array.isArray(data) ? data : data.results ?? [];
        setComments(results);
      } catch {
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    }
    loadComments();
  }, [reportId, t]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.body.trim()) return;
    try {
      setSubmitting(true);
      setError(null);
      setPostSuccess(false);
      const created = await reportService.createComment(reportId, {
        author_name: form.author_name.trim() || undefined,
        body: form.body.trim(),
      });
      setComments((prev) => [...prev, created]);
      setForm({ author_name: '', body: '' });
      setPostSuccess(true);
      setTimeout(() => setPostSuccess(false), 3000);
    } catch {
      setError(t('createReport.submitError'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-50 rounded-xl">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
        </div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
          {t('comments.title')}
        </h3>
      </div>

      {/* Existing Comments */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-xl mb-6">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : comments.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-6">{t('comments.noComments')}</p>
      ) : (
        <div className="space-y-4 mb-8">
          <AnimatePresence initial={false}>
            {comments.map((comment, index) => (
              <motion.div
                key={comment.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gray-50 rounded-2xl border border-gray-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white rounded-lg border border-gray-200">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {comment.author_name || t('comments.namePlaceholder')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {new Date(comment.created_at).toLocaleDateString()}
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {comment.body}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Post Success Toast */}
      <AnimatePresence>
        {postSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-4 text-sm text-emerald-700 font-medium text-center"
          >
            {t('comments.postSuccess')}
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            {t('comments.nameLabel')}
            <span className="text-gray-400 font-normal lowercase ml-1">({t('common.optional')})</span>
          </label>
          <input
            type="text"
            value={form.author_name}
            onChange={(e) => setForm({ ...form, author_name: e.target.value })}
            placeholder={t('comments.namePlaceholder')}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            {t('comments.commentLabel')} <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder={t('comments.commentPlaceholder')}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm resize-none"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !form.body.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('comments.submitting')}
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {t('comments.submitButton')}
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
