import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email:    { label: "Email",  type: "email" },
      password: { label: "Senha",  type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const user = await prisma.user.findUnique({
        where: { email: credentials.email.toLowerCase() },
      });
      if (!user || !user.passwordHash) return null;

      const valid = await compare(credentials.password, user.passwordHash);
      if (!valid) return null;

      return { id: user.id, name: user.name, email: user.email, image: user.avatarUrl ?? null, plan: user.plan, trialEndsAt: user.trialEndsAt?.toISOString() ?? null };
    },
  }),
];

// Google OAuth só ativo se as credenciais estiverem configuradas
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
    newUser: "/sign-up",
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await prisma.user.upsert({
          where: { email: user.email! },
          update: { name: user.name ?? undefined },
          create: {
            email: user.email!,
            name: user.name ?? "Usuário",
            avatarUrl: user.image ?? null,
          },
        });
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      if (account?.provider === "google") {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
          select: { id: true, plan: true, trialEndsAt: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.plan = dbUser.plan;
          token.trialEndsAt = dbUser.trialEndsAt?.toISOString() ?? null;
        }
      } else if (user) {
        token.id = user.id;
        token.plan = (user as { plan?: string | null }).plan ?? "FREE";
        token.trialEndsAt = (user as { trialEndsAt?: string | null }).trialEndsAt ?? null;
      }
      if (trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { plan: true, trialEndsAt: true },
        });
        if (dbUser) {
          token.plan = dbUser.plan;
          token.trialEndsAt = dbUser.trialEndsAt?.toISOString() ?? null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; plan?: string | null; trialEndsAt?: string | null }).id = token.id as string;
        (session.user as { id?: string; plan?: string | null; trialEndsAt?: string | null }).plan = token.plan ?? "FREE";
        (session.user as { id?: string; plan?: string | null; trialEndsAt?: string | null }).trialEndsAt = (token.trialEndsAt as string | null) ?? null;
      }
      return session;
    },
  },
};
