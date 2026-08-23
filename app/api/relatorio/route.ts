/*
 * @Author: SessyoinKirin
 * @Date: 2026-08-23 16:25:04
 * @LastEditors: SessyoinKirin
 * @LastEditTime: 2026-08-23 16:25:16
 * @FilePath: \my-app\app\api\relatorio\route.ts
 * @Description: 
 * 
 * Copyright (c) 2026 by SessyoinKirin, All Rights Reserved. 
 */
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Datas de início e fim são obrigatórias." },
        { status: 400 }
      );
    }

    // Define o intervalo considerando o dia inteiro em Brasília (GMT-3)
    const start = new Date(`${startDate}T00:00:00-03:00`);
    const end = new Date(`${endDate}T23:59:59.999-03:00`);

    const client = await clientPromise;
    const db = client.db("Projeto");

    const registos = await db
      .collection("estatistica")
      .find({
        zeradoEmIso: {
          $gte: start,
          $lte: end,
        },
      })
      .sort({ zeradoEmIso: 1 })
      .toArray();

    return NextResponse.json(registos, { status: 200 });
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}