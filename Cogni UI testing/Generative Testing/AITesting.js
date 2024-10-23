const API_KEY = 'API Key'; 

const inputElement = document.querySelector('#topicInput');
const quizContainer = document.querySelector('#quiz-container');
const continueButton = document.querySelector('.button-Continue');
const quizForm = document.getElementById('quizForm');
const quickBtn = document.getElementById('quick');
const longBtn = document.getElementById('long');
const loadingScreen = document.getElementById('loadingScreen');
const heroTitle = document.getElementById('hero-title');
const heroDescription = document.getElementById('hero-description');
const questionSection = document.getElementById('question-section');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const questionIndicator = document.getElementById('question-indicator');
const insightsContainer = document.getElementById('inDepthAnalysis');
const reviewContainer = document.getElementById('review-container');

// Quiz Configuration
let testingData = [];
let selectedAnswers = [];
let specificCategories = [];
let incorrectDetails = [];
let currentCategoryIndex = 0;
let quizState = 'answering';
let specificTopicInProgress = false;
let testQuestionsInProgress = false;
let currentQuestionIndex = 0;
let allInsightsData = [];

// Debounce Timer
let debounceTimeout = null;

// Utility function to capitalize the first letter of each word
function capitalizeWords(str) {
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

document.addEventListener('DOMContentLoaded', () => {
    // Ensure all essential DOM elements are present
    if (!quickBtn || !longBtn || !continueButton || !quizForm || !inputElement || !quizContainer) {
        console.error("Essential DOM elements are missing. Please check your HTML structure.");
        return;
    }

    // Initially disable navigation buttons and continue button
    prevBtn.disabled = true;
    nextBtn.disabled = false;
    continueButton.style.display = 'none';
    questionIndicator.style.display = 'none';

    // Initially hide question-section, insights, and review sections
    questionSection.style.display = 'none';
    //insightsContainer.style.display = 'none';
    //reviewContainer.style.display = 'none';

    hideLoadingScreen();

    // Prevent default form submission behavior
    quizForm.addEventListener('submit', (event) => {
        event.preventDefault();
    });

    // Event listeners for Quick and Long Answer buttons
    [quickBtn, longBtn].forEach((btn, index) => {
        btn.addEventListener('click', () => {
            quickBtn.disabled = true;
            longBtn.disabled = true;

            toggleActive(btn, index === 0 ? longBtn : quickBtn);
            updateBtnPosition(index === 0);
            debouncedGenerateQuiz();
        });
    });

    // Event listener for answer selection within the quiz container
    quizContainer.addEventListener('change', (event) => {
        const target = event.target;
        if (target.tagName === 'INPUT' && target.type === 'radio') {
            const questionIndex = parseInt(target.name.split('-')[1]);
            handleOptionSelect(questionIndex, target.value);
        }
    });

    continueButton.addEventListener('click', (event) => {
        event.preventDefault();
    
        if (quizState === 'answering') {
            if (checkAllQuestionsAnswered()) {
                continueButton.disabled = true;
                processSelectedAnswers();
            } else {
                alert("Please answer all questions before continuing.");
            }
        } else if (quizState === 'feedback') {
            incorrectDetails = [];
            selectedAnswers = [];
            currentCategoryIndex++;
            if (currentCategoryIndex < specificCategories.length) {
                quizState = 'answering';
                generateTestQuestions(specificCategories[currentCategoryIndex]);
            } else {
                quizState = 'finished';
                endQuiz();
            }
        } else if (quizState === 'finished') {
            // Restart the quiz
            restartQuiz();
        }
    });

    // Event listeners for Previous and Next buttons
    prevBtn.addEventListener('click', () => {
        navigateQuestion(-1);
    });

    nextBtn.addEventListener('click', () => {
        navigateQuestion(1);
    });
});

// Function to toggle active state between Quick and Long buttons
function toggleActive(selected, other) {
    if (selected && other) {
        selected.classList.add('active');
        other.classList.remove('active');
        testLength = selected.id;

        if (testLength === 'quick') {
            categoryTotal = 3;
            generatedQuestionAmount = 4;
        } else if (testLength === 'long') {
            categoryTotal = 5;
            generatedQuestionAmount = 5;
        }
    } else {
        console.error("One of the buttons is missing. Cannot toggle active state.");
    }
}

// Function to update button position (can be expanded if needed)
function updateBtnPosition(isQuick) {
    console.log(`${isQuick ? 'Quick' : 'Long'} option selected`);
    testLength = isQuick ? 'quick' : 'long';
}

// Debounced function to generate the quiz
function debouncedGenerateQuiz() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        handleGenerateQuiz();
    }, 300);
}

