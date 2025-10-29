// ============ src/utils/validadores.ts ============

export function validarCPF(cpf: string): boolean {
  const apenasNumeros = cpf.replace(/\D/g, '')
  if (apenasNumeros.length !== 11) return false
  if (/^(\d)\1{10}$/.test(apenasNumeros)) return false
  
  let soma = 0, resto = 0
  
  for (let i = 1; i <= 9; i++) {
    soma += parseInt(apenasNumeros[i - 1]) * (11 - i)
  }
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(apenasNumeros[9])) return false
  
  soma = 0
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(apenasNumeros[i - 1]) * (12 - i)
  }
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  
  return resto === parseInt(apenasNumeros[10])
}

export function validarCNPJ(cnpj: string): boolean {
  const apenasNumeros = cnpj.replace(/\D/g, '')
  if (apenasNumeros.length !== 14) return false
  if (/^(\d)\1{13}$/.test(apenasNumeros)) return false
  
  let tamanho = apenasNumeros.length - 2
  let numeros = apenasNumeros.substring(0, tamanho)
  let digitos = apenasNumeros.substring(tamanho)
  let soma = 0, pos = 0
  
  for (let i = tamanho - 1; i >= 0; i--) {
    soma += parseInt(numeros[tamanho - 1 - i]) * (pos % 8 + 2)
    pos++
  }
  
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  if (resultado !== parseInt(digitos[0])) return false
  
  tamanho = tamanho + 1
  numeros = apenasNumeros.substring(0, tamanho)
  soma = 0
  pos = 0
  
  for (let i = tamanho - 1; i >= 0; i--) {
    soma += parseInt(numeros[tamanho - 1 - i]) * (pos % 8 + 2)
    pos++
  }
  
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  return resultado === parseInt(digitos[1])
}
