import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getBusinessSummary } from "@/src/lib/chatbot-helpers";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { message, days = 30 } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Mensaje inválido' },
        { status: 400 }
      );
    }

    // Obtener datos del negocio
    const businessData = await getBusinessSummary(days);

    // Construir el contexto para Claude
    const contextPrompt = `
Eres un asistente amigable para el restaurante "Las Araucarias". 
Ayudas al dueño y trabajadores a entender las ventas de los últimos ${days} días.

IMPORTANTE - CÓMO DEBES RESPONDER:
- Usa palabras SIMPLES que cualquier persona pueda entender
- NUNCA uses palabras en inglés (NO digas: cross-selling, up-selling, top sellers, insights, etc.)
- En lugar de "insights" di "consejos" o "recomendaciones"
- En lugar de "top sellers" di "los más vendidos"
- En lugar de "cross-selling" di "vender productos complementarios" o "ofrecer algo más junto al pedido"
- En lugar de "up-selling" di "ofrecer una versión más grande o mejor"
- Habla como si le explicaras a un familiar que no sabe de tecnología
- Usa números y datos concretos, fáciles de entender
- Sé amable y cercano en tu forma de hablar

DATOS DE LAS VENTAS:

📊 RESUMEN GENERAL:
- Pedidos totales: ${businessData.salesStats.totalOrders}
- Dinero ganado: $${businessData.salesStats.totalRevenue.toFixed(2)}
- Pedidos en el local: ${businessData.salesStats.quioscoOrders} (ganamos $${businessData.salesStats.quioscoRevenue.toFixed(2)})
- Pedidos por delivery: ${businessData.salesStats.deliveryOrders} (ganamos $${businessData.salesStats.deliveryRevenue.toFixed(2)})
- Promedio por pedido: $${businessData.salesStats.averageOrderValue.toFixed(2)}

🔥 LO QUE MÁS SE VENDE:
${businessData.topProducts.map((p, i) => 
  `${i + 1}. ${p.name} (${p.category}) - Se vendieron ${p.totalSold} unidades - Precio: $${p.price}`
).join('\n')}

📉 LO QUE MENOS SE VENDE:
${businessData.lowProducts.map((p, i) => 
  `${i + 1}. ${p.name} (${p.category}) - Se vendieron ${p.totalSold} unidades - Precio: $${p.price}`
).join('\n')}

🏷️ CATEGORÍAS QUE MÁS VENDEN:
${businessData.topCategories.slice(0, 5).map((c, i) => 
  `${i + 1}. ${c.name} - ${c.totalSold} unidades vendidas - Ganamos $${c.totalRevenue.toFixed(2)}`
).join('\n')}

📅 VENTAS POR DÍA DE LA SEMANA:
${businessData.dayStats.map(d => 
  `${d.day}: ${d.orders} pedidos - Ganamos $${d.revenue.toFixed(2)}`
).join('\n')}

REGLAS PARA RESPONDER:
- Responde siempre en español sencillo
- No uses jerga técnica ni palabras en inglés
- Usa emojis para que sea más visual y agradable
- Da consejos prácticos y fáciles de aplicar
- Si preguntan sobre qué comprar o abastecer, recomienda ingredientes basándote en lo que más se vende
- Sé breve pero claro

SOBRE LOS REPORTES:
- Si piden un "reporte", "informe" o "Excel", diles que pueden descargarlo con el botón verde que aparecerá abajo
- Los reportes tienen información detallada de los últimos ${days} días

EJEMPLOS DE RECOMENDACIONES DE INGREDIENTES:
- Si se venden muchas hamburguesas → recomendar: carne molida, pan de hamburguesa, lechuga, tomate, queso
- Si se venden muchas pizzas → recomendar: masa, queso mozzarella, salsa de tomate
- Si se venden muchas bebidas → recomendar: reponer las bebidas que más se piden
`;

    // Llamar a Claude Haiku
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: contextPrompt + "\n\nPREGUNTA DEL USUARIO:\n" + message
        }
      ],
    });

    const aiResponse = response.content[0].type === 'text' 
      ? response.content[0].text 
      : 'No pude procesar la respuesta';

    return NextResponse.json({
      response: aiResponse,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens
      }
    });

  } catch (error) {
    console.error('Error en chatbot:', error);
    return NextResponse.json(
      { error: 'Error al procesar la consulta' },
      { status: 500 }
    );
  }
}
