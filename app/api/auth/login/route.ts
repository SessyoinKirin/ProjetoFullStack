/*
 * @Author: SessyoinKirin
 * @Date: 2026-08-23 01:28:00
 * @LastEditors: SessyoinKirin
 * @LastEditTime: 2026-08-23 12:30:32
 * @FilePath: \my-app\app\api\auth\login\route.ts
 * @Description: Rota de Login Protegida contra NoSQL Injection
 * 
 * Copyright (c) 2026 by SessyoinKirin, All Rights Reserved. 
 */
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { signJWT } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 🛡️ SANITIZAÇÃO: Força estritamente o tipo string para neutralizar objetos de injeção NoSQL
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    // Se os dados enviadas não forem textos válidos, recusa antes de ir ao banco
    if (!email || !password) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("Projeto");

    // Agora o findOne sempre receberá uma string limpa
    const user = await db.collection("User").findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    const token = await signJWT({ userId: user._id.toString(), email: user.email });

    const response = NextResponse.json({ message: "Login realizado com sucesso" }, { status: 200 });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 86400*3, // 3 dias
    });

    return response;
  } catch (error) {
    console.error("Erro na rota de login:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}