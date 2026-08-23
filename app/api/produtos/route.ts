/*
 * @Author: SessyoinKirin
 * @Date: 2026-08-19 22:05:52
 * @LastEditors: SessyoinKirin
 * @LastEditTime: 2026-08-23 01:43:57
 * @FilePath: \my-app\app\api\produtos\route.ts
 * @Description: 
 * 
 * Copyright (c) 2026 by SessyoinKirin, All Rights Reserved. 
 */
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyJWT } from "@/lib/auth";
import { cookies } from "next/headers";

// Função para obter ID do usuário logado através do Token
async function getUserIdFromCookie() {
  const cookieStore = await cookies(); // <--- Adicionado o await aqui
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  const payload = await verifyJWT(token);
  return payload ? payload.userId : null;
}



export async function GET() {
  try {
    const client = await clientPromise;
    
    // 1. Altere para o seu Banco de Dados
    const db = client.db("Projeto"); 

    // 2. Altere para a sua Coleção (Tabela) de Informações
    const informations = await db
      .collection("Information")
      .find({})
      .toArray();

    return NextResponse.json(informations);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch information" },
      { status: 500 }
    );
  }
}
function formatTitleCase(str: string): string {
  if (!str) return "";
  return str
    .trim()
    .toLowerCase()
    .replace(/(^\w|\s\w)/g, (letter) => letter.toUpperCase());
}
export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("Projeto");
    const body = await request.json();

    const newProduct = {
      userId: new ObjectId(userId), // Associa o produto ao usuário da coleção User
      _product: {
        Name: body.Name,
        Price: Number(body.Price) || 0,
        MoneyQuantity: 0,
        DebitQuantity: 0,
        CreditQuantity: 0,
        HistoricMoney: 0,
        HistoricDebit: 0,
        HistoricCredit: 0,
        ImageLink: body.ImageLink || "",
      },
    };

    const result = await db.collection("Information").insertOne(newProduct);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar produto" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("Projeto");
    const body = await request.json();

    const { id, Name, Price, MoneyQuantity, DebitQuantity, CreditQuantity, HistoricMoney, HistoricDebit, HistoricCredit, ImageLink } = body;

    const result = await db.collection("Information").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          "_product.Name": Name,
          "_product.Price": Number(Price),
          "_product.MoneyQuantity": Number(MoneyQuantity) || 0,
          "_product.DebitQuantity": Number(DebitQuantity) || 0,
          "_product.CreditQuantity": Number(CreditQuantity) || 0,
          "_product.HistoricMoney": Number(HistoricMoney) || 0,
          "_product.HistoricDebit": Number(HistoricDebit) || 0,
          "_product.HistoricCredit": Number(HistoricCredit) || 0,
          "_product.ImageLink": ImageLink,
        },
      }
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar produto" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("Projeto");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
    }

    const result = await db.collection("Information").deleteOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao deletar produto" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { action } = await request.json();
    const client = await clientPromise;
    const db = client.db("Projeto");

    // 1. Zera apenas o estoque (Quantidades atuais)
    if (action === "reset_stock") {
      await db.collection("Information").updateMany(
        {},
        {
          $set: {
            "_product.MoneyQuantity": 0,
            "_product.DebitQuantity": 0,
            "_product.CreditQuantity": 0,
          },
        }
      );

      return NextResponse.json(
        { message: "Estoque zerado com sucesso!" },
        { status: 200 }
      );
    }

    // 2. Zera apenas os Históricos de Vendas
    if (action === "reset_history") {
      await db.collection("Information").updateMany(
        {},
        {
          $set: {
            "_product.HistoricMoney": 0,
            "_product.HistoricDebit": 0,
            "_product.HistoricCredit": 0,
          },
        }
      );

      return NextResponse.json(
        { message: "Histórico zerado com sucesso!" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Ação não informada ou inválida." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erro na rota PATCH:", error);
    return NextResponse.json(
      { error: "Erro ao zerar dados no banco de dados." },
      { status: 500 }
    );
  }
}