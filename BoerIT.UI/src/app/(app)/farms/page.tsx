'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { toast } from 'sonner';
import { Plus, MapPin, Pencil, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { farmsApi } from '@/lib/api/farms';
import { farmSchema, type FarmFormData } from '@/lib/validators';
import { ApiError } from '@/lib/api/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageLoader, ErrorMessage } from '@/components/ui/Feedback';
import { formatDate } from '@/lib/utils';
import type { Farm } from '@/types/farm';

export default function FarmsPage() {
  const { data: farms, isLoading, error, mutate } = useSWR<Farm[]>('farms', farmsApi.list);
  const [showForm, setShowForm] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FarmFormData>({
    resolver: zodResolver(farmSchema),
  });

  function openCreate() {
    setEditingFarm(null);
    reset({ name: '', description: '', location: '', landHectares: 0 });
    setShowForm(true);
  }

  function openEdit(farm: Farm) {
    setEditingFarm(farm);
    reset({
      name: farm.name,
      description: farm.description ?? '',
      location: farm.location ?? '',
      landHectares: farm.landHectares,
    });
    setShowForm(true);
  }

  async function onSubmit(data: FarmFormData) {
    try {
      if (editingFarm) {
        await farmsApi.update(editingFarm.id, data);
        toast.success('Farm updated.');
      } else {
        await farmsApi.create(data);
        toast.success('Farm created!');
      }
      await mutate();
      setShowForm(false);
      reset();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  }

  async function handleDelete(farm: Farm) {
    if (!confirm(`Delete "${farm.name}"? This cannot be undone.`)) return;
    setDeletingId(farm.id);
    try {
      await farmsApi.delete(farm.id);
      toast.success('Farm deleted.');
      await mutate();
    } catch {
      toast.error('Failed to delete farm.');
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorMessage message="Failed to load farms." />;

  const inputClass = 'w-full bg-stone-900 border border-stone-700 text-white placeholder-stone-500 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors';

  return (
    <div>
      <PageHeader
        title="My Farms"
        description="Manage your farm profiles and navigate to parameters and forecasts."
        action={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Farm
          </button>
        }
      />

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-stone-900 border border-stone-700 rounded-xl p-6 mb-8">
          <h2 className="text-white font-medium mb-5">{editingFarm ? 'Edit Farm' : 'New Farm'}</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1.5">Farm name *</label>
                <input {...register('name')} className={inputClass} placeholder="Kleingeluk" />
                {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1.5">Location</label>
                <input {...register('location')} className={inputClass} placeholder="Cradock, EC" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1.5">Land size (ha) *</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('landHectares', { valueAsNumber: true })}
                  className={inputClass}
                  placeholder="1500"
                />
                {errors.landHectares && <p className="mt-1 text-xs text-red-400">{errors.landHectares.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1.5">Description</label>
                <input {...register('description')} className={inputClass} placeholder="Optional notes" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingFarm ? 'Save changes' : 'Create farm'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Farms list */}
      {farms?.length === 0 ? (
        <div className="border border-dashed border-stone-800 rounded-xl p-12 text-center">
          <MapPin className="w-10 h-10 text-stone-600 mx-auto mb-4" />
          <p className="text-stone-400 text-sm">No farms yet. Create your first one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {farms?.map((farm) => (
            <div
              key={farm.id}
              className="bg-stone-900 border border-stone-800 rounded-xl p-5 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-medium truncate">{farm.name}</h3>
                  <p className="text-stone-500 text-xs mt-0.5">
                    {farm.location && `${farm.location} · `}
                    {farm.landHectares.toLocaleString('en-ZA')} ha · Added {formatDate(farm.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => openEdit(farm)}
                  className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(farm)}
                  disabled={deletingId === farm.id}
                  className="p-2 text-stone-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  {deletingId === farm.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />
                  }
                </button>
                <Link
                  href={`/farms/${farm.id}`}
                  className="inline-flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                >
                  Open <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
