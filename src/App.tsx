import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { AlertCircle, FileSpreadsheet, Plus, ShieldCheck, X } from 'lucide-react';
import { ConfirmDialog } from './components/ConfirmDialog';
import { DashboardSummary } from './components/DashboardSummary';
import { EdtExplorerView } from './components/EdtExplorerView';
import { GoogleSheetsSyncView } from './components/GoogleSheetsSyncView';
import { GoogleSignInButton } from './components/GoogleSignInButton';
import { MaintenanceFormModal } from './components/MaintenanceFormModal';
import { MaintenanceRegistryView } from './components/MaintenanceRegistryView';
import { SiahoSafetyView } from './components/SiahoSafetyView';
import { TankAtlasView } from './components/TankAtlasView';
import {
  evaluateAtmosphericSafety,
  INITIAL_MAINTENANCE_RECORDS,
  PROJECT_METADATA,
} from './data/api653MasterData';
import {
  getAccessToken,
  googleSignIn,
  initAuth,
  logout,
} from './services/googleAuth';
import {
  AppView,
  ConnectedSpreadsheet,
  MaintenanceRecord,
  PhaseId,
  TankId,
} from './types/maintenance';

const STORAGE_RECORDS_KEY = 'sgm_api653_records_v1';
const STORAGE_SHEET_META_KEY = 'sgm_api653_sheet_meta_v1';

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('resumen');
  const [selectedTank, setSelectedTank] = useState<TankId | 'Todos'>('Todos');
  const [selectedPhase, setSelectedPhase] = useState<PhaseId | 'Todas'>('Todas');

  const [records, setRecords] = useState<MaintenanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_RECORDS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback to initial master sample records
    }
    return INITIAL_MAINTENANCE_RECORDS;
  });

  const [connectedSheet, setConnectedSheet] =
    useState<ConnectedSpreadsheet | null>(() => {
      try {
        const saved = localStorage.getItem(STORAGE_SHEET_META_KEY);
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
      return null;
    });

  // Google Workspace Auth State (access token stored strictly in memory via googleAuth.ts)
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(getAccessToken());
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authNotice, setAuthNotice] = useState<{
    type: 'info' | 'error';
    text: string;
  } | null>(null);

  // Modal Form & Delete Confirmation State
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [presetEdt, setPresetEdt] = useState<string | null>(null);
  const [presetTank, setPresetTank] = useState<TankId | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<MaintenanceRecord | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser, token) => {
        setUser(authedUser);
        setAccessToken(token);
      },
      (firebaseUser) => {
        setUser(firebaseUser);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_RECORDS_KEY, JSON.stringify(records));
    } catch {
      // ignore quota errors
    }
  }, [records]);

  useEffect(() => {
    try {
      if (connectedSheet) {
        localStorage.setItem(
          STORAGE_SHEET_META_KEY,
          JSON.stringify(connectedSheet)
        );
      } else {
        localStorage.removeItem(STORAGE_SHEET_META_KEY);
      }
    } catch {
      // ignore
    }
  }, [connectedSheet]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setAuthNotice(null);
    try {
      const res = await googleSignIn();
      if (res.status === 'success') {
        setUser(res.user);
        setAccessToken(res.accessToken);
        setAuthNotice(null);
      } else if (res.status === 'cancelled') {
        setAuthNotice({ type: 'info', text: res.message });
      } else {
        setAuthNotice({ type: 'error', text: res.message });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
  };

  const handleOpenNewForm = (edtCode?: string, tankOverride?: TankId) => {
    setEditingRecord(null);
    setPresetEdt(edtCode || null);
    setPresetTank(tankOverride || null);
    setFormOpen(true);
  };

  const handleSaveRecord = (saved: MaintenanceRecord) => {
    setRecords((prev) => {
      const exists = prev.some((r) => r.id === saved.id);
      if (exists) {
        return prev.map((r) => (r.id === saved.id ? saved : r));
      }
      return [saved, ...prev];
    });
    setFormOpen(false);
    setEditingRecord(null);
    setPresetEdt(null);
  };

  const handleDuplicateRecord = (rec: MaintenanceRecord) => {
    const nextNum = String(records.length + 1).padStart(3, '0');
    const copy: MaintenanceRecord = {
      ...rec,
      id: `rec-${Date.now()}`,
      codigoOrden: `OT-${rec.tanque.replace('T-', '')}-${nextNum}`,
      estado: 'Programado',
      syncedToSheets: false,
      updatedAt: new Date().toISOString(),
    };
    setEditingRecord(copy);
    setPresetEdt(null);
    setFormOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!recordToDelete) return;
    setRecords((prev) => prev.filter((r) => r.id !== recordToDelete.id));
    setRecordToDelete(null);
  };

  const handleImportRecords = (
    imported: MaintenanceRecord[],
    mode: 'replace' | 'merge'
  ) => {
    if (mode === 'replace') {
      setRecords(imported);
    } else {
      setRecords((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        const additions = imported.filter((r) => !existingIds.has(r.id));
        return [...additions, ...prev];
      });
    }
  };

  const handleMarkAllSynced = () => {
    setRecords((prev) => prev.map((r) => ({ ...r, syncedToSheets: true })));
  };

  // KPI Metrics computed strictly from real state
  const scopedRecords =
    selectedTank === 'Todos'
      ? records
      : records.filter((r) => r.tanque === selectedTank);

  const totalHH = scopedRecords.reduce((acc, r) => acc + r.horasHombre, 0);
  const baselineHH =
    selectedTank === 'Todos'
      ? PROJECT_METADATA.hhDirectasTanque * 3
      : PROJECT_METADATA.hhDirectasTanque;
  const pctHH = Math.min(100, Math.round((totalHH / baselineHH) * 100));

  const safeSiahoCount = scopedRecords.filter(
    (r) =>
      r.siaho.artVerificado &&
      evaluateAtmosphericSafety(r.siaho.readings).allSafe
  ).length;
  const pctSiaho =
    scopedRecords.length > 0
      ? Math.round((safeSiahoCount / scopedRecords.length) * 100)
      : 100;

  const pendingSyncCount = records.filter((r) => !r.syncedToSheets).length;

  const navItems: { id: AppView; label: string }[] = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'registro', label: 'Registro' },
    { id: 'atlas', label: 'Planos y Partes' },
    { id: 'edt', label: 'EDT' },
    { id: 'siaho', label: 'SIAHO y EPP' },
    { id: 'sheets', label: 'Google Sheets' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Bar Contract: 3 zonas exactas (Marca — 5 enlaces — 1 acción primaria) */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-8 px-6 py-3.5">
          {/* Zona 1: Brand Title */}
          <button
            type="button"
            onClick={() => setActiveView('resumen')}
            className="text-left text-base font-extrabold tracking-tight text-[#0F2942] whitespace-nowrap shrink-0"
          >
            La Experta · API 653
          </button>

          {/* Zona 2: Enlaces de navegación de una sola línea */}
          <nav
            className="hidden md:flex items-center gap-6"
            aria-label="Navegación principal"
          >
            {navItems.map((item) => {
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  className={`border-b-2 py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'border-[#0F2942] font-semibold text-[#0F2942]'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zona 3: 1 Acción Primaria */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => handleOpenNewForm()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0F2942] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-900 whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Registro</span>
            </button>
          </div>
        </div>

        {/* Navegación móvil compacta */}
        <div className="flex md:hidden items-center gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveView(item.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 ${
                activeView === item.id
                  ? 'bg-[#0F2942] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* Barra Contextual del Workspace (Filtro de Tanques + Google Sheets Sign-In + KPI Strip) */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1320px] px-6 py-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Selector de Tanque Activo */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-slate-500">
                Activo / Tanque:
              </span>
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
                {(['Todos', 'T-2303', 'T-2208', 'T-2209'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTank(t)}
                    className={`rounded-md px-3 py-1 font-mono text-xs font-semibold transition-colors whitespace-nowrap ${
                      selectedTank === t
                        ? 'bg-white text-[#0F2942] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Estado Google Sheets / Sign In */}
            <div className="flex flex-wrap items-center gap-3">
              {!accessToken ? (
                <GoogleSignInButton
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  label={isLoggingIn ? 'Conectando...' : 'Sign in with Google'}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveView('sheets')}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 whitespace-nowrap"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
                  <span>
                    {connectedSheet
                      ? `${connectedSheet.title} (${pendingSyncCount} pend.)`
                      : `Google Conectado · ${user?.email || ''}`}
                  </span>
                </button>
              )}
            </div>
          </div>

          {authNotice && (
            <div
              className={`flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-xs font-medium ${
                authNotice.type === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-800'
                  : 'border-sky-200 bg-sky-50 text-sky-900'
              }`}
              role="status"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{authNotice.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setAuthNotice(null)}
                className="rounded p-1 hover:bg-black/5"
                aria-label="Cerrar aviso"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* 4-Column KPI Strip */}
          <div className="grid grid-cols-2 gap-4 pt-1 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">
                Órdenes de Mantenimiento
              </p>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-mono text-2xl font-bold tabular-nums text-slate-900">
                  {scopedRecords.length}
                </span>
                <span className="text-xs font-medium text-slate-600">
                  {scopedRecords.filter((r) => r.tipo === 'Preventivo').length} Prev ·{' '}
                  {scopedRecords.filter((r) => r.tipo === 'Correctivo').length} Corr
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">
                Horas-Hombre (HH Directas)
              </p>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-mono text-2xl font-bold tabular-nums text-sky-700">
                  {totalHH.toLocaleString()}
                </span>
                <span className="font-mono text-xs tabular-nums text-slate-600">
                  {pctHH}% de {baselineHH.toLocaleString()} HH
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">
                Cumplimiento SIAHO / API 2015
              </p>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="inline-flex items-center gap-1.5 font-mono text-2xl font-bold tabular-nums text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                  {pctSiaho}%
                </span>
                <span className="text-xs text-slate-600">
                  {safeSiahoCount}/{scopedRecords.length} aptos
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">
                Sincronización Google Sheets
              </p>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-mono text-2xl font-bold tabular-nums text-slate-900">
                  {pendingSyncCount === 0 ? 'Al día' : `${pendingSyncCount} pend.`}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveView('sheets')}
                  className="text-xs font-semibold text-sky-700 hover:underline whitespace-nowrap"
                >
                  {connectedSheet ? 'Sincronizar ahora' : 'Configurar hoja'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="mx-auto w-full max-w-[1320px] flex-1 px-6 py-8">
        {activeView === 'resumen' && (
          <DashboardSummary
            records={records}
            selectedTank={selectedTank}
            onOpenNewForm={handleOpenNewForm}
            onSelectPhaseFilter={(phaseId) => {
              setSelectedPhase(phaseId);
              setActiveView('registro');
            }}
            onSelectRecordEdit={(rec) => {
              setEditingRecord(rec);
              setFormOpen(true);
            }}
          />
        )}

        {activeView === 'registro' && (
          <MaintenanceRegistryView
            records={records}
            selectedTank={selectedTank}
            selectedPhase={selectedPhase}
            onPhaseChange={setSelectedPhase}
            onOpenNewForm={() => handleOpenNewForm()}
            onEditRecord={(rec) => {
              setEditingRecord(rec);
              setFormOpen(true);
            }}
            onDuplicateRecord={handleDuplicateRecord}
            onDeleteRecord={(rec) => setRecordToDelete(rec)}
          />
        )}

        {activeView === 'atlas' && (
          <TankAtlasView
            selectedTank={selectedTank}
            onSelectTank={setSelectedTank}
            records={records}
            onRegisterForComponent={(edtCode, tankId) =>
              handleOpenNewForm(edtCode, tankId)
            }
          />
        )}

        {activeView === 'edt' && (
          <EdtExplorerView
            records={records}
            onRegisterFromEdt={(edtCode) => handleOpenNewForm(edtCode)}
          />
        )}

        {activeView === 'siaho' && <SiahoSafetyView records={records} />}

        {activeView === 'sheets' && (
          <GoogleSheetsSyncView
            user={user}
            accessToken={accessToken}
            isLoggingIn={isLoggingIn}
            onLogin={handleGoogleLogin}
            onLogout={handleGoogleLogout}
            records={records}
            connectedSheet={connectedSheet}
            onUpdateConnectedSheet={setConnectedSheet}
            onImportRecords={handleImportRecords}
            onMarkAllSynced={handleMarkAllSynced}
          />
        )}
      </main>

      {/* Footer Limpio */}
      <footer className="border-t border-slate-200 bg-white py-5">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-4 px-6 text-xs text-slate-500">
          <span>
            {PROJECT_METADATA.empresaEjecutora} · {PROJECT_METADATA.ingenieroResidente}
          </span>
          <span>
            Normativa Rectora: {PROJECT_METADATA.normativaRectora} · Activos: T-2303, T-2208,
            T-2209
          </span>
        </div>
      </footer>

      {/* Modal Formulario de Registro */}
      <MaintenanceFormModal
        open={formOpen}
        initialRecord={editingRecord}
        presetEdt={presetEdt}
        presetTank={presetTank || (selectedTank === 'Todos' ? 'T-2303' : selectedTank)}
        existingCount={records.length}
        onClose={() => {
          setFormOpen(false);
          setEditingRecord(null);
          setPresetEdt(null);
          setPresetTank(null);
        }}
        onSave={handleSaveRecord}
      />

      {/* Confirmación de Eliminación */}
      <ConfirmDialog
        open={recordToDelete !== null}
        variant="danger"
        title="Eliminar registro de mantenimiento"
        description="¿Confirmas que deseas eliminar permanentemente este registro técnico de la bitácora local?"
        details={
          recordToDelete
            ? [
                `Orden: ${recordToDelete.codigoOrden} (${recordToDelete.tanque})`,
                `Actividad: ${recordToDelete.actividadNombre}`,
                `Horas-Hombre: ${recordToDelete.horasHombre} HH`,
              ]
            : []
        }
        confirmLabel="Eliminar Registro"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setRecordToDelete(null)}
      />
    </div>
  );
}
