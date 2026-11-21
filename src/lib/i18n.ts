export type LanguageCode = "en" | "es" | "zh" | "fr" | "vi" | "ht";

export interface LanguageOption {
  code: LanguageCode;
  nativeLabel: string;
  englishLabel: string;
}

export const LANGUAGES: readonly LanguageOption[] = [
  { code: "en", nativeLabel: "English", englishLabel: "English" },
  { code: "es", nativeLabel: "Español", englishLabel: "Spanish" },
  { code: "zh", nativeLabel: "中文", englishLabel: "Mandarin Chinese" },
  { code: "fr", nativeLabel: "Français", englishLabel: "French" },
  { code: "vi", nativeLabel: "Tiếng Việt", englishLabel: "Vietnamese" },
  { code: "ht", nativeLabel: "Kreyòl Ayisyen", englishLabel: "Haitian Creole" },
];

export interface TranslationDict {
  tagline: string;
  languageLabel: string;
  profileTitle: string;
  phoneLabel: string;
  phonePlaceholder: string;
  timezoneLabel: string;
  saveProfile: string;
  saving: string;
  profileSavedToast: string;
  invalidPhoneError: string;
  addMedTitle: string;
  addMedSubtitle: string;
  medNameLabel: string;
  medNamePlaceholder: string;
  quickSelectLabel: string;
  dosageLabel: string;
  dosagePlaceholder: string;
  instructionsLabel: string;
  instructionsPlaceholder: string;
  daysLabel: string;
  everyDay: string;
  timeLabel: string;
  addReminderBtn: string;
  medAddedToast: string;
  medValidationError: string;
  scheduleTitle: string;
  scheduleEmpty: string;
  activeBadge: string;
  pausedBadge: string;
  deleteBtn: string;
  medDeletedToast: string;
  autoSendNote: string;
  autoSentToast: string;
  lastSentLabel: string;
  phonePreviewTitle: string;
  phonePreviewSubtitle: string;
  smsHeaderSub: string;
  liveTemplateLabel: string;
  sentHistoryLabel: string;
  waitingForSchedule: string;
  charsLabel: string;
  noMedPreview: string;
  daysShort: readonly [string, string, string, string, string, string, string];
  smsPrefix: string;
}

