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

interface Store
{
    상호명 : string;
    상권업종대분류명 : string;
    법정동명 : string;
    도로명 : string;
    경도 : number;
    위도 : number;
}

export default function NaverMapStore({stores} : { stores : Store[] })
{
    // 받아온 stores를 통해서 marker를 생성
    // 위도 경도 마커


    // 위험 (일반 사용자도 웹에서 볼 수 있음)
    // .env 에 있는 내용을 가져다 씀
    const naver_api_key = process.env.NEXT_PUBLIC_NAVER_MAP;

    // 리액트에 그림을 그리기 위해서 useRef (지도를 div에 연결)
    let mapRef = useRef<HTMLDivElement>(null);

    // NaverMap 컴포넌트가 실행되면 실행할 코드 useEffect();

    // useEffect에 [] 빈배열 넣으면 처음 한번만 그림
    // 그린 다음에 stores가 들어오니까
    // [stores]
    useEffect(()=>{
        console.log(naver_api_key);
        const initMap = ()=>{
            // 지도가 안그려져 있으면 그린다 (중복 그리기 방지), 로딩 전에는 안그린다
            if(!mapRef.current || !window.naver?.maps) return;

            // 네이버 지도를 그린다
            let map = new window.naver.maps.Map(mapRef.current, {
                // 중심좌표, 줌레벨
                center: new window.naver.maps.LatLng(37.4563, 126.7052),
                zoom: 13
            })
            
            // stores가 안 비어있으면
            // stores.법정동명 === '부평동' 일때만 마커찍기
            stores
            //.filter(store => store.법정동명 === '부평동')
            //.filter(store => store.상권업종대분류명 === '음식')
            .forEach(store => {
                // 위치 설정
                const position = new window.naver.maps.LatLng(store.위도, store.경도);

                // 지도 위에 마커 위치
                const marker = new window.naver.maps.Marker({
                    map,
                    position, // 위도 경도
                });

                // 클릭했을 때 나올 div를 만들어주고, 변수에 담아서 클릭이벤트에 담는다
                const infoWindow = new window.naver.maps.InfoWindow({
                    content:`
                        <div style="color:black;padding:4px;">
                            <strong>${store.상호명}</strong>
                            <br/>
                            ${store.상권업종대분류명}
                            <br/>
                            <span>주소명 : ${store.도로명}</span>
                        </div>
                    `
                })
                
                // 마우스 클릭 이벤트 addEventListner
                window.naver.maps.Event.addListener(marker, 'click', ()=>{
                    // infoWindow 이미 있으면 없애기
                    if(infoWindow.getMap()){
                        infoWindow.close();
                    }else{
                        infoWindow.open(map, marker);
                    }
                });
            });
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

    }, [stores])        // [] 은 처음 한번만 그린다
    // [stores] : stores 바뀔때마다 그린다(useEffect)

    return(
        // 지도를 그릴 영역으로 선택
        <div ref={mapRef} style={{width:'500px', height:'500px'}}>
        </div>
    )
}