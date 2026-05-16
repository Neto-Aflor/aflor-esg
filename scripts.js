/* -------------------------------------------------------------
   AFLOR · Inteligência Aplicada
   scripts.js — I-ESG AFLOR V1.0
------------------------------------------------------------- */

if (window.Chart && window.ChartDataLabels) {
  Chart.register(ChartDataLabels);
}

let ultimoPayloadDiagnostico = null;
let diagnosticoSheetId = null;

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby8PlLvAcCWBp5eCq_p1uOwTH7ZwHfKWVisNRqNAvWXVO79kLrDNrz1dY34Y6TfIA/exec';
const DIAGNOSTICO_TIPO = 'I-ESG';
const DIAGNOSTICO_ORIGEM = 'diagnostico_iesg';
const IESG_CAMPOS = ['E1', 'E2', 'S1', 'S2', 'G1', 'G2', 'G3'];

const CENARIOS_IESG = {
  governancaCritica: {
    titulo: 'Governança crítica',
    diagnostico: 'O índice indica fragilidade estrutural de governança. A empresa apresenta sinal de risco em pelo menos uma das bases críticas de governança: separação financeira ou continuidade operacional por dependência de pessoas-chave. Mesmo que existam boas práticas em outras áreas, essa base limita a previsibilidade, dificulta decisões gerenciais e aumenta a exposição a passivos ocultos.',
    planoAcao: [
      'Separar de forma clara as finanças da empresa e dos sócios.',
      'Documentar processos essenciais e responsáveis por decisões críticas.',
      'Criar uma rotina mínima de análise gerencial com indicadores mensais.',
    ],
  },
  passivoTrabalhista: {
    titulo: 'Passivo trabalhista e segurança',
    diagnostico: 'O diagnóstico aponta exposição relevante em segurança, documentação obrigatória, vínculos ou terceiros envolvidos na operação. Esse tipo de fragilidade pode gerar passivos trabalhistas, interrupções operacionais e aumento de risco em fiscalizações, acidentes ou conflitos contratuais.',
    planoAcao: [
      'Revisar documentos obrigatórios, treinamentos e registros de segurança.',
      'Mapear contratos, vínculos e responsabilidades de terceiros ou prestadores.',
      'Definir uma rotina de controle preventivo para reduzir exposição trabalhista e operacional.',
    ],
  },
  riscoAmbiental: {
    titulo: 'Risco ambiental operacional',
    diagnostico: 'O índice aponta baixa rastreabilidade sobre resíduos, materiais descartados ou insumos utilizados na operação. A ausência de controle formal pode gerar desperdícios, perda de margem, dificuldade de comprovação e exposição a exigências ambientais de clientes, fornecedores ou órgãos reguladores.',
    planoAcao: [
      'Registrar os principais resíduos, materiais descartados e responsáveis internos.',
      'Organizar comprovantes de destinação, coleta ou tratamento quando aplicável.',
      'Criar indicadores simples para acompanhar desperdícios, custos e riscos ambientais.',
    ],
  },
  exposicaoCritica: {
    titulo: 'Exposição crítica geral',
    diagnostico: 'O resultado indica baixa maturidade geral nos pilares ambiental, social e de governança. A empresa opera com controles limitados, baixa rastreabilidade e pouca previsibilidade sobre riscos que podem afetar margem, continuidade e capacidade de decisão.',
    planoAcao: [
      'Identificar os pilares com maior fragilidade — ambiental, social ou governança — e priorizar ações de controle mínimo em cada um.',
      'Definir responsáveis e evidências mínimas para cada controle crítico.',
      'Implantar uma rotina mensal de revisão dos riscos operacionais e gerenciais.',
    ],
  },
  riscoAlto: {
    titulo: 'Risco alto',
    diagnostico: 'A empresa apresenta controles iniciais, mas ainda opera com fragilidades relevantes nos pilares ambiental, social e de governança. O resultado indica risco de perdas por retrabalho, informalidade, baixa documentação ou ausência de indicadores mínimos para tomada de decisão.',
    planoAcao: [
      'Corrigir primeiro o pilar com menor pontuação no diagnóstico.',
      'Formalizar registros mínimos de controle, responsáveis e periodicidade.',
      'Substituir controles dispersos por uma rotina simples de acompanhamento gerencial.',
    ],
  },
  maturidadeVulneravel: {
    titulo: 'Maturidade vulnerável',
    diagnostico: 'A empresa possui alguns controles estruturados, mas ainda depende de práticas manuais, registros parciais ou decisões pouco sistematizadas. A maturidade atual reduz parte dos riscos, mas ainda não oferece blindagem suficiente para escala, auditorias, clientes mais exigentes ou crescimento organizado.',
    planoAcao: [
      'Padronizar os controles que hoje dependem de pessoas, planilhas ou rotinas informais.',
      'Criar indicadores simples para acompanhar evolução dos pilares E, S e G.',
      'Conectar os registros operacionais a uma rotina de análise e decisão.',
    ],
  },
  maturidadeConsolidacao: {
    titulo: 'Maturidade em consolidação',
    diagnostico: 'A empresa demonstra uma base relevante de organização e controle, mas ainda possui lacunas que limitam previsibilidade, automação e uso estratégico dos dados. O próximo avanço está em transformar boas práticas isoladas em um sistema contínuo de gestão e evidência.',
    planoAcao: [
      'Integrar os controles existentes em uma base única de acompanhamento.',
      'Padronizar e centralizar os registros dos principais riscos em uma base única, reduzindo dependência de memória ou rotinas dispersas.',
      'Usar os dados gerados para apoiar decisões, auditorias, clientes e parceiros.',
    ],
  },
  maturidadeExecutiva: {
    titulo: 'Maturidade executiva',
    diagnostico: 'O índice indica uma operação com bom nível de controle, previsibilidade e organização nos pilares ambiental, social e de governança. O desafio agora é usar essa base para fortalecer decisões estratégicas, ampliar rastreabilidade, qualificar fornecedores e sustentar crescimento com menor exposição a riscos.',
    planoAcao: [
      'Expandir os critérios de controle para fornecedores, parceiros e terceiros relevantes.',
      'Consolidar os indicadores de risco ambiental, social e de governança em relatórios executivos recorrentes.',
      'Utilizar a maturidade atual como diferencial em contratos, crédito, auditorias e novas oportunidades comerciais.',
    ],
  },
};

