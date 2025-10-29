// ============ src/utils/formatadores.ts ============

export function formatarCPF(cpf: string): string {
  const apenasNumeros = cpf.replace(/\D/g, '')
  return apenasNumeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatarCNPJ(cnpj: string): string {
  const apenasNumeros = cnpj.replace(/\D/g, '')
  return apenasNumeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}
