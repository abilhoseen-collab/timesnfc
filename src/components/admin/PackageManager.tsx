import { useState, useEffect } from 'react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Loader2, Package, X } from 'lucide-react';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { getUserFriendlyError } from '@/lib/errorHandler';
import { bnCurrency } from '@/lib/formatters';

const packageSchema = z.object({
  name: z.string().trim().min(1, 'প্যাকেজের নাম দিন').max(100, 'নাম ১০০ অক্ষরের বেশি হতে পারবে না'),
  description: z.string().trim().max(500, 'বিবরণ ৫০০ অক্ষরের বেশি হতে পারবে না').optional(),
  price: z.number().min(0, 'মূল্য ঋণাত্মক হতে পারবে না').max(1_000_000, 'মূল্য অনেক বেশি'),
  duration_days: z.number().int('পূর্ণ সংখ্যা দিন').min(1, 'অন্তত ১ দিন হতে হবে').max(3650, 'সর্বোচ্চ ১০ বছর'),
  features: z.array(z.string().trim().min(1).max(200)).max(50, 'সর্বোচ্চ ৫০টি ফিচার'),
  is_active: z.boolean(),
});

interface PackageType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
  features: string[];
  is_active: boolean;
  created_at: string;
}

export default function PackageManager() {
  const { toast } = useToast();
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageType | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PackageType | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    duration_days: 30,
    features: [] as string[],
    is_active: true,
  });
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .order('price', { ascending: true });

    if (error) {
      toast({ title: 'প্যাকেজ লোড করা যায়নি', description: getUserFriendlyError(error), variant: 'destructive' });
    } else if (data) {
      setPackages(
        data.map((pkg) => ({
          ...pkg,
          features: Array.isArray(pkg.features) ? (pkg.features as string[]) : [],
        }))
      );
    }
    setLoading(false);
  };

  const openCreateModal = () => {
    setEditingPackage(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      duration_days: 30,
      features: [],
      is_active: true,
    });
    setNewFeature('');
    setShowModal(true);
  };

  const openEditModal = (pkg: PackageType) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      price: pkg.price,
      duration_days: pkg.duration_days,
      features: pkg.features,
      is_active: pkg.is_active,
    });
    setNewFeature('');
    setShowModal(true);
  };

  const addFeature = () => {
    const value = newFeature.trim();
    if (!value) return;
    if (value.length > 200) {
      toast({ title: 'ফিচার ২০০ অক্ষরের বেশি হতে পারবে না', variant: 'destructive' });
      return;
    }
    if (formData.features.length >= 50) {
      toast({ title: 'সর্বোচ্চ ৫০টি ফিচার যোগ করা যাবে', variant: 'destructive' });
      return;
    }
    setFormData((prev) => ({ ...prev, features: [...prev.features, value] }));
    setNewFeature('');
  };

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    const parsed = packageSchema.safeParse({
      name: formData.name,
      description: formData.description || undefined,
      price: Number(formData.price),
      duration_days: Number(formData.duration_days),
      features: formData.features,
      is_active: formData.is_active,
    });

    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast({ title: 'ভ্যালিডেশন ব্যর্থ', description: first?.message ?? 'ইনপুট চেক করুন', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const payload = {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      price: parsed.data.price,
      duration_days: parsed.data.duration_days,
      features: parsed.data.features,
      is_active: parsed.data.is_active,
    };

    const { error } = editingPackage
      ? await supabase.from('packages').update(payload).eq('id', editingPackage.id)
      : await supabase.from('packages').insert(payload);

    setSaving(false);
    if (error) {
      toast({
        title: editingPackage ? 'প্যাকেজ আপডেট ব্যর্থ' : 'প্যাকেজ তৈরি ব্যর্থ',
        description: getUserFriendlyError(error),
        variant: 'destructive',
      });
      return;
    }
    toast({ title: editingPackage ? 'প্যাকেজ আপডেট হয়েছে' : 'প্যাকেজ তৈরি হয়েছে' });
    setShowModal(false);
    fetchPackages();
  };

  const performDelete = async (pkg: PackageType) => {
    const { error } = await supabase.from('packages').delete().eq('id', pkg.id);
    if (error) {
      toast({ title: 'প্যাকেজ ডিলিট ব্যর্থ', description: getUserFriendlyError(error), variant: 'destructive' });
      throw error;
    }
    toast({ title: 'প্যাকেজ ডিলিট হয়েছে' });
    fetchPackages();
  };

  const toggleActive = async (pkg: PackageType) => {
    const { error } = await supabase
      .from('packages')
      .update({ is_active: !pkg.is_active })
      .eq('id', pkg.id);

    if (error) {
      toast({ title: 'প্যাকেজ আপডেট ব্যর্থ', description: getUserFriendlyError(error), variant: 'destructive' });
    } else {
      fetchPackages();
    }
  };

  if (loading) {
    return <LoadingState variant="card" rows={3} label="প্যাকেজ লোড হচ্ছে..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Package Management</h2>
          <p className="text-muted-foreground">Manage subscription packages and pricing</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" />
          Add Package
        </Button>
      </div>

      {/* Packages Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <Card key={pkg.id} className={`relative ${!pkg.is_active ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                </div>
                <Switch
                  checked={pkg.is_active}
                  onCheckedChange={() => toggleActive(pkg)}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-3xl font-bold text-primary">{bnCurrency(pkg.price)}</div>
                <div className="text-sm text-muted-foreground">{pkg.duration_days} days</div>
              </div>

              {pkg.description && (
                <p className="text-sm text-muted-foreground">{pkg.description}</p>
              )}

              {pkg.features.length > 0 && (
                <ul className="space-y-1">
                  {pkg.features.slice(0, 5).map((feature, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      {feature}
                    </li>
                  ))}
                  {pkg.features.length > 5 && (
                    <li className="text-sm text-muted-foreground">
                      +{pkg.features.length - 5} more...
                    </li>
                  )}
                </ul>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEditModal(pkg)}
                >
                  <Pencil className="mr-1 h-3 w-3" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteTarget(pkg)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {packages.length === 0 && (
        <EmptyState
          icon={Package}
          title="কোনো প্যাকেজ নেই"
          description="প্রথম প্যাকেজ তৈরি করে শুরু করুন।"
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={deleteTarget ? `"${deleteTarget.name}" ডিলিট করবেন?` : 'ডিলিট করবেন?'}
        description="এই প্যাকেজ ডিলিট করলে যেসব সাবস্ক্রিপশনে এটি ব্যবহৃত হয়েছে সেগুলোতে সমস্যা হতে পারে। এই কাজটি ফেরানো যাবে না।"
        confirmLabel="ডিলিট করুন"
        destructive
        onConfirm={async () => {
          if (deleteTarget) await performDelete(deleteTarget);
          setDeleteTarget(null);
        }}
      />


      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? 'Edit Package' : 'Create Package'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Package Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Premium"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Package description..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (৳)</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (days)</Label>
                <Input
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_days: Number(e.target.value) }))}
                  min={1}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Features</Label>
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Add a feature..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                />
                <Button type="button" variant="outline" onClick={addFeature}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.features.length > 0 && (
                <div className="space-y-1 mt-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 bg-muted rounded px-3 py-1.5">
                      <span className="flex-1 text-sm">{feature}</span>
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label>Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingPackage ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
