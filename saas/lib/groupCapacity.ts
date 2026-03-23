import { prisma } from "@/lib/prisma";

export const MAX_MEMBERS_BASE = 12;
export const MAX_MEMBERS_CAP = 40;
export const PREMIUM_BONUS = 4;      // cada membro Premium adiciona 4 vagas

/**
 * Retorna o limite efetivo de membros de um grupo,
 * levando em conta quantos membros Premium ele já tem.
 */
export async function getEffectiveMaxMembers(groupId: string): Promise<number> {
  const premiumCount = await prisma.groupMember.count({
    where: {
      groupId,
      user: { plan: { in: ["PREMIUM", "FAMILY"] } },
    },
  });
  return Math.min(MAX_MEMBERS_CAP, MAX_MEMBERS_BASE + premiumCount * PREMIUM_BONUS);
}

/**
 * Calcula o limite efetivo a partir de uma lista de planos já carregada,
 * sem precisar de nova query ao banco.
 */
export function computeEffectiveMax(memberPlans: string[]): number {
  const premiumCount = memberPlans.filter((p) => p === "PREMIUM" || p === "FAMILY").length;
  return Math.min(MAX_MEMBERS_CAP, MAX_MEMBERS_BASE + premiumCount * PREMIUM_BONUS);
}