// Function to handle quiz generation after selecting Quick or Long
async function handleGenerateQuiz() {
    const topic = inputElement.value.trim();

    if (!topic) {
        alert("Please enter a topic to generate the quiz.");
        quickBtn.disabled = false;
        longBtn.disabled = false;
        return;
    }

    console.log("Starting quiz generation...");
    showLoadingScreen();

    try {
        await generateSpecificTopic(topic);
    } catch (error) {
        console.error("Error during quiz generation:", error);
    } finally {
        hideLoadingScreen();
        console.log("Quiz generation complete.");
        quickBtn.disabled = false;
        longBtn.disabled = false;
    }
}

// Function to show the loading screen
function showLoadingScreen() {
    if (loadingScreen) {
        loadingScreen.style.visibility = 'visible';
    }
}

// Function to hide the loading screen
function hideLoadingScreen() {
    if (loadingScreen) {
        loadingScreen.style.visibility = 'hidden';
    }
}

// Function to show the localized loading screen (specific to insights/navigation area)
function showFeedbackLoading() {
    const insightsLoadingScreen = document.getElementById('insightsLoadingScreen');
    if (insightsLoadingScreen) {
        insightsLoadingScreen.style.display = 'flex'; // Use 'flex' if you want to center content using flexbox
    }
}

// Function to hide the localized loading screen (specific to insights/navigation area)
function hideFeedbackLoading() {
    const insightsLoadingScreen = document.getElementById('insightsLoadingScreen');
    if (insightsLoadingScreen) {
        insightsLoadingScreen.style.display = 'none';
    }
}

