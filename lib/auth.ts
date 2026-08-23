/*
 * @Author: SessyoinKirin
 * @Date: 2026-08-23 01:27:27
 * @LastEditors: SessyoinKirin
 * @LastEditTime: 2026-08-23 15:01:00
 * @FilePath: \my-app\lib\auth.ts
 * @Description: Autenticação JWT usando variáveis de ambiente
 * 
 * Copyright (c) 2026 by SessyoinKirin, All Rights Reserved. 
 */
import { SignJWT, jwtVerify } from "jose";

// Força a leitura do .env.local sem expor a chave de fallback no código
const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error("A variável de ambiente JWT_SECRET não está definida no arquivo .env.local!");
}

const SECRET_KEY = new TextEncoder().encode(secret);

export async function signJWT(payload: { userId: string; email: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("3d") // Alterado para 3 dias conforme alinhado anteriormente
    .sign(SECRET_KEY);
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as { userId: string; email: string };
  } catch (error) {
    return null;
  }
}