// /api/chat/gpt
// npm install openai
import { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { connectDB } from "@/Utils/db";
import { ObjectId } from "mongodb";

export type Role = "user" | "assistant" | "system";
type InMsg = { role: Role; content: string };

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-user-id");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ text: "허가되지않은 요청입니다" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    // 프론트 호환: messages 배열 우선, 없으면 prompt가 배열이면 사용, 문자열이면 1건으로 래핑
    const rawMessages: InMsg[] = Array.isArray(body.messages)
      ? body.messages
      : Array.isArray(body.prompt)
      ? body.prompt
      : typeof body.prompt === "string"
      ? [{ role: "user", content: String(body.prompt) }]
      : [];

    const roomId: string | undefined = body.roomId;
    const userId: string | undefined = body.userId;

    if (!roomId || !userId || rawMessages.length === 0) {
      return res.status(400).json({ text: "잘못된 요청입니다" });
    }

    // 가장 최신 user 메시지 추출 (DB 저장용)
    const lastUserMsg = [...rawMessages].reverse().find(m => m.role === "user" && m.content?.trim()?.length);
    if (!lastUserMsg) {
      return res.status(400).json({ text: "user 메시지가 없습니다" });
    }

    // Mongo ID 변환
    const rid = new ObjectId(String(roomId));
    const uid = new ObjectId(String(userId));

    // DB 연결 및 방 검증
    const db = (await connectDB).db("mydb");
    const room = await db.collection("room").findOne({ _id: rid });
    if (!room || !room.userId?.equals?.(uid)) {
      return res.status(401).json({ text: "잘못된 정보" });
    }

    // 1) 유저 최신 메시지 저장
    const now = new Date();
    const userDoc = {
      _id: new ObjectId(),
      roomId: rid,
      userId: uid,
      role: "user" as const,
      text: lastUserMsg.content.trim(),
      createdAt: now,
    };
    await db.collection("chat").insertOne(userDoc);

    // 2) LLM 호출: 히스토리 전체 전달 (필요 시 서버측에서도 컷팅)
    const MAX_CONTEXT = 40;
    const llmMessages: InMsg[] = rawMessages
      .slice()
      .map(m => ({ role: m.role, content: m.content ?? "" }))
      .filter(m => !!m.content)
      .slice(-MAX_CONTEXT);

    const response = await client.responses.create({
      model: "gpt-5-nano",
      input: llmMessages, // ← 다중 턴 히스토리 전달
    });

    const text = (response as any).output_text ?? ""; // SDK 버전에 따라 필드명이 다를 수 있음
    const AIDoc = {
      _id: new ObjectId(),
      roomId: rid,
      userId: uid,
      role: "assistant" as const,
      text,
      createdAt: new Date(),
    };
    await db.collection("chat").insertOne(AIDoc);

    // 4) 채팅방 최신 시각 갱신
    await db.collection("room").updateOne({ _id: rid }, { $set: { lastChatAt: new Date() } });

    // 5) 프론트 호환 응답 (프론트에서 기대하는 키로 맞춤)
    return res.status(200).json({ userDoc, AIDoc });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ text: "서버 에러" });
  }
}
