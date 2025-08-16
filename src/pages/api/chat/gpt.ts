// /api/chat/gpt
// npm install openai
import { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const client = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

export default async function handler(req : NextApiRequest, res : NextApiResponse)
{
    // POST 요청이 아니면 405 리턴해서 종료
    console.log('들어옴')
    if(req.method !== "POST")
    {
        return res.status(405).json({text:'허가되지않은 요청입니다'})
    }
    try{
        const { prompt, email, room_id } = req.body;        // 리액트에서 보낸 body를 분해
        if (!prompt) {
            return res.status(400).json({ text: "잘못된 요청입니다 (prompt없음)" });
        }
        const response = await client.responses.create({
            model: "gpt-5-nano",
            input: prompt,
        });
        const text = response.output_text;
        console.log(text);
        return res.status(200).json({text:text});
    }catch(err){
        res.status(500).json({text:'서버 에러'})        // 백엔드 부분에서 처리하다가 에러나면
    }
}