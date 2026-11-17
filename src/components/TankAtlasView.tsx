import React, { useMemo, useState } from 'react';
import {
  Camera,
  Compass,
  Maximize2,
  Plus,
  Wrench,
  X,
} from 'lucide-react';
import {
  ComponentDiscipline,
  DISCIPLINE_META,
  TANK_PARTS,
  TANK_PROFILES,
  TankPartItem,
} from '../data/tankAtlasData';
import { MaintenanceRecord, TankId } from '../types/maintenance';

interface TankAtlasViewProps {
  selectedTank: TankId | 'Todos';
  onSelectTank: (tank: TankId | 'Todos') => void;
  records: MaintenanceRecord[];
  onRegisterForComponent: (edtCode: string, tank: TankId) => void;
}

const ResilientPhoto: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className = 'h-full w-full object-cover' }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-800 via-[#0F2942] to-slate-900 p-4 text-center text-slate-300">
        <Camera className="h-8 w-8 text-sky-400" />
        <p className="mt-2 text-xs font-semibold text-white">{alt}</p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

export const TankAtlasView: React.FC<TankAtlasViewProps> = ({
  selectedTank,
  onSelectTank,
  records,
  onRegisterForComponent,
}) => {
  const activeTankId: TankId =
    selectedTank === 'Todos' ? 'T-2303' : selectedTank;
  const profile = TANK_PROFILES[activeTankId];

  const [blueprintMode, setBlueprintMode] = useState<'elevation' | 'pid'>(
    'elevation'
  );
  const [disciplineFilter, setDisciplineFilter] = useState<
    ComponentDiscipline | 'Todos'
  >('Todos');
  const [selectedPartId, setSelectedPartId] = useState<string>(
    TANK_PARTS[0].id
  );
  const [zoomPhoto, setZoomPhoto] = useState<{
    url: string;
    title: string;
    caption: string;
  } | null>(null);

  const selectedPart =
    TANK_PARTS.find((p) => p.id === selectedPartId) || TANK_PARTS[0];

  const visibleParts = useMemo(() => {
    return TANK_PARTS.filter((p) =>
      disciplineFilter === 'Todos' ? true : p.discipline === disciplineFilter
    );
  }, [disciplineFilter]);

  const blueprintHotspots = useMemo(() => {
    return TANK_PARTS.filter(
      (p) =>
        p.blueprintView === blueprintMode &&
        (disciplineFilter === 'Todos' || p.discipline === disciplineFilter)
    );
  }, [blueprintMode, disciplineFilter]);

  const tankMaintenanceCount = records.filter(
    (r) => r.tanque === activeTankId
  ).length;

  const handleSelectPart = (part: TankPartItem) => {
    setSelectedPartId(part.id);
    setBlueprintMode(part.blueprintView);
  };

  return (
    <div className="space-y-8">
      {/* Encabezado Hero del Tanque Seleccionado con Foto Real */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid grid-cols-1 items-stretch lg:grid-cols-12">
          <div className="flex flex-col justify-between p-6 lg:col-span-7 lg:p-8">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
                  {(['T-2303', 'T-2208', 'T-2209'] as TankId[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onSelectTank(t)}
                      className={`rounded-md px-3 py-1.5 font-mono text-xs font-bold transition-colors ${
                        activeTankId === t
                          ? 'bg-[#0F2942] text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <span className="font-mono text-xs font-semibold text-sky-700">
                  {tankMaintenanceCount} órdenes registradas en este activo
                </span>
              </div>

              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                  {profile.nombre} · Atlas de Componentes y Planos
                </h1>
                <p className="mt-1 text-sm text-slate-600">{profile.servicio}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 text-xs sm:grid-cols-2">
                <div>
                  <span className="font-semibold text-slate-500">
                    Configuración de Techo
                  </span>
                  <p className="mt-0.5 font-medium text-slate-900">
                    {profile.tipoTecho}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">
                    Dimensiones y Capacidad
                  </span>
                  <p className="mt-0.5 font-mono font-medium text-slate-900">
                    {profile.dimensiones} · {profile.capacidadNominal}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">
                    Material Estructural
                  </span>
                  <p className="mt-0.5 font-medium text-slate-900">
                    {profile.materialPrincipal}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">
                    Normativa y Estrategia
                  </span>
                  <p className="mt-0.5 font-medium text-slate-900">
                    {profile.normaDiseno} · {profile.anioConstruccion}
                  </p>
                </div>
              </div>
            </div>

            {/* Filtro por Disciplina */}
            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="mb-2 text-xs font-semibold text-slate-500">
                Filtrar Sistemas del Tanque:
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setDisciplineFilter('Todos')}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    disciplineFilter === 'Todos'
                      ? 'border-[#0F2942] bg-[#0F2942] text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Todos ({TANK_PARTS.length})
                </button>
                {DISCIPLINE_META.map((d) => {
                  const count = TANK_PARTS.filter(
                    (p) => p.discipline === d.id
                  ).length;
                  const active = disciplineFilter === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDisciplineFilter(d.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                        active
                          ? `${d.bgClass} ${d.textClass} ${d.borderClass} ring-1 ring-slate-900/10`
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className="h-2 w-2 rounded-sm shrink-0"
                        style={{ backgroundColor: d.color }}
                      />
                      <span>
                        {d.id} ({count})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Fotografía Principal del Tanque */}
          <div className="relative min-h-[260px] bg-slate-900 lg:col-span-5">
            <ResilientPhoto
              src={profile.heroPhoto}
              alt={`${profile.nombre} - Vista general de parque de tanques con techo flotante`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white">
              <div>
                <p className="font-mono text-[11px] font-semibold text-sky-300">
                  VISTA DE CAMPO · {activeTankId}
                </p>
                <p className="text-xs text-slate-200">
                  Tanque atmosférico de techo flotante externo con anillos SCI y escalera helicoidal
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setZoomPhoto({
                    url: profile.heroPhoto,
                    title: profile.nombre,
                    caption: `${profile.tipoTecho} · ${profile.dimensiones}`,
                  })
                }
                className="shrink-0 rounded-lg bg-white/15 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                title="Ampliar fotografía"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Planos Técnicos Interactivos + Inspector de Componente */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Plano CAD SVG Interactivo */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-sky-700" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Planos Técnicos Interactivos ({activeTankId})
                </h2>
                <p className="text-[11px] text-slate-500">
                  Haz clic en cualquier punto numerado del plano para inspeccionar el componente y su foto real.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setBlueprintMode('elevation')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  blueprintMode === 'elevation'
                    ? 'bg-[#0F2942] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Plano 01: Alzado / Corte A-A
              </button>
              <button
                type="button"
                onClick={() => setBlueprintMode('pid')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  blueprintMode === 'pid'
                    ? 'bg-[#0F2942] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Plano 02: P&amp;ID Auxiliar
              </button>
            </div>
          </div>

          {/* Lienzo Blueprint CAD */}
          <div className="relative bg-[#0B1E33] p-4">
            <svg
              viewBox="0 0 800 460"
              className="w-full h-auto select-none"
              role="img"
              aria-label={
                blueprintMode === 'elevation'
                  ? `Plano de Alzado y Corte Transversal del tanque ${activeTankId}`
                  : `Diagrama P&ID de Sistemas Auxiliares del tanque ${activeTankId}`
              }
            >
              {/* Cuadrícula técnica de plano */}
              <defs>
                <pattern
                  id="cadGrid"
                  width="25"
                  height="25"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 25 0 L 0 0 0 25"
                    fill="none"
                    stroke="#1E3A5F"
                    strokeWidth="0.6"
                  />
                </pattern>
              </defs>
              <rect width="800" height="460" fill="url(#cadGrid)" />
              <rect
                x="14"
                y="14"
                width="772"
                height="432"
                fill="none"
                stroke="#38BDF8"
                strokeOpacity="0.35"
                strokeWidth="1.2"
              />

              {/* Cajetín técnico de plano */}
              <g transform="translate(545, 396)">
                <rect
                  width="230"
                  height="42"
                  fill="#0F2942"
                  stroke="#38BDF8"
                  strokeOpacity="0.6"
                  strokeWidth="1"
                />
                <text
                  x="10"
                  y="16"
                  fill="#BAE6FD"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="700"
                >
                  {blueprintMode === 'elevation'
                    ? `PLANO A-A · ${activeTankId} (API 650/653)`
                    : `P&ID SISTEMAS AUX. · ${activeTankId}`}
                </text>
                <text
                  x="10"
                  y="32"
                  fill="#94A3B8"
                  fontSize="8.5"
                  fontFamily="JetBrains Mono, monospace"
                >
                  INVERSORA LA EXPERTA B.G. · ESC 1:150
                </text>
              </g>

              {blueprintMode === 'elevation' ? (
                <g>
                  {/* Fundación / Anillo de concreto */}
                  <rect
                    x="130"
                    y="388"
                    width="500"
                    height="18"
                    fill="#1E293B"
                    stroke="#94A3B8"
                    strokeWidth="1.5"
                  />
                  {/* Láminas de Piso y Anillo Anular */}
                  <line
                    x1="150"
                    y1="384"
                    x2="610"
                    y2="384"
                    stroke="#F59E0B"
                    strokeWidth="3.5"
                  />

                  {/* Envolvente / Virolas 1-6 */}
                  <rect
                    x="170"
                    y="120"
                    width="420"
                    height="264"
                    fill="#0F2942"
                    fillOpacity="0.65"
                    stroke="#E2E8F0"
                    strokeWidth="2.2"
                  />
                  {[164, 208, 252, 296, 340].map((yPos) => (
                    <line
                      key={yPos}
                      x1="170"
                      y1={yPos}
                      x2="590"
                      y2={yPos}
                      stroke="#64748B"
                      strokeDasharray="6 4"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Techo Flotante y Pontones */}
                  <rect
                    x="184"
                    y="154"
                    width="392"
                    height="18"
                    fill="#1E3A5F"
                    stroke="#38BDF8"
                    strokeWidth="1.8"
                  />
                  {/* Pontones extremos */}
                  <rect
                    x="184"
                    y="142"
                    width="44"
                    height="30"
                    fill="#0284C7"
                    fillOpacity="0.35"
                    stroke="#38BDF8"
                    strokeWidth="1.5"
                  />
                  <rect
                    x="532"
                    y="142"
                    width="44"
                    height="30"
                    fill="#0284C7"
                    fillOpacity="0.35"
                    stroke="#38BDF8"
                    strokeWidth="1.5"
                  />
                  {/* Patas de soporte techo */}
                  {[240, 320, 440, 515].map((lx) => (
                    <line
                      key={lx}
                      x1={lx}
                      y1="172"
                      x2={lx}
                      y2="382"
                      stroke="#94A3B8"
                      strokeDasharray="4 4"
                      strokeWidth="1.2"
                    />
                  ))}

                  {/* Drenaje Articulado (Swivel Joints) */}
                  <polyline
                    points="380,172 340,248 280,310 170,350"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="3"
                  />
                  <circle cx="340" cy="248" r="5" fill="#0284C7" stroke="#FFF" strokeWidth="1.2" />
                  <circle cx="280" cy="310" r="5" fill="#0284C7" stroke="#FFF" strokeWidth="1.2" />

                  {/* Cámara de Espuma y Anillo SCI (Rojo) */}
                  <polyline
                    points="620,384 620,125 590,125"
                    fill="none"
                    stroke="#F43F5E"
                    strokeWidth="3"
                  />
                  <rect
                    x="592"
                    y="112"
                    width="20"
                    height="24"
                    fill="#E11D48"
                    stroke="#FECDD3"
                    strokeWidth="1.2"
                  />
                  <line
                    x1="164"
                    y1="128"
                    x2="596"
                    y2="128"
                    stroke="#FB7185"
                    strokeDasharray="3 3"
                    strokeWidth="2"
                  />

                  {/* Escalera helicoidal exterior */}
                  <path
                    d="M 590 135 Q 615 180 572 225 T 588 315 T 565 384"
                    fill="none"
                    stroke="#FBBF24"
                    strokeWidth="2.2"
                  />

                  {/* Boquilla y Manhole inferior */}
                  <rect
                    x="146"
                    y="336"
                    width="24"
                    height="18"
                    fill="#334155"
                    stroke="#E2E8F0"
                    strokeWidth="1.5"
                  />
                  {/* Puesta a tierra */}
                  <polyline
                    points="170,382 145,382 145,414"
                    fill="none"
                    stroke="#818CF8"
                    strokeWidth="2.5"
                  />
                  <line x1="133" y1="414" x2="157" y2="414" stroke="#818CF8" strokeWidth="2" />
                  <line x1="138" y1="419" x2="152" y2="419" stroke="#818CF8" strokeWidth="2" />

                  {/* Instrumento Radar en Techo */}
                  <line x1="350" y1="154" x2="350" y2="112" stroke="#10B981" strokeWidth="2.2" />
                  <circle cx="350" cy="108" r="8" fill="#059669" stroke="#D1FAE5" strokeWidth="1.5" />

                  {/* Cotas dimensionales */}
                  <line x1="170" y1="68" x2="590" y2="68" stroke="#64748B" strokeWidth="1" />
                  <text
                    x="380"
                    y="61"
                    textAnchor="middle"
                    fill="#CBD5E1"
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    Ø 36.6 m (120 ft) · 6 Virolas
                  </text>
                  <line x1="92" y1="120" x2="92" y2="384" stroke="#64748B" strokeWidth="1" />
                  <text
                    x="82"
                    y="255"
                    textAnchor="middle"
                    transform="rotate(-90 82 255)"
                    fill="#CBD5E1"
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    H = 14.6 m (48 ft)
                  </text>
                </g>
              ) : (
                <g>
                  {/* P&ID Tanque Central Esquemático */}
                  <rect
                    x="315"
                    y="155"
                    width="190"
                    height="190"
                    rx="4"
                    fill="#0F2942"
                    stroke="#E2E8F0"
                    strokeWidth="2"
                  />
                  <text
                    x="410"
                    y="200"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="13"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="700"
                  >
                    {activeTankId}
                  </text>
                  <text
                    x="410"
                    y="218"
                    textAnchor="middle"
                    fill="#7DD3FC"
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    ESPACIO CONFINADO / ZONA 0
                  </text>

                  {/* Circuito Neumático superior: Compresor -> Extractor Venturi */}
                  <rect
                    x="185"
                    y="92"
                    width="120"
                    height="44"
                    rx="4"
                    fill="#0F766E"
                    fillOpacity="0.35"
                    stroke="#2DD4BF"
                    strokeWidth="1.5"
                  />
                  <text
                    x="245"
                    y="112"
                    textAnchor="middle"
                    fill="#99F6E4"
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    COMPRESOR 375-750 CFM
                  </text>
                  <line
                    x1="305"
                    y1="114"
                    x2="380"
                    y2="114"
                    stroke="#2DD4BF"
                    strokeWidth="2.5"
                  />
                  <polygon
                    points="385,102 425,102 415,134 395,134"
                    fill="#0D9488"
                    stroke="#99F6E4"
                    strokeWidth="1.5"
                  />
                  <line x1="405" y1="134" x2="405" y2="155" stroke="#2DD4BF" strokeWidth="2.5" />

                  {/* Circuito Hidráulico Izquierda: Succión -> Bomba Centrífuga */}
                  <line x1="120" y1="325" x2="315" y2="325" stroke="#38BDF8" strokeWidth="3" />
                  <circle cx="165" cy="325" r="22" fill="#0369A1" stroke="#BAE6FD" strokeWidth="2" />
                  <text
                    x="165"
                    y="362"
                    textAnchor="middle"
                    fill="#BAE6FD"
                    fontSize="8.5"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    BOMBA TRASIEGO
                  </text>

                  {/* Circuito Neumático Derecha: Bomba Doble Diafragma */}
                  <line x1="505" y1="325" x2="670" y2="325" stroke="#2DD4BF" strokeWidth="3" />
                  <rect
                    x="560"
                    y="303"
                    width="64"
                    height="44"
                    rx="6"
                    fill="#0F766E"
                    stroke="#99F6E4"
                    strokeWidth="1.8"
                  />
                  <text
                    x="592"
                    y="362"
                    textAnchor="middle"
                    fill="#99F6E4"
                    fontSize="8.5"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    BOMBA DIAFRAGMA
                  </text>

                  {/* Circuito Eléctrico Clase I Div 1 */}
                  <line
                    x1="505"
                    y1="205"
                    x2="650"
                    y2="205"
                    stroke="#818CF8"
                    strokeDasharray="5 3"
                    strokeWidth="2.2"
                  />
                  <rect
                    x="565"
                    y="184"
                    width="60"
                    height="40"
                    rx="3"
                    fill="#312E81"
                    stroke="#A5B4FC"
                    strokeWidth="1.5"
                  />
                  <text
                    x="595"
                    y="238"
                    textAnchor="middle"
                    fill="#C7D2FE"
                    fontSize="8.5"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    EX D / LOTO
                  </text>

                  {/* Lazos de Control e Instrumentación */}
                  <circle cx="415" cy="235" r="15" fill="#065F46" stroke="#6EE7B7" strokeWidth="1.5" />
                  <text
                    x="415"
                    y="238"
                    textAnchor="middle"
                    fill="#ECFDF5"
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="700"
                  >
                    PT
                  </text>

                  <rect
                    x="372"
                    y="350"
                    width="86"
                    height="28"
                    rx="4"
                    fill="#064E3B"
                    stroke="#34D399"
                    strokeWidth="1.5"
                  />
                  <text
                    x="415"
                    y="368"
                    textAnchor="middle"
                    fill="#A7F3D0"
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="700"
                  >
                    AT-2015 GAS
                  </text>
                </g>
              )}

              {/* Hotspots Interactivos */}
              {blueprintHotspots.map((part) => {
                const isSelected = part.id === selectedPart.id;
                return (
                  <g
                    key={part.id}
                    transform={`translate(${part.hotspotX}, ${part.hotspotY})`}
                    onClick={() => setSelectedPartId(part.id)}
                    className="cursor-pointer"
                  >
                    {isSelected && (
                      <circle
                        r="20"
                        fill={part.disciplineColor}
                        fillOpacity="0.28"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />
                    )}
                    <circle
                      r={isSelected ? 13 : 11}
                      fill={part.disciplineColor}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    <text
                      y="3.5"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="7.5"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="700"
                    >
                      {part.tag.split('-')[1]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Inspector de Componente Seleccionado + Fotografía Real */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white overflow-hidden lg:col-span-5">
          <div>
            <div className="relative aspect-[4/3] w-full bg-slate-900">
              <ResilientPhoto
                src={selectedPart.photoUrl}
                alt={selectedPart.name}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/15 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2 text-white">
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span
                      className="rounded px-2 py-0.5 font-bold text-white"
                      style={{ backgroundColor: selectedPart.disciplineColor }}
                    >
                      {selectedPart.tag}
                    </span>
                    <span className="text-sky-300">{selectedPart.discipline}</span>
                  </div>
                  <h3 className="mt-1 text-base font-bold leading-snug">
                    {selectedPart.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setZoomPhoto({
                      url: selectedPart.photoUrl,
                      title: `${selectedPart.tag} · ${selectedPart.name}`,
                      caption: selectedPart.photoCaption,
                    })
                  }
                  className="shrink-0 rounded-lg bg-white/15 p-2 text-white hover:bg-white/25"
                  title="Ampliar fotografía"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4 p-5 text-xs">
              <p className="text-sm leading-relaxed text-slate-700">
                {selectedPart.summary}
              </p>

              <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <span className="font-semibold text-slate-500">
                    Especificaciones Técnicas:
                  </span>
                  <p className="mt-0.5 font-medium text-slate-900">
                    {selectedPart.specs}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">
                    Materiales e Insumos:
                  </span>
                  <p className="mt-0.5 text-slate-800">{selectedPart.materials}</p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-2 font-mono">
                  <span className="text-slate-600">{selectedPart.standard}</span>
                  <span className="font-bold text-[#0F2942]">
                    EDT {selectedPart.linkedEdt}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <Camera className="h-3.5 w-3.5" />
              <span>{selectedPart.photoCaption}</span>
            </span>
            <button
              type="button"
              onClick={() =>
                onRegisterForComponent(selectedPart.linkedEdt, activeTankId)
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F2942] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-900 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Registrar OT</span>
            </button>
          </div>
        </div>
      </section>

      {/* Catálogo Fotográfico Completo por Disciplina */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Catálogo Completo de Partes y Sistemas ({visibleParts.length})
            </h2>
            <p className="text-xs text-slate-500">
              Selecciona cualquier tarjeta para ubicar el componente en su plano correspondiente o iniciar una orden de mantenimiento.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleParts.map((part) => {
            const isActive = part.id === selectedPart.id;
            return (
              <div
                key={part.id}
                className={`flex flex-col justify-between overflow-hidden rounded-xl border bg-white transition-all ${
                  isActive
                    ? 'border-[#0F2942] ring-2 ring-[#0F2942]/15'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="relative aspect-[4/3] w-full bg-slate-100">
                    <ResilientPhoto
                      src={part.photoUrl}
                      alt={part.name}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setZoomPhoto({
                          url: part.photoUrl,
                          title: `${part.tag} · ${part.name}`,
                          caption: part.photoCaption,
                        })
                      }
                      className="absolute right-2.5 top-2.5 rounded-lg bg-slate-950/60 p-1.5 text-white backdrop-blur-sm hover:bg-slate-950/80"
                      title="Ver foto ampliada"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span
                        className="font-mono font-bold"
                        style={{ color: part.disciplineColor }}
                      >
                        {part.tag} · {part.discipline}
                      </span>
                      <span className="font-mono text-slate-500">
                        EDT {part.linkedEdt}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {part.name}
                    </h3>
                    <p className="text-xs leading-relaxed text-slate-600 line-clamp-2">
                      {part.summary}
                    </p>
                    <p className="font-mono text-[11px] text-slate-500">
                      {part.standard}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleSelectPart(part)}
                    className="text-xs font-semibold text-sky-700 hover:underline whitespace-nowrap"
                  >
                    Ver en Plano
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onRegisterForComponent(part.linkedEdt, activeTankId)
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-800 hover:border-sky-600 hover:text-sky-800 whitespace-nowrap"
                  >
                    <Wrench className="h-3 w-3" />
                    <span>Registrar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Modal Fotografía Ampliada */}
      {zoomPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
              <div>
                <h3 className="text-sm font-bold">{zoomPhoto.title}</h3>
                <p className="text-xs text-slate-400">{zoomPhoto.caption}</p>
              </div>
              <button
                type="button"
                onClick={() => setZoomPhoto(null)}
                className="rounded-lg bg-white/10 p-2 text-slate-200 hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ResilientPhoto
              src={zoomPhoto.url}
              alt={zoomPhoto.title}
              className="max-h-[75vh] w-full object-contain bg-black"
            />
          </div>
        </div>
      )}
    </div>
  );
};
