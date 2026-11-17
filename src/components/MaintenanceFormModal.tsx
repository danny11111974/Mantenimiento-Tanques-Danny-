import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  ShieldAlert,
  Wrench,
  X,
} from 'lucide-react';
import {
  EDT_ACTIVITIES,
  evaluateAtmosphericSafety,
  PHASES,
  PROJECT_METADATA,
  SPECIALTIES,
} from '../data/api653MasterData';
import {
  MaintenanceRecord,
  MaintenanceStatus,
  MaintenanceType,
  PhaseId,
  PriorityLevel,
  TankId,
  WorkPermitType,
} from '../types/maintenance';

interface MaintenanceFormModalProps {
  open: boolean;
  initialRecord?: MaintenanceRecord | null;
  presetEdt?: string | null;
  presetTank?: TankId | null;
  existingCount: number;
  onClose: () => void;
  onSave: (record: MaintenanceRecord) => void;
}

const STATUS_OPTIONS: MaintenanceStatus[] = [
  'Programado',
  'En Ejecución',
  'Inspección QA/QC',
  'Completado',
  'Observación Crítica',
];

const PRIORITY_OPTIONS: PriorityLevel[] = ['Baja', 'Media', 'Alta', 'Crítica'];

const PERMIT_OPTIONS: WorkPermitType[] = [
  'Trabajo en Frío',
  'Trabajo en Caliente',
  'Espacio Confinado',
  'Trabajo en Altura',
];

