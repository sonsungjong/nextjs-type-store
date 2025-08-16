"use client";
// 리액트 관련 함수를 사용하기 위해서는 'use client' 를 파일 상단에 기록

// 네이버 지도 API
// https://www.ncloud.com/
// 로그인 -> 콘솔 -> Services -> Maps 검색
// Maps -> Application -> Application 등록 버튼
// 애플리케이션 이름 적기, Dynamic Map 선택
// Web서비스 URL에 웹주소 입력 후 추가 (http://localhost:3000)
// 등록 버튼 클릭
// 인증 정보 클릭 (Client ID 기록)

import { useEffect, useRef } from "react";

// 일반 JS는 global로 위치 (npm install 설치 X)
declare global
{
    interface Window{
        // naver는 어떤 자료형이든 가능하게
        naver:any;
    }
}

export default function NaverMap()
{
    // 위험 (일반 사용자도 웹에서 볼 수 있음)
    // .env 에 있는 내용을 가져다 씀
    const naver_api_key = process.env.NEXT_PUBLIC_NAVER_MAP;

    // 리액트에 그림을 그리기 위해서 useRef (지도를 div에 연결)
    let mapRef = useRef<HTMLDivElement>(null);

    // NaverMap 컴포넌트가 실행되면 실행할 코드 useEffect();
    useEffect(()=>{
        console.log(naver_api_key);
        const initMap = ()=>{
            // 지도가 안그려져 있으면 그린다 (중복 그리기 방지), 로딩 전에는 안그린다
            if(!mapRef.current || !window.naver?.maps) return;

            // 네이버 지도를 그린다
            new window.naver.maps.Map(mapRef.current, {
                // 중심좌표, 줌레벨
                center: new window.naver.maps.LatLng(37.5, 127.0),
                zoom: 13
            })
        }

        // 중복체크용 ID
        const scriptID = 'naver-sdk-map'
        if(!document.getElementById(scriptID)){
            // 스크립트 태그 생성 <script></script>
            const script = document.createElement('script')            // HTML에 생성
            script.id = scriptID;
            script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${naver_api_key}`
            script.async = true;
            script.onload=initMap;
            document.head.appendChild(script);
        }else{
            initMap();
        }

    }, [])

    return(
        // 지도를 그릴 영역으로 선택
        <div ref={mapRef} style={{width:'500px', height:'500px'}}>
        </div>
    )
}