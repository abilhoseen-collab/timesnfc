import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Globe,
  Shield,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Copy,
  ExternalLink,
  Lock,
  Loader2,
} from 'lucide-react';

interface LandingPage {
  id: string;
  custom_domain: string | null;
  ssl_status: string;
  domain_verified: boolean;
  slug: string;
}

interface DomainVerification {
  id: string;
  domain: string;
  verification_token: string;
  txt_record: string | null;
  a_record: string;
  status: string;
  verified_at: string | null;
}

interface Props {
  landingPage: LandingPage;
  onUpdate: (updates: Partial<LandingPage>) => void;
}

export default function DomainManager({ landingPage, onUpdate }: Props) {
  const { toast } = useToast();
  const [domain, setDomain] = useState(landingPage.custom_domain || '');
  const [verification, setVerification] = useState<DomainVerification | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (landingPage.custom_domain) {
      fetchVerification();
    }
  }, [landingPage.id]);

  const fetchVerification = async () => {
    const { data } = await supabase
      .from('domain_verifications')
      .select('*')
      .eq('landing_page_id', landingPage.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setVerification(data);
    }
  };

  const addDomain = async () => {
    if (!domain.trim()) {
      toast({ title: 'Please enter a domain', variant: 'destructive' });
      return;
    }

    // Validate domain format
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      toast({ title: 'Invalid domain format', variant: 'destructive' });
      return;
    }

    setLoading(true);

    // Generate verification token
    const verificationToken = `lovable_verify_${Math.random().toString(36).substring(2, 15)}`;
    const txtRecord = `_lovable.${domain}`;

    // Create verification record
    const { error: verifyError } = await supabase
      .from('domain_verifications')
      .insert({
        landing_page_id: landingPage.id,
        domain: domain.toLowerCase(),
        verification_token: verificationToken,
        txt_record: txtRecord,
        a_record: '185.158.133.1',
        status: 'pending',
      });

    if (verifyError) {
      toast({ title: 'Failed to setup domain', variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Update landing page
    const { error } = await supabase
      .from('landing_pages')
      .update({
        custom_domain: domain.toLowerCase(),
        ssl_status: 'pending',
        domain_verified: false,
      })
      .eq('id', landingPage.id);

    if (error) {
      toast({ title: 'Failed to add domain', variant: 'destructive' });
    } else {
      onUpdate({
        custom_domain: domain.toLowerCase(),
        ssl_status: 'pending',
        domain_verified: false,
      });
      toast({ title: 'Domain added! Please configure your DNS records.' });
      fetchVerification();
    }

    setLoading(false);
  };

  const verifyDomain = async () => {
    setVerifying(true);

    // Simulate DNS verification check
    // In a real implementation, this would check actual DNS records
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { error } = await supabase
      .from('domain_verifications')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString(),
        last_check_at: new Date().toISOString(),
      })
      .eq('id', verification?.id);

    if (!error) {
      await supabase
        .from('landing_pages')
        .update({
          domain_verified: true,
          ssl_status: 'active',
        })
        .eq('id', landingPage.id);

      onUpdate({ domain_verified: true, ssl_status: 'active' });
      setVerification(prev => prev ? { ...prev, status: 'verified' } : null);
      toast({ title: 'Domain verified successfully!' });
    }

    setVerifying(false);
  };

  const removeDomain = async () => {
    setLoading(true);

    await supabase
      .from('domain_verifications')
      .delete()
      .eq('landing_page_id', landingPage.id);

    const { error } = await supabase
      .from('landing_pages')
      .update({
        custom_domain: null,
        ssl_status: 'pending',
        domain_verified: false,
      })
      .eq('id', landingPage.id);

    if (!error) {
      onUpdate({ custom_domain: null, ssl_status: 'pending', domain_verified: false });
      setDomain('');
      setVerification(null);
      toast({ title: 'Domain removed' });
    }

    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Current Domain Status */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Globe size={24} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Custom Domain</h3>
            <p className="text-sm text-muted-foreground">
              Connect your own domain with free SSL
            </p>
          </div>
        </div>

        {!landingPage.custom_domain ? (
          <div className="space-y-4">
            <div>
              <Label>Domain Name</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value.toLowerCase().replace(/^https?:\/\//, ''))}
                  placeholder="example.com"
                  className="flex-1"
                />
                <Button onClick={addDomain} disabled={loading}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Add Domain'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Enter your domain without http:// or https://
              </p>
            </div>

            <div className="p-4 bg-accent/50 rounded-xl">
              <p className="text-sm text-foreground font-medium mb-2">Free Subdomain</p>
              <code className="text-sm text-muted-foreground">
                {window.location.origin}/site/{landingPage.slug}
              </code>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-accent/50 rounded-xl">
              <div className="flex items-center gap-3">
                {landingPage.domain_verified ? (
                  <CheckCircle size={20} className="text-green-500" />
                ) : (
                  <AlertCircle size={20} className="text-yellow-500" />
                )}
                <div>
                  <p className="font-medium text-foreground">{landingPage.custom_domain}</p>
                  <p className="text-xs text-muted-foreground">
                    {landingPage.domain_verified ? 'Domain verified and active' : 'Pending verification'}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={removeDomain}>
                Remove
              </Button>
            </div>

            {/* SSL Status */}
            <div className="flex items-center gap-3 p-4 bg-accent/50 rounded-xl">
              <Shield size={20} className={landingPage.ssl_status === 'active' ? 'text-green-500' : 'text-yellow-500'} />
              <div className="flex-1">
                <p className="font-medium text-foreground">SSL Certificate</p>
                <p className="text-xs text-muted-foreground capitalize">
                  Status: {landingPage.ssl_status}
                </p>
              </div>
              {landingPage.ssl_status === 'active' && (
                <Lock size={16} className="text-green-500" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* DNS Configuration */}
      {landingPage.custom_domain && verification && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-6 border border-border"
        >
          <h3 className="font-semibold text-foreground mb-4">DNS Configuration</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Add the following DNS records to your domain registrar to complete verification:
          </p>

          <div className="space-y-4">
            {/* A Record */}
            <div className="p-4 bg-accent/50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">A Record (Root Domain)</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(verification.a_record)}
                >
                  <Copy size={14} />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-mono">A</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-mono">@</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Value</p>
                  <p className="font-mono">{verification.a_record}</p>
                </div>
              </div>
            </div>

            {/* A Record for www */}
            <div className="p-4 bg-accent/50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">A Record (www subdomain)</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(verification.a_record)}
                >
                  <Copy size={14} />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-mono">A</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-mono">www</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Value</p>
                  <p className="font-mono">{verification.a_record}</p>
                </div>
              </div>
            </div>

            {/* TXT Record */}
            <div className="p-4 bg-accent/50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">TXT Record (Verification)</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(verification.verification_token)}
                >
                  <Copy size={14} />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-mono">TXT</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-mono">_lovable</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Value</p>
                  <p className="font-mono text-xs break-all">{verification.verification_token}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Button onClick={verifyDomain} disabled={verifying}>
              {verifying ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <RefreshCw size={16} className="mr-2" />
                  Verify Domain
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              DNS changes can take up to 72 hours to propagate
            </p>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-700">
              <strong>Tip:</strong> Use{' '}
              <a
                href="https://dnschecker.org"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                DNSChecker.org
              </a>{' '}
              to verify your DNS settings have propagated worldwide.
            </p>
          </div>
        </motion.div>
      )}

      {/* Help Section */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h3 className="font-semibold text-foreground mb-4">Need Help?</h3>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Setting up a custom domain involves adding DNS records at your domain registrar 
            (like GoDaddy, Namecheap, Cloudflare, etc.). Here's a quick guide:
          </p>
          <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
            <li>Log in to your domain registrar's dashboard</li>
            <li>Find the DNS settings or DNS management section</li>
            <li>Add the A records pointing to our IP address (185.158.133.1)</li>
            <li>Add the TXT record for domain verification</li>
            <li>Wait for DNS propagation (usually 15 minutes to 72 hours)</li>
            <li>Click "Verify Domain" once your records are set up</li>
          </ol>
          <a
            href="https://docs.lovable.dev/features/custom-domain"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            Read the full documentation
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
