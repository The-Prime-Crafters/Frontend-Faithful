
// Key from .env
const OPENAI_API_KEY = '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';

export async function queryOpenAI(prompt: string) {
    try {
        console.log('🤖 Sending request to OpenAI...');
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o', // Using GPT-4o as requested
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' }, // System prompt will be overridden by the chat screen's prompt usually, but good to have default
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ OpenAI API Error:', JSON.stringify(data, null, 2));
            return "I'm having trouble thinking right now. Please try again.";
        }

        console.log('✅ OpenAI Response received');
        return data.choices[0].message.content;
    } catch (error) {
        console.error('❌ Error querying OpenAI:', error);
        return "I'm having trouble answering that right now. Please try again later.";
    }
}
