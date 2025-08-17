'use client';

import React, { useState, useEffect } from 'react';

// API 응답 타입 정의 (사용자의 API 파일에 맞춰서 작성)
interface User {
  email: string;
  token: string;
}

interface Room {
  _id: string;
  title: string;
  userId: string;
  lastChatAt: string;
}

interface ChatMessage {
  _id: string;
  roomId: string;
  userId: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
}

// 간단한 메시지 박스 컴포넌트 (alert 대신 사용)
const MessageBox = ({ message, onClose }: { message: string | null; onClose: () => void }) => {
  if (!message) return null;
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      padding: '20px',
      border: '1px solid #ccc',
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      zIndex: 1000
    }}>
      <p>{message}</p>
      <button onClick={onClose} style={{ marginTop: '10px', padding: '5px 10px' }}>확인</button>
    </div>
  );
};

export default function Page(){
  // 상태 관리
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [roomTitle, setRoomTitle] = useState('');
  const [messageBox, setMessageBox] = useState<string | null>(null);

  // 메시지 박스 표시 함수
  const showMessage = (msg: string) => {
    setMessageBox(msg);
  };

  const closeMessageBox = () => {
    setMessageBox(null);
  };

  // 로그인 처리
  const handleLogin = async () => {
    try {
      const response = await fetch('/api/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data);
        showMessage('로그인 성공!');
      } else {
        showMessage('로그인 실패: ' + data.error);
      }
    } catch (error) {
      showMessage('API 호출 중 오류 발생.');
    }
  };

  // 채팅방 목록 가져오기
  const fetchRooms = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/chat/room', {
        method: 'GET',
        headers: {
          'x-user-id': user.token,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setRooms(data);
      } else {
        showMessage('채팅방 목록 가져오기 실패: ' + data.error);
      }
    } catch (error) {
      showMessage('API 호출 중 오류 발생.');
    }
  };

  useEffect(() => {
    if (user) {
      fetchRooms();
    }
  }, [user]);

  // 채팅방 생성
  const handleCreateRoom = async () => {
    if (!user || !roomTitle) return;
    try {
      const response = await fetch('/api/chat/room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.token,
        },
        body: JSON.stringify({ title: roomTitle }),
      });
      const data = await response.json();
      if (response.ok) {
        showMessage('채팅방 생성 성공!');
        fetchRooms();
        setRoomTitle('');
      } else {
        showMessage('채팅방 생성 실패: ' + data.error);
      }
    } catch (error) {
      showMessage('API 호출 중 오류 발생.');
    }
  };

  // 채팅방 삭제
  const handleDeleteRoom = async (roomId: string) => {
    if (!user) return;
    try {
      const response = await fetch('/api/chat/room', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.token,
        },
        body: JSON.stringify({ roomId }),
      });
      const data = await response.json();
      if (response.ok) {
        showMessage('채팅방 삭제 성공!');
        setSelectedRoom(null);
        setChats([]);
        fetchRooms();
      } else {
        showMessage('채팅방 삭제 실패: ' + data.error);
      }
    } catch (error) {
      showMessage('API 호출 중 오류 발생.');
    }
  };

  // 채팅방 선택 및 메시지 가져오기
  const handleSelectRoom = async (room: Room) => {
    if (!user) return;
    setSelectedRoom(room);
    try {
      const response = await fetch('/api/chat/room_chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: room._id,
          userId: user.token,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setChats(data.reverse()); // 최신순으로 가져온 것을 오래된 순으로 뒤집어서 표시
      } else {
        showMessage('채팅 목록 가져오기 실패: ' + data.error);
      }
    } catch (error) {
      showMessage('API 호출 중 오류 발생.');
    }
  };

  // 채팅 메시지 전송
  const handleSendMessage = async () => {
    if (!user || !selectedRoom || !prompt.trim()) return;
    const userMessage: ChatMessage = {
      _id: 'temp-' + Date.now(),
      roomId: selectedRoom._id,
      userId: user.token,
      role: 'user',
      text: prompt.trim(),
      createdAt: new Date().toISOString(),
    };
    setChats(prev => [...prev, userMessage]);
    setPrompt('');

    try {
      const response = await fetch('/api/chat/gpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          roomId: selectedRoom._id,
          userId: user.token,
          role: 'user',
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setChats(prev => [...prev.slice(0, prev.length - 1), data.user, data.assistant]);
      } else {
        showMessage('메시지 전송 실패: ' + data.text);
      }
    } catch (error) {
      showMessage('API 호출 중 오류 발생.');
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '1000px', margin: 'auto' }}>
      <h1>채팅 UI 테스트</h1>
      <hr style={{ margin: '20px 0' }} />

      {!user ? (
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h2>로그인</h2>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: '8px', marginRight: '10px', width: '200px' }}
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '8px', marginRight: '10px', width: '200px' }}
          />
          <button onClick={handleLogin} style={{ padding: '8px 16px', cursor: 'pointer' }}>로그인</button>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
            <p><strong>로그인됨:</strong> {user.email} (토큰: {user.token.substring(0, 10)}...)</p>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            {/* 채팅방 목록 */}
            <div style={{ flex: 1, border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
              <h2>채팅방 목록</h2>
              <div style={{ marginBottom: '10px', display: 'flex' }}>
                <input
                  type="text"
                  placeholder="새 채팅방 제목"
                  value={roomTitle}
                  onChange={(e) => setRoomTitle(e.target.value)}
                  style={{ padding: '8px', flex: 1, marginRight: '10px' }}
                />
                <button onClick={handleCreateRoom} style={{ padding: '8px 16px', cursor: 'pointer' }}>방 생성</button>
              </div>
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {rooms.map((room) => (
                  <li
                    key={room._id}
                    onClick={() => handleSelectRoom(room)}
                    style={{
                      padding: '10px',
                      border: '1px solid #eee',
                      marginBottom: '5px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      backgroundColor: selectedRoom?._id === room._id ? '#e0f7fa' : 'transparent',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>{room.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRoom(room._id);
                      }}
                      style={{ padding: '4px 8px', cursor: 'pointer', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* 채팅창 */}
            <div style={{ flex: 2, border: '1px solid #ccc', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
              <h2>{selectedRoom ? selectedRoom.title : '채팅방을 선택하세요'}</h2>
              <div style={{ flex: 1, border: '1px solid #eee', padding: '10px', marginBottom: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse', minHeight: '300px' }}>
                {chats.slice().reverse().map((chat, index) => (
                  <div key={index} style={{
                    marginBottom: '10px',
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: chat.role === 'user' ? '#dcf8c6' : '#e5e5ea',
                    textAlign: chat.role === 'user' ? 'right' : 'left',
                    wordWrap: 'break-word',
                  }}>
                    <strong>{chat.role === 'user' ? '나' : 'AI'}:</strong> {chat.text}
                  </div>
                ))}
              </div>
              {selectedRoom && (
                <div style={{ display: 'flex' }}>
                  <input
                    type="text"
                    placeholder="메시지 입력..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                    style={{ padding: '8px', flex: 1, marginRight: '10px' }}
                  />
                  <button onClick={handleSendMessage} style={{ padding: '8px 16px', cursor: 'pointer' }}>전송</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <MessageBox message={messageBox} onClose={closeMessageBox} />
    </div>
  );
};