// Function to generate specific subtopics based on user input
async function generateSpecificTopic(inputTopic) {
    showLoadingScreen();

    if (specificTopicInProgress) {
        console.log('Question generation already in progress. Aborting duplicate call.');
        hideLoadingScreen();
        return;
    }

    specificTopicInProgress = true;

    const totalSubtopics = testLength === 'quick' ? 3 : 5;
    console.log(`Generating ${totalSubtopics} subtopics for the topic: ${inputTopic}`);

    // Define the JSON schema for the response
    const subtopicsSchema = {
        type: "object",
        properties: {
            keytopic: { type: "string" },
            topic1: { type: "string" },
            topic2: { type: "string" },
            topic3: { type: "string" },
            ...(totalSubtopics >= 5 && {
                topic4: { type: "string" },
                topic5: { type: "string" }
            })
        },
        required: ["keytopic", "topic1", "topic2", "topic3", ...(totalSubtopics === 5 ? ["topic4", "topic5"] : [])],
        additionalProperties: false
    };

    const messages = [{
        role: "user",
        content: `Generate a key topic and exactly ${totalSubtopics} subtopics for the main topic "${inputTopic}". The response should be in JSON format with the tags 'keytopic', 'topic1', 'topic2',${totalSubtopics >=5 ? " 'topic4', 'topic5'" : ""}.`
    }];

    const options = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`, // Ensure this is securely handled in production!
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: "gpt-4o-2024-08-06", // Ensure you have access to this model
            messages: messages,
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "subtopics_schema",
                    strict: true,
                    schema: subtopicsSchema
                }
            },
            max_tokens: 150
        })
    };

    try {
        let response = await fetch('https://api.openai.com/v1/chat/completions', options);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error('Network response was not ok: ' + JSON.stringify(errorData));
        }

        let data = await response.json();
        console.log('Received data from GPT:', data);

        // Check if response contains a refusal
        if (data.choices && data.choices.length > 0) {
            const choice = data.choices[0];
            if (choice.message.refusal) {
                console.error('GPT refused the request:', choice.message.refusal);
                return;
            }

            if (choice.message.content) {
                let parsedData;
                try {
                    parsedData = JSON.parse(choice.message.content);
                } catch (parseError) {
                    console.error('Error parsing JSON response:', parseError.message);
                    return;
                }

                console.log('Parsed Data:', parsedData);

                const keyTopic = parsedData.keytopic;
                const subtopics = [parsedData.topic1, parsedData.topic2, parsedData.topic3];
                if (totalSubtopics === 5 && parsedData.topic4 && parsedData.topic5) {
                    subtopics.push(parsedData.topic4, parsedData.topic5);
                }

                console.log('Key Topic:', keyTopic);
                console.log('Subtopics:', subtopics);

                specificCategories = subtopics;
                console.log('Specific Categories:', specificCategories);

                updateHeroTitle(specificCategories[currentCategoryIndex]);

                // Hide the hero description
                heroDescription.style.display = 'none';

                // Show the question section
                questionSection.style.display = 'block';

                // Enable navigation buttons and question indicator
                prevBtn.disabled = true;
                nextBtn.disabled = false;
                questionIndicator.style.display = 'block';

                if (specificCategories.length > 0) {
                    await generateTestQuestions(specificCategories[currentCategoryIndex]);
                } else {
                    console.error('No specific categories returned.');
                }
            } else {
                console.error('No content returned from GPT.');
            }
        } else {
            console.error('No choices returned from GPT.');
        }

    } catch (error) {
        console.error('Error during the API call:', error.message);
    } finally {
        specificTopicInProgress = false;
        hideLoadingScreen();
    }
}

// Function to update the hero title with the current subtopic
function updateHeroTitle(subtopic) {
    if (heroTitle) {
        heroTitle.textContent = capitalizeWords(subtopic);
    }
}

// Utility function to shuffle an array (Fisher-Yates Shuffle)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Function to generate test questions for a specific category
async function generateTestQuestions(specificCategory) {
    if (testQuestionsInProgress) {
        console.log('Test questions generation already in progress. Aborting duplicate call.');
        return;
    }

    testQuestionsInProgress = true;

    const totalQuestions = testLength === 'quick' ? 4 : 5;

    console.log(`GPT called with specific category: ${specificCategory}`);
    showLoadingScreen();

    insightsContainer.style.display = 'none';
    reviewContainer.style.display = 'none';
    insightsContainer.innerHTML = '';
    reviewContainer.innerHTML = '';

    const testQuestionFunction = {
        name: "generate_test_questions",
        description: `Generate ${totalQuestions} multiple-choice questions about the specific category: ${specificCategory}. Each question should have 5 answer choices (one correct). Provide an explanation for each correct answer. Only respond in JSON format.`,
        parameters: {
            type: "object",
            properties: {
                keytopic: { type: "string", description: "The key topic for which the quiz is generated." },
                ...Array.from({ length: totalQuestions }, (_, i) => ({
                    [`question${i + 1}`]: {
                        type: "object",
                        properties: {
                            question: { type: "string", description: `The question content for question${i + 1}.` },
                            options: { type: "array", items: { type: "string" }, description: `An array of 4 incorrect answer choices for question${i + 1}.` },
                            correct_answer: { type: "string", description: `The correct answer for question${i + 1}.` },
                            explanation: { type: "string", description: `Explanation for the correct answer of question${i + 1}.` }
                        },
                        required: ["question", "options", "correct_answer", "explanation"],
                        additionalProperties: false
                    }
                })).reduce((acc, curr) => Object.assign(acc, curr), {})
            },
            required: [
                "keytopic",
                ...Array.from({ length: totalQuestions }, (_, i) => `question${i + 1}`)
            ],
            additionalProperties: false
        }
    };

    const options = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`, 
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "gpt-4-0613",
            messages: [{
                role: "user",
                content: `Generate ${generatedQuestionAmount} multiple-choice questions about "${specificCategory}". Each question should have 5 answer choices (one correct). Provide an explanation for each correct answer. Respond in strict JSON format.`
            }],
            functions: [testQuestionFunction],
            function_call: "auto",
            max_tokens: 1500 // Increased to accommodate explanations
        })
    };

    try {
        console.log('Sending API request with the following options:', options);

        let response = await fetch('https://api.openai.com/v1/chat/completions', options);
        console.log(`API response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Network response was not ok: ${response.statusText} - ${errorText}`);
        }

        let data = await response.json();
        console.log('Received data from GPT:', data);

        if (data.choices && data.choices.length > 0 && data.choices[0].message.function_call) {
            const functionCall = data.choices[0].message.function_call;
            console.log('Function Call Data:', functionCall);

            try {
                const parsedData = JSON.parse(functionCall.arguments);
                console.log('Parsed Data:', parsedData);

                testingData = [];

                for (let i = 1; i <= totalQuestions; i++) {
                    const questionTag = `question${i}`;
                    if (parsedData[questionTag]) {
                        let { question, options, correct_answer, explanation } = parsedData[questionTag];

                        if (!options.includes(correct_answer)) {
                            options.push(correct_answer);
                        }

                        const shuffledOptions = shuffleArray(options);

                        testingData.push({
                            question,
                            options: shuffledOptions,
                            correct_answer,
                            explanation
                        });
                    } else {
                        console.warn(`Question ${i} is missing in the parsed data.`);
                    }
                }
                console.log('Testing data stored:', testingData);

                selectedAnswers = new Array(testingData.length).fill(null);
                console.log('Selected answers initialized:', selectedAnswers);

                populateQuestions(); // Dynamically create slides
                quizState = 'answering';
            } catch (parseError) {
                console.error('Error parsing the function arguments:', parseError.message);
            }
        } else {
            console.error('No function call data returned from GPT. Response:', data);
        }
    } catch (error) {
        console.error('Error during the API call:', error.message, error.stack);
    } finally {
        testQuestionsInProgress = false;
        console.log('Resetting quiz progress and showing continue button.');

        continueButton.style.display = 'block';
        hideLoadingScreen();
    }
}

