import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Layers,
  Plus,
  Printer,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  evaluateAtmosphericSafety,
  PHASES,
  PROJECT_METADATA,
  SPECIALTIES,
} from '../data/api653MasterData';
import { exportCompleteMaintenanceExcel } from '../services/excelExport';
import {
  MaintenanceRecord,
  PhaseId,
  TankId,
} from '../types/maintenance';
import { CompanyLogo } from './CompanyLogo';
import { PrintablePdfReportModal } from './PrintablePdfReportModal';

interface DashboardSummaryProps {
  records: MaintenanceRecord[];
  selectedTank: TankId | 'Todos';
  onOpenNewForm: (presetEdt?: string) => void;
  onSelectPhaseFilter: (phaseId: PhaseId) => void;
  onSelectRecordEdit: (record: MaintenanceRecord) => void;
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  records,
  selectedTank,
  onOpenNewForm,
  onSelectPhaseFilter,
  onSelectRecordEdit,
}) => {
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showPrintableReport, setShowPrintableReport] = useState(false);

  const filteredRecords =
    selectedTank === 'Todos'
      ? records
      : records.filter((r) => r.tanque === selectedTank);

  const totalHH = filteredRecords.reduce((sum, r) => sum + r.horasHombre, 0);
  const targetBaselineHH =
    selectedTank === 'Todos'
      ? PROJECT_METADATA.hhDirectasTanque * 3
      : PROJECT_METADATA.hhDirectasTanque;

  const preventiveRecords = filteredRecords.filter((r) => r.tipo === 'Preventivo');
  const correctiveRecords = filteredRecords.filter((r) => r.tipo === 'Correctivo');
  const preventiveHH = preventiveRecords.reduce((s, r) => s + r.horasHombre, 0);
  const correctiveHH = correctiveRecords.reduce((s, r) => s + r.horasHombre, 0);

  // Donut calculation
  const donutTotal = Math.max(1, totalHH);
  const phaseStats = PHASES.map((phase) => {
    const recs = filteredRecords.filter((r) => r.phaseId === phase.id);
    const hhLogged = recs.reduce((s, r) => s + r.horasHombre, 0);
    const tankMultiplier = selectedTank === 'Todos' ? 3 : 1;
    const hhPlanned = phase.estimatedHH * tankMultiplier;
    const pct = Math.min(100, Math.round((hhLogged / hhPlanned) * 100));
    return {
      phase,
      count: recs.length,
      hhLogged,
      hhPlanned,
      pct,
    };
  });

  // Build SVG donut arcs
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;
  const donutSegments = phaseStats.map((st) => {
    const share = totalHH > 0 ? st.hhLogged / donutTotal : 0;
    const length = share * circumference;
    const segment = {
      ...st,
      strokeDasharray: `${length} ${circumference - length}`,
      strokeDashoffset: -cumulativeOffset,
    };
    cumulativeOffset += length;
    return segment;
  });

  // Tank comparison stats
  const tankStats = PROJECT_METADATA.tanques.map((tank) => {
    const tRecs = records.filter((r) => r.tanque === tank);
    const prevHH = tRecs
      .filter((r) => r.tipo === 'Preventivo')
      .reduce((s, r) => s + r.horasHombre, 0);
    const corrHH = tRecs
      .filter((r) => r.tipo === 'Correctivo')
      .reduce((s, r) => s + r.horasHombre, 0);
    const total = prevHH + corrHH;
    return {
      tank,
      prevHH,
      corrHH,
      total,
      count: tRecs.length,
      pct: Math.min(
        100,
        Math.round((total / PROJECT_METADATA.hhDirectasTanque) * 100)
      ),
    };
  });

  const maxTankBar = Math.max(
    400,
    ...tankStats.map((t) => t.total)
  );

  return (
    <div className="space-y-8">
      {/* Banner Técnico Maestro */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="bg-[#0F2942] px-6 py-6 text-white lg:col-span-8 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <CompanyLogo variant="light" size="md" />
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-sky-300">
                <span>Residente: {PROJECT_METADATA.ingenieroResidente}</span>
                <span aria-hidden="true">·</span>
                <span>{PROJECT_METADATA.normativaRectora}</span>
              </div>
            </div>
            <h1 className="mt-4 max-w-2xl text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Control Integral de Mantenimiento Preventivo y Correctivo
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
              Seguimiento técnico en tiempo real para los tanques atmosféricos{' '}
              <span className="font-mono font-semibold text-white">
                T-2303, T-2208 y T-2209
              </span>
              . Vincula cada orden de trabajo con la Estructura de Desglose de Trabajo
              (EDT), control atmosférico SIAHO y sincronización directa con Google Sheets.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onOpenNewForm()}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-400 whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span>Registrar Mantenimiento</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPrintableReport(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-500 whitespace-nowrap"
              >
                <Printer className="h-4 w-4" />
                <span>Reporte PDF Técnico</span>
              </button>
              <button
                type="button"
                onClick={() => exportCompleteMaintenanceExcel(records, selectedTank)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 whitespace-nowrap"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Exportar Excel (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPdfModal(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 whitespace-nowrap"
              >
                <FileText className="h-4 w-4" />
                <span>Ver Plan Maestro PDF</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-between bg-slate-50 px-6 py-6 lg:col-span-4 border-t border-slate-200 lg:border-t-0 lg:border-l">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Alcance Base del Plan Maestro
              </p>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Ruta Crítica</p>
                  <p className="mt-0.5 font-mono text-xl font-bold tabular-nums text-slate-900">
                    {PROJECT_METADATA.duracionNetaDias} días
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Proyección 3 Tanques</p>
                  <p className="mt-0.5 font-mono text-xl font-bold tabular-nums text-slate-900">
                    {PROJECT_METADATA.hhProyeccionTresTanques.toLocaleString()} HH
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">HH Directas / Tanque</p>
                  <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-sky-700">
                    {PROJECT_METADATA.hhDirectasTanque.toLocaleString()} HH
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">HH Perm. Obra</p>
                  <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-amber-700">
                    {PROJECT_METADATA.hhPermObraTanque} HH
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-600">
              Estrategia Fast-Tracking cada 14 días · {totalHH.toLocaleString()} /{' '}
              {targetBaselineHH.toLocaleString()} HH directas registradas
            </div>
          </div>
        </div>
      </section>

      {/* Progreso por Fases EDT (6 Fases Color-Coded) */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Avance por Fases del Plan Maestro (EDT 1.0 – 6.0)
            </h2>
            <p className="text-xs text-slate-500">
              Haz clic en cualquier fase para filtrar sus órdenes de trabajo en el registro técnico.
            </p>
          </div>
          <span className="font-mono text-xs font-medium text-slate-600 tabular-nums">
            6 Fases · 24 Actividades Técnicas
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {phaseStats.map(({ phase, count, hhLogged, hhPlanned, pct }) => (
            <button
              key={phase.id}
              type="button"
              onClick={() => onSelectPhaseFilter(phase.id)}
              className="group rounded-xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="font-mono text-xs font-bold"
                  style={{ color: phase.colorHex }}
                >
                  {phase.code} · EDT {phase.id}
                </span>
                <span className="font-mono text-xs text-slate-500 tabular-nums">
                  {phase.days} días · {count} reg.
                </span>
              </div>
              <h3 className="mt-1.5 text-sm font-bold text-slate-900 group-hover:text-sky-800">
                {phase.title}
              </h3>
              <p className="mt-1 text-xs text-slate-500">{phase.standard}</p>

              <div className="mt-4">
                <div className="mb-1.5 flex items-baseline justify-between text-xs">
                  <span className="font-mono font-bold tabular-nums text-slate-800">
                    {hhLogged.toLocaleString()} HH
                  </span>
                  <span className="font-mono tabular-nums text-slate-500">
                    de {hhPlanned.toLocaleString()} HH ({pct}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(pct, hhLogged > 0 ? 4 : 0)}%`,
                      backgroundColor: phase.colorHex,
                    }}
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Gráficos Analíticos Interactivos */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Gráfico 1: Preventivo vs Correctivo por Tanque */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Mantenimiento Preventivo vs. Correctivo por Tanque
              </h3>
              <p className="text-xs text-slate-500">
                Horas-Hombre acumuladas comparadas por naturaleza de intervención
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-700">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-sky-600" />
                Preventivo ({preventiveHH} HH)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
                Correctivo ({correctiveHH} HH)
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {tankStats.map((t) => {
              const prevWidth = (t.prevHH / maxTankBar) * 100;
              const corrWidth = (t.corrHH / maxTankBar) * 100;
              return (
                <div key={t.tank} className="space-y-1.5">
                  <div className="flex items-baseline justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {t.tank}
                      </span>
                      <span className="text-slate-500">
                        {t.count} {t.count === 1 ? 'orden' : 'órdenes'}
                      </span>
                    </div>
                    <div className="font-mono tabular-nums text-slate-700">
                      <span className="font-bold text-slate-900">{t.total} HH</span>
                      <span className="text-slate-400">
                        {' '}
                        / {PROJECT_METADATA.hhDirectasTanque.toLocaleString()} HH ({t.pct}%)
                      </span>
                    </div>
                  </div>
                  <div className="flex h-6 w-full overflow-hidden rounded-lg bg-slate-100">
                    {t.prevHH > 0 && (
                      <div
                        className="flex items-center justify-center bg-sky-600 font-mono text-[11px] font-semibold text-white transition-all"
                        style={{ width: `${Math.max(prevWidth, 6)}%` }}
                        title={`Preventivo: ${t.prevHH} HH`}
                      >
                        {t.prevHH}h
                      </div>
                    )}
                    {t.corrHH > 0 && (
                      <div
                        className="flex items-center justify-center bg-amber-500 font-mono text-[11px] font-semibold text-white transition-all"
                        style={{ width: `${Math.max(corrWidth, 6)}%` }}
                        title={`Correctivo: ${t.corrHH} HH`}
                      >
                        {t.corrHH}h
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumen comparativo */}
          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
            <div>
              <p className="text-xs text-slate-500">Órdenes Preventivas</p>
              <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-sky-700">
                {preventiveRecords.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Órdenes Correctivas</p>
              <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-amber-600">
                {correctiveRecords.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Ratio Correctivo</p>
              <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-slate-900">
                {filteredRecords.length > 0
                  ? `${Math.round(
                      (correctiveRecords.length / filteredRecords.length) * 100
                    )}%`
                  : '0%'}
              </p>
            </div>
          </div>
        </div>

        {/* Gráfico 2: Donut de Distribución de HH por Fase */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
          <h3 className="text-base font-bold text-slate-900">
            Distribución de Horas-Hombre por Fase
          </h3>
          <p className="text-xs text-slate-500">
            Proporción de HH ejecutadas o programadas según EDT
          </p>

          <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative flex shrink-0 items-center justify-center">
              <svg width="144" height="144" viewBox="0 0 144 144" className="-rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth="18"
                />
                {totalHH > 0 &&
                  donutSegments.map((seg) =>
                    seg.hhLogged > 0 ? (
                      <circle
                        key={seg.phase.id}
                        cx="72"
                        cy="72"
                        r={radius}
                        fill="transparent"
                        stroke={seg.phase.colorHex}
                        strokeWidth="18"
                        strokeDasharray={seg.strokeDasharray}
                        strokeDashoffset={seg.strokeDashoffset}
                      />
                    ) : null
                  )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-mono text-xl font-bold tabular-nums text-slate-900">
                  {totalHH}
                </span>
                <span className="text-[11px] font-medium text-slate-500">HH Reg.</span>
              </div>
            </div>

            <div className="w-full space-y-2">
              {phaseStats.map(({ phase, hhLogged }) => (
                <div
                  key={phase.id}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: phase.colorHex }}
                    />
                    <span className="truncate font-medium text-slate-700">
                      {phase.code} · {phase.shortTitle}
                    </span>
                  </div>
                  <span className="ml-2 font-mono font-bold tabular-nums text-slate-900">
                    {hhLogged}h
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Actividad Reciente + Especialidades */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Últimos Registros */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Bitácora Reciente de Mantenimiento
              </h3>
              <p className="text-xs text-slate-500">
                Haz clic en cualquier orden para editar o inspeccionar sus parámetros QA/QC y SIAHO
              </p>
            </div>
            <Layers className="h-4 w-4 text-slate-400" />
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {filteredRecords.slice(0, 5).map((rec) => {
              const phase = PHASES.find((p) => p.id === rec.phaseId) || PHASES[0];
              const atm = evaluateAtmosphericSafety(rec.siaho.readings);
              return (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => onSelectRecordEdit(rec)}
                  className="flex w-full items-start justify-between gap-4 py-3.5 text-left transition-colors hover:bg-slate-50 px-2 rounded-lg"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-slate-900">
                        {rec.codigoOrden}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className="font-mono font-semibold"
                        style={{ color: phase.colorHex }}
                      >
                        {rec.tanque} / EDT {rec.edt}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`font-semibold ${
                          rec.tipo === 'Correctivo'
                            ? 'text-amber-700'
                            : 'text-sky-700'
                        }`}
                      >
                        {rec.tipo}
                      </span>
                    </div>
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {rec.actividadNombre}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {rec.componenteAfectado || rec.descripcionTecnica}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-mono text-sm font-bold tabular-nums text-slate-900">
                      {rec.horasHombre} HH
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{rec.estado}</p>
                    <p
                      className={`mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium ${
                        atm.allSafe ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      <ShieldCheck className="h-3 w-3" />
                      {atm.allSafe ? 'Atmósfera OK' : 'Alerta Gases'}
                    </p>
                  </div>
                </button>
              );
            })}
            {filteredRecords.length === 0 && (
              <div className="py-10 text-center text-sm text-slate-500">
                No hay registros para el tanque seleccionado. Crea el primer registro técnico.
              </div>
            )}
          </div>
        </div>

        {/* Carga por Especialidad */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
          <h3 className="text-base font-bold text-slate-900">
            Consolidado por Especialidad (Plan 3,536 HH)
          </h3>
          <p className="text-xs text-slate-500">
            Distribución base de horas-hombre por cargo técnico (Sección 2 del Plan)
          </p>
          <div className="mt-4 space-y-3">
            {SPECIALTIES.slice(0, 7).map((sp) => {
              const logged = filteredRecords
                .filter((r) => r.especialidad === sp.role)
                .reduce((acc, r) => acc + r.horasHombre, 0);
              const pct = Math.min(100, Math.round((logged / sp.totalHH) * 100));
              return (
                <div key={sp.id} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="truncate font-medium text-slate-700">
                      {sp.role}
                    </span>
                    <span className="shrink-0 font-mono tabular-nums text-slate-600">
                      <strong className="text-slate-900">{logged}</strong> / {sp.totalHH} HH
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#0F2942]"
                      style={{ width: `${Math.max(pct, logged > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Modal Vista Previa Imprimible PDF Técnico */}
      <PrintablePdfReportModal
        open={showPrintableReport}
        records={records}
        selectedTank={selectedTank}
        onClose={() => setShowPrintableReport(false)}
      />

      {/* Modal Visor del PDF Maestro Adjunto */}
      {showPdfModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label="Documento Maestro PDF API 653"
        >
          <div className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-[#0F2942] px-6 py-4 text-white">
              <div>
                <h3 className="text-base font-bold">
                  Documento Maestro: EDT, Cronograma, HH y Especificaciones API 653
                </h3>
                <p className="text-xs text-sky-300">
                  {PROJECT_METADATA.empresaEjecutora} · {PROJECT_METADATA.ingenieroResidente}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Cerrar visor PDF"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <iframe
              src={PROJECT_METADATA.pdfPath}
              title="Documento Maestro API 653"
              className="h-full w-full flex-1 bg-slate-100"
            />
          </div>
        </div>
      )}
    </div>
  );
};
