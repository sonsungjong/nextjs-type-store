'use client';
// nextjs 에서는 react 함수를 사용하기 위해서 'use client'; 를 파일 맨위에 적어줘야한다
// 아이콘 npm install react-icons lucide-react

import { useState } from "react"
import { ChevronsLeft, ChevronsRight, Home, LayoutDashboard, Store, Sun } from "lucide-react";
import Link from "next/link";

// 열리고 닫히는 사이드바 컴포넌트
export default function Sidebar()
{
    // 창이 열리고 닫히는 상태를 관리할 state변수
    const [isOpen, setIsOpen] = useState(true);         // true : 열려있음 , false : 닫혀있음

    return(
        <div className={`h-screen bg-gray-900 transform transition-all duration-300 ease-in-out
         ${isOpen ? 'w-64': 'w-16'} flex flex-col text-white`} 
         style={{zIndex:1000}}      // 다른 콘텐츠 위에 배치되도록 zIndex
         >
            
            {/* 제목 */}
            <div className="relative flex h-16 items-center px-4 border-gray-700 border-b">
                
                <div className="flex items-center flex-grow">
                    <Home className="h-6 w-6 mr-2" />
                    {isOpen ? (<h2 className="whitespace-nowrap">프로젝트 제목</h2>) : null}
                </div>

                {/* 토글 버튼 */}
                <button className="absolute -right-8 w-8
                 bg-gray-900 h-full flex items-center
                  justify-center
                cursor-pointer hover:bg-gray-700 
                transition-all duration-300 ease-in-out
                 rounded-tr-lg rounded-br-lg" 
                 onClick={()=>{setIsOpen(!isOpen)}}>
                    {
                        isOpen ? (<ChevronsLeft className="w-5 h-5"/>):(
                            <ChevronsRight className="w-5 h-5"/>
                        )
                    }
                </button>
            </div>

            {/* 내용물 */}
            <nav className="flex flex-col">
                {/* 사이드바 메뉴 항목 */}
                <Link href="/" className="flex items-center p-4">
                    <LayoutDashboard className="w-5 h-5 mr-2"></LayoutDashboard>
                    {isOpen ? (<span>대시보드</span>) : null}
                </Link>
                <Link href="/store" className="flex items-center p-4">
                    <Store className="w-5 h-5 mr-2"></Store>
                    {isOpen ? (<span>상가 정보</span>) : null}
                </Link>
                <Link href="/weather" className="flex items-center p-4">
                    <Sun className="w-5 h-5 mr-2" />
                    {isOpen ? (<span>날씨 정보</span>) : null}
                </Link>
            </nav>
        </div>
    )
}