// Function to populate questions into the quiz
function populateQuestions() {
    // Hide the initial quiz-container and show the question-section
    quizContainer.style.display = 'none';
    questionSection.style.display = 'block';

    // Clear any existing slides
    questionSection.querySelectorAll('.question-slide').forEach(slide => {
        slide.remove(); // Remove existing slides to prevent duplicates
    });

    // Dynamically create slides based on the number of questions
    testingData.forEach((item, index) => {
        const slide = document.createElement('div');
        slide.className = 'question-slide';
        slide.id = `question-${index}`;

        const questionText = document.createElement('p');
        questionText.textContent = item.question;
        slide.appendChild(questionText);

        item.options.forEach((option, optionIndex) => {
            const label = document.createElement('label');
            label.className = 'option';

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = `question-${index}`;
            radio.value = option;
            radio.id = `question-${index}-option-${optionIndex}`;

            radio.addEventListener('change', () => {
                handleOptionSelect(index, option);
            });

            const optionText = document.createTextNode(option);
            label.appendChild(radio);
            label.appendChild(optionText);

            slide.appendChild(label);
        });

        // Insert the slide before the navigation arrows
        questionSection.insertBefore(slide, questionSection.querySelector('.navigation-arrows'));
    });

    // Show the first question
    currentQuestionIndex = 0;
    showSlide(currentQuestionIndex);

    // Update navigation buttons and continue button visibility
    updateNavigationButtons();
}


// Function to display a specific question slide
function showSlide(index) {
    const slides = questionSection.querySelectorAll('.question-slide');
    slides.forEach((slide, idx) => {
        slide.style.display = idx === index ? 'block' : 'none';
    });
    questionIndicator.textContent = `Question ${index + 1} of ${testingData.length}`;

    updateNavigationButtons();
}

// Function to navigate between questions
function navigateQuestion(direction) {
    const total = testingData.length;
    currentQuestionIndex += direction;

    if (currentQuestionIndex < 0) {
        currentQuestionIndex = 0;
    } else if (currentQuestionIndex >= total) {
        currentQuestionIndex = total - 1;
    }

    showSlide(currentQuestionIndex);
}

// Function to update the state of navigation buttons and the continue button
function updateNavigationButtons() {
    // Disable 'prev' button on first question
    prevBtn.disabled = currentQuestionIndex === 0;

    // Disable 'next' button on last question
    nextBtn.disabled = currentQuestionIndex === testingData.length - 1;

    // Check if all questions are answered
    if (checkAllQuestionsAnswered()) {
        console.log("All questions are answered. Showing and enabling Continue button.");
        continueButton.style.display = 'block';
        continueButton.disabled = false; // Enable continue button once all questions are answered
    } else {
        console.log("Not all questions are answered. Disabling Continue button.");
        continueButton.disabled = true;
    }

    // Additional debug for button visibility
    console.log(`Continue button display: ${continueButton.style.display}`);
}

// Function to check if all questions have been answered
function checkAllQuestionsAnswered() {
    return selectedAnswers.every(answer => answer !== null);
}

// Function to handle answer selection
function handleOptionSelect(questionIndex, selectedOptionValue) {
    selectedAnswers[questionIndex] = selectedOptionValue;

    console.log(`Selected option for question ${questionIndex + 1}: ${selectedOptionValue}`);
    console.log('Selected answers array:', selectedAnswers);

    // Update 'continueButton' state
    updateNavigationButtons();
}

// Function to process selected answers and generate feedback
async function processSelectedAnswers() {
    console.log('Processing selected answers...');
    showLoadingScreen();

    let correctCount = 0;
    let incorrectCount = 0;
    incorrectDetails = [];

    // Prepare data for insights display
    const insightsData = [];

    selectedAnswers.forEach((answer, index) => {
        const question = testingData[index];

        if (question && answer !== null) {
            const isCorrect = answer === question.correct_answer;

            if (isCorrect) {
                correctCount++;
                console.log(`Question ${index + 1}: Correct Answer - ${answer}`);
            } else {
                incorrectCount++;
                console.log(`Question ${index + 1}: Incorrect Answer - ${answer}. The Correct Answer Was - ${question.correct_answer}`);

                incorrectDetails.push({
                    question: question.question,
                    correctAnswer: question.correct_answer,
                    selectedAnswer: answer
                });
            }

            insightsData.push({
                questionNumber: index + 1,
                question: question.question,
                selectedAnswer: answer,
                correctAnswer: question.correct_answer,
                explanation: question.explanation,
                isCorrect: isCorrect
            });
        } else {
            console.warn(`Question ${index + 1} was not answered or the question data is missing.`);
        }
    });

    console.log(`Correct answers: ${correctCount}`);
    console.log(`Incorrect answers: ${incorrectCount}`);
    console.log('Incorrect answer details:', incorrectDetails);

    // Accumulate insights data for all subcategories
    allInsightsData.push({
        category: specificCategories[currentCategoryIndex],
        insights: insightsData
    });

    quizState = 'feedback';

    // Consolidated function to display insights and feedback
    await displayInsightsAndFeedback(insightsData);

    hideLoadingScreen();
}

