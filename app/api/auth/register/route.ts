/*
 * @Author: SessyoinKirin
 * @Date: 2026-08-23 01:44:46
 * @LastEditors: SessyoinKirin
 * @LastEditTime: 2026-08-23 15:06:37
 * @FilePath: \my-app\app\api\auth\register\route.ts
 * @Description: Rota de registro desativada por segurança
 * 
 * Copyright (c) 2026 by SessyoinKirin, All Rights Reserved. 
 */
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "O cadastro de novos usuários está permanentemente desativado." },
    { status: 403 }
  );
}
