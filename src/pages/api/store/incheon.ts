// http://localhost:3000/api/store/incheon

import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import Papa from "papaparse";

interface Store
{
    상호명 : string;
    상권업종대분류명 : string;
    법정동명 : string;
    도로명 : string;
    경도 : number;
    위도 : number;
}

// csv파일을 읽어서 원하는 부분만 남긴다음 React부분에 전달
export default async function handler(req : NextApiRequest, res : NextApiResponse)
{
    // HTTP 보안문제 허용 (CORS)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }


    // 응답으로 전송 (RESTAPI 의 GET요청)
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }
    try {
        const csvPath = path.join(process.cwd(), "src", "assets", "소상공인시장진흥공단_상가(상권)정보_인천_202503.csv");

        const csvData = fs.readFileSync(csvPath, "utf8");

        console.log(csvPath);           // 폴더 경로
        console.log(csvData);           // csv 파일들 이름

        const parsed = Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
        });

        const stores: Store[] = (parsed.data as any[])
        .filter((row) =>
            row["상호명"] &&
            row["상권업종대분류명"] &&
            row["법정동명"] &&
            row["도로명"] &&
            row["경도"] &&
            row["위도"]
        )
        .map((row) => ({
            상호명: row["상호명"],
            상권업종대분류명: row["상권업종대분류명"],
            법정동명: row["법정동명"],
            도로명: row["도로명"],
            경도: parseFloat(row["경도"]),
            위도: parseFloat(row["위도"]),
        }));

        console.log(stores.length)
        return res.status(200).json(stores);
    } catch (error) {
        console.error("CSV 파싱 오류:", error);
        return res.status(500).json({ message: "서버 오류: CSV 파일을 처리하는 중 문제가 발생했습니다." });
    }
}