// Function to provide feedback based on selected answers
async function provideFeedback() {
    console.log('Preparing to fetch feedback...');

    showFeedbackLoading();

    const messages = [
        {
            role: "system",
            content: "You are an AI tutor providing feedback based on quiz performance."
        },
        {
            role: "user",
            content: `The student has just completed a quiz section on "${specificCategories[currentCategoryIndex]}". Here are the details of the questions they got wrong:\n\n${JSON.stringify(incorrectDetails)}\n\nPlease provide feedback divided into 3 sections:\n1. Summary of their performance.\n2. Explanation of the correct answers for the questions they got wrong.\n3. Common mistakes to avoid. Respond in JSON format with the keys 'summary', 'explanations', and 'tips'.`
        }
    ];

    const feedbackSchema = {
        type: "object",
        properties: {
            summary: { 
                type: "string", 
                description: "A brief summary of the student's overall performance in the quiz." 
            },
            explanations: { 
                type: "string", 
                description: "Detailed explanations of the correct answers for the questions the student got wrong." 
            },
            tips: { 
                type: "string", 
                description: "Practical tips and recommendations for improvement based on the quiz performance." 
            }
        },
        required: ["summary", "explanations", "tips"],
        additionalProperties: false
    };

    console.log('Sending request to OpenAI with structured outputs:', messages);

    const options = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "gpt-4o-2024-08-06",
            messages: messages,
            functions: [{
                name: "generate_feedback",
                description: "Generate personalized feedback based on the student's quiz performance. Feedback should include a summary, explanations, and tips in JSON format.",
                parameters: feedbackSchema
            }],
            function_call: "auto",
            max_tokens: 1000,
            temperature: 0.7,
            n: 1
        })
    };

    try {
        let response = await fetch('https://api.openai.com/v1/chat/completions', options);
        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        let data = await response.json();
        console.log('Feedback generated:', data);

        if (data.choices && data.choices.length > 0) {
            const choice = data.choices[0];
            if (choice.message.function_call && choice.message.function_call.arguments) {
                const feedback = JSON.parse(choice.message.function_call.arguments);
                console.log('Feedback parsed:', feedback);
                // Display feedback after insights
                displayFeedback(feedback); // Updated to call displayFeedback
            } else if (choice.message.content) {
                // Fallback if function_call is not used
                try {
                    const feedback = JSON.parse(choice.message.content);
                    console.log('Feedback parsed from content:', feedback);
                    displayFeedback(feedback); // Updated to call displayFeedback
                } catch (parseError) {
                    console.error('Error parsing feedback from content:', parseError.message);
                }
            } else {
                console.error('No function_call or content returned from GPT.');
            }
        } else {
            console.error('No choices returned from GPT.');
        }
    } catch (error) {
        console.error('Error generating feedback:', error.message);
    } finally {
        hideFeedbackLoading();
    }
}

// Function to display AI-generated feedback to the user
function displayFeedback(feedback) {
    // Ensure the insights container is visible
    insightsContainer.style.display = 'block';
    
    // Clear any existing content to prevent duplication
    insightsContainer.innerHTML = '';
    
    // Create a heading for the feedback section
    const feedbackHeading = document.createElement('h2');
    feedbackHeading.textContent = 'AI-Generated Feedback';
    insightsContainer.appendChild(feedbackHeading);
    
    // Define the sections expected in the feedback
    const feedbackSections = ['summary', 'explanations', 'tips'];
    
    feedbackSections.forEach(section => {
        if (feedback[section]) {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = `feedback-section ${section}`; // Optional: Add classes for styling
            
            const sectionTitle = document.createElement('h3');
            sectionTitle.textContent = capitalizeWords(section);
            sectionDiv.appendChild(sectionTitle);
            
            const sectionContent = document.createElement('p');
            sectionContent.textContent = feedback[section];
            sectionDiv.appendChild(sectionContent);
            
            insightsContainer.appendChild(sectionDiv);
        }
    });
    
    // Create a container for the Continue button
    const continueButtonContainer = document.createElement('div');
    continueButtonContainer.className = 'continue-button-container'; // Optional: Add class for styling
    
    // Append the Continue button to its container
    continueButtonContainer.appendChild(continueButton);
    
    // Append the Continue button container to the insights container
    insightsContainer.appendChild(continueButtonContainer);
    
    // Scroll to the feedback section for better user experience
    feedbackHeading.scrollIntoView({ behavior: "smooth" });
    
    // Update the Continue button text based on remaining categories
    if (currentCategoryIndex < specificCategories.length - 1) {
        continueButton.textContent = 'Next Category →';
    } else {
        continueButton.textContent = 'Finish Quiz';
    }
    
    // Ensure the Continue button is visible and enabled
    continueButton.style.display = 'block';
    continueButton.disabled = false;
}

