export interface UILabels {
  printCarePlan: string;
  interactionAudit: string;
  dailySchedule: string;
  medicinesExplained: string;
  redFlags: string;
  followUpChecklist: string;
  pharmacistQuestions: string;
  askPlan: string;
}

export const UI_LABELS: Record<string, UILabels> = {
  English: {
    printCarePlan: 'Print Care Plan',
    interactionAudit: 'FDA Drug Interaction Audit',
    dailySchedule: 'Your Daily Medication Schedule',
    medicinesExplained: 'Your Medicines Explained',
    redFlags: 'Red-Flag Symptoms (When to Get Help)',
    followUpChecklist: 'Interactive Follow-Up Checklist',
    pharmacistQuestions: 'Questions to Ask Your Pharmacist',
    askPlan: 'Ask About Your Discharge Plan',
  },
  Spanish: {
    printCarePlan: 'Imprimir Plan',
    interactionAudit: 'Auditoría de Interacciones FDA',
    dailySchedule: 'Tu Horario Diario de Medicinas',
    medicinesExplained: 'Tus Medicinas Explicadas',
    redFlags: 'Síntomas de Alerta (Cuándo Pedir Ayuda)',
    followUpChecklist: 'Lista de Seguimiento Interactivo',
    pharmacistQuestions: 'Preguntas para Tu Farmacéutico',
    askPlan: 'Pregunta Sobre Tu Plan de Alta',
  },
  Hindi: {
    printCarePlan: 'प्लान प्रिंट करें',
    interactionAudit: 'FDA दवा इंटरैक्शन जांच',
    dailySchedule: 'आपकी दैनिक दवा समय-सारिणी',
    medicinesExplained: 'आपकी दवाइयों की जानकारी',
    redFlags: 'खतरे के लक्षण (कब मदद लें)',
    followUpChecklist: 'फॉलो-अप चेकलिस्ट',
    pharmacistQuestions: 'फार्मासिस्ट से पूछने के लिए सवाल',
    askPlan: 'अपनी डिस्चार्ज योजना के बारे में पूछें',
  },
  Arabic: {
    printCarePlan: 'طباعة الخطة',
    interactionAudit: 'فحص تفاعلات الأدوية (FDA)',
    dailySchedule: 'جدول الأدوية اليومي',
    medicinesExplained: 'شرح أدويتك',
    redFlags: 'أعراض الخطر (متى تطلب المساعدة)',
    followUpChecklist: 'قائمة المتابعة التفاعلية',
    pharmacistQuestions: 'أسئلة للصيدلي',
    askPlan: 'اسأل عن خطة الخروج',
  },
  French: {
    printCarePlan: 'Imprimer le Plan',
    interactionAudit: 'Audit des Interactions FDA',
    dailySchedule: 'Votre Programme Quotidien',
    medicinesExplained: 'Vos Médicaments Expliqués',
    redFlags: 'Signes d’Alerte (Quand Consulter)',
    followUpChecklist: 'Liste de Suivi Interactive',
    pharmacistQuestions: 'Questions pour Votre Pharmacien',
    askPlan: 'Questions sur Votre Sortie',
  },
  'Mandarin Chinese': {
    printCarePlan: '打印护理计划',
    interactionAudit: 'FDA 药物相互作用审查',
    dailySchedule: '每日用药时间表',
    medicinesExplained: '药物说明',
    redFlags: '危险信号症状（何时求助）',
    followUpChecklist: '复诊互动清单',
    pharmacistQuestions: '向药剂师咨询的问题',
    askPlan: '咨询您的出院计划',
  },
};
