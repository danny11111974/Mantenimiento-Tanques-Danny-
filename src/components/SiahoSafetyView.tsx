import React, { useState } from 'react';
import {
  CheckCircle2,
  HardHat,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import {
  EPP_BASICO,
  EPP_ESPECIALIZADO,
  evaluateAtmosphericSafety,
} from '../data/api653MasterData';
import { MaintenanceRecord } from '../types/maintenance';

interface SiahoSafetyViewProps {
  records: MaintenanceRecord[];
}

export const SiahoSafetyView: React.FC<SiahoSafetyViewProps> = ({ records }) => {
  const [simO2, setSimO2] = useState<number>(20.9);
  const [simLel, setSimLel] = useState<number>(0);
  const [simH2s, setSimH2s] = useState<number>(0);
  const [simCo, setSimCo] = useState<number>(0);

  const simResult = evaluateAtmosphericSafety({
    o2: simO2,
    lel: simLel,
    h2s: simH2s,
    co: simCo,
  });

  return (
    <div className="space-y-8">
      {/* Protocolo Crítico de Seguridad */}
      <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-6">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-white">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">
              Protocolo Crítico de Seguridad Industrial (SIAHO)
            </h2>
            <p className="text-sm leading-relaxed text-slate-700">
              Ninguna actividad iniciará sin la emisión del{' '}
              <strong>Permiso de Trabajo (Frío / Caliente / Espacio Confinado / Altura)</strong>{' '}
              validado por el Ing. Residente y el Supervisor SIAHO, acompañado del{' '}
              <strong>Análisis de Riesgos en el Trabajo (ART)</strong> y prueba atmosférica vigente.
            </p>
          </div>
        </div>
      </div>

      {/* Verificador Atmosférico Interactivo + Medidas Preventivas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Verificador en Campo */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
          <h3 className="text-base font-bold text-slate-900">
            Verificador Atmosférico de Campo (API 2015)
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Simula o verifica lecturas del explosímetro multigas antes de autorizar ingreso a tanque.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-semibold text-slate-700">Oxígeno (O₂ %)</span>
                <span className="font-mono text-slate-500">19.5–23.5%</span>
              </div>
              <input
                type="number"
                step={0.1}
                value={simO2}
                onChange={(e) => setSimO2(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm font-bold tabular-nums text-slate-900"
              />
              <span
                className={`mt-1 block text-[11px] font-semibold ${
                  simResult.o2Ok ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {simResult.o2Ok ? 'En rango seguro' : 'Fuera de rango O₂'}
              </span>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-semibold text-slate-700">LEL (%)</span>
                <span className="font-mono text-slate-500">0% exacto</span>
              </div>
              <input
                type="number"
                step={0.5}
                value={simLel}
                onChange={(e) => setSimLel(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm font-bold tabular-nums text-slate-900"
              />
              <span
                className={`mt-1 block text-[11px] font-semibold ${
                  simResult.lelOk ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {simResult.lelOk ? 'Libre de inflamables' : 'Riesgo de explosión'}
              </span>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-semibold text-slate-700">H₂S (ppm)</span>
                <span className="font-mono text-slate-500">&lt; 10 ppm</span>
              </div>
              <input
                type="number"
                step={1}
                value={simH2s}
                onChange={(e) => setSimH2s(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm font-bold tabular-nums text-slate-900"
              />
              <span
                className={`mt-1 block text-[11px] font-semibold ${
                  simResult.h2sOk ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {simResult.h2sOk ? 'Bajo límite TLV' : 'Excede 10 ppm'}
              </span>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-semibold text-slate-700">CO (ppm)</span>
                <span className="font-mono text-slate-500">&lt; 25 ppm</span>
              </div>
              <input
                type="number"
                step={1}
                value={simCo}
                onChange={(e) => setSimCo(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm font-bold tabular-nums text-slate-900"
              />
              <span
                className={`mt-1 block text-[11px] font-semibold ${
                  simResult.coOk ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {simResult.coOk ? 'Bajo límite TLV' : 'Excede 25 ppm'}
              </span>
            </div>
          </div>

          <div
            className={`mt-5 flex items-center justify-between gap-3 rounded-xl border p-4 ${
              simResult.allSafe
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-rose-300 bg-rose-50 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs font-bold">
              {simResult.allSafe ? (
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
              )}
              <span>{simResult.statusLabel}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSimO2(20.9);
                setSimLel(0);
                setSimH2s(0);
                setSimCo(0);
              }}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              Restablecer
            </button>
          </div>
        </div>

        {/* Medidas Preventivas y Control de Riesgos */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
          <h3 className="text-base font-bold text-slate-900">
            A. Medidas Preventivas y Control de Riesgos en Obra
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-xs font-bold text-sky-800">
                Espacios Confinados (API 2015)
              </h4>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                Monitoreo continuo de atmósfera (O₂: 19.5%-23.5%, LEL: 0%, H₂S &lt; 10 ppm,
                CO &lt; 25 ppm). Registro estricto de entrada/salida y presencia permanente
                de vigía exterior.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-xs font-bold text-amber-800">
                Trabajos en Caliente (Soldadura/Corte)
              </h4>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                Barrido de gases previo, mantas ignífugas para contener chispas, extintores
                PQS de 20 lbs en cada frente y puesta a tierra de máquinas de soldar y tanque.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-xs font-bold text-rose-800">
                Trabajos en Altura (&gt; 1.80 m)
              </h4>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                Uso obligatorio de andamios certificados con tarjeta verde y líneas de vida
                verticales/horizontales para labores sobre 1.80 metros.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-xs font-bold text-emerald-800">
                Control Ambiental
              </h4>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                Contención secundaria bajo bombas y compresores, segregación de desechos
                peligrosos (borra, envases de pintura) y control de polvo en sand blasting.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* EPP Básico y Especializado */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <HardHat className="h-5 w-5 text-sky-700" />
            <h3 className="text-base font-bold text-slate-900">
              B. EPP Básico Obligatorio (Todo el Personal)
            </h3>
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {EPP_BASICO.map((item) => (
              <div key={item.zona} className="py-3">
                <p className="text-xs font-bold text-slate-900">{item.zona}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                  {item.spec}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-indigo-700" />
            <h3 className="text-base font-bold text-slate-900">
              C. EPP Especializado por Actividad Crítica
            </h3>
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {EPP_ESPECIALIZADO.map((item) => (
              <div key={item.key} className="py-3">
                <p className="text-xs font-bold text-indigo-900">{item.actividad}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                  {item.detalle}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auditoría de Permisos de Registros Activos */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="text-base font-bold text-slate-900">
            Auditoría de Permisos y Pruebas Atmosféricas Registradas
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                <th className="px-4 py-3">OT / Tanque</th>
                <th className="px-4 py-3">Permiso de Trabajo</th>
                <th className="px-4 py-3">N° Permiso</th>
                <th className="px-4 py-3">ART / Vigía / EPP</th>
                <th className="px-4 py-3 text-right">O₂ (%)</th>
                <th className="px-4 py-3 text-right">LEL (%)</th>
                <th className="px-4 py-3 text-right">H₂S (ppm)</th>
                <th className="px-4 py-3 text-right">CO (ppm)</th>
                <th className="px-4 py-3">Dictamen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => {
                const ev = evaluateAtmosphericSafety(r.siaho.readings);
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {r.codigoOrden} · {r.tanque}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{r.siaho.permisoTipo}</td>
                    <td className="px-4 py-3 font-mono text-slate-800">
                      {r.siaho.permisoNumero}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      ART: {r.siaho.artVerificado ? 'Sí' : 'No'} · Vigía:{' '}
                      {r.siaho.vigiaExterior ? 'Sí' : 'No'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {r.siaho.readings.o2}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {r.siaho.readings.lel}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {r.siaho.readings.h2s}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {r.siaho.readings.co}
                    </td>
                    <td
                      className={`px-4 py-3 font-semibold ${
                        ev.allSafe ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {ev.allSafe ? 'Apto' : 'Crítico'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