function setTextIfExists(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setHtmlIfExists(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = value;
}

function setWidthIfExists(id, value) {
  const el = document.getElementById(id);
  if (el) el.style.width = value;
}

function formatarNumero(valor) {
  return Number(valor).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

function planoParaHtml(planoAcao) {
  return `<ol>${planoAcao.map(item => `<li>${item}</li>`).join('')}</ol>`;
}

function textoResposta(campo) {
  const selecionado = document.getElementById(campo);
  if (!selecionado || selecionado.selectedIndex < 0) return '-';
  const option = selecionado.options[selecionado.selectedIndex];
  return option && option.value !== '' ? option.textContent : '-';
}

function sanitizarNomeArquivo(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function nomeArquivoPdfBase() {
  const data = new Date().toISOString().slice(0, 10);
  return `i_esg_aflor_${data}`;
}

function nomeArquivoPdf() {
  return `${nomeArquivoPdfBase()}.pdf`;
}

function lerResposta(campo) {
  const selecionado = document.getElementById(campo);
  if (!selecionado || selecionado.value === '') return null;
  return Number(selecionado.value);
}

function lerRespostasIESG() {
  return IESG_CAMPOS.reduce((acc, campo) => {
    acc[campo] = lerResposta(campo);
    return acc;
  }, {});
}

function classificarIndice(indiceFinal) {
  if (indiceFinal <= 40) return 'Exposição Crítica';
  if (indiceFinal <= 55) return 'Risco Alto';
  if (indiceFinal <= 70) return 'Maturidade Vulnerável';
  if (indiceFinal <= 85) return 'Maturidade em Consolidação';
  return 'Maturidade Executiva';
}

function obterCenario(respostas, indiceFinal) {
  if (respostas.G1 === 0 || respostas.G3 === 0) return CENARIOS_IESG.governancaCritica;
  if (respostas.S1 === 0 || respostas.S2 === 0) return CENARIOS_IESG.passivoTrabalhista;
  if (respostas.E1 === 0) return CENARIOS_IESG.riscoAmbiental;
  if (indiceFinal <= 40) return CENARIOS_IESG.exposicaoCritica;
  if (indiceFinal >= 41 && indiceFinal <= 55) return CENARIOS_IESG.riscoAlto;
  if (indiceFinal >= 56 && indiceFinal <= 70) return CENARIOS_IESG.maturidadeVulneravel;
  if (indiceFinal >= 71 && indiceFinal <= 85) return CENARIOS_IESG.maturidadeConsolidacao;
  return CENARIOS_IESG.maturidadeExecutiva;
}

function calcularIESG(respostas) {
  const scoreE = (respostas.E1 + respostas.E2) / 2;
  const scoreS = (respostas.S1 + respostas.S2) / 2;
  const scoreG = (respostas.G1 + respostas.G2 + respostas.G3) / 3;
  const indiceBase = scoreE * 0.25 + scoreS * 0.30 + scoreG * 0.45;
  const travas = [];

  if (respostas.G1 === 0) travas.push({ campo: 'G1', teto: 40, tipo: 'crítica' });
  if (respostas.G3 === 0) travas.push({ campo: 'G3', teto: 40, tipo: 'crítica' });
  if (respostas.S1 === 0) travas.push({ campo: 'S1', teto: 50, tipo: 'crítica' });
  if (respostas.S2 === 0) travas.push({ campo: 'S2', teto: 50, tipo: 'crítica' });
  if (respostas.E1 === 0) travas.push({ campo: 'E1', teto: 60, tipo: 'crítica' });
  if (respostas.G2 === 0) travas.push({ campo: 'G2', teto: 75, tipo: 'moderada' });
  if (respostas.E2 === 0) travas.push({ campo: 'E2', teto: 85, tipo: 'moderada' });

  const tetos = travas.map(trava => trava.teto);
  const indiceFinal = Math.floor(Math.min(indiceBase, ...tetos));
  const classificacao = classificarIndice(indiceFinal);
  const cenario = obterCenario(respostas, indiceFinal);
  const redFlagsAtivas = travas.filter(trava => trava.tipo === 'crítica').map(trava => trava.campo);

  return {
    ...respostas,
    scoreE,
    scoreS,
    scoreG,
    indiceBase,
    indiceFinal,
    classificacao,
    cenario: cenario.titulo,
    diagnostico: cenario.diagnostico,
    planoAcao: cenario.planoAcao,
    travasAplicadas: travas,
    redFlagsAtivas,
  };
}

function renderizarEstadoNeutro() {
  const neutro = '—';
  ['ganhoAnual', 'roiPercentual', 'payback', 'iesgClassificacao', 'horasRecuperadasKPI', 'custoManual', 'custoAFLOR'].forEach(id => setTextIfExists(id, neutro));
  ['icoScore', 'icoFaixa', 'icoTitulo', 'pr_icoScore', 'pr_icoFaixa', 'pr_icoTitulo', 'pr_heroClassificacao'].forEach(id => setTextIfExists(id, neutro));
  ['icoRecomendacao', 'pr_icoRecomendacao', 'rp_recBody', 'pr_recBodyPdf'].forEach(id => setHtmlIfExists(id, neutro));
  setWidthIfExists('icoBarFill', '0%');
  setWidthIfExists('pr_icoBarFill', '0%');
  ultimoPayloadDiagnostico = null;
}

function montarPayload(resultado) {
  const planoAcaoTexto = resultado.planoAcao.map((item, index) => `${index + 1}. ${item}`).join('\n');
  const redFlagDominante = resultado.redFlagsAtivas[0] || '';

  return {
    diagnostico_tipo: DIAGNOSTICO_TIPO,
    origem: DIAGNOSTICO_ORIGEM,
    data: new Date().toISOString(),
    dataLocale: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
    lead: {
      nome: (document.getElementById('lead_nome')?.value || '').trim(),
      empresa: (document.getElementById('lead_empresa')?.value || '').trim(),
      email: (document.getElementById('lead_email')?.value || '').trim(),
      celular: (document.getElementById('lead_celular')?.value || '').trim(),
    },
    inputs: {
      e1ResiduosInsumos: resultado.E1,
      e2EnergiaAguaRecursos: resultado.E2,
      s1SegurancaSaudeOcupacional: resultado.S1,
      s2ContratosRelacoesTrabalho: resultado.S2,
      g1SeparacaoFinanceira: resultado.G1,
      g2RegrasContratosResponsabilidades: resultado.G2,
      g3ContinuidadeDependenciaGestao: resultado.G3,
    },
    resultado: {
      scoreE: resultado.scoreE,
      scoreS: resultado.scoreS,
      scoreG: resultado.scoreG,
      indiceBase: resultado.indiceBase,
      indiceFinal: resultado.indiceFinal,
      classificacao: resultado.classificacao,
      titulo: resultado.cenario,
      tipo: resultado.cenario,
      redFlagDominante,
      diagnostico: resultado.diagnostico,
      planoAcao: planoAcaoTexto,
    },
  };
}

function atualizarResultado(resultado) {
  const planoHtml = planoParaHtml(resultado.planoAcao);
  const scoreETexto = formatarNumero(resultado.scoreE);
  const scoreSTexto = formatarNumero(resultado.scoreS);
  const scoreGTexto = formatarNumero(resultado.scoreG);
  const indiceTexto = String(resultado.indiceFinal);

  setTextIfExists('ganhoAnual', scoreETexto);
  setTextIfExists('roiPercentual', scoreSTexto);
  setTextIfExists('payback', scoreGTexto);
  setTextIfExists('iesgClassificacao', resultado.classificacao);
  setTextIfExists('horasRecuperadasKPI', '');
  setTextIfExists('custoManual', '');
  setTextIfExists('custoAFLOR', '');

  setTextIfExists('icoScore', indiceTexto);
  setTextIfExists('icoFaixa', resultado.classificacao);
  setTextIfExists('icoTitulo', resultado.cenario);
  setHtmlIfExists('icoRecomendacao', resultado.diagnostico);
  setWidthIfExists('icoBarFill', `${resultado.indiceFinal}%`);

  setTextIfExists('docDate', new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }));
  setTextIfExists('rp_recTitle', resultado.cenario);
  setHtmlIfExists('rp_recBody', planoHtml);
  setHtmlIfExists('reportAnalysis', resultado.diagnostico);

  setTextIfExists('rp_ganhoAnual', indiceTexto);
  setTextIfExists('rp_roi', scoreETexto);
  setTextIfExists('rp_payback', scoreSTexto);
  setTextIfExists('rp_colabs', scoreGTexto);
  setTextIfExists('rp_pColabs', resultado.E1);
  setTextIfExists('rp_pSalario', resultado.E2);
  setTextIfExists('rp_pMinutos', resultado.S1);
  setTextIfExists('rp_pFormularios', resultado.S2);

  setTextIfExists('pr_date', new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }));
  setTextIfExists('pr_ganhoAnual', indiceTexto);
  setTextIfExists('pr_roi', scoreETexto);
  setTextIfExists('pr_payback', scoreSTexto);
  setTextIfExists('pr_horas', scoreGTexto);
  setTextIfExists('pr_heroClassificacao', resultado.classificacao);
  setTextIfExists('pr_icoScore', indiceTexto);
  setTextIfExists('pr_icoFaixa', resultado.classificacao);
  setTextIfExists('pr_icoTitulo', resultado.cenario);
  setHtmlIfExists('pr_icoRecomendacao', resultado.diagnostico);
  setWidthIfExists('pr_icoBarFill', `${resultado.indiceFinal}%`);
  setTextIfExists('pr_recTitlePdf', resultado.cenario);
  setHtmlIfExists('pr_recBodyPdf', planoHtml);
  setHtmlIfExists('pr_pdfRecText', resultado.diagnostico);

  setTextIfExists('pdf-empresa', (document.getElementById('lead_empresa')?.value || '').trim() || '-');
  setTextIfExists('pdf-nome', (document.getElementById('lead_nome')?.value || '').trim() || '-');
  setTextIfExists('pdf-salario', textoResposta('E1'));
  setTextIfExists('pdf-colaboradores', textoResposta('E2'));
  setTextIfExists('pdf-minutos', textoResposta('S1'));
  setTextIfExists('pdf-formularios', textoResposta('S2'));
  setTextIfExists('pdf-g1', textoResposta('G1'));
  setTextIfExists('pdf-g2', textoResposta('G2'));
  setTextIfExists('pdf-g3', textoResposta('G3'));

  ultimoPayloadDiagnostico = montarPayload(resultado);
}

