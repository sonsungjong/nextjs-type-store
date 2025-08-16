// @/pages/api/signin.ts

import { connectDB } from "@/Utils/db";
import { NextApiRequest, NextApiResponse } from "next";

// http://localhost:3000/api/signin 으로 접속하면 동작할 함수 (API)
export default async function handler(req : NextApiRequest, res : NextApiResponse)
{
    console.log('http://localhost:3000/api/signin 들어옴')

    // CORS 설정 (다른 IP/포트에 대해 연결 허용) : 테스트를 위해 모든 IP 허용
    res.setHeader("Access-Control-Allow-Origin", "*");      // * : 모든
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    // email, password 를 받아서 find()
    try{
        if(req.method == 'POST')
        {
            console.log(req.body)           // 어떤 메시지를 보냈는지 확인
            // req.body : {email:'', password:''}
            let email : string = req.body.email;
            let password : string = req.body.password;

            // insertOne
            let db = (await connectDB).db('mydb');          // 데이터베이스 접속
            let user = await db.collection('user').findOne({email:email, password:password});

            console.log(user);              // 유저정보 잘 찾아지는지 확인용

            if(user){
                // user를 찾았다 (res.ok)
                return res.status(200).json({
                    email:user.email,
                    token:'1'           // 로그인 완료 권한
                })
            }else{
                // user를 못찾았다 (!res.ok)
                return res.status(401).json({
                    error:'아이디 또는 비밀번호가 일치하지 않습니다'
                })
            }
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