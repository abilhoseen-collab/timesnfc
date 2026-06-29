import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import VCardEditor from "./pages/VCardEditor";
import VCardPublic from "./pages/VCardPublic";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Payment from "./pages/Payment";
import TemplatePreview from "./pages/TemplatePreview";
import NFCPayment from "./pages/NFCPayment";
import TrackOrder from "./pages/TrackOrder";
import NotFound from "./pages/NotFound";
import ConstructionTemplate from "./pages/templates/ConstructionTemplate";
import DoctorTemplate from "./pages/templates/DoctorTemplate";
import RealEstateTemplate from "./pages/templates/RealEstateTemplate";
import ConstructionPublic from "./pages/templates/ConstructionPublic";
import DoctorPublic from "./pages/templates/DoctorPublic";
import RealEstatePublic from "./pages/templates/RealEstatePublic";
import LandingPageBuilder from "./pages/LandingPageBuilder";
import LandingPagePublic from "./pages/LandingPagePublic";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import RefundPolicy from "./pages/RefundPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import AccountSettings from "./pages/AccountSettings";
import Billing from "./pages/Billing";
import Support from "./pages/Support";
import Referrals from "./pages/Referrals";
import Leads from "./pages/Leads";
import BulkQR from "./pages/BulkQR";
import BulkCreate from "./pages/BulkCreate";
import Teams from "./pages/Teams";
import AcceptInvite from "./pages/AcceptInvite";
import Maintenance from "./pages/Maintenance";
import Offline from "./pages/Offline";
import PWADiagnostics from "./pages/PWADiagnostics";
import Directory from "./pages/Directory";
import Leaderboard from "./pages/Leaderboard";
import Network from "./pages/Network";
import LinktreeView from "./pages/LinktreeView";
import AffiliateDashboard from "./pages/AffiliateDashboard";
import MaintenanceGate from "./components/MaintenanceGate";
import PWAManager from "./components/PWAManager";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 min default — reduces refetch storms
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <PWAManager />
            <BrowserRouter>
              <MaintenanceGate>
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
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </MaintenanceGate>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
