/**
 * Unit tests for VCardEditor.fetchVCard()
 *
 * fetchVCard is a private method of the component, so we exercise it
 * by rendering <VCardEditor /> with mocked deps and asserting observable
 * outcomes (navigate, toast, populated form fields).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// ---- Mocks ---------------------------------------------------------------

const navigateMock = vi.fn();
const toastMock = vi.fn();
const maybeSingleMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useParams: () => ({ id: 'card-1' }),
  };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' }, loading: false }),
}));

vi.mock('@/hooks/useSubscriptionLimits', () => ({
  useSubscriptionLimits: () => ({
    canCreateVcard: true,
    currentVcards: 1,
    vcardLimit: 5,
    hasActiveSubscription: true,
    isLoading: false,
    packageName: 'Pro',
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

// Build a chainable supabase query builder where every method returns `this`
// except .maybeSingle() which is the terminal mock.
const buildBuilder = () => {
  const builder: any = {};
  ['select', 'eq', 'order', 'limit', 'update', 'insert', 'delete', 'in', 'gte']
    .forEach((m) => { builder[m] = vi.fn(() => builder); });
  builder.maybeSingle = maybeSingleMock;
  return builder;
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => buildBuilder()),
  },
}));

// Stub heavy child modules so render stays cheap & deterministic.
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: () => (props: any) => props?.children ?? null }),
  AnimatePresence: ({ children }: any) => children,
}));

vi.mock('@/components/CustomSectionsEditor', () => ({ default: () => null }));
vi.mock('@/components/vcard/VCardPreview', () => ({ default: () => null }));
vi.mock('@/components/vcard/VCardAnalyticsDashboard', () => ({ default: () => null }));

vi.mock('@/components/vcard-editor', async () => {
  const React = await import('react');
  const initialFormData: any = {
    name: '', job_title: '', company: '', email: '', phone: '', website: '',
    address: '', bio: '', template: 'freelancer',
    linkedin_url: '', twitter_url: '', facebook_url: '', instagram_url: '',
    youtube_url: '', github_url: '',
    is_active: true, photo_url: '', cover_image_url: '',
    qr_foreground_color: '#000000', qr_background_color: '#FFFFFF', qr_logo_url: '',
    notification_email: '', notify_on_view: false, notify_on_click: false,
    slug: '', whatsapp_number: '', telegram_username: '',
    chat_enabled: false, payment_enabled: false,
    payment_bkash: '', payment_nagad: '', payment_rocket: '',
    payment_bank_details: '', payment_button_text: 'Send Payment / Donate',
    appointment_enabled: false, appointment_title: 'Book an Appointment',
    appointment_description: '', appointment_duration_minutes: 30,
    appointment_available_days: ['monday'],
    appointment_start_time: '09:00', appointment_end_time: '17:00',
    appointment_email: '',
  };
  // BasicInfoEditor shows the name so we can assert form population.
  const BasicInfoEditor = ({ formData }: any) =>
    React.createElement('div', { 'data-testid': 'basic-info-name' }, formData?.name ?? '');
  const Pass = () => null;
  return {
    initialFormData,
    BasicInfoEditor,
    SocialLinksEditor: Pass,
    AppointmentSettings: Pass,
    PaymentSettings: Pass,
    ChatWidgetSettings: Pass,
    NotificationSettings: Pass,
    QRCodeSettings: Pass,
    PhotoUploader: Pass,
    TemplateSelector: Pass,
  };
});

// ---- Helpers -------------------------------------------------------------

const renderEditor = async () => {
  const { default: VCardEditor } = await import('@/pages/VCardEditor');
  return render(
    <MemoryRouter initialEntries={['/vcard/card-1']}>
      <Routes>
        <Route path="/vcard/:id" element={<VCardEditor />} />
      </Routes>
    </MemoryRouter>
  );
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ---- Tests ---------------------------------------------------------------

describe('VCardEditor.fetchVCard', () => {
  it('populates the form when supabase returns a row (.maybeSingle resolves with data)', async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        id: 'card-1',
        name: 'Akash Khan',
        job_title: 'Engineer',
        is_active: true,
        slug: 'akash-khan',
      },
      error: null,
    });

    await renderEditor();

    await waitFor(() => {
      expect(screen.getByTestId('basic-info-name')).toHaveTextContent('Akash Khan');
    });
    expect(navigateMock).not.toHaveBeenCalledWith('/dashboard');
  });

  it('shows a Bengali "not found" toast and navigates to /dashboard when data is null', async () => {
    maybeSingleMock.mockResolvedValueOnce({ data: null, error: null });

    await renderEditor();

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'ত্রুটি',
        description: 'কার্ড পাওয়া যায়নি',
        variant: 'destructive',
      })
    );
  });

  it('handles supabase errors gracefully (PGRST116 → friendly toast + redirect)', async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'No rows returned' },
    });

    await renderEditor();

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });
    const call = toastMock.mock.calls.find(([arg]) => arg?.variant === 'destructive');
    expect(call?.[0]).toMatchObject({
      title: 'ত্রুটি',
      variant: 'destructive',
    });
    expect(typeof call?.[0]?.description).toBe('string');
    expect(call?.[0]?.description.length).toBeGreaterThan(0);
  });

  it('handles a thrown network error without crashing', async () => {
    maybeSingleMock.mockRejectedValueOnce(new Error('Failed to fetch'));

    await renderEditor();

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'ত্রুটি',
        description: expect.stringContaining('নেটওয়ার্ক'),
        variant: 'destructive',
      })
    );
  });
});
