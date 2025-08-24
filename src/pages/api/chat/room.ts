// /api/chat/room
// 1. 채팅방 생성 [POST요청]
// 2. 채팅방 삭제 [DELETE요청]
// 3. 채팅방 목록 [GET요청]

import { connectDB } from "@/Utils/db";
import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req : NextApiRequest, res : NextApiResponse)
{
    try{
        // CORS 설정 추가 (다른 IP/포트에 대해 연결 허용)
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-user-id");

        // OPTIONS 메서드에 대한 사전 요청(preflight) 처리
        if (req.method === "OPTIONS") {
            return res.status(200).end();
        }
        
        // DB연결 (mydb 데이터베이스에 연결)
        const db = (await connectDB).db('mydb')

        // 1. GET 채팅방 목록 조회 : userId
        if("GET" === req.method)
        {
            const headerId = req.headers["x-user-id"];
            if(headerId)
            {
                const userId = Array.isArray(headerId) ? headerId[0] : headerId;
                // 아이디가 정상적으로 들어있으면 진행
                if(userId)
                {
                    // 몽고DB에서 그 아이디로 채팅방을 찾는다
                    // room : _id(ObjectID), title(string), userId(ObjectID), createdAt, lastChatAt
                    const rooms = await db.collection('room')                         // room 테이블
                    .find({userId:new ObjectId(String(userId))})        // room에서 일치하는 유저ID 찾기
                    .sort({lastChatAt: -1})         // 마지막 채팅이 최신인 순으로
                    .limit(200)                     // 200개까지
                    .toArray();                 // 배열 객체 형태로 가져오기

                    return res.status(200).json(rooms);         // rooms 를 응답으로 보낸다
                }else{
                    return res.status(401).json({error:'userId 불일치'})
                }
            }else{
                return res.status(401).json({error:'userId 불일치'})
            }
        }

        // 2. POST 요청: 채팅방 생성
        if (req.method === "POST") {
            const headerId = req.headers["x-user-id"];
            const { title } = req.body;

            if (!title || !headerId) {
                return res.status(400).json({ error: '제목 또는 userId가 누락되었습니다.' });
            }

            const userId = Array.isArray(headerId) ? headerId[0] : headerId;

            const newRoom = {
                title: String(title),
                userId: new ObjectId(String(userId)),
                createdAt: new Date(),
                lastChatAt: new Date(),
            };

            const result = await db.collection('room').insertOne(newRoom);
            return res.status(201).json({
                roomId: result.insertedId
            });
        }

        // 3. DELETE 요청: 채팅방 삭제
        if (req.method === "DELETE") {
            const headerId = req.headers["x-user-id"];
            const { roomId } = req.body;

            if (!headerId || !roomId) {
                return res.status(400).json({ error: 'userId 또는 roomId가 누락되었습니다.' });
            }

            const userId = Array.isArray(headerId) ? headerId[0] : headerId;

            const result = await db.collection('room').deleteOne({
                _id: new ObjectId(String(roomId)),
                userId: new ObjectId(String(userId)),
            });

            if (result.deletedCount === 1) {
                // 이 채팅방에 속한 모든 메시지도 삭제
                await db.collection('chat').deleteMany({
                    roomId: new ObjectId(String(roomId)),
                });

                return res.status(200).json({ message: '채팅방이 삭제되었습니다.' });
            } else {
                return res.status(404).json({ error: '채팅방을 찾을 수 없거나 삭제 권한이 없습니다.' });
            }
        }

        return res.status(405).json({ error: '지원하지 않는 HTTP 메서드입니다.' });

    }catch(err){
        console.log(err);
        return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
}