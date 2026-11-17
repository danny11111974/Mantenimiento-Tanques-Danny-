import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  Printer,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  EPP_BASICO,
  evaluateAtmosphericSafety,
  PHASES,
  PROJECT_METADATA,
} from '../data/api653MasterData';
import {
  generateTechnicalPdfReport,
  PdfExportOptions,
} from '../services/pdfReportExport';
import {
  MaintenanceRecord,
  TankId,
  WorkPermitType,
} from '../types/maintenance';
import { CompanyLogo } from './CompanyLogo';

interface PrintablePdfReportModalProps {
  open: boolean;
  records: MaintenanceRecord[];
  selectedTank: TankId | 'Todos';
  onClose: () => void;
}

export const PrintablePdfReportModal: React.FC<PrintablePdfReportModalProps> = ({
  open,
  records,
  selectedTank,
  onClose,
}) => {
  const [options, setOptions] = useState<PdfExportOptions>({
    includeSummary: true,
    includeSiahoVisual: true,
    includeOrdersTable: true,
    includeSignatures: true,
  });

  if (!open) return null;

  const scoped =
    selectedTank === 'Todos'
      ? records
      : records.filter((r) => r.tanque === selectedTank);

  const totalCount = Math.max(1, scoped.length);
  const prevCount = scoped.filter((r) => r.tipo === 'Preventivo').length;
  const corrCount = scoped.filter((r) => r.tipo === 'Correctivo').length;
  const totalHH = scoped.reduce((s, r) => s + r.horasHombre, 0);
  const baselineHH =
    selectedTank === 'Todos'
      ? PROJECT_METADATA.hhDirectasTanque * 3
      : PROJECT_METADATA.hhDirectasTanque;
  const pctHH = Math.min(100, Math.round((totalHH / baselineHH) * 100));

  // SIAHO visual metrics
  const atmSafeCount = scoped.filter(
    (r) => evaluateAtmosphericSafety(r.siaho.readings).allSafe
  ).length;
  const artCount = scoped.filter((r) => r.siaho.artVerificado).length;
  const vigiaCount = scoped.filter((r) => r.siaho.vigiaExterior).length;
  const eppCount = scoped.filter(
    (r) => r.siaho.eppBasicoCompleto && r.siaho.eppEspecializadoCompleto
  ).length;

  const atmPct = Math.round((atmSafeCount / totalCount) * 100);
  const artPct = Math.round((artCount / totalCount) * 100);
  const vigiaPct = Math.round((vigiaCount / totalCount) * 100);
  const eppPct = Math.round((eppCount / totalCount) * 100);

  const avgO2 =
    scoped.length > 0
      ? Number((scoped.reduce((s, r) => s + r.siaho.readings.o2, 0) / scoped.length).toFixed(1))
      : 20.9;
  const maxLel =
    scoped.length > 0 ? Math.max(...scoped.map((r) => r.siaho.readings.lel)) : 0;
  const maxH2s =
    scoped.length > 0 ? Math.max(...scoped.map((r) => r.siaho.readings.h2s)) : 0;
  const maxCo =
    scoped.length > 0 ? Math.max(...scoped.map((r) => r.siaho.readings.co)) : 0;

  const permitDistribution: {
    type: WorkPermitType;
    color: string;
    count: number;
  }[] = [
    {
      type: 'Espacio Confinado',
      color: '#0284C7',
      count: scoped.filter((r) => r.siaho.permisoTipo === 'Espacio Confinado').length,
    },
    {
      type: 'Trabajo en Caliente',
      color: '#D97706',
      count: scoped.filter((r) => r.siaho.permisoTipo === 'Trabajo en Caliente').length,
    },
    {
      type: 'Trabajo en Frío',
      color: '#0D9488',
      count: scoped.filter((r) => r.siaho.permisoTipo === 'Trabajo en Frío').length,
    },
    {
      type: 'Trabajo en Altura',
      color: '#E11D48',
      count: scoped.filter((r) => r.siaho.permisoTipo === 'Trabajo en Altura').length,
    },
  ];

  const handlePrint = () => {
    document.body.classList.add('printing-report');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-report');
    }, 500);
  };

  const handleDownloadPdf = () => {
    generateTechnicalPdfReport(records, selectedTank, options);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/70 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Vista previa imprimible de reporte PDF técnico"
    >
      {/* Barra de controles superior (oculta al imprimir) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-[#0F2942] px-6 py-3.5 text-white">
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="text-sm font-bold sm:text-base">
            Vista Previa del Reporte Técnico Imprimible (PDF)
          </h2>
          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-200">
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={options.includeSummary}
                onChange={(e) =>
                  setOptions((o) => ({ ...o, includeSummary: e.target.checked }))
                }
                className="rounded border-slate-400"
              />
              <span>Resumen KPI</span>
            </label>
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={options.includeSiahoVisual}
                onChange={(e) =>
                  setOptions((o) => ({ ...o, includeSiahoVisual: e.target.checked }))
                }
                className="rounded border-slate-400"
              />
              <span>Resumen Visual SIAHO</span>
            </label>
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={options.includeOrdersTable}
                onChange={(e) =>
                  setOptions((o) => ({ ...o, includeOrdersTable: e.target.checked }))
                }
                className="rounded border-slate-400"
              />
              <span>Órdenes Técnicas</span>
            </label>
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={options.includeSignatures}
                onChange={(e) =>
                  setOptions((o) => ({ ...o, includeSignatures: e.target.checked }))
                }
                className="rounded border-slate-400"
              />
              <span>Firmas</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20 whitespace-nowrap"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir Reporte</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-rose-500 whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            <span>Descargar PDF (.pdf)</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white/10 p-2 text-slate-200 hover:bg-white/20 hover:text-white"
            aria-label="Cerrar vista previa"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Área de Documento Imprimible */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div
          id="printable-technical-report"
          className="mx-auto max-w-[960px] rounded-xl border border-slate-300 bg-white shadow-2xl overflow-hidden"
        >
          {/* Membrete Corporativo con Logo */}
          <div className="border-b-4 border-sky-600 bg-[#0F2942] px-8 py-6 text-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <CompanyLogo variant="light" size="lg" />
              <div className="text-right font-mono text-xs text-slate-200">
                <p className="font-bold text-white">REPORTE TÉCNICO OFICIAL</p>
                <p>Fecha: {new Date().toISOString().slice(0, 10)}</p>
                <p>
                  Alcance:{' '}
                  {selectedTank === 'Todos'
                    ? 'T-2303, T-2208 y T-2209'
                    : `Tanque ${selectedTank}`}
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-white/15 pt-4 flex flex-wrap items-baseline justify-between gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white">
                Dossier Técnico de Mantenimiento Preventivo y Correctivo
              </h1>
              <span className="text-xs text-sky-300">
                Residente: {PROJECT_METADATA.ingenieroResidente}
              </span>
            </div>
          </div>

          <div className="space-y-8 p-8 text-slate-900">
            {/* 1. Resumen Ejecutivo */}
            {options.includeSummary && (
              <section className="print-break-inside-avoid space-y-4">
                <h2 className="border-b border-slate-200 pb-2 text-sm font-bold tracking-wide text-[#0F2942]">
                  1. RESUMEN EJECUTIVO DE MANTENIMIENTO Y HORAS-HOMBRE
                </h2>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                    <p className="text-[11px] font-semibold text-slate-500">
                      Órdenes Totales
                    </p>
                    <p className="mt-1 font-mono text-xl font-bold tabular-nums text-[#0F2942]">
                      {scoped.length}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      {prevCount} Preventivas · {corrCount} Correctivas
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                    <p className="text-[11px] font-semibold text-slate-500">
                      Horas-Hombre (HH)
                    </p>
                    <p className="mt-1 font-mono text-xl font-bold tabular-nums text-sky-700">
                      {totalHH.toLocaleString()} HH
                    </p>
                    <p className="font-mono text-[11px] text-slate-600">
                      {pctHH}% de {baselineHH.toLocaleString()} HH plan
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                    <p className="text-[11px] font-semibold text-slate-500">
                      Órdenes Completadas
                    </p>
                    <p className="mt-1 font-mono text-xl font-bold tabular-nums text-emerald-700">
                      {scoped.filter((r) => r.estado === 'Completado').length}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Normativa API 653 / ASME
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                    <p className="text-[11px] font-semibold text-slate-500">
                      Seguridad SIAHO
                    </p>
                    <p className="mt-1 font-mono text-xl font-bold tabular-nums text-emerald-700">
                      {atmPct}%
                    </p>
                    <p className="text-[11px] text-slate-600">
                      {atmSafeCount}/{scoped.length} atmósferas aptas
                    </p>
                  </div>
                </div>

                {/* Avance por Fase */}
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {PHASES.map((ph) => {
                    const hhReg = scoped
                      .filter((r) => r.phaseId === ph.id)
                      .reduce((s, r) => s + r.horasHombre, 0);
                    const hhPlan =
                      ph.estimatedHH * (selectedTank === 'Todos' ? 3 : 1);
                    const pct = Math.min(100, Math.round((hhReg / hhPlan) * 100));
                    return (
                      <div
                        key={ph.id}
                        className="rounded-lg border border-slate-200 p-2.5 text-xs"
                      >
                        <div className="flex justify-between font-mono font-bold">
                          <span style={{ color: ph.colorHex }}>{ph.code}</span>
                          <span>{pct}%</span>
                        </div>
                        <p className="truncate font-medium text-slate-800">
                          {ph.shortTitle}
                        </p>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(pct, hhReg > 0 ? 5 : 0)}%`,
                              backgroundColor: ph.colorHex,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 2. Sección Visual de Resumen de Seguridad SIAHO */}
            {options.includeSiahoVisual && (
              <section className="print-break-inside-avoid space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h2 className="text-sm font-bold tracking-wide text-[#0F2942]">
                    2. RESUMEN VISUAL DE SEGURIDAD INDUSTRIAL (SIAHO) Y CONTROL ATMOSFÉRICO
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                      atmPct === 100 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {atmPct === 100 ? (
                      <ShieldCheck className="h-4 w-4" />
                    ) : (
                      <ShieldAlert className="h-4 w-4" />
                    )}
                    {atmPct === 100
                      ? '100% EN RANGO SEGURO API 2015'
                      : 'REQUIERE VERIFICACIÓN DE GASES'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-5 md:grid-cols-3">
                  {/* Panel A: Barras de Cumplimiento Protocolo Crítico */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-900">
                      Cumplimiento Protocolo Crítico
                    </h3>
                    {[
                      { label: 'Atmósfera Segura (API 2015)', pct: atmPct, color: '#059669' },
                      { label: 'ART Validado en Sitio', pct: artPct, color: '#0284C7' },
                      { label: 'Vigía Exterior Asignado', pct: vigiaPct, color: '#4F46E5' },
                      { label: 'EPP Básico y Especializado', pct: eppPct, color: '#D97706' },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-medium text-slate-700">{item.label}</span>
                          <span className="font-mono font-bold tabular-nums text-slate-900">
                            {item.pct}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Panel B: Indicadores Multigas Promedio/Pico */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-900">
                      Lecturas Multigas vs. Límites API 2015
                    </h3>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        {
                          gas: 'O₂ Promedio',
                          val: `${avgO2}%`,
                          limit: '19.5 – 23.5%',
                          ok: avgO2 >= 19.5 && avgO2 <= 23.5,
                        },
                        {
                          gas: 'LEL Máximo',
                          val: `${maxLel}%`,
                          limit: 'Meta: 0%',
                          ok: maxLel === 0,
                        },
                        {
                          gas: 'H₂S Máximo',
                          val: `${maxH2s} ppm`,
                          limit: '< 10 ppm',
                          ok: maxH2s < 10,
                        },
                        {
                          gas: 'CO Máximo',
                          val: `${maxCo} ppm`,
                          limit: '< 25 ppm',
                          ok: maxCo < 25,
                        },
                      ].map((g) => (
                        <div
                          key={g.gas}
                          className={`rounded-lg border bg-white p-2.5 ${
                            g.ok ? 'border-emerald-200' : 'border-rose-300'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                            <span>{g.gas}</span>
                            {g.ok ? (
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <ShieldAlert className="h-3 w-3 text-rose-600" />
                            )}
                          </div>
                          <p
                            className={`mt-1 font-mono text-base font-bold tabular-nums ${
                              g.ok ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {g.val}
                          </p>
                          <p className="font-mono text-[10px] text-slate-500">
                            Límite: {g.limit}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Panel C: Permisos por Categoría de Riesgo + EPP */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-900">
                      Permisos Emitidos por Riesgo
                    </h3>
                    <div className="space-y-2.5">
                      {permitDistribution.map((pd) => {
                        const share = Math.round((pd.count / totalCount) * 100);
                        return (
                          <div key={pd.type} className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="font-medium text-slate-700">
                                {pd.type}
                              </span>
                              <span className="font-mono font-bold tabular-nums text-slate-900">
                                {pd.count} ({share}%)
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.max(share, pd.count > 0 ? 6 : 0)}%`,
                                  backgroundColor: pd.color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <p className="pt-1 text-[10px] leading-snug text-slate-500">
                      EPP Básico Obligatorio ({EPP_BASICO.length} zonas) y EPP
                      Especializado verificados antes de cada jornada.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* 3. Tabla de Órdenes de Mantenimiento */}
            {options.includeOrdersTable && (
              <section className="space-y-3">
                <h2 className="border-b border-slate-200 pb-2 text-sm font-bold tracking-wide text-[#0F2942]">
                  3. DETALLE TÉCNICO DE ÓRDENES DE MANTENIMIENTO ({scoped.length})
                </h2>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full border-collapse text-left text-[11px]">
                    <thead>
                      <tr className="bg-[#0F2942] text-white font-semibold">
                        <th className="px-3 py-2.5">OT / Fecha</th>
                        <th className="px-3 py-2.5">Tanque · EDT</th>
                        <th className="px-3 py-2.5">Tipo / Estado</th>
                        <th className="px-3 py-2.5">Actividad, Componente y Hallazgo</th>
                        <th className="px-3 py-2.5">QA/QC · NDT</th>
                        <th className="px-3 py-2.5">SIAHO</th>
                        <th className="px-3 py-2.5 text-right">HH</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {scoped.map((r) => {
                        const atm = evaluateAtmosphericSafety(r.siaho.readings);
                        return (
                          <tr key={r.id} className="even:bg-slate-50/70">
                            <td className="px-3 py-2.5 align-top font-mono whitespace-nowrap">
                              <div className="font-bold text-slate-900">
                                {r.codigoOrden}
                              </div>
                              <div className="text-[10px] text-slate-500">{r.fecha}</div>
                            </td>
                            <td className="px-3 py-2.5 align-top font-mono whitespace-nowrap">
                              <div className="font-bold text-slate-900">{r.tanque}</div>
                              <div className="text-[10px] text-sky-700">
                                EDT {r.edt}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 align-top whitespace-nowrap">
                              <div
                                className={`font-bold ${
                                  r.tipo === 'Correctivo'
                                    ? 'text-amber-700'
                                    : 'text-sky-700'
                                }`}
                              >
                                {r.tipo}
                              </div>
                              <div className="text-[10px] text-slate-600">{r.estado}</div>
                            </td>
                            <td className="px-3 py-2.5 align-top">
                              <p className="font-semibold text-slate-900">
                                {r.actividadNombre}
                              </p>
                              <p className="text-[10px] text-slate-600">
                                <strong>Comp.:</strong> {r.componenteAfectado}
                              </p>
                              {r.hallazgoCorrectivo && (
                                <p className="text-[10px] text-amber-800">
                                  <strong>Hallazgo:</strong> {r.hallazgoCorrectivo}
                                </p>
                              )}
                            </td>
                            <td className="px-3 py-2.5 align-top font-mono text-[10px] text-slate-700">
                              <div>{r.qaqc.metodoNdt}</div>
                              {r.qaqc.dftSecoMils && <div>DFT: {r.qaqc.dftSecoMils}</div>}
                              {r.qaqc.espesorMinimoMils && (
                                <div>Esp.: {r.qaqc.espesorMinimoMils}</div>
                              )}
                            </td>
                            <td className="px-3 py-2.5 align-top font-mono text-[10px] whitespace-nowrap">
                              <div>{r.siaho.permisoNumero}</div>
                              <div
                                className={`font-bold ${
                                  atm.allSafe ? 'text-emerald-700' : 'text-rose-700'
                                }`}
                              >
                                {atm.allSafe ? 'Apto API 2015' : 'Alerta Gases'}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 align-top text-right font-mono font-bold tabular-nums text-slate-900">
                              {r.horasHombre}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* 4. Bloque de Firmas */}
            {options.includeSignatures && (
              <section className="print-break-inside-avoid pt-8">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
                  {[
                    {
                      name: PROJECT_METADATA.ingenieroResidente,
                      role: 'Ingeniero Residente de Obra',
                    },
                    {
                      name: 'Supervisor SIAHO',
                      role: 'Control Atmosférico y Permisología',
                    },
                    {
                      name: 'Inspector QA/QC',
                      role: 'Certificación API 653 / NDT Nivel II-III',
                    },
                  ].map((s) => (
                    <div key={s.name} className="text-center">
                      <div className="mx-auto mb-2 h-10 w-4/5 border-b border-slate-400" />
                      <p className="text-xs font-bold text-[#0F2942]">{s.name}</p>
                      <p className="text-[11px] text-slate-500">{s.role}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Pie de página del reporte */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-8 py-3 text-[11px] text-slate-500">
            <span>
              {PROJECT_METADATA.empresaEjecutora} · {PROJECT_METADATA.normativaRectora}
            </span>
            <span>Dossier Técnico Generado por SGM API 653</span>
          </div>
        </div>
      </div>
    </div>
  );
};
