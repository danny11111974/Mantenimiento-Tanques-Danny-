import { TankId } from '../types/maintenance';

export type ComponentDiscipline =
  | 'Mecánico'
  | 'Hidráulico'
  | 'Neumático'
  | 'Eléctrico'
  | 'Control e Instrumentación';

export interface TankTechnicalProfile {
  id: TankId;
  nombre: string;
  servicio: string;
  tipoTecho: string;
  capacidadNominal: string;
  dimensiones: string;
  materialPrincipal: string;
  normaDiseno: string;
  anioConstruccion: string;
  heroPhoto: string;
}

export interface TankPartItem {
  id: string;
  tag: string;
  name: string;
  discipline: ComponentDiscipline;
  disciplineColor: string;
  summary: string;
  specs: string;
  materials: string;
  standard: string;
  linkedEdt: string;
  photoUrl: string;
  photoCaption: string;
  blueprintView: 'elevation' | 'pid';
  hotspotX: number; // SVG viewBox 0..800
  hotspotY: number; // SVG viewBox 0..460
}

export const TANK_IMAGES = {
  heroFloatingRoof: '/src/assets/images/tank_floating_roof_1794919964261.jpg',
  mechanicalSeals: '/src/assets/images/mechanical_shell_seals_1794919963527.jpg',
  hydraulicSci: '/src/assets/images/hydraulic_sci_pumps_1794919964266.jpg',
  pneumaticVenturi: '/src/assets/images/pneumatic_blasting_venturi_1794919966183.jpg',
  electricalInst: '/src/assets/images/electrical_instrumentation_panel_1794919967021.jpg',
};

export const TANK_PROFILES: Record<TankId, TankTechnicalProfile> = {
  'T-2303': {
    id: 'T-2303',
    nombre: 'Tanque Atmosférico T-2303',
    servicio: 'Almacenamiento de Crudo / Hidrocarburos Pesados',
    tipoTecho: 'Techo Flotante Externo de Pontón Anular (API 650 Anexo C)',
    capacidadNominal: '80,000 Bls (Estándar)',
    dimensiones: 'Diámetro 36.6 m (120 ft) × Altura 14.6 m (48 ft) · 6 Virolas',
    materialPrincipal: 'Acero al Carbono ASTM A36 / A283 Gr. C',
    normaDiseno: 'API 650 / Inspección & Rehabilitación API 653',
    anioConstruccion: 'Servicio Continuo · Turnaround 55 Días',
    heroPhoto: TANK_IMAGES.heroFloatingRoof,
  },
  'T-2208': {
    id: 'T-2208',
    nombre: 'Tanque Atmosférico T-2208',
    servicio: 'Almacenamiento de Crudo Liviano / Intermedio',
    tipoTecho: 'Techo Flotante Externo con Sellos Dobles Viton',
    capacidadNominal: '80,000 Bls (Estándar)',
    dimensiones: 'Diámetro 36.6 m (120 ft) × Altura 14.6 m (48 ft) · 6 Virolas',
    materialPrincipal: 'Acero al Carbono ASTM A36 / A283 Gr. C',
    normaDiseno: 'API 650 Anexo H / API 653',
    anioConstruccion: 'Fast-Tracking +14 Días · Turnaround 55 Días',
    heroPhoto: TANK_IMAGES.heroFloatingRoof,
  },
  'T-2209': {
    id: 'T-2209',
    nombre: 'Tanque Atmosférico T-2209',
    servicio: 'Almacenamiento Operativo / Buffer de Trasiego',
    tipoTecho: 'Techo Flotante Externo con Drenaje Articulado 4"',
    capacidadNominal: '80,000 Bls (Estándar)',
    dimensiones: 'Diámetro 36.6 m (120 ft) × Altura 14.6 m (48 ft) · 6 Virolas',
    materialPrincipal: 'Acero al Carbono ASTM A36 / A283 Gr. C',
    normaDiseno: 'API 650 / API 653 / NFPA 11-15',
    anioConstruccion: 'Fast-Tracking +28 Días · Turnaround 55 Días',
    heroPhoto: TANK_IMAGES.heroFloatingRoof,
  },
};

