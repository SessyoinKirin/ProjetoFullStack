/*
 * @Author: SessyoinKirin
 * @Date: 2026-08-23 15:17:51
 * @LastEditors: SessyoinKirin
 * @LastEditTime: 2026-08-23 16:34:02
 * @FilePath: \my-app\app\api\estatistica\route.ts
 * @Description: Salva ou incrementa estatísticas no fuso de Brasília (Sistema Single-User)
 * 
 * Copyright (c) 2026 by SessyoinKirin, All Rights Reserved. 
 */
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, Name, Price, HistoricMoney, HistoricDebit, HistoricCredit } = body;

    if (!Name) {
      return NextResponse.json({ error: "O nome do produto é obrigatório." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("Projeto");

    // Pega a data atual formatada no fuso de Brasília (apenas DD/MM/YYYY para o filtro do dia)
    const agoraIso = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const dataHoje = agoraIso.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

    // Define o filtro: mesmo produto (por ID ou Nome) e zerado no MESMO DIA
    const idProd = productId ? String(productId) : null;
    const filter = {
      $or: [{ productId: idProd }, { Name: String(Name) }],
      zeradoEmData: dataHoje, // Filtra registros da mesma data
    };

    // Operação para somar os contadores e registrar/atualizar os dados
    const update = {
      $inc: {
        HistoricMoney: Number(HistoricMoney) || 0,
        HistoricDebit: Number(HistoricDebit) || 0,
        HistoricCredit: Number(HistoricCredit) || 0,
      },
      $set: {
        productId: idProd,
        Name: String(Name),
        Price: Number(Price) || 0,
        zeradoEmData: dataHoje,
        zeradoEm: agoraIso.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
        zeradoEmIso: agoraIso,
      },
    };

    // upsert: true cria o registro se não existir, ou atualiza/soma se já existir no mesmo dia
    await db.collection("estatistica").updateOne(filter, update, { upsert: true });

    return NextResponse.json(
      { message: "Estatística atualizada com sucesso!" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erro ao gravar estatística:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}