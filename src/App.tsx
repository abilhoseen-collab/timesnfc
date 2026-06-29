import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import OnboardingTour from "./components/OnboardingTour";
import MaintenanceGate from "./components/MaintenanceGate";
import PWAManager from "./components/PWAManager";

// Code-split heavy pages: editor, public card, dashboards
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Admin = lazy(() => import("./pages/Admin"));
const VCardEditor = lazy(() => import("./pages/VCardEditor"));
const VCardPublic = lazy(() => import("./pages/VCardPublic"));
const Cart = lazy(() => import("./pages/Cart"));
const Orders = lazy(() => import("./pages/Orders"));
const Payment = lazy(() => import("./pages/Payment"));
const TemplatePreview = lazy(() => import("./pages/TemplatePreview"));
const NFCPayment = lazy(() => import("./pages/NFCPayment"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const ConstructionTemplate = lazy(() => import("./pages/templates/ConstructionTemplate"));
const DoctorTemplate = lazy(() => import("./pages/templates/DoctorTemplate"));
const RealEstateTemplate = lazy(() => import("./pages/templates/RealEstateTemplate"));
const ConstructionPublic = lazy(() => import("./pages/templates/ConstructionPublic"));
const DoctorPublic = lazy(() => import("./pages/templates/DoctorPublic"));
const RealEstatePublic = lazy(() => import("./pages/templates/RealEstatePublic"));
const LandingPageBuilder = lazy(() => import("./pages/LandingPageBuilder"));
const LandingPagePublic = lazy(() => import("./pages/LandingPagePublic"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const Billing = lazy(() => import("./pages/Billing"));
const Support = lazy(() => import("./pages/Support"));
const Referrals = lazy(() => import("./pages/Referrals"));
const Leads = lazy(() => import("./pages/Leads"));
const BulkQR = lazy(() => import("./pages/BulkQR"));
const BulkCreate = lazy(() => import("./pages/BulkCreate"));
const Teams = lazy(() => import("./pages/Teams"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const Offline = lazy(() => import("./pages/Offline"));
const PWADiagnostics = lazy(() => import("./pages/PWADiagnostics"));
const Directory = lazy(() => import("./pages/Directory"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Network = lazy(() => import("./pages/Network"));
const LinktreeView = lazy(() => import("./pages/LinktreeView"));
const AffiliateDashboard = lazy(() => import("./pages/AffiliateDashboard"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="animate-spin text-primary" size={32} />
  </div>
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <PWAManager />
            <OnboardingTour />
            <BrowserRouter>
              <MaintenanceGate>
                <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/vcard/new" element={<VCardEditor />} />
                    <Route path="/vcard/:id" element={<VCardEditor />} />
                    <Route path="/c/:slug" element={<VCardPublic />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/payment" element={<Payment />} />
                    <Route path="/template/:templateId" element={<TemplatePreview />} />
                    <Route path="/nfc-payment" element={<NFCPayment />} />
                    <Route path="/track-order" element={<TrackOrder />} />
                    <Route path="/templates/construction" element={<ConstructionTemplate />} />
                    <Route path="/templates/doctor" element={<DoctorTemplate />} />
                    <Route path="/templates/realestate" element={<RealEstateTemplate />} />
                    <Route path="/p/construction/:userId" element={<ConstructionPublic />} />
                    <Route path="/p/doctor/:userId" element={<DoctorPublic />} />
                    <Route path="/p/realestate/:userId" element={<RealEstatePublic />} />
                    <Route path="/landing-builder" element={<LandingPageBuilder />} />
                    <Route path="/landing-builder/:id" element={<LandingPageBuilder />} />
                    <Route path="/site/:slug" element={<LandingPagePublic />} />
                    <Route path="/refund-policy" element={<RefundPolicy />} />
                    <Route path="/shipping-policy" element={<ShippingPolicy />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route path="/settings" element={<AccountSettings />} />
                    <Route path="/billing" element={<Billing />} />
                    <Route path="/support" element={<Support />} />
                    <Route path="/referrals" element={<Referrals />} />
                    <Route path="/leads" element={<Leads />} />
                    <Route path="/bulk-qr" element={<BulkQR />} />
                    <Route path="/bulk-create" element={<BulkCreate />} />
                    <Route path="/teams" element={<Teams />} />
                    <Route path="/accept-invite" element={<AcceptInvite />} />
                    <Route path="/maintenance" element={<Maintenance />} />
                    <Route path="/offline" element={<Offline />} />
                    <Route path="/pwa-diagnostics" element={<PWADiagnostics />} />
                    <Route path="/directory" element={<Directory />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/network" element={<Network />} />
                    <Route path="/affiliate" element={<AffiliateDashboard />} />
                    <Route path="/l/:slug" element={<LinktreeView />} />
                    <Route path="/help" element={<HelpCenter />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </MaintenanceGate>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
