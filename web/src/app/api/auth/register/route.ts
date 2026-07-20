import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const { email, username, password, confirmPassword } = await req.json();

        if (!email || !username || !password || !confirmPassword) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        if (password !== confirmPassword) {
            return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
        }

        const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
        if (!usernameRegex.test(username)) {
            return NextResponse.json({ error: "Username can only contain letters, numbers, and symbols (_.-)" }, { status: 400 });
        }

        const usernameLower = username.toLowerCase();
        const emailLower = email.toLowerCase();

        // Check for existing user by email or username
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: emailLower },
                    { usernameLower }
                ]
            }
        });

        if (existingUser) {
            if (existingUser.email === emailLower) {
                return NextResponse.json({ error: "Email is already in use" }, { status: 400 });
            }
            if (existingUser.usernameLower === usernameLower) {
                return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                email: emailLower,
                username: username,
                usernameLower: usernameLower,
                password: hashedPassword,
            }
        });

        return NextResponse.json({ success: true, message: "User registered successfully" });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
