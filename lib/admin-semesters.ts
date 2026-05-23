export const semesterRoman: Record<number, string> = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
  5: 'V',
  6: 'VI',
  7: 'VII',
  8: 'VIII',
};

export function semesterLabel(semester: string | number) {
  const sem = Number(semester);
  return `${semesterRoman[sem] ?? sem} SEM`;
}
