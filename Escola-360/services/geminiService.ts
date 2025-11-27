import { GoogleGenAI, Type, Schema } from "@google/genai";
import { 
  BimesterPlanningResponse, 
  EducationalContent, 
  Question, 
  QuestionType,
  SlideDeck,
  CurriculumStandard,
  AssessmentConfig,
  GeneratedAssessment,
  MethodologyStrategy,
  Rubric,
  LessonPlan,
} from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- SCHEMAS ---

const lessonPlanSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    topic: { type: Type.STRING, description: "O tema da unidade de ensino." },
    objectives: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Lista de objetivos de aprendizagem específicos para este tema.",
    },
    content_summary: { type: Type.STRING, description: "Resumo do conteúdo teórico." },
    methodology: { type: Type.STRING, description: "Descrição detalhada da estratégia metodológica aplicada." },
    bncc_skills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          code: { type: Type.STRING, description: "Código alfanumérico da BNCC (ex: EF01LP01)." },
          description: { type: Type.STRING, description: "Descrição completa da habilidade." },
        },
      },
    },
    activities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          duration: { type: Type.STRING },
        },
      },
      description: "3 atividades práticas alinhadas à metodologia escolhida.",
    },
    assessments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          methodology: { type: Type.STRING, description: "Como a avaliação será aplicada." },
          criteria: { type: Type.STRING, description: "Critérios de correção/análise." },
        },
      },
      description: "3 propostas diferenciadas de avaliação.",
    },
    inclusion: {
      type: Type.OBJECT,
      properties: {
        general: { type: Type.STRING, description: "Estratégias gerais de DUA (Desenho Universal)." },
        adhd: { type: Type.STRING, description: "Adaptação específica para TDAH neste tópico." },
        autism: { type: Type.STRING, description: "Adaptação específica para TEA neste tópico." },
        dyslexia: { type: Type.STRING, description: "Adaptação específica para Dislexia neste tópico." },
        high_abilities: { type: Type.STRING, description: "Desafio extra para Altas Habilidades." }
      },
      required: ["general", "adhd", "autism", "dyslexia", "high_abilities"]
    },
    interdisciplinary: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
              subject: { type: Type.STRING, description: "Disciplina conectada (ex: Matemática, História)." },
              description: { type: Type.STRING, description: "Como conectar este tema com a outra disciplina." }
          },
          required: ["subject", "description"]
        }
    }
  },
  required: ["topic", "objectives", "content_summary", "methodology", "bncc_skills", "activities", "assessments", "inclusion", "interdisciplinary"],
};

const bimesterPlanningSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overview: {
      type: Type.STRING,
      description: "Visão geral dos objetivos pedagógicos para todo o bimestre."
    },
    plans: {
      type: Type.ARRAY,
      items: lessonPlanSchema,
    },
  },
  required: ["overview", "plans"],
};

const rubricSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    criteria: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Critério de avaliação (ex: Clareza, Argumentação)." },
          levels: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                levelName: { type: Type.STRING, description: "Nome do nível (ex: Iniciante, Avançado)." },
                description: { type: Type.STRING, description: "Descrição do desempenho esperado neste nível." }
              },
              required: ["levelName", "description"]
            }
          }
        },
        required: ["name", "levels"]
      }
    }
  },
  required: ["title", "criteria"]
};

const educationalTextSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    introduction: { type: Type.STRING, description: "Parágrafo introdutório que contextualiza o tema." },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          subtitle: { type: Type.STRING },
          content: { type: Type.STRING, description: "Conteúdo detalhado da seção. Use markdown **negrito** para conceitos chave." }
        },
        required: ["subtitle", "content"]
      },
      description: "Divida o texto em 3 a 5 seções lógicas com subtítulos claros."
    },
    glossary: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING },
          definition: { type: Type.STRING }
        },
        required: ["term", "definition"]
      },
      description: "Lista de 4 a 8 termos técnicos ou complexos citados no texto."
    },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ["VIDEO", "BOOK", "ARTICLE", "SITE"] },
          title: { type: Type.STRING },
          authorOrSource: { type: Type.STRING },
          description: { type: Type.STRING }
        },
        required: ["type", "title"]
      },
      description: "3 indicações de materiais complementares REAIS (Youtube, Livros, Sites)."
    },
    references: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Bibliografia formatada (ABNT simplificada) das fontes teóricas utilizadas."
    }
  },
  required: ["title", "introduction", "sections", "glossary", "recommendations", "references"],
};

const questionBankSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, enum: [QuestionType.MULTIPLE_CHOICE, QuestionType.ESSAY, QuestionType.RESEARCH, QuestionType.PLAYFUL] },
      statement: { type: Type.STRING, description: "O enunciado da questão ou descrição da atividade." },
      options: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING }, 
        description: "Para múltipla escolha, lista de alternativas." 
      },
      correctAnswer: { type: Type.STRING, description: "Para múltipla escolha, a alternativa correta." },
      justification: { type: Type.STRING, description: "Justificativa detalhada do porquê a alternativa está correta." },
      answerKey: { type: Type.STRING, description: "Gabarito comentado, diretrizes de resposta ou objetivos da atividade lúdica." },
      bnccAlignment: { type: Type.STRING, description: "Habilidade BNCC trabalhada." }
    },
    required: ["type", "statement", "bnccAlignment"]
  }
};

const slideDeckSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    slides: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING, description: "Texto sintetizado, explicativo e didático sobre o tópico do slide (parágrafo). Não use tópicos/bullets." }
        },
        required: ["title", "content"]
      }
    }
  },
  required: ["title", "slides"]
};

const managementDocSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    summary: { type: Type.STRING, description: "Resumo executivo do documento." },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          heading: { type: Type.STRING, description: "Título da seção." },
          content: { type: Type.STRING, description: "Conteúdo detalhado da seção." }
        },
        required: ["heading", "content"]
      }
    }
  },
  required: ["title", "summary", "sections"]
};

// --- HELPER FUNCTIONS ---

const extractStateName = (curriculumString: string): string => {
  if (curriculumString.includes("BNCC")) return "Nacional";
  return curriculumString.split(' (')[0];
};

const STATE_CURRICULA: Record<string, string> = {
  "Acre": "Currículo de Referência Único do Acre",
  "Alagoas": "Referencial Curricular de Alagoas (ReCAL)",
  "Amapá": "Referencial Curricular Amapaense",
  "Amazonas": "Referencial Curricular Amazonense",
  "Bahia": "Documento Curricular Referencial da Bahia (DCRC)",
  "Ceará": "Documento Curricular Referencial do Ceará (DCRC)",
  "Distrito Federal": "Currículo em Movimento",
  "Espírito Santo": "Currículo do Espírito Santo",
  "Goiás": "Documento Curricular de Goiás (DC-GO)",
  "Maranhão": "Documento Curricular do Território Maranhense",
  "Mato Grosso": "Documento de Referência Curricular de Mato Grosso (DRC-MT)",
  "Mato Grosso do Sul": "Referencial Curricular de MS",
  "Minas Gerais": "Currículo Referência de Minas Gerais (CRMG)",
  "Pará": "Documento Curricular do Estado do Pará",
  "Paraíba": "Proposta Curricular do Estado da Paraíba",
  "Paraná": "Referencial Curricular do Paraná (CREP)",
  "Pernambuco": "Currículo de Pernambuco",
  "Piauí": "Currículo do Piauí",
  "Rio de Janeiro": "Documento Curricular do Rio de Janeiro",
  "Rio Grande do Norte": "Documento Curricular do RN",
  "Rio Grande do Sul": "Referencial Curricular Gaúcho (RCG)",
  "Rondônia": "Referencial Curricular de Rondônia",
  "Roraima": "Documento Curricular de Roraima (DCRR)",
  "Santa Catarina": "Currículo Base do Território Catarinense",
  "São Paulo": "Currículo Paulista",
  "Sergipe": "Currículo de Sergipe",
  "Tocantins": "Documento Curricular do Tocantins (DCT)"
};

// Available Themes for Slides
const SLIDE_THEME_NAMES = ['Indigo', 'Emerald', 'Violet', 'Amber', 'Rose'];