export const TRANSLATIONS: Record<LanguageCode, TranslationDict> = {
  en: {
    tagline: "Multilingual Medication Reminders",
    languageLabel: "Language",
    profileTitle: "Patient Profile",
    phoneLabel: "Phone Number",
    phonePlaceholder: "+1 (555) 234-5678",
    timezoneLabel: "Timezone",
    saveProfile: "Save Profile",
    saving: "Saving...",
    profileSavedToast: "Patient profile saved",
    invalidPhoneError: "Enter a valid phone number with country code (e.g. +1 555 234 5678).",
    addMedTitle: "Add Medication",
    addMedSubtitle: "Set up a simple text reminder for yourself or a loved one.",
    medNameLabel: "Medication Name",
    medNamePlaceholder: "e.g., Metformin",
    quickSelectLabel: "Common medications:",
    dosageLabel: "Dosage",
    dosagePlaceholder: "e.g., 500mg — 1 tablet",
    instructionsLabel: "Special Instructions",
    instructionsPlaceholder: "e.g., Take with food",
    daysLabel: "Reminder Days",
    everyDay: "Every Day",
    timeLabel: "Reminder Time",
    addReminderBtn: "Add Reminder",
    medAddedToast: "Medication reminder added",
    medValidationError: "Please enter a medication name, dosage, and at least one day.",
    scheduleTitle: "Active Medication Schedule",
    scheduleEmpty: "No reminders yet. Add a medication above to get started.",
    activeBadge: "Active",
    pausedBadge: "Paused",
    deleteBtn: "Delete",
    medDeletedToast: "Medication removed",
    autoSendNote: "Sends automatically at scheduled time",
    autoSentToast: "Automatic medication reminder sent",
    lastSentLabel: "Last sent",
    phonePreviewTitle: "Live SMS Phone Preview",
    phonePreviewSubtitle: "Messages appear here automatically when it is time to take pills.",
    smsHeaderSub: "DoseBridge Health SMS",
    liveTemplateLabel: "Next message preview",
    sentHistoryLabel: "Sent automatically",
    waitingForSchedule: "Messages will arrive automatically at each scheduled pill time.",
    charsLabel: "chars",
    noMedPreview: "Add a medication to preview your translated SMS reminder.",
    daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    smsPrefix: "DoseBridge: Time for",
  },
  es: {
    tagline: "Recordatorios de Medicinas en Tu Idioma",
    languageLabel: "Idioma",
    profileTitle: "Perfil del Paciente",
    phoneLabel: "Número de Teléfono",
    phonePlaceholder: "+1 (555) 234-5678",
    timezoneLabel: "Zona Horaria",
    saveProfile: "Guardar Perfil",
    saving: "Guardando...",
    profileSavedToast: "Perfil del paciente guardado",
    invalidPhoneError: "Ingresa un número válido con código de país (ej. +1 555 234 5678).",
    addMedTitle: "Agregar Medicina",
    addMedSubtitle: "Crea un recordatorio sencillo por mensaje de texto.",
    medNameLabel: "Nombre de la Medicina",
    medNamePlaceholder: "ej., Metformin",
    quickSelectLabel: "Medicinas comunes:",
    dosageLabel: "Dosis",
    dosagePlaceholder: "ej., 500mg — 1 pastilla",
    instructionsLabel: "Instrucciones Especiales",
    instructionsPlaceholder: "ej., Tomar con comida",
    daysLabel: "Días del Recordatorio",
    everyDay: "Todos los Días",
    timeLabel: "Hora del Recordatorio",
    addReminderBtn: "Agregar Recordatorio",
    medAddedToast: "Recordatorio de medicina agregado",
    medValidationError: "Escribe el nombre, la dosis y elige al menos un día.",
    scheduleTitle: "Horario de Medicinas",
    scheduleEmpty: "Aún no hay recordatorios. Agrega una medicina arriba.",
    activeBadge: "Activo",
    pausedBadge: "Pausado",
    deleteBtn: "Eliminar",
    medDeletedToast: "Medicina eliminada",
    autoSendNote: "Se envía automáticamente a la hora programada",
    autoSentToast: "Recordatorio automático enviado",
    lastSentLabel: "Último envío",
    phonePreviewTitle: "Vista Previa del SMS",
    phonePreviewSubtitle: "Los mensajes llegan automáticamente cuando toca tomar la medicina.",
    smsHeaderSub: "DoseBridge Salud SMS",
    liveTemplateLabel: "Vista previa del mensaje",
    sentHistoryLabel: "Enviado automáticamente",
    waitingForSchedule: "Los mensajes llegarán automáticamente a cada hora programada.",
    charsLabel: "caracteres",
    noMedPreview: "Agrega una medicina para ver el mensaje traducido.",
    daysShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
    smsPrefix: "DoseBridge: Hora de",
  },
  zh: {
    tagline: "多语言服药提醒助手",
    languageLabel: "语言",
    profileTitle: "患者资料",
    phoneLabel: "手机号码",
    phonePlaceholder: "+1 (555) 234-5678",
    timezoneLabel: "时区",
    saveProfile: "保存资料",
    saving: "保存中...",
    profileSavedToast: "患者资料已保存",
    invalidPhoneError: "请输入带国家区号的有效手机号（如 +1 555 234 5678）。",
    addMedTitle: "添加药物",
    addMedSubtitle: "为您或家人设置简单清楚的短信服药提醒。",
    medNameLabel: "药物名称",
    medNamePlaceholder: "例如：Metformin",
    quickSelectLabel: "常用药物：",
    dosageLabel: "服用剂量",
    dosagePlaceholder: "例如：500mg — 1片",
    instructionsLabel: "特别说明",
    instructionsPlaceholder: "例如：随餐服用",
    daysLabel: "提醒日期",
    everyDay: "每天",
    timeLabel: "提醒时间",
    addReminderBtn: "添加提醒",
    medAddedToast: "已添加服药提醒",
    medValidationError: "请填写药物名称、剂量，并至少选择一天。",
    scheduleTitle: "当前服药计划",
    scheduleEmpty: "暂无提醒，请在上方添加一种药物。",
    activeBadge: "已开启",
    pausedBadge: "已暂停",
    deleteBtn: "删除",
    medDeletedToast: "药物已删除",
    autoSendNote: "到设定时间自动发送提醒",
    autoSentToast: "已自动发送服药提醒",
    lastSentLabel: "上次发送",
    phonePreviewTitle: "实时手机短信预览",
    phonePreviewSubtitle: "到了服药时间，提醒短信会自动显示在这里。",
    smsHeaderSub: "DoseBridge 健康短信",
    liveTemplateLabel: "下一条短信预览",
    sentHistoryLabel: "已自动发送",
    waitingForSchedule: "到每个服药时间后，短信将自动送达。",
    charsLabel: "字",
    noMedPreview: "添加药物后即可预览对应语言的短信提醒。",
    daysShort: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
    smsPrefix: "DoseBridge提醒：请服用",
  },
  fr: {
    tagline: "Rappels de Médicaments Multilingues",
    languageLabel: "Langue",
    profileTitle: "Profil du Patient",
    phoneLabel: "Numéro de Téléphone",
    phonePlaceholder: "+1 (555) 234-5678",
    timezoneLabel: "Fuseau Horaire",
    saveProfile: "Enregistrer",
    saving: "Enregistrement...",
    profileSavedToast: "Profil du patient enregistré",
    invalidPhoneError: "Entrez un numéro valide avec indicatif pays (ex. +1 555 234 5678).",
    addMedTitle: "Ajouter un Médicament",
    addMedSubtitle: "Créez un rappel SMS clair pour vous ou un proche.",
    medNameLabel: "Nom du Médicament",
    medNamePlaceholder: "ex., Metformin",
    quickSelectLabel: "Médicaments courants :",
    dosageLabel: "Dose",
    dosagePlaceholder: "ex., 500mg — 1 comprimé",
    instructionsLabel: "Consignes Spéciales",
    instructionsPlaceholder: "ex., Prendre avec un repas",
    daysLabel: "Jours de Rappel",
    everyDay: "Tous les Jours",
    timeLabel: "Heure du Rappel",
    addReminderBtn: "Ajouter le Rappel",
    medAddedToast: "Rappel de médicament ajouté",
    medValidationError: "Indiquez le nom, la dose et au moins un jour.",
    scheduleTitle: "Programme de Médicaments",
    scheduleEmpty: "Aucun rappel. Ajoutez un médicament ci-dessus.",
    activeBadge: "Actif",
    pausedBadge: "En pause",
    deleteBtn: "Supprimer",
    medDeletedToast: "Médicament supprimé",
    autoSendNote: "Envoi automatique à l'heure prévue",
    autoSentToast: "Rappel automatique envoyé",
    lastSentLabel: "Dernier envoi",
    phonePreviewTitle: "Aperçu SMS en Direct",
    phonePreviewSubtitle: "Les messages arrivent automatiquement à l'heure de la prise.",
    smsHeaderSub: "DoseBridge Santé SMS",
    liveTemplateLabel: "Aperçu du prochain SMS",
    sentHistoryLabel: "Envoyé automatiquement",
    waitingForSchedule: "Les rappels s'afficheront automatiquement à chaque heure prévue.",
    charsLabel: "car.",
    noMedPreview: "Ajoutez un médicament pour voir l'aperçu du SMS.",
    daysShort: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
    smsPrefix: "DoseBridge : Prenez",
  },
  vi: {
    tagline: "Nhắc Uống Thuốc Đa Ngôn Ngữ",
    languageLabel: "Ngôn ngữ",
    profileTitle: "Hồ Sơ Bệnh Nhân",
    phoneLabel: "Số Điện Thoại",
    phonePlaceholder: "+1 (555) 234-5678",
    timezoneLabel: "Múi Giờ",
    saveProfile: "Lưu Hồ Sơ",
    saving: "Đang lưu...",
    profileSavedToast: "Đã lưu hồ sơ bệnh nhân",
    invalidPhoneError: "Nhập số điện thoại hợp lệ có mã vùng (vd: +1 555 234 5678).",
    addMedTitle: "Thêm Thuốc",
    addMedSubtitle: "Tạo tin nhắn nhắc uống thuốc dễ hiểu cho bạn hoặc người thân.",
    medNameLabel: "Tên Thuốc",
    medNamePlaceholder: "vd: Metformin",
    quickSelectLabel: "Thuốc thường dùng:",
    dosageLabel: "Liều Dùng",
    dosagePlaceholder: "vd: 500mg — 1 viên",
    instructionsLabel: "Hướng Dẫn Thêm",
    instructionsPlaceholder: "vd: Uống cùng bữa ăn",
    daysLabel: "Ngày Nhắc",
    everyDay: "Mỗi Ngày",
    timeLabel: "Giờ Nhắc",
    addReminderBtn: "Thêm Lịch Nhắc",
    medAddedToast: "Đã thêm lịch nhắc thuốc",
    medValidationError: "Vui lòng nhập tên thuốc, liều dùng và chọn ít nhất một ngày.",
    scheduleTitle: "Lịch Uống Thuốc Hiện Tại",
    scheduleEmpty: "Chưa có lịch nhắc. Hãy thêm thuốc ở trên.",
    activeBadge: "Đang bật",
    pausedBadge: "Tạm dừng",
    deleteBtn: "Xóa",
    medDeletedToast: "Đã xóa thuốc",
    autoSendNote: "Tự động gửi đúng giờ đã đặt",
    autoSentToast: "Đã tự động gửi tin nhắn nhắc thuốc",
    lastSentLabel: "Gửi gần nhất",
    phonePreviewTitle: "Xem Trước Tin Nhắn SMS",
    phonePreviewSubtitle: "Tin nhắn sẽ tự động hiển thị tại đây khi đến giờ uống thuốc.",
    smsHeaderSub: "DoseBridge Y Tế SMS",
    liveTemplateLabel: "Xem trước tin nhắn kế tiếp",
    sentHistoryLabel: "Đã gửi tự động",
    waitingForSchedule: "Tin nhắn sẽ tự động gửi đến vào mỗi giờ uống thuốc đã đặt.",
    charsLabel: "ký tự",
    noMedPreview: "Thêm một loại thuốc để xem trước tin nhắn nhắc nhở.",
    daysShort: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
    smsPrefix: "DoseBridge: Đến giờ uống",
  },
  ht: {
    tagline: "Rapèl Medikaman nan Lang Ou",
    languageLabel: "Lang",
    profileTitle: "Pwofil Pasyan",
    phoneLabel: "Nimewo Telefòn",
    phonePlaceholder: "+1 (555) 234-5678",
    timezoneLabel: "Zòn Lè",
    saveProfile: "Sove Pwofil",
    saving: "Ap sove...",
    profileSavedToast: "Pwofil pasyan an sove",
    invalidPhoneError: "Antre yon nimewo telefòn ki bon ak kòd peyi a (egz. +1 555 234 5678).",
    addMedTitle: "Ajoute Medikaman",
    addMedSubtitle: "Mete yon rapèl SMS senp pou tèt ou oswa yon moun ou renmen.",
    medNameLabel: "Non Medikaman",
    medNamePlaceholder: "egz., Metformin",
    quickSelectLabel: "Medikaman komen:",
    dosageLabel: "Dòz",
    dosagePlaceholder: "egz., 500mg — 1 grenn",
    instructionsLabel: "Enstriksyon Espesyal",
    instructionsPlaceholder: "egz., Pran ak manje",
    daysLabel: "Jou Rapèl yo",
    everyDay: "Chak Jou",
    timeLabel: "Lè Rapèl la",
    addReminderBtn: "Ajoute Rapèl",
    medAddedToast: "Rapèl medikaman an ajoute",
    medValidationError: "Tanpri antre non medikaman an, dòz la, ak omwen yon jou.",
    scheduleTitle: "Orè Medikaman Aktif",
    scheduleEmpty: "Poko gen rapèl. Ajoute yon medikaman anwo a.",
    activeBadge: "Aktif",
    pausedBadge: "Sou Pòz",
    deleteBtn: "Efase",
    medDeletedToast: "Medikaman an efase",
    autoSendNote: "Voye otomatikman nan lè ki pwograme a",
    autoSentToast: "Rapèl medikaman otomatik la voye",
    lastSentLabel: "Dènye mesaj voye",
    phonePreviewTitle: "Apèsi SMS sou Telefòn",
    phonePreviewSubtitle: "Mesaj yo parèt la otomatikman lè li lè pou pran grenn yo.",
    smsHeaderSub: "DoseBridge Sante SMS",
    liveTemplateLabel: "Apèsi pwochen mesaj la",
    sentHistoryLabel: "Voye otomatikman",
    waitingForSchedule: "Mesaj yo ap rive otomatikman nan chak lè ki pwograme.",
    charsLabel: "lèt",
    noMedPreview: "Ajoute yon medikaman pou wè apèsi SMS la.",
    daysShort: ["Dim", "Len", "Mad", "Mèk", "Jed", "Van", "Sam"],
    smsPrefix: "DoseBridge: Lè pou pran",
  },
};

export function isLanguageCode(value: string): value is LanguageCode {
  return value in TRANSLATIONS;
}

const MAX_SMS_LENGTH = 149;

export function buildSmsReminderText(
  lang: LanguageCode,
  med: { name: string; dosage: string; instructions: string },
): string {
  const t = TRANSLATIONS[lang];
  const cleanName = med.name.trim();
  const cleanDosage = med.dosage.trim();
  const cleanInst = med.instructions.trim();
  const sep = lang === "zh" ? "，" : ". ";
  const space = lang === "zh" ? "" : " ";
  const end = lang === "zh" ? "。" : ".";

  const core = `${t.smsPrefix}${space}${cleanName} (${cleanDosage})`;
  const full = cleanInst ? `${core}${sep}${cleanInst}${end}` : `${core}${end}`;
  if (full.length <= MAX_SMS_LENGTH) return full;

  const clipped = full.slice(0, MAX_SMS_LENGTH - 1).trimEnd();
  return `${clipped}…`;
}