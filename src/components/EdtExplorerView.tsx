import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Wrench } from 'lucide-react';
import {
  EDT_ACTIVITIES,
  PHASES,
  PROJECT_METADATA,
  SPECIALTIES,
} from '../data/api653MasterData';
import { MaintenanceRecord, PhaseId } from '../types/maintenance';

interface EdtExplorerViewProps {
  records: MaintenanceRecord[];
  onRegisterFromEdt: (edtCode: string) => void;
}

export const EdtExplorerView: React.FC<EdtExplorerViewProps> = ({
  records,
  onRegisterFromEdt,
}) => {
  const [expandedPhases, setExpandedPhases] = useState<Record<PhaseId, boolean>>({
    '1.0': true,
    '2.0': true,
    '3.0': false,
    '4.0': false,
    '5.0': false,
    '6.0': false,
  });
  const [tankCountSim, setTankCountSim] = useState<number>(3);

  const togglePhase = (id: PhaseId) => {
    setExpandedPhases((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-8">
      {/* Encabezado EDT */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Tabla Maestro EDT, Cronograma y Especificaciones Técnicas
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            {PROJECT_METADATA.normativaRectora} · {PROJECT_METADATA.normasAuxiliares} ·
            Haz clic en &quot;Registrar&quot; en cualquier actividad EDT para precargar el formato técnico.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setExpandedPhases({
                '1.0': true,
                '2.0': true,
                '3.0': true,
                '4.0': true,
                '5.0': true,
                '6.0': true,
              })
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Expandir Todas
          </button>
          <button
            type="button"
            onClick={() =>
              setExpandedPhases({
                '1.0': false,
                '2.0': false,
                '3.0': false,
                '4.0': false,
                '5.0': false,
                '6.0': false,
              })
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Colapsar Todas
          </button>
        </div>
      </div>

      {/* Acordeones por Fase */}
      <div className="space-y-4">
        {PHASES.map((phase) => {
          const isOpen = expandedPhases[phase.id];
          const activities = EDT_ACTIVITIES.filter((a) => a.phaseId === phase.id);
          const loggedHH = records
            .filter((r) => r.phaseId === phase.id)
            .reduce((acc, r) => acc + r.horasHombre, 0);

          return (
            <div
              key={phase.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <button
                type="button"
                onClick={() => togglePhase(phase.id)}
                className="flex w-full flex-wrap items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  )}
                  <span
                    className="h-3 w-3 rounded-sm shrink-0"
                    style={{ backgroundColor: phase.colorHex }}
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className="font-mono font-bold"
                        style={{ color: phase.colorHex }}
                      >
                        {phase.id} · {phase.code}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-mono text-slate-500">
                        {phase.standard}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {phase.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-6 font-mono text-xs tabular-nums">
                  <div className="text-right">
                    <span className="block text-[11px] text-slate-500">Duración</span>
                    <strong className="text-slate-900">{phase.days} días</strong>
                  </div>
                  <div className="text-right">
                    <span className="block text-[11px] text-slate-500">
                      HH Plan / Reg.
                    </span>
                    <strong className="text-slate-900">
                      {phase.estimatedHH} /{' '}
                      <span style={{ color: phase.colorHex }}>{loggedHH} HH</span>
                    </strong>
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 font-semibold text-slate-600 border-b border-slate-200">
                          <th className="px-4 py-2.5">EDT</th>
                          <th className="px-4 py-2.5">Actividad Técnica</th>
                          <th className="px-4 py-2.5 text-right">Días</th>
                          <th className="px-4 py-2.5">Predec.</th>
                          <th className="px-4 py-2.5">Norma Aplicable</th>
                          <th className="px-4 py-2.5">Conformación de Cuadrilla</th>
                          <th className="px-4 py-2.5 text-right">HH Est.</th>
                          <th className="px-4 py-2.5 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activities.map((act) => (
                          <tr key={act.edt} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                              {act.edt}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-900">
                              <div>{act.name}</div>
                              <span
                                className={`text-[11px] font-semibold ${
                                  act.recommendedType === 'Correctivo'
                                    ? 'text-amber-700'
                                    : 'text-sky-700'
                                }`}
                              >
                                Enfoque típico: {act.recommendedType}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                              {act.days}
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                              {act.predecessor}
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                              {act.standard}
                            </td>
                            <td className="px-4 py-3 text-slate-700">{act.crew}</td>
                            <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-slate-900">
                              {act.estimatedHH}
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => onRegisterFromEdt(act.edt)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-800 transition-colors hover:border-sky-600 hover:bg-sky-50 hover:text-sky-800"
                              >
                                <Plus className="h-3 w-3" />
                                <span>Registrar</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Especificaciones Técnicas Detalladas de la Fase (Sección 3 PDF) */}
                  <div className="grid grid-cols-1 gap-6 border-t border-slate-200 bg-slate-50/70 p-6 lg:grid-cols-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Procedimiento Técnico Detallado
                      </h4>
                      <ol className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-600 list-decimal list-inside">
                        {phase.procedures.map((proc, idx) => (
                          <li key={idx}>{proc}</li>
                        ))}
                      </ol>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Materiales e Insumos Requeridos
                      </h4>
                      <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-600 list-disc list-inside">
                        {phase.materials.map((mat, idx) => (
                          <li key={idx}>{mat}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2.5 text-xs leading-relaxed text-slate-600">
                      <h4 className="font-bold text-slate-900">
                        Equipos, Herramientas e Instrumentos
                      </h4>
                      <p>
                        <strong className="text-slate-800">Equipos:</strong>{' '}
                        {phase.equipment.equipos}
                      </p>
                      <p>
                        <strong className="text-slate-800">Herramientas:</strong>{' '}
                        {phase.equipment.herramientas}
                      </p>
                      <p>
                        <strong className="text-slate-800">Instrumentos:</strong>{' '}
                        {phase.equipment.instrumentos}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Consolidado de HH por Especialidad y Escalamiento Multi-Tanque */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Consolidado de Horas-Hombre por Especialidad y Estrategia Multi-Tanque
            </h3>
            <p className="text-xs text-slate-500">
              Fast-Tracking cada 14 días para T-2303, T-2208 y T-2209
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 p-1">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setTankCountSim(n)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tankCountSim === n
                    ? 'bg-[#0F2942] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {n} {n === 1 ? 'Tanque' : 'Tanques'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                <th className="px-4 py-3">Especialidad / Cargo Técnico</th>
                <th className="px-4 py-3 text-right">HH Directas (1T)</th>
                <th className="px-4 py-3 text-right">HH Perm. Obra (1T)</th>
                <th className="px-4 py-3 text-right">Total 1 Tanque</th>
                <th className="px-4 py-3 text-right">
                  Proyección ({tankCountSim} {tankCountSim === 1 ? 'Tanque' : 'Tanques'})
                </th>
                <th className="px-4 py-3">Notas de Asignación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {SPECIALTIES.map((sp) => (
                <tr key={sp.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {sp.role}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                    {sp.hhDirectas.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                    {sp.hhPermObra > 0 ? sp.hhPermObra.toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-slate-900">
                    {sp.totalHH.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-sky-700">
                    {(sp.totalHH * tankCountSim).toLocaleString()} HH
                  </td>
                  <td className="px-4 py-3 text-slate-600">{sp.notes}</td>
                </tr>
              ))}
              <tr className="bg-[#0F2942] font-bold text-white">
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-center gap-2">
                    <Wrench className="h-3.5 w-3.5 text-sky-300" />
                    TOTAL GENERAL
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                  {PROJECT_METADATA.hhDirectasTanque.toLocaleString()} HH
                </td>
                <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                  {PROJECT_METADATA.hhPermObraTanque.toLocaleString()} HH
                </td>
                <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                  {PROJECT_METADATA.hhTotalTanque.toLocaleString()} HH
                </td>
                <td className="px-4 py-3.5 text-right font-mono tabular-nums text-sky-300">
                  {(PROJECT_METADATA.hhTotalTanque * tankCountSim).toLocaleString()} HH
                </td>
                <td className="px-4 py-3.5 text-xs font-normal text-slate-200">
                  {tankCountSim === 3
                    ? 'Estrategia Fast-Tracking cada 14 días (T-2303, T-2208, T-2209)'
                    : 'Alcance base jornada 8h/día · 55 días ruta crítica'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
