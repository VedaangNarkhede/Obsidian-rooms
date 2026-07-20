import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardClient from '@/components/dashboard/DashboardClient';

export default async function GlobalDashboardEmptyState() {
    const session = await getServerSession(authOptions);
    
    const ownedVaults = await prisma.vault.findMany({
        where: { userId: (session?.user as any)?.id },
        include: { grants: true }
    });
    const grantedVaults = await prisma.vault.findMany({
        where: { grants: { some: { email: session?.user?.email || '' } } }
    });

    const preferences = await prisma.vaultPreference.findMany({
        where: { userId: (session?.user as any)?.id }
    });
    const prefMap = new Map(preferences.map(p => [p.vaultId, p.nickname]));

    const allVaults = [
        ...ownedVaults.map(v => ({
            id: v.id,
            name: v.name,
            nickname: prefMap.get(v.id) || null,
            isSharedByMe: v.grants.length > 0,
            isGrantedToMe: false
        })),
        ...grantedVaults.map(v => ({
            id: v.id,
            name: v.name,
            nickname: prefMap.get(v.id) || null,
            isSharedByMe: false,
            isGrantedToMe: true
        }))
    ];

    return <DashboardClient allVaults={allVaults} />;
}
