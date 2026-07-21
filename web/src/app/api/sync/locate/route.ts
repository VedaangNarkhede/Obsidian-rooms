import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        const { apiKey, notePath } = await request.json();
        if (!apiKey || !notePath) {
            return NextResponse.json({ found: false });
        }

        const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
        
        const keyObj = await prisma.apiKey.findUnique({
            where: { keyHash },
            include: { user: true }
        });
        
        if (!keyObj) {
            return NextResponse.json({ found: false });
        }
        
        // Find notes matching this notePath ending, belonging to a vault owned by this user
        const notes = await prisma.note.findMany({
            where: {
                vault: {
                    userId: keyObj.userId
                }
            },
            include: { vault: true }
        });

        const matchedNote = notes.find(n => n.path.endsWith(notePath));

        if (matchedNote) {
            const vaultName = matchedNote.vault.name;
            let quickAccessName = "";
            if (matchedNote.path !== notePath && matchedNote.path.endsWith(notePath)) {
                quickAccessName = matchedNote.path.substring(0, matchedNote.path.length - notePath.length - 1);
            }
            return NextResponse.json({ found: true, vaultName, quickAccessName });
        }

        return NextResponse.json({ found: false });
    } catch(err) {
        console.error(err);
        return NextResponse.json({ found: false });
    }
}
