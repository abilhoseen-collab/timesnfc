import { useMemo } from 'react';
import {
  ComposableMap, Geographies, Geography, ZoomableGroup,
} from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

interface Props {
  countries: { name: string; value: number }[];
}

export default function GeoMap({ countries }: Props) {
  const { t } = useTranslation();
  const max = useMemo(
    () => Math.max(1, ...countries.map((c) => c.value)),
    [countries],
  );
  const colorScale = scaleLinear<string>()
    .domain([0, max])
    .range(['hsl(var(--muted))', 'hsl(var(--primary))']);

  const lookup = useMemo(() => {
    const m = new Map<string, number>();
    countries.forEach((c) => m.set(c.name.toLowerCase(), c.value));
    return m;
  }, [countries]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Globe size={18} /> {t('analytics.geoMap')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full aspect-[2/1] bg-muted/20 rounded-lg overflow-hidden">
          <ComposableMap projectionConfig={{ scale: 140 }} style={{ width: '100%', height: '100%' }}>
            <ZoomableGroup>
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const name = (geo.properties?.name || '').toLowerCase();
                    const v = lookup.get(name) || 0;
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={v > 0 ? colorScale(v) : 'hsl(var(--muted))'}
                        stroke="hsl(var(--border))"
                        strokeWidth={0.3}
                        style={{
                          default: { outline: 'none' },
                          hover: { fill: 'hsl(var(--primary))', outline: 'none', cursor: 'pointer' },
                          pressed: { outline: 'none' },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>
        </div>
        {countries.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {countries.slice(0, 9).map((c) => (
              <div key={c.name} className="flex justify-between p-2 rounded bg-muted/30">
                <span className="truncate">{c.name}</span>
                <span className="font-semibold text-primary">{c.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
