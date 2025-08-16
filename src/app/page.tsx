"use client";     // react 전용 함수를 사용할 수 있음

import Image from "next/image";
import NaverMapStore from "./components/NaverMap/NaverMapStore";
import { useEffect, useState } from "react";

interface Store
{
    상호명 : string;
    상권업종대분류명 : string;
    법정동명 : string;
    도로명 : string;
    경도 : number;
    위도 : number;
}

export default function Home() {

  const [stores, setStores] = useState<Store[]>([]);

  useEffect(()=>{
    // http://localhost:3000/api/store/incheon 로 get요청
    async function fetchStores(){
      let res = await fetch('http://localhost:3000/api/store/incheon');
      let data = await res.json();

      // 받아온 데이터 console.log
      console.log(data);
      setStores(data);
    }

    fetchStores();
  }, [])

  return (
    <div>
      {/* 
        w- : width
        h- : height
        p- : padding (px-, py-, ps-, pe-, pt-, pb-)
        m- : margin
        text- : 글자
        bg- : 배경색
        rounded : 테두리 둥글게
        border- : 테두리 색상
        flex : display:flex
        hover: : 마우스 올릴때만
      */}
      {/* <div className="text-[20pt] text-[#ff0000]
      bg-purple-400 w-[250px] h-[250px]
      flex justify-center items-center
      m-[16px] p-[16px] rounded-[20px]
        border-[4px] border-black
        hover:text-white transition-all
      ">
        hello world
      </div> */}

      <NaverMapStore stores={stores}/>
    </div>
  );
}
