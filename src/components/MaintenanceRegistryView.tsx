import React, { useMemo, useState } from 'react';
import {
  Copy,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  Plus,
  Printer,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import {
  evaluateAtmosphericSafety,
  PHASES,
  PROJECT_METADATA,
} from '../data/api653MasterData';
import { exportCompleteMaintenanceExcel } from '../services/excelExport';
import {
  MaintenanceRecord,
  MaintenanceStatus,
  MaintenanceType,
  PhaseId,
  TankId,
} from '../types/maintenance';
import { PrintablePdfReportModal } from './PrintablePdfReportModal';

interface MaintenanceRegistryViewProps {
  records: MaintenanceRecord[];
  selectedTank: TankId | 'Todos';
  selectedPhase: PhaseId | 'Todas';
  onPhaseChange: (phase: PhaseId | 'Todas') => void;
  onOpenNewForm: () => void;
  onEditRecord: (record: MaintenanceRecord) => void;
  onDuplicateRecord: (record: MaintenanceRecord) => void;
  onDeleteRecord: (record: MaintenanceRecord) => void;
}

export const MaintenanceRegistryView: React.FC<MaintenanceRegistryViewProps> = ({
  records,
  selectedTank,
  selectedPhase,
  onPhaseChange,
  onOpenNewForm,
  onEditRecord,
  onDuplicateRecord,
  onDeleteRecord,
}) => {
  const [typeFilter, setTypeFilter] = useState<MaintenanceType | 'Todos'>('Todos');
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | 'Todos'>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectRecord, setInspectRecord] = useState<MaintenanceRecord | null>(null);
  const [showPrintableReport, setShowPrintableReport] = useState(false);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((r) => {
      if (selectedTank !== 'Todos' && r.tanque !== selectedTank) return false;
      if (selectedPhase !== 'Todas' && r.phaseId !== selectedPhase) return false;
      if (typeFilter !== 'Todos' && r.tipo !== typeFilter) return false;
      if (statusFilter !== 'Todos' && r.estado !== statusFilter) return false;
      if (q) {
        const hay = [
          r.codigoOrden,
          r.edt,
          r.actividadNombre,
          r.componenteAfectado,
          r.descripcionTecnica,
          r.hallazgoCorrectivo,
          r.responsableCuadrilla,
          r.siaho.permisoNumero,
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [records, selectedTank, selectedPhase, typeFilter, statusFilter, searchQuery]);

  const exportCsv = () => {
    const headers = [
      'Codigo_OT',
      'Fecha',
      'Tanque',
      'Tipo',
      'Estado',
      'Prioridad',
      'Fase',
      'EDT',
      'Actividad',
      'Norma',
      'HH',
      'Componente',
      'Permiso_SIAHO',
      'O2_%',
      'LEL_%',
      'H2S_ppm',
      'CO_ppm',
      'Metodo_NDT',
      'Observaciones',
    ];
    const escapeCell = (v: string | number) => {
      const s = String(v ?? '').replace(/"/g, '""');
      return `"${s}"`;
    };
    const rows = filtered.map((r) =>
      [
        r.codigoOrden,
        r.fecha,
        r.tanque,
        r.tipo,
        r.estado,
        r.prioridad,
        r.phaseId,
        r.edt,
        r.actividadNombre,
        r.normaAplicable,
        r.horasHombre,
        r.componenteAfectado,
        `${r.siaho.permisoTipo} (${r.siaho.permisoNumero})`,
        r.siaho.readings.o2,
        r.siaho.readings.lel,
        r.siaho.readings.h2s,
        r.siaho.readings.co,
        r.qaqc.metodoNdt,
        r.observaciones,
      ]
        .map(escapeCell)
        .join(',')
    );
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Registro_Mantenimiento_API653_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros y Acciones */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Registro Técnico de Órdenes de Mantenimiento
            </h2>
            <p className="text-xs text-slate-500">
              Mostrando <span className="font-mono font-bold text-slate-800">{filtered.length}</span> de{' '}
              <span className="font-mono font-bold text-slate-800">{records.length}</span> registros ·{' '}
              {PROJECT_METADATA.empresaEjecutora}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowPrintableReport(true)}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-50 whitespace-nowrap"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Reporte PDF Técnico</span>
            </button>
            <button
              type="button"
              onClick={() => exportCompleteMaintenanceExcel(filtered, selectedTank)}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Exportar Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Exportar CSV</span>
            </button>
            <button
              type="button"
              onClick={onOpenNewForm}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0F2942] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-900 whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nuevo Registro</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          {/* Búsqueda */}
          <div className="relative md:col-span-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar OT, EDT, componente, permiso..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-sky-600 focus:outline-none"
            />
          </div>

          {/* Segmented Tipo */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 md:col-span-3">
            {(['Todos', 'Preventivo', 'Correctivo'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`flex-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  typeFilter === t
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Fase Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedPhase}
              onChange={(e) => onPhaseChange(e.target.value as PhaseId | 'Todas')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-sky-600 focus:outline-none"
            >
              <option value="Todas">Todas las Fases (1.0 – 6.0)</option>
              {PHASES.map((ph) => (
                <option key={ph.id} value={ph.id}>
                  {ph.code}: {ph.shortTitle}
                </option>
              ))}
            </select>
          </div>

          {/* Estado Filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as MaintenanceStatus | 'Todos')
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-sky-600 focus:outline-none"
            >
              <option value="Todos">Todos los Estados</option>
              <option value="Programado">Programado</option>
              <option value="En Ejecución">En Ejecución</option>
              <option value="Inspección QA/QC">Inspección QA/QC</option>
              <option value="Completado">Completado</option>
              <option value="Observación Crítica">Observación Crítica</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Alta Densidad */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-semibold text-slate-800">
              No se encontraron registros que coincidan con los filtros actuales
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Ajusta los filtros de fase/tipo o registra una nueva intervención técnica.
            </p>
            <button
              type="button"
              onClick={onOpenNewForm}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0F2942] px-4 py-2 text-xs font-semibold text-white hover:bg-sky-900"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Registrar Primera Orden</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="px-4 py-3 whitespace-nowrap">OT / Fecha</th>
                  <th className="px-4 py-3 whitespace-nowrap">Activo · EDT</th>
                  <th className="px-4 py-3">Actividad Técnica y Componente</th>
                  <th className="px-4 py-3 whitespace-nowrap">Tipo · Estado</th>
                  <th className="px-4 py-3 whitespace-nowrap">SIAHO</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">HH</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((rec) => {
                  const phase = PHASES.find((p) => p.id === rec.phaseId) || PHASES[0];
                  const atm = evaluateAtmosphericSafety(rec.siaho.readings);
                  return (
                    <tr
                      key={rec.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3.5 align-top whitespace-nowrap">
                        <div className="font-mono text-xs font-bold text-slate-900">
                          {rec.codigoOrden}
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] tabular-nums text-slate-500">
                          {rec.fecha}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 align-top whitespace-nowrap">
                        <div className="font-mono text-xs font-bold text-slate-900">
                          {rec.tanque}
                        </div>
                        <div
                          className="mt-0.5 font-mono text-[11px] font-semibold"
                          style={{ color: phase.colorHex }}
                        >
                          {phase.code} · {rec.edt}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 align-top max-w-md">
                        <p className="font-semibold text-slate-900 line-clamp-1">
                          {rec.actividadNombre}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-600 line-clamp-1">
                          {rec.componenteAfectado}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                          {rec.normaAplicable} · {rec.responsableCuadrilla}
                        </p>
                      </td>

                      <td className="px-4 py-3.5 align-top whitespace-nowrap">
                        <div
                          className={`text-xs font-bold ${
                            rec.tipo === 'Correctivo'
                              ? 'text-amber-700'
                              : 'text-sky-700'
                          }`}
                        >
                          {rec.tipo}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-600">
                          {rec.estado} · {rec.prioridad}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 align-top whitespace-nowrap">
                        <div
                          className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            atm.allSafe ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {atm.allSafe ? (
                            <ShieldCheck className="h-3.5 w-3.5" />
                          ) : (
                            <ShieldAlert className="h-3.5 w-3.5" />
                          )}
                          <span>{atm.allSafe ? 'Atmósfera OK' : 'Alerta Gases'}</span>
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-slate-500">
                          {rec.siaho.permisoNumero}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 align-top text-right whitespace-nowrap">
                        <span className="font-mono text-sm font-bold tabular-nums text-slate-900">
                          {rec.horasHombre}
                        </span>
                        <span className="block font-mono text-[11px] tabular-nums text-slate-500">
                          {rec.personalCantidad} pers.
                        </span>
                      </td>

                      <td className="px-4 py-3.5 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setInspectRecord(rec)}
                            title="Ver ficha técnica completa"
                            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditRecord(rec)}
                            title="Editar registro"
                            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-sky-50 hover:text-sky-700"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDuplicateRecord(rec)}
                            title="Duplicar para otro tanque o turno"
                            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteRecord(rec)}
                            title="Eliminar registro"
                            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Ficha Técnica Completa */}
      {inspectRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-[#0F2942] px-6 py-4 text-white">
              <div>
                <p className="font-mono text-xs text-sky-300">
                  {inspectRecord.codigoOrden} · {inspectRecord.tanque} · EDT{' '}
                  {inspectRecord.edt}
                </p>
                <h3 className="mt-0.5 text-lg font-bold">
                  {inspectRecord.actividadNombre}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectRecord(null)}
                className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6 text-sm">
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-4">
                <div>
                  <span className="text-xs text-slate-500">Tipo / Prioridad</span>
                  <p className="font-bold text-slate-900">
                    {inspectRecord.tipo} · {inspectRecord.prioridad}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Estado</span>
                  <p className="font-bold text-slate-900">{inspectRecord.estado}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Horas-Hombre</span>
                  <p className="font-mono font-bold text-slate-900">
                    {inspectRecord.horasHombre} HH ({inspectRecord.personalCantidad} pers.)
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Fecha / Turno</span>
                  <p className="font-mono text-xs font-semibold text-slate-900">
                    {inspectRecord.fecha}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-500">
                    Componente Afectado
                  </h4>
                  <p className="mt-0.5 text-slate-900">
                    {inspectRecord.componenteAfectado}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-500">
                    Descripción Técnica
                  </h4>
                  <p className="mt-0.5 leading-relaxed text-slate-700">
                    {inspectRecord.descripcionTecnica}
                  </p>
                </div>
                {inspectRecord.hallazgoCorrectivo && (
                  <div>
                    <h4 className="text-xs font-bold text-amber-700">
                      Hallazgo / Diagnóstico
                    </h4>
                    <p className="mt-0.5 leading-relaxed text-slate-800">
                      {inspectRecord.hallazgoCorrectivo}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900">
                    Control Atmosférico y Permisología SIAHO
                  </h4>
                  <p className="text-xs text-slate-600">
                    {inspectRecord.siaho.permisoTipo} ·{' '}
                    <span className="font-mono font-bold">
                      {inspectRecord.siaho.permisoNumero}
                    </span>
                  </p>
                  <div className="grid grid-cols-4 gap-2 font-mono text-xs">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <span className="block text-[10px] text-slate-500">O₂</span>
                      <strong>{inspectRecord.siaho.readings.o2}%</strong>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <span className="block text-[10px] text-slate-500">LEL</span>
                      <strong>{inspectRecord.siaho.readings.lel}%</strong>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <span className="block text-[10px] text-slate-500">H₂S</span>
                      <strong>{inspectRecord.siaho.readings.h2s} ppm</strong>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <span className="block text-[10px] text-slate-500">CO</span>
                      <strong>{inspectRecord.siaho.readings.co} ppm</strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900">
                    Parámetros QA/QC y Ensayos NDT
                  </h4>
                  <p className="text-xs text-slate-700">
                    Método: <strong>{inspectRecord.qaqc.metodoNdt}</strong>
                  </p>
                  <div className="space-y-1 font-mono text-xs text-slate-600">
                    {inspectRecord.qaqc.espesorMinimoMils && (
                      <p>Espesor Mínimo: {inspectRecord.qaqc.espesorMinimoMils}</p>
                    )}
                    {inspectRecord.qaqc.perfilAnclajeMils && (
                      <p>Perfil Anclaje: {inspectRecord.qaqc.perfilAnclajeMils}</p>
                    )}
                    {inspectRecord.qaqc.dftSecoMils && (
                      <p>DFT Seco: {inspectRecord.qaqc.dftSecoMils}</p>
                    )}
                    {inspectRecord.qaqc.presionPruebaPsi && (
                      <p>Presión Prueba: {inspectRecord.qaqc.presionPruebaPsi}</p>
                    )}
                    <p>
                      Holiday: {inspectRecord.qaqc.holidayTest} · Vacío:{' '}
                      {inspectRecord.qaqc.vacuumBoxTest}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  const target = inspectRecord;
                  setInspectRecord(null);
                  onEditRecord(target);
                }}
                className="rounded-lg bg-[#0F2942] px-4 py-2 text-xs font-semibold text-white hover:bg-sky-900"
              >
                Editar Registro
              </button>
              <button
                type="button"
                onClick={() => setInspectRecord(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      <PrintablePdfReportModal
        open={showPrintableReport}
        records={filtered}
        selectedTank={selectedTank}
        onClose={() => setShowPrintableReport(false)}
      />
    </div>
  );
};