// Consolidated Function to display insights and feedback after quiz completion
async function displayInsightsAndFeedback(insightsData) {
    // Hide question section
    questionSection.style.display = 'none';

    // Display insights container
    insightsContainer.style.display = 'block';

    // Clear previous insights and review content
    insightsContainer.innerHTML = '';
    reviewContainer.innerHTML = '';

    // Display instant insights
    const insightsHeading = document.createElement('h2');
    insightsHeading.textContent = 'Instant Insights';
    insightsContainer.appendChild(insightsHeading);

    const correctCount = insightsData.filter(data => data.isCorrect).length;
    const totalQuestions = insightsData.length;

    const insightsSummary = document.createElement('p');
    insightsSummary.textContent = `You answered ${correctCount} out of ${totalQuestions} questions correctly.`;
    insightsContainer.appendChild(insightsSummary);

    // Display review container
    reviewContainer.style.display = 'block';

    const reviewHeading = document.createElement('h3');
    reviewHeading.textContent = 'Review Your Answers';
    reviewContainer.appendChild(reviewHeading);

    const reviewList = document.createElement('div');
    reviewList.className = 'review-list';

    insightsData.forEach(data => {
        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item';
        reviewItem.style.backgroundColor = data.isCorrect ? '#e6ffe6' : '#ffe6e6';
        reviewItem.style.border = `1px solid ${data.isCorrect ? 'green' : 'red'}`;
        reviewItem.style.padding = '10px';
        reviewItem.style.marginBottom = '10px';
        reviewItem.style.borderRadius = '5px';

        const questionNum = document.createElement('h4');
        questionNum.textContent = `Question ${data.questionNumber}: ${data.question}`;
        reviewItem.appendChild(questionNum);

        const yourAnswer = document.createElement('p');
        yourAnswer.textContent = `Your Answer: ${data.selectedAnswer}`;
        reviewItem.appendChild(yourAnswer);

        const correctAnswer = document.createElement('p');
        correctAnswer.textContent = `Correct Answer: ${data.correctAnswer}`;
        reviewItem.appendChild(correctAnswer);

        const explanation = document.createElement('p');
        explanation.textContent = `Explanation: ${data.explanation}`;
        reviewItem.appendChild(explanation);

        reviewList.appendChild(reviewItem);
    });

    // Make the review list scrollable
    reviewList.style.maxHeight = '300px';
    reviewList.style.overflowY = 'auto';

    reviewContainer.appendChild(reviewList);

    // Ensure 'Continue' button is appended after insights
    insightsContainer.appendChild(continueButton);

    // Ensure the continue button is visible and not disabled
    continueButton.style.display = 'block';
    continueButton.disabled = false;

    // Add event listener to continue button
    continueButton.onclick = async function () {
        // Move to the next subcategory or finish the quiz
        if (currentCategoryIndex < specificCategories.length - 1) {
            currentCategoryIndex++;  // Move to the next category
            quizState = 'answering';
            insightsContainer.innerHTML = ''; // Clear the insights
            await generateTestQuestions(specificCategories[currentCategoryIndex]);
        } else {
            // All categories are done, generate in-depth analysis
            quizState = 'finished';
            await generateInDepthAnalysis();
        }
    };

    // Fetch and display AI-generated feedback
    await provideFeedback();

    // Ensure the 'Continue' button remains visible and clickable after feedback is provided
    continueButton.style.display = 'block';
    continueButton.disabled = false;
}

// Consolidated Function to display insights and feedback after quiz completion
async function displayInsightsAndFeedback(insightsData) {
    // Hide question section
    questionSection.style.display = 'none';

    // Display insights container
    insightsContainer.style.display = 'block';

    // Clear previous insights and review content
    insightsContainer.innerHTML = '';
    reviewContainer.innerHTML = '';

    // Display instant insights
    const insightsHeading = document.createElement('h2');
    insightsHeading.textContent = 'Instant Insights';
    insightsContainer.appendChild(insightsHeading);

    const correctCount = insightsData.filter(data => data.isCorrect).length;
    const totalQuestions = insightsData.length;

    const insightsSummary = document.createElement('p');
    insightsSummary.textContent = `You answered ${correctCount} out of ${totalQuestions} questions correctly.`;
    insightsContainer.appendChild(insightsSummary);

    // Display review container
    reviewContainer.style.display = 'block';

    const reviewHeading = document.createElement('h3');
    reviewHeading.textContent = 'Review Your Answers';
    reviewContainer.appendChild(reviewHeading);

    const reviewList = document.createElement('div');
    reviewList.className = 'review-list';

    insightsData.forEach(data => {
        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item';
        reviewItem.style.backgroundColor = data.isCorrect ? '#e6ffe6' : '#ffe6e6';
        reviewItem.style.border = `1px solid ${data.isCorrect ? 'green' : 'red'}`;
        reviewItem.style.padding = '10px';
        reviewItem.style.marginBottom = '10px';
        reviewItem.style.borderRadius = '5px';

        const questionNum = document.createElement('h4');
        questionNum.textContent = `Question ${data.questionNumber}: ${data.question}`;
        reviewItem.appendChild(questionNum);

        const yourAnswer = document.createElement('p');
        yourAnswer.textContent = `Your Answer: ${data.selectedAnswer}`;
        reviewItem.appendChild(yourAnswer);

        const correctAnswer = document.createElement('p');
        correctAnswer.textContent = `Correct Answer: ${data.correctAnswer}`;
        reviewItem.appendChild(correctAnswer);

        const explanation = document.createElement('p');
        explanation.textContent = `Explanation: ${data.explanation}`;
        reviewItem.appendChild(explanation);

        reviewList.appendChild(reviewItem);
    });

    // Make the review list scrollable
    reviewList.style.maxHeight = '300px';
    reviewList.style.overflowY = 'auto';

    reviewContainer.appendChild(reviewList);

    // Make the review list scrollable
    reviewList.style.maxHeight = '300px';
    reviewList.style.overflowY = 'auto';

    // Ensure 'Continue' button is appended, visible, and clickable
    insightsContainer.appendChild(continueButton);
    continueButton.style.display = 'block';
    continueButton.disabled = false;

    // Fetch and display AI-generated feedback
    await provideFeedback();

    // Set 'continueButton' text based on whether there are more categories
    if (currentCategoryIndex < specificCategories.length - 1) {
        continueButton.textContent = 'Next Category →';
    } else {
        continueButton.textContent = 'Finish Quiz';
    }

    // Ensure the 'Continue' button remains visible and clickable after feedback is provided
    continueButton.style.display = 'block';
    continueButton.disabled = false;
}

