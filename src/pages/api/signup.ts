// src/pages/api/signup.ts
// http://localhost:3000/api/signup
// REST API : GET(주소만), POST(보안강화), DELETE, UPDATE

import { connectDB } from "@/Utils/db";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req : NextApiRequest, res : NextApiResponse)
{
    // http://localhost:3000/api/signup 로 요청하면 동작할 함수
    console.log('들어옴')
    
    // CORS 설정 (다른 IP/포트에 대해 연결 허용) : 테스트를 위해 모든 IP 허용
    res.setHeader("Access-Control-Allow-Origin", "*");      // * : 모든
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    // 아이디(이메일형식), 비밀번호 받아서 DB에 insertOne (POST요청)
    try{
        if(req.method == 'POST')
        {
            console.log(req.body)           // 어떤 메시지를 보냈는지 확인
            // req.body : {email:'', password:''}
            let email : string = req.body.email;
            let password : string = req.body.password;

            // insertOne
            let db = (await connectDB).db('mydb');          // 데이터베이스 접속
            await db.collection('user').insertOne({'email':email, 'password':password});   // npm install bcrypt
            return res.status(200).json({success:'OK'})
        }
        else{
            console.log('POST 외에 메시지 들어옴')
            return res.status(501).json({error:'NOT POST'})
        }
    }
    catch(error){
        // 서버 오류 500 으로 응답
        res.status(500).json({error:'서버 오류 발생'})
    }
}