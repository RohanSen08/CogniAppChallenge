async function generateresults(){
    console.log('generating results');
    let options = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "gpt-4o",
            messages: [{
                role: "user",
                content: `respond strictly in JSON analyze + ${JSON.stringify(incorrectDetails)} + and create tailored feeback for the a test taker, Identtify their common issues and provide info to clarify their problems, Break it down for them, elaborate and extrapolate on what they may not be comprehending, and provide a detailed explanation of the correct answer.`
            }],
            max_tokens: 2000
        })
    };

    try {
        let response = await fetch('https://api.openai.com/v1/chat/completions', options);
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        let data = await response.json();
        console.log(data);

        if (data.choices && data.choices.length > 0) {
            const responseContent = JSON.parse(data.choices[0].message.content);
            testingData = Object.keys(responseContent).map(key => responseContent[key]);
            localStorage.setItem('aiResponse', JSON.stringify(testingData));
            updateQuiz();
        } else {
            console.error('No data returned from the API');
        }
    } catch (error) {
        console.error('Error', error.message);
    } finally {
    }
}