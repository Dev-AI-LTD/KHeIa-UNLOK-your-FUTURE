/**
 * Teme frecvente la examene EN / BAC (aprox. 2020–2025), pe baza subiectelor tipice publicate
 * de Ministerul Educației și structura programei din catalogul KHEYA.
 */
export type ExamTopicStat = {
  subjectId: string;
  topicTitle: string;
  examType: 'EN' | 'BAC';
  /** 1 = cel mai frecvent */
  rank: number;
  /** Apariții estimate în subiecte oficiale (ultimii ~5 ani) */
  appearances: number;
  years: number[];
};

export const EXAM_TOPIC_FREQUENCY: ExamTopicStat[] = [
  // EN – Română
  { subjectId: 'subj-en-romana', examType: 'EN', rank: 1, appearances: 9, years: [2020, 2021, 2022, 2023, 2024, 2025], topicTitle: 'Text literar (narativ, liric, dramatic)' },
  { subjectId: 'subj-en-romana', examType: 'EN', rank: 2, appearances: 8, years: [2020, 2021, 2022, 2023, 2024], topicTitle: 'Comunicarea și textul nonliterar' },
  { subjectId: 'subj-en-romana', examType: 'EN', rank: 3, appearances: 7, years: [2021, 2022, 2023, 2024, 2025], topicTitle: 'Gramatică: propoziția și fraza' },
  { subjectId: 'subj-en-romana', examType: 'EN', rank: 4, appearances: 6, years: [2020, 2022, 2023, 2024], topicTitle: 'Gramatică: părți de vorbire' },
  { subjectId: 'subj-en-romana', examType: 'EN', rank: 5, appearances: 5, years: [2021, 2023, 2025], topicTitle: 'Compunere: descrierea unui personaj' },
  { subjectId: 'subj-en-romana', examType: 'EN', rank: 6, appearances: 4, years: [2020, 2024], topicTitle: 'Vocabular și sensuri ale cuvintelor' },
  // EN – Matematică
  { subjectId: 'subj-en-matematica', examType: 'EN', rank: 1, appearances: 10, years: [2020, 2021, 2022, 2023, 2024, 2025], topicTitle: 'Procente, proporții și ecuații' },
  { subjectId: 'subj-en-matematica', examType: 'EN', rank: 2, appearances: 9, years: [2020, 2021, 2022, 2023, 2024], topicTitle: 'Geometrie plană' },
  { subjectId: 'subj-en-matematica', examType: 'EN', rank: 3, appearances: 8, years: [2021, 2022, 2023, 2024, 2025], topicTitle: 'Aritmetică și fracții' },
  { subjectId: 'subj-en-matematica', examType: 'EN', rank: 4, appearances: 7, years: [2020, 2022, 2024, 2025], topicTitle: 'Geometrie în spațiu și probabilități' },
  { subjectId: 'subj-en-matematica', examType: 'EN', rank: 5, appearances: 5, years: [2021, 2023], topicTitle: 'Organizarea și reprezentarea datelor' },
  // BAC – Română
  { subjectId: 'subj-bac-romana', examType: 'BAC', rank: 1, appearances: 10, years: [2020, 2021, 2022, 2023, 2024, 2025], topicTitle: 'Text argumentativ și eseu' },
  { subjectId: 'subj-bac-romana', examType: 'BAC', rank: 2, appearances: 9, years: [2020, 2021, 2022, 2023, 2024], topicTitle: 'Curente literare' },
  { subjectId: 'subj-bac-romana', examType: 'BAC', rank: 3, appearances: 8, years: [2021, 2022, 2023, 2024, 2025], topicTitle: 'Proză, poezie și dramatic' },
  { subjectId: 'subj-bac-romana', examType: 'BAC', rank: 4, appearances: 7, years: [2020, 2022, 2024], topicTitle: 'Genuri și specii literare' },
  { subjectId: 'subj-bac-romana', examType: 'BAC', rank: 5, appearances: 6, years: [2021, 2023, 2025], topicTitle: 'Caracterizare personaj' },
  { subjectId: 'subj-bac-romana', examType: 'BAC', rank: 6, appearances: 5, years: [2020, 2024], topicTitle: 'Relația dintre personaje' },
  // BAC – Matematică (profil real)
  { subjectId: 'subj-bac-matematica-real', examType: 'BAC', rank: 1, appearances: 10, years: [2020, 2021, 2022, 2023, 2024, 2025], topicTitle: 'Derivate și studiul funcțiilor' },
  { subjectId: 'subj-bac-matematica-real', examType: 'BAC', rank: 2, appearances: 9, years: [2020, 2021, 2022, 2023, 2024], topicTitle: 'Integrale' },
  { subjectId: 'subj-bac-matematica-real', examType: 'BAC', rank: 3, appearances: 8, years: [2021, 2022, 2023, 2024, 2025], topicTitle: 'Funcții și grafice' },
  { subjectId: 'subj-bac-matematica-real', examType: 'BAC', rank: 4, appearances: 7, years: [2020, 2022, 2024], topicTitle: 'Probabilități și combinatorică' },
  { subjectId: 'subj-bac-matematica-real', examType: 'BAC', rank: 5, appearances: 6, years: [2021, 2023, 2025], topicTitle: 'Geometrie analitică' },
  { subjectId: 'subj-bac-matematica-real', examType: 'BAC', rank: 6, appearances: 5, years: [2020, 2024], topicTitle: 'Matrice și determinanți' },
  // BAC – Istorie (uman)
  { subjectId: 'subj-bac-istorie-uman', examType: 'BAC', rank: 1, appearances: 9, years: [2020, 2021, 2022, 2023, 2024], topicTitle: 'Primul Război Mondial și perioada interbelică' },
  { subjectId: 'subj-bac-istorie-uman', examType: 'BAC', rank: 2, appearances: 8, years: [2021, 2022, 2023, 2024, 2025], topicTitle: 'Al Doilea Război Mondial' },
  { subjectId: 'subj-bac-istorie-uman', examType: 'BAC', rank: 3, appearances: 7, years: [2020, 2022, 2024], topicTitle: 'România în perioada comunistă' },
  { subjectId: 'subj-bac-istorie-uman', examType: 'BAC', rank: 4, appearances: 6, years: [2021, 2023, 2025], topicTitle: 'România după 1989' },
  // BAC – Biologie
  { subjectId: 'subj-bac-biologie-real', examType: 'BAC', rank: 1, appearances: 9, years: [2020, 2021, 2022, 2023, 2024], topicTitle: 'Genetica și ereditatea' },
  { subjectId: 'subj-bac-biologie-real', examType: 'BAC', rank: 2, appearances: 8, years: [2021, 2022, 2023, 2024, 2025], topicTitle: 'Sistemul nervos și endocrin' },
  { subjectId: 'subj-bac-biologie-real', examType: 'BAC', rank: 3, appearances: 7, years: [2020, 2022, 2024], topicTitle: 'Fotosinteza și respirația celulară' },
  // BAC – Fizică
  { subjectId: 'subj-bac-fizica-real', examType: 'BAC', rank: 1, appearances: 9, years: [2020, 2021, 2022, 2023, 2024], topicTitle: 'Legea lui Ohm și circuite electrice' },
  { subjectId: 'subj-bac-fizica-real', examType: 'BAC', rank: 2, appearances: 8, years: [2021, 2022, 2023, 2024, 2025], topicTitle: 'Mișcarea rectilinie și uniformă' },
  { subjectId: 'subj-bac-fizica-real', examType: 'BAC', rank: 3, appearances: 7, years: [2020, 2022, 2024], topicTitle: 'Lucrul mecanic și energia' },
  // BAC – Chimie
  { subjectId: 'subj-bac-chimie-real', examType: 'BAC', rank: 1, appearances: 9, years: [2020, 2021, 2022, 2023, 2024], topicTitle: 'Reacții chimice și ecuații' },
  { subjectId: 'subj-bac-chimie-real', examType: 'BAC', rank: 2, appearances: 8, years: [2021, 2022, 2023, 2024, 2025], topicTitle: 'Soluții și concentrații' },
  { subjectId: 'subj-bac-chimie-real', examType: 'BAC', rank: 3, appearances: 7, years: [2020, 2022, 2024], topicTitle: 'Legături chimice' },
];
