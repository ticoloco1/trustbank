/**
 * Ofuscação do ID do vídeo: no backend/banco pode-se guardar o ID invertido.
 * Só na hora de injetar no iframe o ID é "revelado" (revertido).
 * Dificulta leitura direta do ID no código-fonte por scrapers/bots.
 */
export const SecurityHelper = {
  revealId: (secret: string): string => {
    return secret.split("").reverse().join("");
  },
  /** Inverte o ID para armazenar ofuscado (ex.: no banco ou resposta API). */
  obfuscateId: (id: string): string => {
    return id.split("").reverse().join("");
  },
};
