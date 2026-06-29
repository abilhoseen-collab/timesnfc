import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n, t } = useTranslation();
  const current = i18n.language?.startsWith('en') ? 'en' : 'bn';
  const change = (lng: 'bn' | 'en') => {
    i18n.changeLanguage(lng);
    document.documentElement.lang = lng;
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={compact ? 'icon' : 'sm'} className="gap-1">
          <Globe size={16} />
          {!compact && <span className="text-xs font-medium uppercase">{current}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => change('bn')} className={current === 'bn' ? 'font-bold' : ''}>
          🇧🇩 {t('lang.bn')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => change('en')} className={current === 'en' ? 'font-bold' : ''}>
          🇬🇧 {t('lang.en')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
