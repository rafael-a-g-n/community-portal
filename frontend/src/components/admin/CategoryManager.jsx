import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { reportService } from '../../services/reportService';
import { Plus, Loader2, AlertCircle } from 'lucide-react';

export default function CategoryManager({ categories, onSaved, onDeleted }) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editNamePt, setEditNamePt] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const { t, i18n } = useTranslation();

  const [newName, setNewName] = useState('');
  const [newNamePt, setNewNamePt] = useState('');
  const [newIcon, setNewIcon] = useState('');
  const [creating, setCreating] = useState(false);

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditNamePt(cat.name_pt || '');
    setEditIcon(cat.icon || '');
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditNamePt('');
    setEditIcon('');
    setError(null);
  };

  const saveEdit = async (id) => {
    if (!editName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await reportService.updateCategory(id, {
        name: editName,
        name_pt: editNamePt,
        icon: editIcon,
      });
      onSaved(updated);
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update category.');
    } finally {
      setSaving(false);
    }
  };

  const createCategory = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const created = await reportService.createCategory({
        name: newName,
        name_pt: newNamePt,
        icon: newIcon,
      });
      onSaved(created); // We can just append to list
      setNewName('');
      setNewNamePt('');
      setNewIcon('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create category.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category? Linked reports will block deletion.')) return;
    setError(null);
    try {
      await reportService.deleteCategory(id);
      onDeleted(id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete category. Ensure no reports are linked.');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('admin.manageCategories')}</h3>
      </div>

      {error && (
        <div
          className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-2xl px-5 py-4 text-sm mb-6"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Create New Category */}
      <div className="flex flex-wrap items-center gap-3 mb-8 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex-1 min-w-[200px] flex flex-col gap-2">
          <input
            type="text"
            placeholder={t('admin.newCategoryName')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            placeholder="Nome (Portuguese)"
            value={newNamePt}
            onChange={(e) => setNewNamePt(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <input
          type="text"
          placeholder={t('admin.iconEmoji')}
          value={newIcon}
          onChange={(e) => setNewIcon(e.target.value)}
          className="w-32 px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={createCategory}
          disabled={creating || !newName.trim()}
          className="flex items-center justify-center self-end md:self-center px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors h-fit"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {t('admin.addCategory')}
        </button>
      </div>

      {/* Categories List */}
      <div className="space-y-3">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex flex-wrap items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-200 dark:hover:border-indigo-500 transition-colors"
          >
            {editingId === cat.id ? (
              <div className="flex-1 flex flex-wrap items-center gap-3">
                <div className="flex-1 flex flex-col gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    value={editNamePt}
                    onChange={(e) => setEditNamePt(e.target.value)}
                    placeholder="Nome (Portuguese)"
                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <input
                  type="text"
                  value={editIcon}
                  onChange={(e) => setEditIcon(e.target.value)}
                  placeholder={t('admin.iconEmoji')}
                  className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 self-start"
                />
                <div className="flex items-center gap-2 self-start">
                  <button
                    onClick={() => saveEdit(cat.id)}
                    disabled={saving}
                    className="text-xs font-bold px-3 py-1.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 disabled:opacity-50"
                  >
                    {t('common.save')}
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={saving}
                    className="text-xs font-bold px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{cat.icon || '📌'}</span>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100">
                      {i18n.language === 'pt' && cat.name_pt ? cat.name_pt : cat.name}
                      {i18n.language === 'pt' && cat.name_pt && cat.name_pt !== cat.name && (
                        <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">({cat.name})</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {t('admin.categorySlug')}: {cat.slug}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(cat)}
                    className="px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg"
                  >
                    {t('common.manage')}
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg"
                    title="Delete Category"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {categories.length === 0 && <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">{t('admin.noReports')}</p>}
      </div>
    </div>
  );
}
