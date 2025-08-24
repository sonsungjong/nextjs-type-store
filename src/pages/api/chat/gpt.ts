// 채팅내용 DB저장

// /api/chat/gpt
// npm install openai
import { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { connectDB } from "@/Utils/db";
import { ObjectId } from "mongodb";

export type Role = "user" | "assistant" | "system";

const client = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

export default async function handler(req : NextApiRequest, res : NextApiResponse)
{
    // POST 요청이 아니면 405 리턴해서 종료
    console.log('들어옴')

    // CORS 설정 추가 (다른 IP/포트에 대해 연결 허용)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-user-id");

    // OPTIONS 메서드에 대한 사전 요청(preflight) 처리
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if(req.method !== "POST")
    {
        return res.status(405).json({text:'허가되지않은 요청입니다'})
    }

    try{
        const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
        const { prompt, roomId, userId, role } 
        : {prompt? : string; roomId?: string; userId?:string;role?:Role}
        = body;

        if (!prompt || !roomId || !userId || !role) {
            return res.status(400).json({ text: "잘못된 요청입니다" });
        }

        // roomId 와 userId ==> string을 몽고DB ObjectID
        const rid = new ObjectId(String(roomId));
        const uid = new ObjectId(String(userId));

        // 1. DB 접속해서 저장
        const db = (await connectDB).db('mydb')

        const room = await db.collection('room').findOne({_id:rid});            // 채팅방이 있는지
        if(!room || !room.userId.equals(uid))
        {
            // 아이디가 같은지 비교 했는데 달랐다!
            return res.status(401).json({'text':'잘못된 정보'})
        }

        const now = new Date();         // 현재시각
        const userDoc = {
            _id: new ObjectId(),
            roomId: rid,
            userId: uid,
            role: "user",
            text: prompt.trim(),
            createdAt: now
        }
        await db.collection('chat').insertOne(userDoc);     // 사용자가 입력한 정보를 DB에 저장

        // 2. OpenAI 호출
        const response = await client.responses.create({
            model: "gpt-5-nano",
            input: prompt,
        });

        // 3. AI 메시지 DB 저장
        const text = response.output_text;
        //console.log(text);
        const AIDoc = {
            _id: new ObjectId(),
            roomId: rid,
            userId: uid,
            role: "assistant",
            text: text,
            createdAt: new Date()
        }
        await db.collection('chat').insertOne(AIDoc);           // AI 응답을 DB에 저장

        // 4. 채팅방의 최신메시지 시각 갱신
        await db.collection('room').updateOne({_id:rid}, {$set:{lastChatAt: new Date()}})

        // 5. 유저 입력정보와 AI입력 정보를 응답으로 보냄
        return res.status(200).json({user:userDoc, assistant:AIDoc});
    }catch(err){
        console.error(err);
        res.status(500).json({text:'서버 에러'})        // 백엔드 부분에서 처리하다가 에러나면
    }
}

// 로그인 -> 채팅방 목록을 받아오기 -> 채팅방생성/채팅방삭제 -> 채팅방 선택 시 채팅목록 받아오기 -> 채팅하면 저장