function calcularROI() {
  const respostas = lerRespostasIESG();
  const completo = IESG_CAMPOS.every(campo => respostas[campo] !== null);
  if (!completo) {
    renderizarEstadoNeutro();
    return null;
  }

  const resultado = calcularIESG(respostas);
  atualizarResultado(resultado);
  return resultado;
}

function validarCamposIESG() {
  const faltantes = IESG_CAMPOS.filter(campo => lerResposta(campo) === null);
  if (faltantes.length === 0) return true;
  alert('Selecione uma alternativa para todos os parâmetros I-ESG antes de continuar.');
  document.getElementById(faltantes[0])?.focus();
  return false;
}

function gerarDiagnostico() {
  if (!validarCamposLead() || !validarCamposIESG()) return;

  const loadingEl = document.getElementById('diagnosis-loading');
  const reportEl = document.querySelector('.exec-report');
  const contentEl = document.querySelector('.content');

  contentEl?.classList.remove('has-result');
  if (reportEl) reportEl.style.display = 'none';
  if (loadingEl) {
    loadingEl.classList.add('visible');
    loadingEl.setAttribute('aria-hidden', 'false');
  }

  calcularROI();

  salvarDiagnostico('diagnostico').catch(e => {
    console.warn('[AFLOR] Falha silenciosa ao salvar diagnóstico:', e);
  });

  window.setTimeout(function () {
    if (loadingEl) {
      loadingEl.classList.remove('visible');
      loadingEl.setAttribute('aria-hidden', 'true');
    }
    contentEl?.classList.add('has-result');
    if (reportEl) {
      reportEl.style.display = '';
      reportEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 4000);
}

function formatarCelularLead(valor) {
  const digitos = (valor || '').replace(/\D/g, '').slice(0, 11);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 7) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)} ${digitos.slice(7)}`;
}

function validarCamposLead() {
  ['lead_nome', 'lead_empresa', 'lead_email', 'lead_celular'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('input-error');
  });

  const nome = (document.getElementById('lead_nome')?.value || '').trim();
  const empresa = (document.getElementById('lead_empresa')?.value || '').trim();
  const email = (document.getElementById('lead_email')?.value || '').trim();
  const celular = (document.getElementById('lead_celular')?.value || '').trim();
  const lgpd = document.getElementById('lead_lgpd')?.checked;
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const celularDigitos = celular.replace(/\D/g, '');
  const erros = [];

  if (!nome) {
    document.getElementById('lead_nome')?.classList.add('input-error');
    erros.push('• Nome completo é obrigatório.');
  }
  if (!empresa) {
    document.getElementById('lead_empresa')?.classList.add('input-error');
    erros.push('• Empresa é obrigatória.');
  }
  if (!email || !emailValido) {
    document.getElementById('lead_email')?.classList.add('input-error');
    erros.push('• E-mail corporativo válido é obrigatório.');
  }
  if (celularDigitos.length !== 11) {
    document.getElementById('lead_celular')?.classList.add('input-error');
    erros.push('• Celular (WhatsApp) deve conter 11 dígitos.');
  }
  if (!lgpd) {
    erros.push('• É necessário autorizar o uso dos dados conforme a LGPD.');
  }

  if (erros.length > 0) {
    alert('Por favor, corrija os seguintes campos:\n\n' + erros.join('\n'));
    return false;
  }

  return true;
}

async function salvarDiagnostico(acao) {
  if (!ultimoPayloadDiagnostico) calcularROI();
  if (!ultimoPayloadDiagnostico) {
    console.warn('[AFLOR] salvarDiagnostico ignorado — diagnóstico incompleto.');
    return;
  }

  ultimoPayloadDiagnostico = {
    ...ultimoPayloadDiagnostico,
    diagnostico_tipo: DIAGNOSTICO_TIPO,
    origem: DIAGNOSTICO_ORIGEM,
    data: new Date().toISOString(),
    dataLocale: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
    lead: {
      ...(ultimoPayloadDiagnostico.lead || {}),
      nome: (document.getElementById('lead_nome')?.value || '').trim(),
      empresa: (document.getElementById('lead_empresa')?.value || '').trim(),
      email: (document.getElementById('lead_email')?.value || '').trim(),
      celular: (document.getElementById('lead_celular')?.value || '').trim(),
    },
  };

  if (acao === 'pdf' && diagnosticoSheetId) {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        acao: 'pdf',
        diagnostico_tipo: DIAGNOSTICO_TIPO,
        id: diagnosticoSheetId,
      }),
    });
    const result = await response.json();
    if (!result.ok) throw new Error(result.erro || 'Erro ao atualizar PDF.');
    return;
  }

  if (!diagnosticoSheetId) {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(ultimoPayloadDiagnostico),
    });
    const result = await response.json();
    if (!result.ok) throw new Error(result.erro || 'Erro ao salvar diagnóstico.');
    diagnosticoSheetId = result.id;

    if (acao === 'pdf') {
      const responsePdf = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          acao: 'pdf',
          diagnostico_tipo: DIAGNOSTICO_TIPO,
          id: diagnosticoSheetId,
        }),
      });
      const resultPdf = await responsePdf.json();
      if (!resultPdf.ok) throw new Error(resultPdf.erro || 'Erro ao marcar PDF após criação.');
    }
    return;
  }

  console.info('[AFLOR] Diagnóstico já persistido. ID:', diagnosticoSheetId);
}

async function imprimirRelatorio() {
  if (!validarCamposLead() || !validarCamposIESG()) return;
  calcularROI();
  const tituloOriginal = document.title;

  try {
    await salvarDiagnostico('pdf');
  } catch (e) {
    console.warn('[AFLOR] Erro ao registrar PDF:', e);
  }

  setTextIfExists('pdf-empresa', (document.getElementById('lead_empresa')?.value || '').trim());
  setTextIfExists('pdf-nome', (document.getElementById('lead_nome')?.value || '').trim());
  document.title = nomeArquivoPdfBase();
  window.print();
  window.setTimeout(() => {
    document.title = tituloOriginal;
  }, 1000);
}

window.__calcularIESG = calcularIESG;

window.addEventListener('load', calcularROI);

IESG_CAMPOS.forEach(campo => {
  document.getElementById(campo)?.addEventListener('change', calcularROI);
});

document.getElementById('lead_celular')?.addEventListener('input', event => {
  event.target.value = formatarCelularLead(event.target.value);
});
