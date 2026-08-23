// import { NextResponse } from "next/server";
// import clientPromise from "@/lib/mongodb";
// import { ObjectId } from "mongodb";

// // Função para formatar o nome com as primeiras letras maiúsculas
// function formatTitleCase(str: string): string {
//   if (!str) return "";
//   return str
//     .trim()
//     .toLowerCase()
//     .replace(/(^\w|\s\w)/g, (letter) => letter.toUpperCase());
// }

// export async function PUT(request: Request) {
//   try {
//     const client = await clientPromise;
//     const db = client.db("Projeto");
    
//     // Recebe os dados atualizados enviados no body
//     const body = await request.json();
//     const { id, Name, Price, Quantity, ImageLink } = body;

//     if (!id) {
//       return NextResponse.json(
//         { error: "O ID do produto é obrigatório." },
//         { status: 400 }
//       );
//     }

//     // Atualiza o documento específico na coleção "Information"
//     const result = await db.collection("Information").updateOne(
//       { _id: new ObjectId(id) },
//       {
//         $set: {
//           "_product.Name": formatTitleCase(Name),
//           "_product.Price": Number(Price),
//           "_product.Quantity": Number(Quantity),
//           "_product.ImageLink": ImageLink || "",
//         },
//       }
//     );

//     if (result.matchedCount === 0) {
//       return NextResponse.json(
//         { error: "Produto não encontrado." },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json({ message: "Produto atualizado com sucesso!" }, { status: 200 });
//   } catch (error) {
//     return NextResponse.json(
//       { error: "Falha ao atualizar o produto" },
//       { status: 500 }
//     );
//   }
// }