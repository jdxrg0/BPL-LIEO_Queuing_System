export const FLAG_ORDER = ['caterNew', 'caterRenewal', 'caterRetirement'];

export const SLOT_STYLES = [
  {
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-500/20',
    bgFill: '#059669',
    glow: 'glow-emerald',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    grad: 'from-emerald-500 to-emerald-600'
  },
  {
    text: 'text-indigo-700 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-500/20',
    bgFill: '#4f46e5',
    glow: 'glow-indigo',
    bg: 'bg-indigo-50 dark:bg-indigo-500/10',
    grad: 'from-indigo-500 to-violet-600'
  },
  {
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-500/20',
    bgFill: '#e11d48',
    glow: 'glow-rose',
    bg: 'bg-rose-50 dark:bg-rose-500/10',
    grad: 'from-rose-500 to-red-600'
  }
];

export const DEFAULT_SLOT_STYLE = {
  text: 'text-slate-700 dark:text-slate-400',
  border: 'border-slate-200 dark:border-slate-500/20',
  bgFill: '#64748b',
  bg: 'bg-bg-color dark:bg-slate-500/10',
  grad: 'from-slate-500 to-slate-600'
};

export function getServiceSlots(services) {
  return [...services]
    .sort((a, b) => a.id - b.id)
    .slice(0, FLAG_ORDER.length)
    .map((service, index) => ({
      service,
      flag: FLAG_ORDER[index],
      slot: index,
      style: SLOT_STYLES[index] || DEFAULT_SLOT_STYLE
    }));
}