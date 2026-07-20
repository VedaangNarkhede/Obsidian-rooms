import React from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import styles from './Dashboard.module.css';
import DynamicNavbar from '@/components/layout/DynamicNavbar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        redirect('/login');
    }

    // Fetch vaults the user owns or has been granted access to
    const ownedVaults = await prisma.vault.findMany({
        where: { userId: (session.user as any).id }
    });

    const grantedVaults = await prisma.vault.findMany({
        where: { grants: { some: { email: session.user.email || '' } } }
    });

    const ownedVaultIds = ownedVaults.map(v => v.id);
    const allVaults = [...ownedVaults, ...grantedVaults].map(v => ({
        id: v.id,
        name: v.name,
        nickname: null
    }));

    return (
        <div className={styles.dashboardContainer}>
            <DynamicNavbar 
                vaults={allVaults} 
                ownedVaultIds={ownedVaultIds} 
                username={session.user.name || session.user.email || 'User'} 
            />

            <main className={styles.mainContent}>
                {children}
            </main>
        </div>
    );
}
