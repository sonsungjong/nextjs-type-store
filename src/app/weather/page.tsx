'use client';

import { useState } from "react";

export default function Weather() {
    const [prompt, setPrompt] = useState('')

async function handleSubmit(e : React.FormEvent)
    {
        e.preventDefault(); // Prevents the default form submission and page refresh

        // Send a POST request to /api/chat/gpt with the prompt data
        try {
            const response = await fetch('/api/chat/gpt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                // Handle non-successful responses
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Success:", data);

        } catch (error) {
            console.error("Error submitting data:", error);
        }
    }

    return(
        <div className="flex justify-center">
            <form onSubmit={(e)=>{handleSubmit(e)}}>
                <input value={prompt} onChange={(e)=>{setPrompt(e.target.value)}}/>
                <button type="submit">전송</button>
            </form>
        </div>
    )
}
