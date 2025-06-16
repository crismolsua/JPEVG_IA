import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { texto } = req.body;
  if (!texto) return res.status(400).json({ error: "Falta campo texto" });

  const load = fname =>
    JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", fname), "utf8"));
  const pacto1    = load("pacto1.json");
  const pacto2    = load("pacto2.json");
  const estrategia = load("estrategia.json");

  const system = `Eres un asistente que, dada la descripción de un proyecto, sugiere coincidencias válidas de tres fuentes:
- Apartado 2 (Pacto I): ejes y medidas.
- Apartado 3 (Pacto II): áreas, subáreas y actuaciones.
- Apartado 4 (Estrategia Estatal): ejes y medidas.
Devuelve un JSON con arrays apartado2, apartado3 y apartado4, donde cada elemento tenga codigo, nombre y descripcion.`;

  const user = `Descripción del proyecto:\n${texto}\n\n` +
    `Fuente Pacto I:\n${JSON.stringify(pacto1)}\n\n` +
    `Fuente Pacto II:\n${JSON.stringify(pacto2)}\n\n` +
    `Fuente Estrategia Estatal:\n${JSON.stringify(estrategia)}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: system },
      { role: "user",   content: user   },
    ],
    temperature: 0.2,
  });

  try {
    const respuesta = JSON.parse(completion.choices[0].message.content);
    res.status(200).json(respuesta);
  } catch {
    res.status(200).json({ raw: completion.choices[0].message.content });
  }
}