const getCurriculumPrompt = (curriculum: CurriculumStandard): string => {
  if (curriculum === CurriculumStandard.BNCC) {
    return "ALINHAMENTO: Base Nacional Comum Curricular (BNCC). Siga estritamente as competências e habilidades previstas nacionalmente.";
  }

  const stateName = extractStateName(curriculum);
  const docName = STATE_CURRICULA[stateName] || curriculum;

  return `
      ALINHAMENTO: ${docName} + BNCC.
      CONTEXTO REGIONAL: Estado de ${stateName}.

      REGRA DE OURO (UNIVERSALIDADE vs REGIONALISMO):
      1. ATENUE O CONTEXTO REGIONAL. Use a proporção de 80% UNIVERSAL/CIENTÍFICO (BNCC) para 20% REGIONAL.
      2. A "Territorialidade" (${stateName}) deve ser usada apenas como contextualização sutil, NUNCA como foco principal excessivo.
      3. PROIBIDO forçar regionalismo em ciências exatas (Física, Química, Matemática) ou temas gramaticais universais.
      4. Use referências locais apenas se forem exemplos naturais e pertinentes. Se não houver exemplo local óbvio, use exemplos universais clássicos.
      5. O objetivo é evitar a repetição excessiva do nome do estado em cada atividade ou frase. Mantenha o equilíbrio.
  `;
};

// --- API FUNCTIONS ---

export const generateBimesterPlanning = async (
  grade: string,
  subject: string,
  bimester: string,
  curriculum: CurriculumStandard = CurriculumStandard.BNCC,
  customContext: string = ""
): Promise<BimesterPlanningResponse> => {
  
  const curriculumInstruction = getCurriculumPrompt(curriculum);

  const prompt = `
    Você é um especialista sênior em educação brasileira, BNCC, DUA (Desenho Universal para Aprendizagem) e metodologias ativas.
    
    TAREFA:
    Desenvolva um PLANEJAMENTO BIMESTRAL COMPLETO.
    Série: ${grade}
    Componente Curricular: ${subject}
    Período: ${bimester}
    
    DIRETRIZES CURRICULARES:
    ${curriculumInstruction}

    CONTEXTO EXTRA FORNECIDO PELO USUÁRIO:
    ${customContext ? `Considerar as seguintes observações específicas: "${customContext}"` : "Nenhum contexto extra."}

    INSTRUÇÕES:
    1. Identifique TODOS os principais eixos temáticos ou unidades previstos para este bimestre.
    2. Para CADA tema, gere um plano de aula completo contendo:
       - Objetivos, Habilidades BNCC, Resumo.
       - Metodologia: Utilize uma abordagem DIVERSIFICADA E EFICAZ (padrão).
       - 3 Atividades Práticas.
       - 3 Avaliações.
       - **INCLUSÃO (DUA)**: Gere adaptações específicas para TDAH, TEA, Dislexia e Altas Habilidades.
       - **INTERDISCIPLINARIDADE (STEAM)**: Sugira 2 a 3 conexões com outras disciplinas.
    
    A resposta deve ser rica e detalhada.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: bimesterPlanningSchema,
        systemInstruction: "Responda sempre em Português do Brasil. Atue como coordenador pedagógico experiente.",
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as BimesterPlanningResponse;
    }
    throw new Error("No response generated");
  } catch (error) {
    console.error("Error generating bimester planning:", error);
    throw error;
  }
};

export const regenerateLessonPlan = async (
  currentPlan: LessonPlan,
  grade: string,
  subject: string,
  newStrategy: MethodologyStrategy,
  curriculum: CurriculumStandard
): Promise<LessonPlan> => {
  const curriculumInstruction = getCurriculumPrompt(curriculum);
  
  const prompt = `
    REFORMULE este plano de aula para uma nova Metodologia Ativa.
    
    Plano Original:
    Tema: ${currentPlan.topic}
    Objetivos Atuais: ${JSON.stringify(currentPlan.objectives)}
    
    NOVA ESTRATÉGIA METODOLÓGICA ALVO: ${newStrategy}
    
    Instruções:
    1. Mantenha o mesmo TEMA e OBJETIVOS de aprendizagem.
    2. REESCREVA completamente as seguintes seções para se adequarem à metodologia ${newStrategy}:
       - Methodology (Descrição de como aplicar ${newStrategy} neste tema).
       - Activities (Crie 3 atividades novas baseadas em ${newStrategy}).
       - Assessments (Avaliações compatíveis com ${newStrategy}).
       - Inclusion (Adapte as estratégias de inclusão para o contexto de ${newStrategy}).
    
    Contexto: ${grade}, ${subject}.
    ${curriculumInstruction}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: lessonPlanSchema, // Use schema for single plan
      },
    });

    if (response.text) {
      const updatedPlan = JSON.parse(response.text) as LessonPlan;
      // Preserve existing resources that shouldn't change automatically
      updatedPlan.educationalText = currentPlan.educationalText;
      updatedPlan.questionBank = currentPlan.questionBank;
      updatedPlan.slideDeck = currentPlan.slideDeck;
      updatedPlan.selectedStrategy = newStrategy; // Set the selected strategy
      return updatedPlan;
    }
    throw new Error("Failed to regenerate plan");
  } catch (error) {
    console.error("Error regenerating plan:", error);
    throw error;
  }
};