export const MaintenanceFormModal: React.FC<MaintenanceFormModalProps> = ({
  open,
  initialRecord,
  presetEdt,
  presetTank,
  existingCount,
  onClose,
  onSave,
}) => {
  const buildDefaultState = (): MaintenanceRecord => {
    const defaultEdt =
      EDT_ACTIVITIES.find((a) => a.edt === (presetEdt || '1.1')) || EDT_ACTIVITIES[0];
    const phase = PHASES.find((p) => p.id === defaultEdt.phaseId) || PHASES[0];
    const tank: TankId = presetTank || 'T-2303';
    const nextNum = String(existingCount + 1).padStart(3, '0');

    return {
      id: `rec-${Date.now()}`,
      codigoOrden: `OT-${tank.replace('T-', '')}-${nextNum}`,
      fecha: new Date().toISOString().slice(0, 10),
      turno: 'Diurno (07:00-15:00)',
      tanque: tank,
      tipo: defaultEdt.recommendedType,
      estado: 'Programado',
      prioridad: defaultEdt.recommendedType === 'Correctivo' ? 'Alta' : 'Media',
      phaseId: phase.id,
      edt: defaultEdt.edt,
      actividadNombre: defaultEdt.name,
      normaAplicable: defaultEdt.standard,
      responsableCuadrilla: defaultEdt.crew,
      especialidad: SPECIALTIES[0].role,
      personalCantidad: 4,
      horasHombre: 32,
      componenteAfectado: '',
      descripcionTecnica: phase.procedures[0] || '',
      hallazgoCorrectivo: '',
      materialesUsados: phase.materials.slice(0, 3).join(', '),
      equiposInstrumentos: phase.equipment.equipos,
      siaho: {
        permisoTipo:
          phase.id === '3.0'
            ? 'Trabajo en Caliente'
            : phase.id === '1.0' || phase.id === '2.0'
              ? 'Espacio Confinado'
              : 'Trabajo en Frío',
        permisoNumero: `PT-${tank.replace('T-', '')}-${nextNum}`,
        artVerificado: true,
        vigiaExterior: true,
        eppBasicoCompleto: true,
        eppEspecializadoCompleto: true,
        readings: { o2: 20.9, lel: 0, h2s: 0, co: 0 },
      },
      qaqc: {
        metodoNdt:
          phase.id === '2.0'
            ? 'MFL / UT / MT-PT'
            : phase.id === '5.0'
              ? 'DFT SSPC-PA2 + Holiday'
              : phase.id === '6.0'
                ? 'Caja de Vacío 5-8 PSI'
                : 'Inspección Visual',
        espesorMinimoMils: '',
        perfilAnclajeMils: '',
        dftSecoMils: '',
        presionPruebaPsi: '',
        holidayTest: 'N/A',
        vacuumBoxTest: 'N/A',
      },
      observaciones: '',
      syncedToSheets: false,
      updatedAt: new Date().toISOString(),
    };
  };

  const [form, setForm] = useState<MaintenanceRecord>(buildDefaultState);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFormError(null);
      if (initialRecord) {
        setForm({
          ...initialRecord,
          siaho: {
            ...initialRecord.siaho,
            readings: { ...initialRecord.siaho.readings },
          },
          qaqc: { ...initialRecord.qaqc },
        });
      } else {
        setForm(buildDefaultState());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialRecord, presetEdt, presetTank]);

  if (!open) return null;

  const selectedPhase = PHASES.find((p) => p.id === form.phaseId) || PHASES[0];
  const phaseActivities = EDT_ACTIVITIES.filter((a) => a.phaseId === form.phaseId);
  const selectedEdtObj = EDT_ACTIVITIES.find((a) => a.edt === form.edt);
  const atmosphericStatus = evaluateAtmosphericSafety(form.siaho.readings);

  const handlePhaseChange = (newPhaseId: PhaseId) => {
    const firstAct =
      EDT_ACTIVITIES.find((a) => a.phaseId === newPhaseId) || EDT_ACTIVITIES[0];
    const phase = PHASES.find((p) => p.id === newPhaseId) || PHASES[0];
    setForm((prev) => ({
      ...prev,
      phaseId: newPhaseId,
      edt: firstAct.edt,
      actividadNombre: firstAct.name,
      normaAplicable: firstAct.standard,
      responsableCuadrilla: firstAct.crew,
      materialesUsados: phase.materials.slice(0, 3).join(', '),
      equiposInstrumentos: phase.equipment.equipos,
    }));
  };

  const handleEdtChange = (edtCode: string) => {
    const act = EDT_ACTIVITIES.find((a) => a.edt === edtCode);
    if (!act) return;
    setForm((prev) => ({
      ...prev,
      edt: act.edt,
      phaseId: act.phaseId,
      actividadNombre: act.name,
      normaAplicable: act.standard,
      responsableCuadrilla: act.crew,
    }));
  };

  const handleTankChange = (tanque: TankId) => {
    setForm((prev) => ({
      ...prev,
      tanque,
      codigoOrden: initialRecord
        ? prev.codigoOrden
        : `OT-${tanque.replace('T-', '')}-${String(existingCount + 1).padStart(3, '0')}`,
    }));
  };

  const applyCalculatedHH = () => {
    const shiftHours = form.turno.startsWith('Extendido') ? 11 : 8;
    setForm((prev) => ({
      ...prev,
      horasHombre: Math.max(1, prev.personalCantidad * shiftHours),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.codigoOrden.trim()) {
      setFormError('Debes indicar un código de Orden de Trabajo (OT).');
      return;
    }
    if (!form.componenteAfectado.trim()) {
      setFormError('Especifica el componente o zona del tanque intervenida.');
      return;
    }
    if (!form.descripcionTecnica.trim()) {
      setFormError('Ingresa la descripción técnica de la actividad ejecutada o programada.');
      return;
    }
    if (form.horasHombre <= 0) {
      setFormError('Las Horas-Hombre (HH) deben ser mayores que cero.');
      return;
    }

    onSave({
      ...form,
      syncedToSheets: false,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 sm:p-6 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="maintenance-form-title"
    >
      <div className="my-4 w-full max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header del Formato */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-t-2xl bg-[#0F2942] px-6 py-5 text-white">
          <div>
            <p className="text-xs font-medium tracking-wide text-sky-300">
              {PROJECT_METADATA.empresaEjecutora} · {PROJECT_METADATA.ingenieroResidente}
            </p>
            <h2
              id="maintenance-form-title"
              className="mt-1 text-lg font-bold tracking-tight sm:text-xl"
            >
              {initialRecord
                ? `Editar Registro Técnico · ${initialRecord.codigoOrden}`
                : 'Nuevo Registro de Mantenimiento Preventivo / Correctivo'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white/10 p-2 text-slate-200 transition-colors hover:bg-white/20 hover:text-white"
            aria-label="Cerrar formulario"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="divide-y divide-slate-200">
          {formError && (
            <div className="flex items-center gap-3 bg-rose-50 px-6 py-3 text-sm font-medium text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Sección 01: Clasificación y Activo */}
          <div className="space-y-5 px-6 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-900">
                01. Identificación del Activo y Naturaleza del Mantenimiento
              </h3>
              <span className="font-mono text-xs text-slate-500">
                Normativa Rectora: API 653 / API 650 / ASME
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Tipo de Mantenimiento Segmented Switch */}
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Tipo de Mantenimiento
                </label>
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-100 p-1">
                  {(['Preventivo', 'Correctivo'] as MaintenanceType[]).map((tipo) => {
                    const active = form.tipo === tipo;
                    return (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, tipo }))}
                        className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all whitespace-nowrap ${
                          active
                            ? tipo === 'Preventivo'
                              ? 'bg-sky-600 text-white shadow-sm'
                              : 'bg-amber-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
                        }`}
                      >
                        {tipo === 'Preventivo' ? (
                          <ClipboardCheck className="h-4 w-4 shrink-0" />
                        ) : (
                          <Wrench className="h-4 w-4 shrink-0" />
                        )}
                        <span>Mantenimiento {tipo}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Activo / Tanque */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Activo / Tanque
                </label>
                <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-slate-200 bg-slate-100 p-1">
                  {PROJECT_METADATA.tanques.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleTankChange(t)}
                      className={`rounded-lg py-2 font-mono text-xs font-bold transition-colors ${
                        form.tanque === t
                          ? 'bg-[#0F2942] text-white shadow-sm'
                          : 'text-slate-700 hover:bg-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Código OT */}
              <div>
                <label
                  htmlFor="codigoOrden"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Código Orden de Trabajo (OT)
                </label>
                <input
                  id="codigoOrden"
                  type="text"
                  value={form.codigoOrden}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, codigoOrden: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm font-semibold text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
                  placeholder="OT-2303-001"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label
                  htmlFor="fecha"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Fecha de Ejecución
                </label>
                <input
                  id="fecha"
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-sky-600 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="turno"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Jornada / Turno
                </label>
                <select
                  id="turno"
                  value={form.turno}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      turno: e.target.value as MaintenanceRecord['turno'],
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-600 focus:outline-none"
                >
                  <option value="Diurno (07:00-15:00)">Diurno (07:00-15:00 · 8h)</option>
                  <option value="Extendido (07:00-19:00)">
                    Extendido (07:00-19:00 · 11h)
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="estado"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Estado Operativo
                </label>
                <select
                  id="estado"
                  value={form.estado}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      estado: e.target.value as MaintenanceStatus,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-600 focus:outline-none"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="prioridad"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Prioridad / Criticidad
                </label>
                <select
                  id="prioridad"
                  value={form.prioridad}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      prioridad: e.target.value as PriorityLevel,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-600 focus:outline-none"
                >
                  {PRIORITY_OPTIONS.map((pr) => (
                    <option key={pr} value={pr}>
                      {pr}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sección 02: Estructura EDT, Cuadrilla y HH */}
          <div className="space-y-5 bg-slate-50/60 px-6 py-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                02. Vinculación EDT, Cuadrilla y Control de Horas-Hombre (HH)
              </h3>
              {selectedEdtObj && (
                <span className="font-mono text-xs font-medium text-slate-600 tabular-nums">
                  Línea Base EDT {selectedEdtObj.edt}: {selectedEdtObj.days} días ·{' '}
                  {selectedEdtObj.estimatedHH} HH est.
                </span>
              )}
            </div>

            {/* Selector visual de Fases */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {PHASES.map((phase) => {
                const active = form.phaseId === phase.id;
                return (
                  <button
                    key={phase.id}
                    type="button"
                    onClick={() => handlePhaseChange(phase.id)}
                    className={`rounded-xl border p-2.5 text-left transition-all ${
                      active
                        ? `${phase.accentBgClass} ${phase.accentBorderClass} ring-2 ring-offset-1 ring-slate-900/15`
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="font-mono text-xs font-bold"
                        style={{ color: phase.colorHex }}
                      >
                        {phase.code}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {phase.id}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-800">
                      {phase.shortTitle}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <label
                  htmlFor="edtSelect"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Actividad Técnica EDT ({selectedPhase.code}: {selectedPhase.title})
                </label>
                <select
                  id="edtSelect"
                  value={form.edt}
                  onChange={(e) => handleEdtChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-600 focus:outline-none"
                >
                  {phaseActivities.map((act) => (
                    <option key={act.edt} value={act.edt}>
                      [{act.edt}] {act.name} ({act.estimatedHH} HH)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="normaAplicable"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Norma Aplicable
                </label>
                <input
                  id="normaAplicable"
                  type="text"
                  value={form.normaAplicable}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, normaAplicable: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-sky-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label
                  htmlFor="especialidad"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Especialidad Principal
                </label>
                <select
                  id="especialidad"
                  value={form.especialidad}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, especialidad: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-600 focus:outline-none"
                >
                  {SPECIALTIES.map((sp) => (
                    <option key={sp.id} value={sp.role}>
                      {sp.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="cuadrilla"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Conformación de Cuadrilla
                </label>
                <input
                  id="cuadrilla"
                  type="text"
                  value={form.responsableCuadrilla}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, responsableCuadrilla: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-600 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="personalCantidad"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  N° Trabajadores en Frente
                </label>
                <input
                  id="personalCantidad"
                  type="number"
                  min={1}
                  max={50}
                  value={form.personalCantidad}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      personalCantidad: Math.max(1, Number(e.target.value) || 1),
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-sky-600 focus:outline-none"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="horasHombre"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Horas-Hombre (HH)
                  </label>
                  <button
                    type="button"
                    onClick={applyCalculatedHH}
                    className="text-[11px] font-semibold text-sky-700 hover:underline"
                  >
                    Calcular ({form.personalCantidad} ×{' '}
                    {form.turno.startsWith('Extendido') ? 11 : 8}h)
                  </button>
                </div>
                <input
                  id="horasHombre"
                  type="number"
                  min={1}
                  step={0.5}
                  value={form.horasHombre}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      horasHombre: Math.max(0, Number(e.target.value) || 0),
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm font-bold tabular-nums text-slate-900 focus:border-sky-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Sección 03: Protocolo Crítico SIAHO y Atmósfera */}
          <div className="space-y-5 px-6 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-900">
                03. Protocolo Crítico SIAHO, Permisología y Control Atmosférico (API 2015)
              </h3>
              <div
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold ${
                  atmosphericStatus.allSafe
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-rose-300 bg-rose-50 text-rose-800'
                }`}
              >
                {atmosphericStatus.allSafe ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-rose-600" />
                )}
                <span>{atmosphericStatus.statusLabel}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label
                  htmlFor="permisoTipo"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Tipo de Permiso de Trabajo
                </label>
                <select
                  id="permisoTipo"
                  value={form.siaho.permisoTipo}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      siaho: {
                        ...p.siaho,
                        permisoTipo: e.target.value as WorkPermitType,
                      },
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-600 focus:outline-none"
                >
                  {PERMIT_OPTIONS.map((pt) => (
                    <option key={pt} value={pt}>
                      {pt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="permisoNumero"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  N° Permiso Validado (ART)
                </label>
                <input
                  id="permisoNumero"
                  type="text"
                  value={form.siaho.permisoNumero}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      siaho: { ...p.siaho, permisoNumero: e.target.value },
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-sky-600 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 grid grid-cols-2 gap-3 pt-1">
                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={form.siaho.artVerificado}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        siaho: { ...p.siaho, artVerificado: e.target.checked },
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-600"
                  />
                  <span>ART Validado en Sitio</span>
                </label>

                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={form.siaho.vigiaExterior}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        siaho: { ...p.siaho, vigiaExterior: e.target.checked },
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-600"
                  />
                  <span>Vigía Exterior Asignado</span>
                </label>

                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={form.siaho.eppBasicoCompleto}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        siaho: { ...p.siaho, eppBasicoCompleto: e.target.checked },
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-600"
                  />
                  <span>EPP Básico Obligatorio</span>
                </label>

                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={form.siaho.eppEspecializadoCompleto}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        siaho: {
                          ...p.siaho,
                          eppEspecializadoCompleto: e.target.checked,
                        },
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-600"
                  />
                  <span>EPP Especializado Fase</span>
                </label>
              </div>
            </div>

            {/* Medición Multigas */}
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-4">
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">O₂ (%)</span>
                  <span
                    className={`font-mono font-bold ${
                      atmosphericStatus.o2Ok ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    19.5–23.5%
                  </span>
                </div>
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  max={30}
                  value={form.siaho.readings.o2}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      siaho: {
                        ...p.siaho,
                        readings: {
                          ...p.siaho.readings,
                          o2: Number(e.target.value) || 0,
                        },
                      },
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm font-bold tabular-nums text-slate-900"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">LEL (%)</span>
                  <span
                    className={`font-mono font-bold ${
                      atmosphericStatus.lelOk ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    Meta: 0%
                  </span>
                </div>
                <input
                  type="number"
                  step={0.5}
                  min={0}
                  max={100}
                  value={form.siaho.readings.lel}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      siaho: {
                        ...p.siaho,
                        readings: {
                          ...p.siaho.readings,
                          lel: Number(e.target.value) || 0,
                        },
                      },
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm font-bold tabular-nums text-slate-900"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">H₂S (ppm)</span>
                  <span
                    className={`font-mono font-bold ${
                      atmosphericStatus.h2sOk ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    &lt; 10 ppm
                  </span>
                </div>
                <input
                  type="number"
                  step={1}
                  min={0}
                  max={100}
                  value={form.siaho.readings.h2s}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      siaho: {
                        ...p.siaho,
                        readings: {
                          ...p.siaho.readings,
                          h2s: Number(e.target.value) || 0,
                        },
                      },
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm font-bold tabular-nums text-slate-900"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">CO (ppm)</span>
                  <span
                    className={`font-mono font-bold ${
                      atmosphericStatus.coOk ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    &lt; 25 ppm
                  </span>
                </div>
                <input
                  type="number"
                  step={1}
                  min={0}
                  max={200}
                  value={form.siaho.readings.co}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      siaho: {
                        ...p.siaho,
                        readings: {
                          ...p.siaho.readings,
                          co: Number(e.target.value) || 0,
                        },
                      },
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm font-bold tabular-nums text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Sección 04: Especificaciones Técnicas, Hallazgos y QA/QC */}
          <div className="space-y-5 bg-slate-50/50 px-6 py-6">
            <h3 className="text-sm font-bold text-slate-900">
              04. Detalle Técnico, Hallazgos Correctivos y Control QA/QC
            </h3>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <label
                  htmlFor="componenteAfectado"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Componente / Zona del Tanque Intervenida *
                </label>
                <input
                  id="componenteAfectado"
                  type="text"
                  value={form.componenteAfectado}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, componenteAfectado: e.target.value }))
                  }
                  placeholder="Ej. Láminas de piso cuadrante SE, Anillo 1, Boquilla 12&quot;, Sello primario..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-600 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="metodoNdt"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Método de Ensayo / Inspección QA/QC
                </label>
                <input
                  id="metodoNdt"
                  type="text"
                  value={form.qaqc.metodoNdt}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      qaqc: { ...p.qaqc, metodoNdt: e.target.value },
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <label
                  htmlFor="descripcionTecnica"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Descripción Técnica del Trabajo Ejecutado *
                </label>
                <textarea
                  id="descripcionTecnica"
                  rows={3}
                  value={form.descripcionTecnica}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, descripcionTecnica: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-600 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="hallazgoCorrectivo"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  {form.tipo === 'Correctivo'
                    ? 'Diagnóstico de Falla / Hallazgo Correctivo (API 653)'
                    : 'Hallazgos o Desviaciones Detectadas durante Preventivo'}
                </label>
                <textarea
                  id="hallazgoCorrectivo"
                  rows={3}
                  value={form.hallazgoCorrectivo}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, hallazgoCorrectivo: e.target.value }))
                  }
                  placeholder="Describe picaduras (pitting), pérdida de espesor, fugas en pontones, porosidad Holiday, etc."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Mediciones Cuantitativas QA/QC */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Espesor Mín. (mils)
                </label>
                <input
                  type="text"
                  value={form.qaqc.espesorMinimoMils || ''}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      qaqc: { ...p.qaqc, espesorMinimoMils: e.target.value },
                    }))
                  }
                  placeholder="Ej. 245 mils"
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Perfil Anclaje (mils)
                </label>
                <input
                  type="text"
                  value={form.qaqc.perfilAnclajeMils || ''}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      qaqc: { ...p.qaqc, perfilAnclajeMils: e.target.value },
                    }))
                  }
                  placeholder="2.5 - 3.5"
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  DFT Seco (mils)
                </label>
                <input
                  type="text"
                  value={form.qaqc.dftSecoMils || ''}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      qaqc: { ...p.qaqc, dftSecoMils: e.target.value },
                    }))
                  }
                  placeholder="Ej. 14.0"
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Presión Prueba (PSI)
                </label>
                <input
                  type="text"
                  value={form.qaqc.presionPruebaPsi || ''}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      qaqc: { ...p.qaqc, presionPruebaPsi: e.target.value },
                    }))
                  }
                  placeholder="2-3 / 50 PSI"
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Prueba Holiday
                </label>
                <select
                  value={form.qaqc.holidayTest}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      qaqc: {
                        ...p.qaqc,
                        holidayTest: e.target.value as MaintenanceRecord['qaqc']['holidayTest'],
                      },
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900"
                >
                  <option value="N/A">N/A</option>
                  <option value="Aprobado">Aprobado</option>
                  <option value="Reproceso Requerido">Reproceso Requerido</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Caja de Vacío
                </label>
                <select
                  value={form.qaqc.vacuumBoxTest}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      qaqc: {
                        ...p.qaqc,
                        vacuumBoxTest: e.target
                          .value as MaintenanceRecord['qaqc']['vacuumBoxTest'],
                      },
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900"
                >
                  <option value="N/A">N/A</option>
                  <option value="Aprobado (5-8 PSI)">Aprobado (5-8 PSI)</option>
                  <option value="Fuga Detectada">Fuga Detectada</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Materiales e Insumos Consumidos
                </label>
                <input
                  type="text"
                  value={form.materialesUsados}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, materialesUsados: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Equipos, Herramientas e Instrumentos
                </label>
                <input
                  type="text"
                  value={form.equiposInstrumentos}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, equiposInstrumentos: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Observaciones / Dossier As-Built
                </label>
                <input
                  type="text"
                  value={form.observaciones}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, observaciones: e.target.value }))
                  }
                  placeholder="Notas adicionales de entrega o cierre..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Footer Acciones */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-b-2xl bg-white px-6 py-4">
            <p className="text-xs text-slate-500">
              Los cambios se guardan localmente de inmediato y quedan listos para sincronizar con Google Sheets.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#0F2942] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-900 whitespace-nowrap"
              >
                {initialRecord ? 'Actualizar Registro' : 'Guardar Registro Técnico'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
