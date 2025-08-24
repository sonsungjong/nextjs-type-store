// room_chats.ts
// /api/chat/room_chats
// 채팅방을 선택했을때 그 채팅방의 메시지들을 제공

import { connectDB } from "@/Utils/db";
import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // CORS 설정 추가 (다른 IP/포트에 대해 연결 허용)
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-user-id");

        // OPTIONS 메서드에 대한 사전 요청(preflight) 처리
        if (req.method === "OPTIONS") {
            return res.status(200).end();
        }

        // mydb 데이터베이스에 연결
        const db = (await connectDB).db('mydb');

        // POST 요청 처리
        if (req.method === "POST") {
            const { roomId, userId } = req.body;

            // roomId와 userId 유효성 검사
            if (!roomId || !userId) {
                return res.status(400).json({ error: 'roomId와 userId가 필요합니다.' });
            }

            let objectIdRoomId;
            let objectIdUserId;
            try {
                objectIdRoomId = new ObjectId(String(roomId));
                objectIdUserId = new ObjectId(String(userId));
            } catch (e) {
                return res.status(400).json({ error: '유효하지 않은 ObjectId 형식입니다.' });
            }

            // 1. 해당 roomId와 userId를 가진 채팅방이 실제로 존재하는지 확인
            const room = await db.collection('room').findOne({
                _id: objectIdRoomId,
                userId: objectIdUserId,
            });

            if (!room) {
                return res.status(404).json({ error: '채팅방을 찾을 수 없거나 접근 권한이 없습니다.' });
            }

            // 2. 채팅방이 존재하고 접근 권한이 확인되면, 해당 채팅방의 메시지들을 최신순으로 조회
            const messages = await db.collection('chat')
                .find({ roomId: objectIdRoomId })
                .sort({ createdAt: -1 }) // 최신순으로 정렬 (내림차순)
                .limit(500) // 최대 500개
                .toArray();

            // 3. 조회된 메시지들을 응답
            return res.status(200).json(messages);
        }

        // POST 요청이 아니면 405 Method Not Allowed 반환
        return res.status(405).json({ error: '지원하지 않는 HTTP 메서드입니다.' });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
}