export const generateRubric = async (
  grade: string,
  subject: string,
  topic: string,
  methodology: string
): Promise<Rubric> => {
  const prompt = `
    Crie uma RUBRICA DE AVALIAÇÃO (Matriz de Referência) detalhada para o tema.
    
    Série: ${grade}
    Disciplina: ${subject}
    Tema: ${topic}
    Contexto da Aula: ${methodology}

    Estrutura:
    - 4 a 5 Critérios de Avaliação nas linhas (ex: Domínio do Conteúdo, Colaboração, Criatividade).
    - 4 Níveis de Desempenho nas colunas (ex: Insuficiente, Em Desenvolvimento, Proficiente, Avançado).
    
    Para cada célula da matriz, descreva o comportamento observável esperado.
  `;

  try {
    const response = await ai.models.generateContent({
       model: "gemini-2.5-flash",
       contents: prompt,
       config: {
          responseMimeType: "application/json",
          responseSchema: rubricSchema
       }
    });

    if (response.text) {
       return JSON.parse(response.text) as Rubric;
    }
    throw new Error("Failed to generate rubric");
  } catch (error) {
    console.error("Rubric generation error", error);
    throw error;
  }
};

export const generateEducationalText = async (
  grade: string,
  subject: string,
  topic: string
): Promise<EducationalContent> => {
  const prompt = `
    Atue como um EDITOR DE LIVROS DIDÁTICOS premium.
    
    TAREFA:
    Escreva um CAPÍTULO DE LIVRO DIDÁTICO completo e aprofundado sobre o tema, formatado para impressão.
    
    DADOS:
    Série: ${grade}
    Disciplina: ${subject}
    Tema: ${topic}

    DIAGRAMAÇÃO E ESTRUTURA (IMPORTANTE):
    1. **Formato Editorial**: O texto não deve ser um bloco único. Divida-o em SUBTÍTULOS lógicos (Seções) para facilitar a leitura.
    2. **Negrito Pedagógico**: Use marcação markdown (**exemplo**) para destacar TODOS os conceitos-chave, termos técnicos e definições importantes no corpo do texto.
    3. **Rigor Acadêmico**: Cite pensadores, cientistas e obras reais (com datas) no corpo do texto.
    4. **Glossário**: Extraia os termos mais difíceis ou técnicos e crie um glossário ao final.
    5. **Saiba Mais**: Indique 3 materiais complementares REAIS (Vídeos do Youtube, Livros clássicos ou Artigos confiáveis) que o aluno possa buscar.
    6. **Bibliografia**: Liste as referências teóricas usadas para criar o texto.

    Estilo de Escrita:
    - Linguagem adequada à série (${grade}), mas com vocabulário enriquecedor.
    - Explicativo, fluido e envolvente.
    - Universal (evite regionalismos a menos que o tema exija).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: educationalTextSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as EducationalContent;
    }
    throw new Error("No generated text");
  } catch (error) {
    console.error("Error generating educational text", error);
    throw error;
  }
};

export const generateQuestionBank = async (
  grade: string,
  subject: string,
  topic: string,
  quantities: Record<QuestionType, number>
): Promise<Question[]> => {
  
  const isHighSchool = grade.includes("Ensino Médio");
  
  let mcInstruction = "";
  if (isHighSchool) {
    mcInstruction = "Para questões de 'Múltipla Escolha': Gere OBRIGATORIAMENTE 5 alternativas (A, B, C, D, E).";
  } else {
    mcInstruction = "Para questões de 'Múltipla Escolha': Gere OBRIGATORIAMENTE 4 alternativas (A, B, C, D).";
  }

  const requests = Object.entries(quantities)
    .filter(([_, qty]) => qty > 0)
    .map(([type, qty]) => `- ${qty} questões do tipo "${type}"`)
    .join("\n");

  const prompt = `
    Crie um Banco de Questões / Atividades Escolares altamente qualificado.
    Série: ${grade}
    Disciplina: ${subject}
    Tema: ${topic}
    
    QUANTIDADES SOLICITADAS:
    ${requests}

    REGRAS DE ESTRUTURA E CONTEÚDO:
    1. ${mcInstruction}
    2. **Justificativa Obrigatória**: Para questões de Múltipla Escolha, forneça no campo 'justification' uma explicação detalhada.
    3. Para Dissertativas e Pesquisa: Forneça um 'answerKey' robusto.
    4. Para Atividade Lúdica: Crie um jogo, dinâmica ou atividade recreativa adequada à idade.
    5. Indique explicitamente a Habilidade BNCC trabalhada.
    6. **Balanceamento Regional**: NÃO force citações regionais em excesso. Mantenha o foco no conteúdo universal e científico da disciplina. Use o contexto local apenas se for natural.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: questionBankSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as Question[];
    }
    throw new Error("No questions generated");
  } catch (error) {
    console.error("Error generating questions", error);
    throw error;
  }
};

