/**
 * ============================================================================
 * IMPLEMENTAÇÃO PRINCIPAL DO CHATBOT
 * ============================================================================
 */

// ============ actions/chatbot.ts ============

/**
 * Esta é a ação que você vai usar no Botpress
 * 
 * Como usar:
 * 1. Se estiver usando Botpress Studio: Arraste essa action para seu flow
 * 2. Se estiver usando Code: Chame essa action quando receber mensagem
 */

import { validarCPF, validarCNPJ } from '../src/utils/validadores'
import { formatarCPF, formatarCNPJ } from '../src/utils/formatadores'

/**
 * Interface para o estado do usuário
 */
interface EstadoUsuario {
  step: string
  saudacao?: string
  ehCliente?: boolean
  tipoPessoa?: 'fisica' | 'juridica'
  documento?: string
  nome?: string
}

/**
 * IMPORTANTE: Esta é a função que será chamada para cada mensagem
 */
export async function procesarChatbot(event: any, bp: any): Promise<string> {
  try {
    const userId = event.userId
    const mensagem = event.preview || event.text || ''
    
    // ===== OBTER ESTADO DO USUÁRIO =====
    // Escolha uma das opções abaixo conforme sua versão do Botpress:
    
    // Opção 1: Botpress 11.x - 12.x (usando KVS)
    let estado = await bp.kvs.forBot().get(`chatbot:${userId}`)
    if (!estado) {
      estado = { step: 'inicio' }
    }
    
    // Opção 2: Botpress 12.6+ (usando context)
    // let estado = event.state.user || { step: 'inicio' }
    
    // Opção 3: Banco de dados (para qualquer versão)
    // let estado = await db.usuarios.findOne({ userId }) || { step: 'inicio' }
    
    // ===== PROCESSAR CONFORME O STEP =====
    let resposta = ''
    
    switch (estado.step) {
      // STEP 1: Saudação inicial
      case 'inicio': {
        const hora = new Date().getHours()
        estado.saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
        
        resposta = `${estado.saudacao}! 👋 Bem-vindo(a)!

Você é cliente nosso?

✅ Sou cliente
❌ Não sou cliente`
        
        estado.step = 'pergunta_cliente'
        break
      }
      
      // STEP 2: Perguntar se é cliente
      case 'pergunta_cliente': {
        const msg = mensagem.toLowerCase()
        
        if (msg.includes('sim') || msg.includes('cliente') || msg === '1') {
          estado.ehCliente = true
          resposta = `Você é Pessoa Física ou Jurídica?

👤 Pessoa Física
🏢 Pessoa Jurídica`
          estado.step = 'pergunta_tipo_pessoa'
        } else if (msg.includes('não') || msg === '2') {
          estado.ehCliente = false
          resposta = `Você é Pessoa Física ou Jurídica?

👤 Pessoa Física
🏢 Pessoa Jurídica`
          estado.step = 'pergunta_tipo_pessoa'
        } else {
          resposta = '❌ Por favor, responda com "Sou cliente" ou "Não sou cliente"'
        }
        break
      }
      
      // STEP 3: Perguntar tipo de pessoa
      case 'pergunta_tipo_pessoa': {
        const msg = mensagem.toLowerCase()
        
        if (msg.includes('física') || msg === '1') {
          estado.tipoPessoa = 'fisica'
          resposta = 'Por favor, informe seu CPF (formato: 000.000.000-00)'
          estado.step = 'aguardando_documento'
        } else if (msg.includes('jurídica') || msg === '2') {
          estado.tipoPessoa = 'juridica'
          resposta = 'Por favor, informe seu CNPJ (formato: 00.000.000/0000-00)'
          estado.step = 'aguardando_documento'
        } else {
          resposta = '❌ Por favor, responda com "Pessoa Física" ou "Pessoa Jurídica"'
        }
        break
      }
      
      // STEP 4: Validar documento
      case 'aguardando_documento': {
        let valido = false
        let documentoFormatado = ''
        
        if (estado.tipoPessoa === 'fisica') {
          valido = validarCPF(mensagem)
          documentoFormatado = formatarCPF(mensagem)
        } else {
          valido = validarCNPJ(mensagem)
          documentoFormatado = formatarCNPJ(mensagem)
        }
        
        if (valido) {
          estado.documento = mensagem.replace(/\D/g, '')
          const tipoDoc = estado.tipoPessoa === 'fisica' ? 'CPF' : 'CNPJ'
          resposta = `✅ ${tipoDoc} validado: ${documentoFormatado}\n\nQual é o seu nome?`
          estado.step = 'aguardando_nome'
        } else {
          const tipoDoc = estado.tipoPessoa === 'fisica' ? 'CPF' : 'CNPJ'
          resposta = `❌ ${tipoDoc} inválido. Por favor, tente novamente.`
        }
        break
      }
      
      // STEP 5: Pedir nome
      case 'aguardando_nome': {
        if (mensagem.length < 3) {
          resposta = '❌ Por favor, informe um nome válido (mínimo 3 caracteres)'
        } else {
          estado.nome = mensagem
          
          // Escolher menu conforme cliente ou não
          if (estado.ehCliente) {
            resposta = `✅ Obrigado pelas informações!

👋 Olá ${estado.nome}. Escolha uma das opções:

1️⃣ Financeiro
2️⃣ Suporte
3️⃣ Novas contratações
4️⃣ Cancelamento
5️⃣ Fale com um atendente
6️⃣ Encerre o atendimento`
            estado.step = 'menu_cliente'
          } else {
            resposta = `✅ Obrigado pelas informações!

👋 Olá ${estado.nome}. Escolha uma das opções:

1️⃣ Fale com a equipe de vendas
2️⃣ Dúvidas sobre planos
3️⃣ Fale com um atendente
4️⃣ Encerre o atendimento`
            estado.step = 'menu_nao_cliente'
          }
        }
        break
      }
      
      // STEP 6: Menu para cliente
      case 'menu_cliente': {
        const opcoes: Record<string, string> = {
          '1': '💰 Você escolheu **Financeiro**. Direcionando...',
          '2': '🛠️ Você escolheu **Suporte**. Direcionando...',
          '3': '📝 Você escolheu **Novas Contratações**. Direcionando...',
          '4': '⚠️ Você escolheu **Cancelamento**. Direcionando...',
          '5': '👤 Conectando com um atendente...',
          '6': '👋 Obrigado por entrar em contato! Até logo!'
        }
        
        resposta = opcoes[mensagem] || '❌ Opção inválida (1-6)'
        break
      }
      
      // STEP 7: Menu para não-cliente
      case 'menu_nao_cliente': {
        const opcoes: Record<string, string> = {
          '1': '🚀 Você escolheu **Vendas**. Direcionando...',
          '2': '❓ Você escolheu **Planos**. Direcionando...',
          '3': '👤 Conectando com um atendente...',
          '4': '👋 Obrigado por entrar em contato! Até logo!'
        }
        
        resposta = opcoes[mensagem] || '❌ Opção inválida (1-4)'
        break
      }
      
      default:
        resposta = 'Estado desconhecido. Iniciando...'
        estado.step = 'inicio'
    }
    
    // ===== SALVAR ESTADO =====
    // Novamente, escolha conforme sua versão:
    
    // Opção 1: KVS (Botpress 11.x - 12.x)
    await bp.kvs.forBot().set(`chatbot:${userId}`, estado)
    
    // Opção 2: Context (Botpress 12.6+)
    // event.state.user = estado
    
    // Opção 3: Banco de dados
    // await db.usuarios.updateOne({ userId }, { $set: estado }, { upsert: true })
    
    return resposta
    
  } catch (erro) {
    console.error('Erro no chatbot:', erro)
    return '❌ Desculpe, ocorreu um erro. Tente novamente.'
  }
}

/**
