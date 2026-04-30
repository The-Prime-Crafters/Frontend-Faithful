import Constants from 'expo-constants';

// SECURITY: API key should NEVER be hardcoded
// It should come from environment variables or backend proxy
const OPENAI_API_KEY = Constants.expoConfig?.extra?.openaiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

// WARNING: If API key is empty, OpenAI calls will fail
if (!OPENAI_API_KEY) {
  console.warn('⚠️ OpenAI API key not configured. AI features will not work.');
}

export async function queryOpenAI(prompt: string) {
    try {
        if (!OPENAI_API_KEY) {
          console.error('❌ OpenAI API key not configured');
          return "AI features are currently unavailable. Please contact support.";
        }

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