export const generateSlideDeck = async (topic: string, grade: string, subject: string): Promise<SlideDeck> => {
  let specificInstructions = "";

  if (subject.toLowerCase().includes("inglês") || subject.toLowerCase().includes("english")) {
    specificInstructions = `
      ATENÇÃO PARA AULA DE INGLÊS:
      1. Exemplos e Vocabulário em INGLÊS.
      2. Explicações em PORTUGUÊS.
    `;
  }

  const prompt = `
    Crie uma APRESENTAÇÃO DE SLIDES didática e profissional sobre: "${topic}".
    Público: ${grade}, disciplina ${subject}.
    
    ${specificInstructions}
    
    Mantenha o foco no conteúdo universal.

    ESTRUTURA DOS SLIDES:
    - 6 a 8 slides.
    - **Conteúdo ULTRA-SINTETIZADO**: Reduza a quantidade de texto em 40%. Seja direto, impactante e resumido.
    - Limite: Máximo de 30 a 40 palavras por slide no campo 'content'.
    - O objetivo é deixar espaço visual livre nos slides para que o professor possa inserir imagens posteriormente.
    - O campo 'content' deve conter 1 ou 2 parágrafos curtos e poderosos.
    - NÃO use listas de tópicos (bullets).
    - NÃO inclua notas para o professor.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: slideDeckSchema }
  });

  // Assign a random visual theme to persist with the slide deck
  const deck = JSON.parse(response.text!) as SlideDeck;
  deck.theme = SLIDE_THEME_NAMES[Math.floor(Math.random() * SLIDE_THEME_NAMES.length)];
  
  return deck;
};

export const generateAssessment = async (
  grade: string,
  subject: string,
  topic: string,
  bimester: string,
  config: AssessmentConfig
): Promise<GeneratedAssessment> => {
  
  const isHighSchool = grade.includes("Ensino Médio");
  let mcInstruction = isHighSchool ? "5 alternativas (A-E)" : "4 alternativas (A-D)";

  const prompt = `
    Crie uma AVALIAÇÃO FORMAL (PROVA) escolar.
    
    Dados:
    Série: ${grade}
    Disciplina: ${subject}
    Tema: ${topic}
    Bimestre: ${bimester}

    Estrutura Solicitada:
    - ${config.mcCount} Questões de Múltipla Escolha (${mcInstruction}).
    - ${config.essayCount} Questões Dissertativas.

    Instruções:
    1. Linguagem formal e adequada.
    2. Evite enunciados vagos.
    3. Indique a Habilidade BNCC.
    4. **Balanceamento Regional**: Priorize questões universais sobre o tema. Use contexto regional APENAS se for extremamente pertinente ao assunto (ex: Geografia local). Evite repetições excessivas de nomes de estados ou cidades.
    
    Retorne a lista de questões estruturada.
  `;

  try {
     const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
           responseMimeType: "application/json",
           responseSchema: questionBankSchema
        }
     });

     if (response.text) {
        const questions = JSON.parse(response.text) as Question[];
        return {
           header: config,
           questions: questions,
           grade,
           subject,
           topic,
           bimester
        };
     }
     throw new Error("Failed to generate assessment");
  } catch (error) {
     console.error("Assessment generation error", error);
     throw error;
  }
};