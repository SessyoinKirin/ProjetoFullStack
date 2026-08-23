/*
 * @Author: SessyoinKirin
 * @Date: 2026-08-23 01:41:16
 * @LastEditors: SessyoinKirin
 * @LastEditTime: 2026-08-23 17:22:45
 * @FilePath: \my-app\proxy.ts
 * @Description: Configuração do proxy para proteção de rotas de API e páginas.
 * 
 * Copyright (c) 2026 by SessyoinKirin, All Rights Reserved. 
 */
import { NextResponse, NextRequest } from "next/server";
import { verifyJWT } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("auth_token")?.value;
  const verifiedToken = token ? await verifyJWT(token) : null;

  // 1. BLOQUEIO DE ACESSO DIRETO VIA NAVEGADOR (GET /api/produtos)
  // Impede que qualquer pessoa (autenticada ou não) acesse diretamente a URL localhost:3000/api/produtos
  if (pathname === "/api/produtos" && req.method === "GET") {
    const isDirectNavigation = req.headers.get("accept")?.includes("text/html");
    if (isDirectNavigation) {
      return NextResponse.json(
        { error: "Acesso direto à API não é permitido." },
        { status: 403 }
      );
    }
  }

  // 2. BLOQUEIO DE EDITIONS/CRIAÇÕES EM /api/produtos SEM LOGIN
  if (!verifiedToken && pathname.startsWith("/api/produtos")) {
    if (["POST", "DELETE", "PATCH", "PUT"].includes(req.method)) {
      return NextResponse.json({ error: "Acesso não autorizado" }, { status: 401 });
    }
  }

  // 3. BLOQUEIO DE APIS PRIVADAS SEM LOGIN (/api/estatistica, /api/relatorio, /api/update, /api/delete)
  const protectedApis = ["/api/estatistica", "/api/relatorio", "/api/update", "/api/delete"];
  if (!verifiedToken && protectedApis.some((apiPath) => pathname.startsWith(apiPath))) {
    return NextResponse.json({ error: "Acesso não autorizado" }, { status: 401 });
  }

  // 4. PROTEÇÃO DAS PÁGINAS DO FRONTEND SEM LOGIN (/update, /delete)
  const protectedPages = ["/update", "/delete"];
  if (!verifiedToken && protectedPages.some((pagePath) => pathname.startsWith(pagePath))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/produtos/:path*", 
    "/api/estatistica/:path*",
    "/api/relatorio/:path*",
    "/api/update/:path*",
    "/api/delete/:path*",
  ],
};