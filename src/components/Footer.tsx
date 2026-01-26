import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const footerLinks = {
  product: {
    title: "Product",
    links: [
      { name: "Features", href: "#features" },
      { name: "Templates", href: "#templates" },
      { name: "Pricing", href: "#pricing" },
      { name: "NFC Store", href: "#nfc-store" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { name: "About Us", href: "#about" },
      { name: "Contact", href: "#contact" },
      { name: "Track Order", href: "/track-order" },
      { name: "Dashboard", href: "/dashboard" },
    ],
  },
  support: {
    title: "Support",
    links: [
      { name: "FAQ", href: "#faq" },
      { name: "Contact Us", href: "#contact" },
      { name: "Get Started", href: "/auth" },
      { name: "NFC Cards", href: "#nfc-store" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { name: "Privacy Policy", href: "/privacy-policy" },
      { name: "Terms of Service", href: "/terms-of-service" },
      { name: "Refund Policy", href: "/refund-policy" },
      { name: "Shipping Policy", href: "/shipping-policy" },
    ],
  },
};

export function Footer() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLinkClick = (href: string, isPlaceholder?: boolean) => {
    if (isPlaceholder) {
      toast({
        title: "Coming Soon",
        description: "This page is under development. Please contact us for any queries.",
      });
      const element = document.querySelector('#contact');
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }
    
    if (href.startsWith("#")) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(href);
    }
  };

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-custom py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="inline-block mb-6">
              <img src={logo} alt="Times Digital" className="h-12 w-auto brightness-0 invert" />
            </Link>
            <p className="text-primary-foreground/70 text-sm leading-relaxed mb-6 max-w-xs">
              Transform your networking with professional digital business cards. Share your contact info instantly with NFC technology.
            </p>
            <div className="flex gap-3">
              {["F", "T", "L", "I"].map((letter, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-secondary hover:text-secondary-foreground flex items-center justify-center text-sm font-bold transition-colors"
                >
                  {letter}
                </a>
              ))}
            </div>
          </div>
          
          {/* Links */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="font-bold mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <button
                      onClick={() => handleLinkClick(link.href, (link as any).placeholder)}
                      className="text-sm text-primary-foreground/70 hover:text-secondary transition-colors"
                    >
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-primary-foreground/60">
              © {new Date().getFullYear()} Times Digital. All rights reserved.
            </p>
            <p className="text-sm text-primary-foreground/60">
              Part of <span className="text-secondary">Sayem Group</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
