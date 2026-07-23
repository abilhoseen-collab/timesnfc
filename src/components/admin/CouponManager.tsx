import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit2, Copy, Loader2, Tag } from 'lucide-react';
import { getUserFriendlyError } from '@/lib/errorHandler';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { bnCurrency, bnDate } from '@/lib/formatters';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_amount: number;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  per_user_limit: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

const empty = {
  code: '',
  description: '',
  discount_type: 'percent' as 'percent' | 'fixed',
  discount_value: 10,
  min_amount: 0,
  max_discount: '',
  usage_limit: '',
  per_user_limit: 1,
  expires_at: '',
  is_active: true,
};

export default function CouponManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'ত্রুটি', description: getUserFriendlyError(error), variant: 'destructive' });
    } else {
      setCoupons((data as Coupon[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startEdit = (c: Coupon) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      description: c.description || '',
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      min_amount: c.min_amount,
      max_discount: c.max_discount?.toString() || '',
      usage_limit: c.usage_limit?.toString() || '',
      per_user_limit: c.per_user_limit,
      expires_at: c.expires_at ? c.expires_at.slice(0, 10) : '',
      is_active: c.is_active,
    });
    setShowForm(true);
  };

  const reset = () => { setForm(empty); setEditingId(null); setShowForm(false); };

  const save = async () => {
    if (!form.code.trim()) {
      toast({ title: 'কুপন কোড প্রয়োজন', variant: 'destructive' });
      return;
    }
    if (form.discount_value <= 0) {
      toast({ title: 'ডিসকাউন্ট মান ০ এর বেশি হতে হবে', variant: 'destructive' });
      return;
    }
    if (form.discount_type === 'percent' && form.discount_value > 100) {
      toast({ title: 'শতাংশ ১০০ এর বেশি হতে পারে না', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_amount: Number(form.min_amount) || 0,
      max_discount: form.max_discount ? Number(form.max_discount) : null,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      per_user_limit: Number(form.per_user_limit) || 1,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_active: form.is_active,
    };

    const { error } = editingId
      ? await supabase.from('coupons').update(payload).eq('id', editingId)
      : await supabase.from('coupons').insert(payload);

    setSaving(false);
    if (error) {
      toast({ title: 'সংরক্ষণ ব্যর্থ', description: getUserFriendlyError(error), variant: 'destructive' });
    } else {
      toast({ title: editingId ? 'কুপন আপডেট হয়েছে' : 'কুপন তৈরি হয়েছে' });
      reset();
      load();
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) {
      toast({ title: 'ডিলিট ব্যর্থ', description: getUserFriendlyError(error), variant: 'destructive' });
      throw error;
    }
    toast({ title: 'কুপন ডিলিট হয়েছে' });
    load();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'কোড কপি হয়েছে' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">কুপন ম্যানেজমেন্ট</h2>
          <p className="text-sm text-muted-foreground">ডিসকাউন্ট কুপন তৈরি ও পরিচালনা করুন</p>
        </div>
        <Button onClick={() => { reset(); setShowForm(true); }}>
          <Plus size={16} className="mr-2" /> নতুন কুপন
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'কুপন এডিট করুন' : 'নতুন কুপন'}</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>কোড *</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="SAVE20"
              />
            </div>
            <div>
              <Label>ধরন *</Label>
              <Select
                value={form.discount_type}
                onValueChange={(v: 'percent' | 'fixed') => setForm({ ...form, discount_type: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">শতাংশ (%)</SelectItem>
                  <SelectItem value="fixed">ফিক্সড (৳)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ডিসকাউন্ট মান *</Label>
              <Input
                type="number" min={0}
                value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>সর্বোচ্চ ডিসকাউন্ট (৳)</Label>
              <Input
                type="number" min={0}
                value={form.max_discount}
                onChange={(e) => setForm({ ...form, max_discount: e.target.value })}
                placeholder="ঐচ্ছিক"
              />
            </div>
            <div>
              <Label>সর্বনিম্ন অর্ডার অ্যামাউন্ট (৳)</Label>
              <Input
                type="number" min={0}
                value={form.min_amount}
                onChange={(e) => setForm({ ...form, min_amount: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>মোট ইউসেজ লিমিট</Label>
              <Input
                type="number" min={0}
                value={form.usage_limit}
                onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                placeholder="আনলিমিটেড হলে খালি রাখুন"
              />
            </div>
            <div>
              <Label>প্রতি ইউজার লিমিট</Label>
              <Input
                type="number" min={1}
                value={form.per_user_limit}
                onChange={(e) => setForm({ ...form, per_user_limit: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>মেয়াদ শেষ তারিখ</Label>
              <Input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>বিবরণ</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="ইউজারের জন্য একটি ছোট বিবরণ"
              />
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(c) => setForm({ ...form, is_active: c })}
              />
              <Label>সক্রিয়</Label>
            </div>
            <div className="sm:col-span-2 flex gap-2 justify-end">
              <Button variant="outline" onClick={reset} disabled={saving}>বাতিল</Button>
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 size={16} className="mr-2 animate-spin" />}
                {editingId ? 'আপডেট' : 'তৈরি'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <LoadingState variant="card" rows={3} label="কুপন লোড হচ্ছে..." />
      ) : coupons.length === 0 ? (
        <EmptyState
          icon={<Tag size={40} />}
          title="কোনো কুপন নেই"
          description="উপরের বোতাম থেকে নতুন কুপন তৈরি করুন।"
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((c) => (
            <Card key={c.id} className={!c.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Tag size={18} className="text-primary" />
                    <span className="font-mono font-bold text-lg">{c.code}</span>
                  </div>
                  <Badge variant={c.is_active ? 'default' : 'secondary'}>
                    {c.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {c.discount_type === 'percent' ? `${c.discount_value}%` : bnCurrency(c.discount_value)}
                  <span className="text-sm font-normal text-muted-foreground ml-2">ডিসকাউন্ট</span>
                </p>
                {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>ব্যবহার: {c.usage_count}{c.usage_limit ? ` / ${c.usage_limit}` : ' / ∞'}</div>
                  {c.min_amount > 0 && <div>সর্বনিম্ন: {bnCurrency(c.min_amount)}</div>}
                  {c.expires_at && <div>মেয়াদ: {bnDate(c.expires_at)}</div>}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => copyCode(c.code)}>
                    <Copy size={14} />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => startEdit(c)}>
                    <Edit2 size={14} />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => remove(c.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
