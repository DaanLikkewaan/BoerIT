'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Save, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

import { parametersApi } from '@/lib/api/parameters';
import { livestockGroupSchema, type LivestockGroupFormData } from '@/lib/validators';
import { DEFAULT_PARAMETERS, CATTLE_CATEGORIES, SHEEP_CATEGORIES } from '@/constants/livestock';
import { ApiError } from '@/lib/api/client';
import { PageLoader, ErrorMessage } from '@/components/ui/Feedback';
import { cn } from '@/lib/utils';
import type { FarmParameter, LivestockGroup } from '@/types/parameters';

// Group parameters by category for display
function groupByCategory(params: FarmParameter[]) {
  return DEFAULT_PARAMETERS.reduce((acc, def) => {
    const match = params.find((p) => p.parameterKey === def.parameterKey);
    const category = def.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push({
      ...def,
      parameterValue: match?.parameterValue ?? def.parameterValue,
    });
    return acc;
  }, {} as Record<string, (Omit<typeof DEFAULT_PARAMETERS[number], 'parameterValue'> & { parameterValue: string })[]>);
}

export default function ParametersPage() {
  const { farmId } = useParams<{ farmId: string }>();
  const [savingParams, setSavingParams] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Cattle Production': true,
    'Sheep Production': true,
    'Operating Costs': true,
  });
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [showLivestockForm, setShowLivestockForm] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  const { data: parameters = [], isLoading: paramsLoading, mutate: mutateParams } =
    useSWR<FarmParameter[]>(`params-${farmId}`, () => parametersApi.list(farmId));

  const { data: livestock = [], isLoading: livestockLoading, mutate: mutateLivestock } =
    useSWR<LivestockGroup[]>(`livestock-${farmId}`, () => parametersApi.listLivestock(farmId));

  const grouped = groupByCategory(parameters);

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } =
    useForm<LivestockGroupFormData>({ resolver: zodResolver(livestockGroupSchema) });

  const selectedSpecies = watch('species');

  function toggleCategory(cat: string) {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }

  function handleParamChange(key: string, value: string) {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
  }

  async function saveParameters() {
    setSavingParams(true);
    try {
      const toSave = DEFAULT_PARAMETERS.map((def) => ({
        parameterKey: def.parameterKey,
        parameterValue: localValues[def.parameterKey] ??
          parameters.find((p) => p.parameterKey === def.parameterKey)?.parameterValue ??
          def.parameterValue,
        unit: def.unit,
        category: def.category,
      }));
      await parametersApi.upsert(farmId, { parameters: toSave });
      await mutateParams();
      toast.success('Parameters saved.');
    } catch {
      toast.error('Failed to save parameters.');
    } finally {
      setSavingParams(false);
    }
  }

  async function onLivestockSubmit(data: LivestockGroupFormData) {
    try {
      await parametersApi.upsertLivestock(farmId, data);
      await mutateLivestock();
      toast.success('Livestock group saved.');
      setShowLivestockForm(false);
      reset();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save.');
    }
  }

  async function handleDeleteLivestock(id: string) {
    setDeletingGroupId(id);
    try {
      await parametersApi.deleteLivestock(farmId, id);
      await mutateLivestock();
      toast.success('Livestock group removed.');
    } catch {
      toast.error('Failed to delete.');
    } finally {
      setDeletingGroupId(null);
    }
  }

  if (paramsLoading || livestockLoading) return <PageLoader />;

  const inputClass = 'bg-stone-900 border border-stone-700 text-white placeholder-stone-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors';
  const categories = CATTLE_CATEGORIES;

  return (
    <div className="space-y-8">
      {/* ── Livestock Groups ─────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-medium">Livestock Groups</h2>
            <p className="text-stone-400 text-xs mt-0.5">Current herd composition by species and category.</p>
          </div>
          <button
            onClick={() => { setShowLivestockForm((v) => !v); reset(); }}
            className="inline-flex items-center gap-2 text-sm bg-stone-800 hover:bg-stone-700 text-white px-3 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add group
          </button>
        </div>

        {showLivestockForm && (
          <form onSubmit={handleSubmit(onLivestockSubmit)} className="bg-stone-900 border border-stone-700 rounded-xl p-5 mb-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1.5">Species *</label>
                <select {...register('species')} className={`${inputClass} w-full`}>
                  <option value="">Select...</option>
                  <option value="cattle">Cattle</option>
                  <option value="sheep">Sheep</option>
                </select>
                {errors.species && <p className="mt-1 text-xs text-red-400">{errors.species.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1.5">Category *</label>
                <select {...register('category')} className={`${inputClass} w-full`}>
                  <option value="">Select...</option>
                  {(selectedSpecies === 'sheep' ? SHEEP_CATEGORIES : CATTLE_CATEGORIES).map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                {errors.category && <p className="mt-1 text-xs text-red-400">{errors.category.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1.5">Current count *</label>
                <input type="number" {...register('currentCount', { valueAsNumber: true })} className={`${inputClass} w-full`} placeholder="0" />
                {errors.currentCount && <p className="mt-1 text-xs text-red-400">{errors.currentCount.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1.5">Target count</label>
                <input type="number" {...register('targetCount', { valueAsNumber: true })} className={`${inputClass} w-full`} placeholder="Optional" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Save group
              </button>
              <button type="button" onClick={() => setShowLivestockForm(false)} className="px-4 py-2 text-stone-400 hover:text-white text-sm transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        {livestock.length === 0 ? (
          <p className="text-stone-500 text-sm py-4">No livestock groups added yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {livestock.map((group) => (
              <div key={group.id} className="bg-stone-900 border border-stone-800 rounded-xl p-4 relative group">
                <button
                  onClick={() => handleDeleteLivestock(group.id)}
                  disabled={deletingGroupId === group.id}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-stone-500 hover:text-red-400 transition-all"
                >
                  {deletingGroupId === group.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
                <p className="text-stone-400 text-xs capitalize mb-1">{group.species}</p>
                <p className="text-white font-medium capitalize">{group.category}</p>
                <p className="text-amber-400 text-2xl font-semibold mt-1">{group.currentCount.toLocaleString('en-ZA')}</p>
                {group.targetCount && (
                  <p className="text-stone-500 text-xs mt-1">Target: {group.targetCount}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Production Parameters ────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-medium">Production Parameters</h2>
            <p className="text-stone-400 text-xs mt-0.5">Rates, prices and costs used by the forecast engine.</p>
          </div>
          <button
            onClick={saveParameters}
            disabled={savingParams}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            {savingParams ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save all
          </button>
        </div>

        <div className="space-y-3">
          {Object.entries(grouped).map(([category, params]) => (
            <div key={category} className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-stone-800/50 transition-colors"
              >
                <span className="text-white font-medium text-sm">{category}</span>
                {expandedCategories[category]
                  ? <ChevronUp className="w-4 h-4 text-stone-400" />
                  : <ChevronDown className="w-4 h-4 text-stone-400" />
                }
              </button>
              {expandedCategories[category] && (
                <div className="px-5 pb-5 space-y-3 border-t border-stone-800">
                  {params.map((param) => (
                    <div key={param.parameterKey} className="flex items-center justify-between gap-4 pt-3">
                      <div className="flex-1">
                        <label className="block text-sm text-stone-300">{param.label}</label>
                        {param.unit && <span className="text-xs text-stone-500">{param.unit}</span>}
                      </div>
                      <input
                        type="number"
                        step="any"
                        value={localValues[param.parameterKey] ?? param.parameterValue}
                        onChange={(e) => handleParamChange(param.parameterKey, e.target.value)}
                        className={`${inputClass} w-32 text-right`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
