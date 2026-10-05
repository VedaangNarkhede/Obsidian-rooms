import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardClient from '@/components/dashboard/DashboardClient';

export default async function GlobalDashboardEmptyState() {
    const session = await getServerSession(authOptions);
    
    const [ownedVaults, grantedVaults, preferences, publicViews] = await Promise.all([
        prisma.vault.findMany({
            where: { userId: (session?.user as any)?.id },
            include: { grants: true }
        }),
        prisma.vault.findMany({
            where: { grants: { some: { email: session?.user?.email || '' } } }
        }),
        prisma.vaultPreference.findMany({
            where: { userId: (session?.user as any)?.id }
        }),
        prisma.publicVaultView.findMany({
            where: { userId: (session?.user as any)?.id },
            include: { vault: true },
            orderBy: { viewedAt: 'desc' }
        })
    ]);

    const prefMap = new Map(preferences.map(p => [p.vaultId, p.nickname]));

    const allVaults = [
        ...ownedVaults.map(v => ({
            id: v.id,
            name: v.name,
            nickname: prefMap.get(v.id) || null,
            isSharedByMe: v.grants.length > 0,
            isGrantedToMe: false,
            isPublicView: false,
            isPublic: v.isPublic
        })),
        ...grantedVaults.map(v => ({
            id: v.id,
            name: v.name,
            nickname: prefMap.get(v.id) || null,
            isSharedByMe: false,
            isGrantedToMe: true,
            isPublicView: false,
            isPublic: v.isPublic
        })),
        ...publicViews.map(pv => ({
            id: pv.vault.id,
            name: pv.vault.name,
            nickname: prefMap.get(pv.vault.id) || null,
            isSharedByMe: false,
            isGrantedToMe: false,
            isPublicView: true,
            isPublic: pv.vault.isPublic
        }))
    ];

    return <DashboardClient allVaults={allVaults} />;
}
