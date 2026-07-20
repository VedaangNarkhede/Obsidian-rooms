import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                usernameOrEmail: { label: "Email or Username", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.usernameOrEmail || !credentials?.password) {
                    throw new Error("Missing credentials");
                }
                
                const loginStr = credentials.usernameOrEmail.toLowerCase();
                
                // Find by email or usernameLower
                const user = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { email: loginStr },
                            { usernameLower: loginStr }
                        ]
                    }
                });

                if (!user) {
                    throw new Error("Invalid username or password");
                }

                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) {
                    throw new Error("Invalid username or password");
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    username: user.username, // custom field
                };
            }
        })
    ],
    session: {
        strategy: 'jwt'
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.username = (user as any).username;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).id = token.id;
                (session.user as any).username = token.username;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
    },
    secret: process.env.SESSION_SECRET
};

export async function verifyVaultAccess(vaultId: string, user: any) {
    const vault = await prisma.vault.findUnique({
        where: { id: vaultId },
        include: {
            grants: {
                where: { email: user.email || '' }
            }
        }
    });

    if (!vault) return { authorized: false, isOwner: false, allowedPaths: null as string[] | null };
    
    if (vault.userId === user.id) {
        return { authorized: true, isOwner: true, allowedPaths: null };
    }
    
    if (vault.grants.length > 0) {
        const grant = vault.grants[0];
        let allowedPaths: string[] | null = null;
        if (!grant.grantAll && grant.grantedPaths) {
            try {
                allowedPaths = JSON.parse(grant.grantedPaths);
            } catch (e) {
                allowedPaths = [];
            }
        }
        return { authorized: true, isOwner: false, allowedPaths };
    }
    
    return { authorized: false, isOwner: false, allowedPaths: null };
}
