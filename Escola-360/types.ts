export enum GradeLevel {
  EF_1 = "1º Ano do Ensino Fundamental",
  EF_2 = "2º Ano do Ensino Fundamental",
  EF_3 = "3º Ano do Ensino Fundamental",
  EF_4 = "4º Ano do Ensino Fundamental",
  EF_5 = "5º Ano do Ensino Fundamental",
  EF_6 = "6º Ano do Ensino Fundamental",
  EF_7 = "7º Ano do Ensino Fundamental",
  EF_8 = "8º Ano do Ensino Fundamental",
  EF_9 = "9º Ano do Ensino Fundamental",
  EM_1 = "1º Ano do Ensino Médio",
  EM_2 = "2º Ano do Ensino Médio",
  EM_3 = "3º Ano do Ensino Médio",
}

export enum Subject {
  PORTUGUESE = "Língua Portuguesa",
  MATH = "Matemática",
  HISTORY = "História",
  GEOGRAPHY = "Geografia",
  SCIENCE = "Ciências",
  ARTS = "Artes",
  PHYSICAL_ED = "Educação Física",
  ENGLISH = "Inglês",
  PHYSICS = "Física",
  CHEMISTRY = "Química",
  BIOLOGY = "Biologia",
  SOCIOLOGY = "Sociologia",
  PHILOSOPHY = "Filosofia",
  RELIGION = "Ensino Religioso",
  FORMATIVE_ITINERARIES = "Itinerários Formativos",
}

export enum Bimester {
  FIRST = "1º Bimestre",
  SECOND = "2º Bimestre",
  THIRD = "3º Bimestre",
  FOURTH = "4º Bimestre",
}

export enum CurriculumStandard {
  BNCC = "BNCC (Padrão Nacional)",
  // Norte
  AC = "Acre (Referencial Curricular do Acre)",
  AP = "Amapá (Referencial Curricular Amapaense)",
  AM = "Amazonas (Referencial Curricular Amazonense)",
  PA = "Pará (Documento Curricular do Pará)",
  RO = "Rondônia (Referencial Curricular de Rondônia)",
  RR = "Roraima (Documento Curricular de Roraima)",
  TO = "Tocantins (DCT - Documento Curricular do Tocantins)",
  // Nordeste
  AL = "Alagoas (Referencial Curricular de Alagoas)",
  BA = "Bahia (DCRC - Documento Curricular Referencial da Bahia)",
  CE = "Ceará (DCRC - Documento Curricular Referencial do Ceará)",
  MA = "Maranhão (Documento Curricular do Território Maranhense)",
  PB = "Paraíba (Proposta Curricular do Estado da Paraíba)",
  PE = "Pernambuco (Currículo de Pernambuco)",
  PI = "Piauí (Currículo do Piauí)",
  RN = "Rio Grande do Norte (Documento Curricular do RN)",
  SE = "Sergipe (Currículo de Sergipe)",
  // Centro-Oeste
  DF = "Distrito Federal (Currículo em Movimento)",
  GO = "Goiás (DC-GO - Documento Curricular de Goiás)",
  MT = "Mato Grosso (DRC-MT)",
  MS = "Mato Grosso do Sul (Referencial Curricular de MS)",
  // Sudeste
  ES = "Espírito Santo (Currículo do Espírito Santo)",
  MG = "Minas Gerais (CRMG - Currículo Referência de Minas Gerais)",
  RJ = "Rio de Janeiro (Documento Curricular do Rio de Janeiro)",
  SP = "São Paulo (Currículo Paulista)",
  // Sul
  PR = "Paraná (Referencial Curricular do Paraná)",
  RS = "Rio Grande do Sul (Referencial Curricular Gaúcho)",
  SC = "Santa Catarina (Currículo Base da Educação Infantil e Ensino Fundamental do Território Catarinense)",
}

