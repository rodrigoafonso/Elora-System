// Localização da pessoa: fica só na memória desta aba e nunca é gravada.
// Arredondada a 3 casas decimais (cerca de 100 m) antes de qualquer uso.
export const estadoLocal = { posicao: null, origem: null }; // origem: 'gps' | 'cep'

export function pedirLocalizacao() {
  return new Promise((resolver, rejeitar) => {
    if (!('geolocation' in navigator)) return rejeitar(new Error('Este navegador não oferece localização. Informe seu CEP.'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolver({ lat: Math.round(p.coords.latitude * 1000) / 1000, lon: Math.round(p.coords.longitude * 1000) / 1000 }),
      (e) =>
        rejeitar(new Error(e.code === 1
          ? 'A localização não foi liberada (pela pessoa ou por este navegador/página). Informe seu CEP para ver os postos ao redor.'
          : 'Não foi possível obter sua localização agora. Tente de novo ou informe seu CEP.')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 120000 },
    );
  });
}
