/*
 * @Author: SessyoinKirin
 * @Date: 2026-08-23 01:41:16
 * @LastEditors: SessyoinKirin
 * @LastEditTime: 2026-08-23 16:53:08
 * @FilePath: \my-app\proxy.ts
 * @Description: Configuração do proxy para proteção de rotas de API e páginas.
 * 
 * Copyright (c) 2026 by SessyoinKirin, All Rights Reserved. 
 */
import { NextResponse, NextRequest } from "next/server";
import { verifyJWT } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  const verifiedToken = token ? await verifyJWT(token) : null;

  // Bloqueia ações de edição/criação em /api/produtos sem login
  if (!verifiedToken && req.nextUrl.pathname.startsWith("/api/produtos")) {
    if (["POST", "DELETE", "PATCH", "PUT"].includes(req.method)) {
      return NextResponse.json({ error: "Acesso não autorizado" }, { status: 401 });
    }
  }

  // Bloqueia QUALQUER requisição para /api/estatistica se o usuário não estiver autenticado
  if (!verifiedToken && req.nextUrl.pathname.startsWith("/api/estatistica")) {
    return NextResponse.json({ error: "Acesso não autorizado" }, { status: 401 });
  }

  // Bloqueia QUALQUER requisição para /api/relatorio se o usuário não estiver autenticado
  if (!verifiedToken && req.nextUrl.pathname.startsWith("/api/relatorio")) {
    return NextResponse.json({ error: "Acesso não autorizado" }, { status: 401 });
  }

  // Protege páginas completas do frontend que requerem login
  const protectedPages = ["/update", "/delete"];
  if (!verifiedToken && protectedPages.some((path) => req.nextUrl.pathname.startsWith(path))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/produtos/:path*", 
    "/api/estatistica/:path*",
    "/api/relatorio/:path*",
    "/update/:path*", 
    "/delete/:path*"
  ],
};