"use client";
// 리액트 관련 함수를 사용하기 위해서는 'use client' 를 파일 상단에 기록

// 카카오 지도 API
// https://developers.kakao.com/
// 로그인 -> 상단 네비게이션에서 '앱' 클릭
// 앱 생성 버튼을 클릭 (내용입력)
// 생성된 앱을 클릭 -> 비즈 앱 등록 클릭
// JavaScript 키를 복사 저장
// Web 플랫폼 등록 http://localhost:3000 입력하고 저장
// 사이드바 -> 제품 설정 -> 카카오맵 -> 사용설정 ON

// https://apis.map.kakao.com/web/guide/

import { useEffect, useRef } from "react";

// 일반 JS는 global로 위치 (npm install 설치 X)
declare global
{
    interface Window{
        // kakao는 어떤 자료형이든 가능하게
        kakao:any;
    }
}

export default function KakaoMap()
{
    // 위험 (일반 사용자도 웹에서 볼 수 있음)
    // .env 에 있는 내용을 가져다 씀
    const kakao_api_key = process.env.NEXT_PUBLIC_KAKAO_MAP;

    // 리액트에 그림을 그리기 위해서 useRef (지도를 div에 연결)
    let mapRef = useRef<HTMLDivElement>(null);

    // NaverMap 컴포넌트가 실행되면 실행할 코드 useEffect();
    useEffect(()=>{
        console.log(kakao_api_key);
        const initMap = ()=>{
            // 지도가 안그려져 있으면 그린다 (중복 그리기 방지), 로딩 전에는 안그린다
            if(!mapRef.current || !window.kakao?.maps) return;

            // 카카오 지도를 그린다
            new window.kakao.maps.Map(mapRef.current, {
                // 중심좌표, 줌레벨
                center: new window.kakao.maps.LatLng(37.5, 127.0),
                zoom: 13
            })
        }

        // 중복체크용 ID
        const scriptID = 'kakao-sdk-map'
        if(!document.getElementById(scriptID)){
            // 스크립트 태그 생성 <script></script>
            const script = document.createElement('script')            // HTML에 생성
            script.id = scriptID;
            script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakao_api_key}&autoload=false`
            script.async = true;
            script.onload=()=>{
                window.kakao?.maps?.load(initMap)
            };
            document.head.appendChild(script);
        }else{
            window.kakao?.maps?.load?.(initMap);
        }

    }, [])

    return(
        // 지도를 그릴 영역으로 선택
        <div ref={mapRef} style={{width:'500px', height:'500px'}}>
        </div>
    )
}