// Function to handle the end of the quiz and generate in-depth analysis
function endQuiz() {
    console.log("Quiz ended");
    generateInDepthAnalysis();
}

// Function to generate and display an in-depth analysis of the user's performance
async function generateInDepthAnalysis() {
    showLoadingScreen();

    // Aggregate all insights data
    const analysisData = {
        totalCategories: specificCategories.length,
        totalQuestions: allInsightsData.reduce((acc, cat) => acc + cat.insights.length, 0),
        totalCorrectAnswers: allInsightsData.reduce((acc, cat) => acc + cat.insights.filter(q => q.isCorrect).length, 0),
        totalIncorrectAnswers: allInsightsData.reduce((acc, cat) => acc + cat.insights.filter(q => !q.isCorrect).length, 0),
        performancePercentage: ((allInsightsData.reduce((acc, cat) => acc + cat.insights.filter(q => q.isCorrect).length, 0) / allInsightsData.reduce((acc, cat) => acc + cat.insights.length, 0)) * 100).toFixed(2),
        incorrectDetails: allInsightsData.reduce((acc, cat) => acc.concat(cat.insights.filter(q => !q.isCorrect).map(q => ({
            category: cat.category,
            question: q.question,
            correctAnswer: q.correctAnswer,
            selectedAnswer: q.selectedAnswer
        }))), [])
    };

    const messages = [
        {
            role: "system",
            content: "You are an AI educational assistant providing a detailed analysis of a student's quiz performance."
        },
        {
            role: "user",
            content: `Provide an in-depth analysis based on the following test performance data:\n\n${JSON.stringify(analysisData)}\n\nThe analysis should include:\n1. A summary of the student's overall performance.\n2. An evaluation of their understanding of the broader unit.\n3. Assessment of their skills related to the unit.\n4. Common struggles or mistakes observed.\n5. Recommendations for improvement.\n\nPlease respond in JSON format with appropriate sections.`
        }
    ];

    const analysisFunction = {
        name: "generate_in_depth_analysis",
        description: "Generate an in-depth analysis of the student's quiz performance based on provided data. Respond in JSON format with sections for summary, understanding, skills, common struggles, and recommendations.",
        parameters: {
            type: "object",
            properties: {
                summary: { type: "string", description: "Summary of the student's overall performance." },
                understanding: { type: "string", description: "Evaluation of the student's understanding of the broader unit." },
                skills: { type: "string", description: "Assessment of the student's skills related to the unit." },
                common_struggles: { type: "string", description: "Common struggles or mistakes observed during the test." },
                recommendations: { type: "string", description: "Recommendations for improvement." }
            },
            required: ["summary", "understanding", "skills", "common_struggles", "recommendations"]
        }
    };

    const options = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`, // Ensure this is securely handled in production!
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "gpt-4-0613",
            messages: messages,
            functions: [analysisFunction],
            function_call: "auto",
            max_tokens: 1000,
            temperature: 0.7
        })
    };

    try {
        let response = await fetch('https://api.openai.com/v1/chat/completions', options);

        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }

        let data = await response.json();
        console.log('In-depth analysis data:', data);

        if (data.choices && data.choices.length > 0 && data.choices[0].message.function_call) {
            const functionCall = data.choices[0].message.function_call;
            const analysis = JSON.parse(functionCall.arguments);
            displayInDepthAnalysis(analysis);
        } else {
            console.error('No function call data returned from GPT.');
        }
    } catch (error) {
        console.error('Error generating in-depth analysis:', error.message);
    } finally {
        hideLoadingScreen();
    }
}

// Function to display the in-depth analysis to the user
function displayInsightsAndReview(insightsData) {
    // Hide question section
    questionSection.style.display = 'none';

    // Display insights container
    insightsContainer.style.display = 'block';

    // Clear previous insights and review content
    insightsContainer.innerHTML = '';
    reviewContainer.innerHTML = '';

    // Display instant insights
    const insightsHeading = document.createElement('h2');
    insightsHeading.textContent = 'Instant Insights';
    insightsContainer.appendChild(insightsHeading);

    const correctCount = insightsData.filter(data => data.isCorrect).length;
    const totalQuestions = insightsData.length;

    const insightsSummary = document.createElement('p');
    insightsSummary.textContent = `You answered ${correctCount} out of ${totalQuestions} questions correctly.`;
    insightsContainer.appendChild(insightsSummary);

    // Add 'Continue' button under insights
    insightsContainer.appendChild(continueButton);

    // Display review container
    reviewContainer.style.display = 'block';

    const reviewHeading = document.createElement('h3');
    reviewHeading.textContent = 'Review Your Answers';
    reviewContainer.appendChild(reviewHeading);

    const reviewList = document.createElement('div');
    reviewList.className = 'review-list';

    insightsData.forEach(data => {
        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item';
        reviewItem.style.backgroundColor = data.isCorrect ? '#e6ffe6' : '#ffe6e6';
        reviewItem.style.border = `1px solid ${data.isCorrect ? 'green' : 'red'}`;
        reviewItem.style.padding = '10px';
        reviewItem.style.marginBottom = '10px';
        reviewItem.style.borderRadius = '5px';

        const questionNum = document.createElement('h4');
        questionNum.textContent = `Question ${data.questionNumber}: ${data.question}`;
        reviewItem.appendChild(questionNum);

        const yourAnswer = document.createElement('p');
        yourAnswer.textContent = `Your Answer: ${data.selectedAnswer}`;
        reviewItem.appendChild(yourAnswer);

        const correctAnswer = document.createElement('p');
        correctAnswer.textContent = `Correct Answer: ${data.correctAnswer}`;
        reviewItem.appendChild(correctAnswer);

        const explanation = document.createElement('p');
        explanation.textContent = `Explanation: ${data.explanation}`;
        reviewItem.appendChild(explanation);

        reviewList.appendChild(reviewItem);
    });

    // Make the review list scrollable
    reviewList.style.maxHeight = '300px';
    reviewList.style.overflowY = 'auto';

    reviewContainer.appendChild(reviewList);
}

// Function to display the in-depth analysis to the user
function displayInDepthAnalysis(analysis) {
    insightsContainer.style.display = 'block';
    insightsContainer.innerHTML += '<h2>In-Depth Analysis</h2>'; // Add a heading for clarity

    const analysisSections = ['summary', 'understanding', 'skills', 'common_struggles', 'recommendations'];

    analysisSections.forEach(section => {
        if (analysis[section]) {
            const div = document.createElement('div');
            const heading = document.createElement('h3');
            heading.textContent = capitalizeWords(section.replace('_', ' '));
            const content = document.createElement('p');
            content.textContent = analysis[section];
            div.appendChild(heading);
            div.appendChild(content);
            insightsContainer.appendChild(div);
        }
    });

    // Scroll down to display analysis
    insightsContainer.scrollIntoView({ behavior: "smooth" });

    // Set 'continueButton' text to allow quiz restart
    continueButton.textContent = 'Restart Quiz';
    continueButton.style.display = 'block';
    continueButton.disabled = false;
}

// Function to restart the quiz
function restartQuiz() {
    selectedAnswers = [];
    currentCategoryIndex = 0;
    quizState = 'answering';
    specificCategories = [];
    testingData = [];
    incorrectDetails = [];
    allInsightsData = []; // Reset accumulated insights data

    // Reset UI
    quizContainer.innerHTML = '';
    continueButton.style.display = 'none';

    inputElement.value = '';

    if (quickBtn && longBtn) {
        quickBtn.classList.add('active');
        longBtn.classList.remove('active');
        testLength = 'quick';
        categoryTotal = 3;
        generatedQuestionAmount = 4;

        quickBtn.disabled = false;
        longBtn.disabled = false;
    }

    // Reset Hero Section
    heroDescription.style.display = 'block';
    heroTitle.textContent = 'Customized AI Performance Insights';

    // Hide 'question-section', 'insightsContainer', and 'reviewContainer'
    questionSection.style.display = 'none';
    insightsContainer.style.display = 'none';
    reviewContainer.style.display = 'none';

    // Reset navigation buttons
    prevBtn.disabled = true;
    nextBtn.disabled = false;
    questionIndicator.style.display = 'none';
    continueButton.style.display = 'none';
}