// Methodology Strategies (Active Methodologies)
export enum MethodologyStrategy {
  TRADITIONAL = "Expositiva Dialogada (Padrão)",
  PBL = "PBL - Aprendizagem Baseada em Projetos",
  GAMIFICATION = "Gamificação",
  FLIPPED_CLASSROOM = "Sala de Aula Invertida",
  HYBRID = "Ensino Híbrido (Rotação por Estações)",
  STORYTELLING = "Storytelling (Narrativa)",
  PEER_INSTRUCTION = "Instruction by Peers (Instrução por Pares)",
  STEAM = "STEAM (Science, Tech, Eng, Arts, Math)"
}

export interface BnccSkill {
  code: string;
  description: string;
}

export interface Activity {
  title: string;
  description: string;
  duration: string;
}

export interface Assessment {
  title: string;
  methodology: string;
  criteria: string;
}

// Inclusion / DUA
export interface InclusionAdaptations {
  general: string;
  adhd: string; // TDAH
  autism: string; // TEA
  dyslexia: string;
  high_abilities: string; // Altas Habilidades/Superdotação
}

// Interdisciplinary
export interface InterdisciplinaryConnection {
  subject: string;
  description: string;
}

// Rubrics
export interface RubricLevel {
  levelName: string; // e.g., "Iniciante", "Avançado"
  description: string;
}

export interface RubricCriterion {
  name: string;
  levels: RubricLevel[];
}

export interface Rubric {
  title: string;
  criteria: RubricCriterion[];
}

// Generated Content Types
export enum QuestionType {
  MULTIPLE_CHOICE = "Múltipla Escolha",
  ESSAY = "Dissertativa",
  RESEARCH = "Pesquisa",
  PLAYFUL = "Atividade Lúdica"
}

export interface Question {
  type: QuestionType;
  statement: string;
  options?: string[];
  correctAnswer?: string;
  justification?: string;
  answerKey?: string;
  bnccAlignment?: string;
}

export interface TextbookSection {
  subtitle: string;
  content: string;
}

export interface Recommendation {
  type: 'VIDEO' | 'BOOK' | 'ARTICLE' | 'SITE';
  title: string;
  authorOrSource?: string;
  description?: string;
}

export interface GlossaryItem {
  term: string;
  definition: string;
}

export interface EducationalContent {
  title: string;
  introduction: string;
  sections: TextbookSection[];
  glossary: GlossaryItem[];
  recommendations: Recommendation[];
  references: string[];
}

export interface Slide {
  title: string;
  content: string;
}

export interface SlideDeck {
  title: string;
  theme?: string;
  slides: Slide[];
}

export interface AssessmentConfig {
  schoolName: string;
  professorName: string;
  date: string;
  totalValue: number;
  mcCount: number;
  mcValue: number;
  essayCount: number;
  essayValue: number;
}

export interface GeneratedAssessment {
  header: AssessmentConfig;
  questions: Question[];
  topic: string;
  grade: string;
  subject: string;
  bimester: string;
}

export interface LessonPlan {
  topic: string;
  objectives: string[];
  content_summary: string;
  methodology: string;
  selectedStrategy?: MethodologyStrategy;
  bncc_skills: BnccSkill[];
  activities: Activity[];
  assessments: Assessment[];
  
  // New Modules
  inclusion?: InclusionAdaptations;
  interdisciplinary?: InterdisciplinaryConnection[];
  
  // Generated Content
  educationalText?: EducationalContent;
  questionBank?: Question[];
  slideDeck?: SlideDeck;
  generatedAssessment?: GeneratedAssessment;
  rubric?: Rubric;
}

export interface BimesterPlanningResponse {
  overview: string;
  plans: LessonPlan[];
}


// Auth & Library Types
export interface User {
  email: string;
  name: string;
}

export enum LibraryItemType {
  PLANNING = 'PLANNING',
  DOCUMENT = 'DOCUMENT'
}

// Library Content can be Planning or Document
export type LibraryContent = BimesterPlanningResponse;

export interface LibraryItem {
  id: string;
  type: LibraryItemType;
  title: string;
  createdAt: string;
  content: LibraryContent;
  metadata?: any;
}