export const DISCIPLINE_META: {
  id: ComponentDiscipline;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}[] = [
  {
    id: 'Mecánico',
    color: '#D97706',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-200',
  },
  {
    id: 'Hidráulico',
    color: '#0284C7',
    bgClass: 'bg-sky-50',
    textClass: 'text-sky-800',
    borderClass: 'border-sky-200',
  },
  {
    id: 'Neumático',
    color: '#0D9488',
    bgClass: 'bg-teal-50',
    textClass: 'text-teal-800',
    borderClass: 'border-teal-200',
  },
  {
    id: 'Eléctrico',
    color: '#4F46E5',
    bgClass: 'bg-indigo-50',
    textClass: 'text-indigo-800',
    borderClass: 'border-indigo-200',
  },
  {
    id: 'Control e Instrumentación',
    color: '#059669',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-200',
  },
];

export const TANK_PARTS: TankPartItem[] = [
  // ===================== MECÁNICOS =====================
  {
    id: 'mec-floor',
    tag: 'MEC-01',
    name: 'Láminas de Piso y Anillo Anular',
    discipline: 'Mecánico',
    disciplineColor: '#D97706',
    summary:
      'Placas de fondo soldadas a traslape y anillo perimetral sometido a escaneo MFL 100%, reemplazo o parches de refuerzo (lap patches).',
    specs: 'Espesores 1/4", 5/16" y 3/8" · Soldadura AWS E6010 / E7018 · Prueba Vacuum Box 5–8 PSI',
    materials: 'Láminas ASTM A36 / A283 Gr. C, electrodos bajo hidrógeno',
    standard: 'API 653 Sec. 9.10 / ASME Sec. IX',
    linkedEdt: '3.1',
    photoUrl: TANK_IMAGES.heroFloatingRoof,
    photoCaption: 'Estructura base y envolvente del tanque sobre fundación anular',
    blueprintView: 'elevation',
    hotspotX: 390,
    hotspotY: 382,
  },
  {
    id: 'mec-shell',
    tag: 'MEC-02',
    name: 'Virolas de Envolvente (Pared) y Soldaduras',
    discipline: 'Mecánico',
    disciplineColor: '#D97706',
    summary:
      'Anillos cilíndricos de acero estructural evaluados por verticalidad, asentamiento diferencial y espesor residual por ultrasonido (UT).',
    specs: '6 virolas progresivas · Protección SSPC-SP10 (2.5–3.5 mils anclaje) + Epóxico/Poliuretano',
    materials: 'Placas ASTM A36, esquema epóxico altos sólidos + poliuretano UV',
    standard: 'API 653 Sec. 4, 6 y 9.2 · SSPC-SP10',
    linkedEdt: '2.3',
    photoUrl: TANK_IMAGES.mechanicalSeals,
    photoCaption: 'Cordones de soldadura en pared y recubrimiento anticorrosivo industrial',
    blueprintView: 'elevation',
    hotspotX: 215,
    hotspotY: 268,
  },
  {
    id: 'mec-roof-seals',
    tag: 'MEC-03',
    name: 'Techo Flotante, Pontones y Sellos Perimetrales',
    discipline: 'Mecánico',
    disciplineColor: '#D97706',
    summary:
      'Cubierta flotante con compartimentos estancos (pontones), patas calibrables y sellos primarios tipo zapata metálica + secundarios Viton.',
    specs: 'Prueba estanqueidad pontones 2–3 PSI · Compresión perimetral continua contra pared',
    materials: 'Zapata metálica galvanizada/inox 304, elastómero Viton/Poliuretano, flejes inox 316',
    standard: 'API 650 Anexo C y H / API 653',
    linkedEdt: '4.1',
    photoUrl: TANK_IMAGES.mechanicalSeals,
    photoCaption: 'Detalle de sellos elastoméricos perimetrales y tornillería inoxidable',
    blueprintView: 'elevation',
    hotspotX: 430,
    hotspotY: 162,
  },
  {
    id: 'mec-nozzles-loto',
    tag: 'MEC-04',
    name: 'Boquillas, Manholes (24"/36") y Bridas Ciegas',
    discipline: 'Mecánico',
    disciplineColor: '#D97706',
    summary:
      'Conexiones de succión/descarga, accesos hombre en pared/techo y raquetas de aislamiento mecánico LOTO con torque controlado.',
    specs: 'Bridas ANSI 150# · Empacaduras espirometálicas / grafitadas · Espárragos ASTM A193 B7',
    materials: 'Bridas ciegas identificadas, empacaduras nuevas, lubricante anti-seize',
    standard: 'OSHA 1910.147 / API 653 Sec. 9.9 / API 2015',
    linkedEdt: '1.1',
    photoUrl: TANK_IMAGES.mechanicalSeals,
    photoCaption: 'Brida de boquilla empernada con espárragos B7 y placa de aislamiento',
    blueprintView: 'elevation',
    hotspotX: 196,
    hotspotY: 345,
  },
  {
    id: 'mec-stairs',
    tag: 'MEC-05',
    name: 'Escaleras Helicoidales y Plataformas Superiores',
    discipline: 'Mecánico',
    disciplineColor: '#D97706',
    summary:
      'Acceso perimetral helicoidal con peldaños grating antideslizantes, barandas de seguridad y plataforma de aforo en corona.',
    specs: 'Rehabilitación estructural, reemplazo de ángulos/rejillas corroídas y pintura poliuretano',
    materials: 'Perfiles estructurales ASTM A36, rejillas grating galvanizadas',
    standard: 'API 650 / OSHA Trabajo en Altura (> 1.80 m)',
    linkedEdt: '3.4',
    photoUrl: TANK_IMAGES.heroFloatingRoof,
    photoCaption: 'Escalera helicoidal envolvente y pasarela superior perimetral',
    blueprintView: 'elevation',
    hotspotX: 575,
    hotspotY: 225,
  },

  // ===================== HIDRÁULICOS =====================
  {
    id: 'hid-drain',
    tag: 'HID-01',
    name: 'Drenaje Articulado de Techo y Juntas Giratorias',
    discipline: 'Hidráulico',
    disciplineColor: '#0284C7',
    summary:
      'Sistema articulado sumergido para evacuación pluvial desde el sumidero del techo flotante hacia válvula exterior sin pérdida de hermeticidad.',
    specs: 'Tubería 4" Sch 40 · Juntas giratorias (swivel joints) · Prueba hidrostática 50 PSI',
    materials: 'Tubería ASTM A106 Gr. B, sellos Viton, grasa grafitada, codos acero al carbono',
    standard: 'API 650 Anexo H',
    linkedEdt: '4.2',
    photoUrl: TANK_IMAGES.hydraulicSci,
    photoCaption: 'Múltiple hidráulico con juntas flexibles, válvulas y manómetros de prueba',
    blueprintView: 'elevation',
    hotspotX: 350,
    hotspotY: 245,
  },
  {
    id: 'hid-pumps',
    tag: 'HID-02',
    name: 'Bombas Centrífugas Antiexplosión y Línea Trasiego',
    discipline: 'Hidráulico',
    disciplineColor: '#0284C7',
    summary:
      'Equipos de bombeo hidráulico para trasiego de crudo remanente hacia tanques operativos e hidrojetting de alta presión (3,000–5,000 PSI).',
    specs: 'Motor antiexplosión · Contención secundaria antiderrame · Válvulas compuerta 150#',
    materials: 'Mangueras antiestáticas, acoples rápidos certificados, válvulas bridadas',
    standard: 'API 2015 / API 2016',
    linkedEdt: '1.2',
    photoUrl: TANK_IMAGES.hydraulicSci,
    photoCaption: 'Bomba centrífuga de trasiego sobre base de concreto con válvulas bridadas',
    blueprintView: 'pid',
    hotspotX: 165,
    hotspotY: 325,
  },
  {
    id: 'hid-sci',
    tag: 'HID-03',
    name: 'Cámaras de Espuma y Anillo Contra Incendio (SCI)',
    discipline: 'Hidráulico',
    disciplineColor: '#0284C7',
    summary:
      'Red hidráulica perimetral de enfriamiento por agua pulverizada y cámaras generadoras de espuma con disco de ruptura en corona del tanque.',
    specs: 'Anillo aspersores NFPA 15 · Cámaras de espuma NFPA 11 · Prueba de flujo hasta 300 PSI',
    materials: 'Discos de ruptura de vidrio, boquillas aspersoras bronce/inox, tubería ASTM A53/A106',
    standard: 'NFPA 11 / NFPA 15 / NFPA 25',
    linkedEdt: '4.3',
    photoUrl: TANK_IMAGES.hydraulicSci,
    photoCaption: 'Columnas ascendentes rojas SCI con válvulas de control y manómetros',
    blueprintView: 'elevation',
    hotspotX: 598,
    hotspotY: 132,
  },

  // ===================== NEUMÁTICOS =====================
  {
    id: 'neu-venturi',
    tag: 'NEU-01',
    name: 'Extractores / Sopladores Neumáticos Venturi',
    discipline: 'Neumático',
    disciplineColor: '#0D9488',
    summary:
      'Equipos de ventilación forzada accionados por aire comprimido sin partes eléctricas móviles para desgasificación segura de hidrocarburos.',
    specs: 'Montaje directo en manholes de pared y techo · Puesta a tierra antiestática obligatoria',
    materials: 'Ductos antiestáticos flexibles, mangueras de aire comprimido con seguros whip-check',
    standard: 'API 2015 / API 2016',
    linkedEdt: '1.3',
    photoUrl: TANK_IMAGES.pneumaticVenturi,
    photoCaption: 'Extractor neumático de desgasificación operando sobre manhole de acceso',
    blueprintView: 'pid',
    hotspotX: 405,
    hotspotY: 120,
  },
  {
    id: 'neu-diaphragm',
    tag: 'NEU-02',
    name: 'Bombas Neumáticas de Doble Diafragma (Borra)',
    discipline: 'Neumático',
    disciplineColor: '#0D9488',
    summary:
      'Bombas autocebantes accionadas por aire comprimido para succión de borra petrolizada, lodos pesados y aguas aceitosas hacia tratamiento.',
    specs: 'Operación intrínsecamente segura en zona 0/1 · Filtro regulador lubricador (FRL)',
    materials: 'Diafragmas de Viton/Buna-N, mangueras de succión antiestáticas, tambores 55 gal',
    standard: 'API 2016 / SIAHO Control Ambiental',
    linkedEdt: '1.4',
    photoUrl: TANK_IMAGES.pneumaticVenturi,
    photoCaption: 'Bomba neumática de doble diafragma con múltiple distribuidor de aire',
    blueprintView: 'pid',
    hotspotX: 595,
    hotspotY: 325,
  },
  {
    id: 'neu-blasting',
    tag: 'NEU-03',
    name: 'Compresores Diésel, Tolvas y Caja de Vacío',
    discipline: 'Neumático',
    disciplineColor: '#0D9488',
    summary:
      'Sistema neumático de alto caudal para granallado abrasivo SSPC-SP10, aplicación Airless (45:1/60:1) y pruebas de vacío en soldaduras.',
    specs: 'Compresores 375–750 CFM · Post-enfriadores · Caja de vacío 5–8 PSI (0–30 inHg)',
    materials: 'Boquillas Venturi carburo de tungsteno, abrasivo mineral libre de sílice, solución jabonosa',
    standard: 'SSPC-SP10 / API 650 Sec. 7.3.3',
    linkedEdt: '5.1',
    photoUrl: TANK_IMAGES.pneumaticVenturi,
    photoCaption: 'Compresor portátil industrial y manifold neumático con manómetros',
    blueprintView: 'pid',
    hotspotX: 255,
    hotspotY: 118,
  },

  // ===================== ELÉCTRICOS =====================
  {
    id: 'ele-grounding',
    tag: 'ELE-01',
    name: 'Puesta a Tierra Equipotencial y Shunts de Techo',
    discipline: 'Eléctrico',
    disciplineColor: '#4F46E5',
    summary:
      'Barra maestra de cobre y trenzas flexibles que garantizan continuidad eléctrica entre fundación, envolvente, techo flotante y máquinas de soldar.',
    specs: 'Resistencia de puesta a tierra < 5 Ω · Derivaciones perimetrales cada 30 m en corona',
    materials: 'Barra cobre 3/16" × 1", cable cobre desnudo trenzado, conectores bimetálicos',
    standard: 'API RP 2003 / NFPA 780 / SIAHO Trabajos en Caliente',
    linkedEdt: '3.2',
    photoUrl: TANK_IMAGES.electricalInst,
    photoCaption: 'Barra maestra de cobre y trenza equipotencial soldada a envolvente',
    blueprintView: 'elevation',
    hotspotX: 162,
    hotspotY: 382,
  },
  {
    id: 'ele-class1',
    tag: 'ELE-02',
    name: 'Cajas Antiexplosión Clase I Div. 1 y LOTO Eléctrico',
    discipline: 'Eléctrico',
    disciplineColor: '#4F46E5',
    summary:
      'Envolventes a prueba de explosión, sellos cortafuego conduit, luminarias intrínsecamente seguras y seccionadores con bloqueo/etiquetado LOTO.',
    specs: 'NEMA 7 / Clase I Div. 1 Grupos C y D · Alimentación 24 VDC intrínsecamente segura interna',
    materials: 'Cajas Killark aluminio libre de cobre, sellos EYS, candados y tarjetas LOTO',
    standard: 'NEC Art. 500 / OSHA 1910.147',
    linkedEdt: '1.1',
    photoUrl: TANK_IMAGES.electricalInst,
    photoCaption: 'Caja eléctrica a prueba de explosión Clase I Div. 1 con conduit rígido',
    blueprintView: 'pid',
    hotspotX: 595,
    hotspotY: 205,
  },

  // ===================== CONTROL E INSTRUMENTACIÓN =====================
  {
    id: 'ins-radar',
    tag: 'INS-01',
    name: 'Transmisor de Nivel por Radar (LT-101) y Lazos 4–20 mA',
    discipline: 'Control e Instrumentación',
    disciplineColor: '#059669',
    summary:
      'Medición continua de nivel de crudo por radar de onda guiada/libre con enclavamiento de alarmas de alto nivel (LAHH) hacia sala de control.',
    specs: 'Brida DN100 150# RF · Señal HART 4–20 mA · Precisión ±2 mm · Certificado Ex d',
    materials: 'Transmisor radar industrial, pozo tranquilizador (stilling well), cable instrumentación apantallado',
    standard: 'API MPMS Cap. 3.1B / ISA-5.1',
    linkedEdt: '2.1',
    photoUrl: TANK_IMAGES.electricalInst,
    photoCaption: 'Transmisor de nivel LT-101 montado sobre boquilla bridada en techo',
    blueprintView: 'elevation',
    hotspotX: 350,
    hotspotY: 112,
  },
  {
    id: 'ins-pressure',
    tag: 'INS-02',
    name: 'Manómetros Calibrados, Vacuómetros y Termohigrómetros',
    discipline: 'Control e Instrumentación',
    disciplineColor: '#059669',
    summary:
      'Instrumentación certificada para pruebas neumáticas de pontones (0–15 PSI), pruebas hidrostáticas (0–300 PSI) y caja de vacío (0–30 inHg).',
    specs: 'Exactitud ±0.5% FS · Calibración trazable vigente · Sicrómetro punto de rocío (Fase V)',
    materials: 'Manómetros glicerina acero inox 316, válvulas aguja de bloqueo, vacuómetro patrón',
    standard: 'ASME B40.100 / API 653 / SSPC-PA2',
    linkedEdt: '6.1',
    photoUrl: TANK_IMAGES.electricalInst,
    photoCaption: 'Manómetro industrial calibrado con sello de verificación vigente',
    blueprintView: 'pid',
    hotspotX: 415,
    hotspotY: 235,
  },
  {
    id: 'ins-gas-ndt',
    tag: 'INS-03',
    name: 'Explosímetros Multigas (AT-2015) y Equipos NDT',
    discipline: 'Control e Instrumentación',
    disciplineColor: '#059669',
    summary:
      'Monitoreo atmosférico continuo (O₂, LEL, H₂S, CO) y suite de instrumentación NDT: Escáner MFL, Ultrasonido A/B-Scan, PosiTector DFT y Holiday.',
    specs: 'O₂: 19.5–23.5% · LEL: 0% · H₂S < 10 ppm · CO < 25 ppm · Detector Holiday 67.5V',
    materials: 'Sensores electroquímicos/catalíticos calibrados, gel acoplante UT, cinta Testex',
    standard: 'API 2015 / NFPA 326 / ASME Sec. V / NACE SP0188',
    linkedEdt: '1.5',
    photoUrl: TANK_IMAGES.pneumaticVenturi,
    photoCaption: 'Control atmosférico en boca de espacio confinado previo al ingreso',
    blueprintView: 'pid',
    hotspotX: 415,
    hotspotY: 365,
  },
];
