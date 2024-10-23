const OPENAI_API_KEY = 'API Key';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Function to fetch flashcards from OpenAI API
const fetchFlashcards = async (prompt, language) => {
  console.log('Fetching flashcards with prompt:', prompt, 'and respond only in the language:', language);

  const systemMessage = {
    role: 'system',
    content: 'You are a helpful assistant that creates flashcards based on user prompts.',
  };

  const userMessage = {
    role: 'user',
    content: `Create up to 10 flashcards based on the following topic. Each flashcard should have a "Heading" and "Content". The "Heading" should be a question, and the "Content" should be a brief answer. The flashcards should be in an array under the key "flashcards". If the topic doesn't allow for 10 flashcards, create as many as possible, but not less than 5. Topic: ${prompt}. YOU MUST RESPOND IN ${language}, but keep the JSON keys in English.`,
  };

  const messages = [systemMessage, userMessage];

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: messages,
      functions: [
        {
          name: 'flashcards_generation',
          description: 'Generate a set of flashcards from the given topic',
          parameters: {
            type: 'object',
            properties: {
              flashcards: {
                type: 'array',
                minItems: 5,
                maxItems: 10,
                items: {
                  type: 'object',
                  properties: {
                    Heading: { type: 'string', description: 'Question or title of the flashcard' },
                    Content: { type: 'string', description: 'Answer or explanation for the flashcard' },
                  },
                  required: ['Heading', 'Content'],
                  additionalProperties: false,
                },
              },
            },
            required: ['flashcards'],
            additionalProperties: false,
          },
        },
      ],
      function_call: { name: 'flashcards_generation' },
    }),
  };

  try {
    const response = await fetch(OPENAI_API_URL, options);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    const assistantMessage = data.choices[0].message;

    // Access parsed output
    if (assistantMessage.function_call) {
      const parsedOutput = JSON.parse(assistantMessage.function_call.arguments);
      console.log('Received flashcards data:', parsedOutput.flashcards);
      return parsedOutput.flashcards;
    } else {
      console.error('Unexpected response format:', data);
      return [];
    }
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

// JavaScript code to handle UI interactions and integrate with HTML
document.addEventListener('DOMContentLoaded', () => {
  const inputElement = document.querySelector('.prompt-section input[type="text"]');
  const submitButton = document.querySelector('.prompt-section .submit-button');
  const flashcardContainer = document.querySelector('.the-flash-card-container');
  const progressBar = document.querySelector('.progress-bar .progress');
  const progressText = document.querySelector('.progress-text');
  const nextButton = document.querySelector('.left-and-right-arrows .arrow-right');
  const prevButton = document.querySelector('.left-and-right-arrows .arrow-left');
  const loadingScreen = document.getElementById('loadingScreen'); // Moved here for global access

  let flashcards = [];
  let currentCardIndex = 0;
  let isFlipped = false;

  // Functions to show and hide the loading screen
  function showLoadingScreen() {
    if (loadingScreen) {
      loadingScreen.style.visibility = 'visible';
    }
  }

  function hideLoadingScreen() {
    if (loadingScreen) {
      loadingScreen.style.visibility = 'hidden';
    }
  }

  // Hide navigation controls initially
  const arrowsContainer = document.querySelector('.left-and-right-arrows');
  const progressContent = document.querySelector('.progress-content');
  if (arrowsContainer && progressContent) {
    arrowsContainer.style.display = 'none';
    progressContent.style.display = 'none';
  } else {
    console.warn('Navigation controls or progress content elements not found.');
  }

  const updateProgress = () => {
    const totalFlashcards = flashcards.length;

    if (totalFlashcards === 0) {
      if (progressBar) progressBar.style.width = '0%';
      if (progressText) progressText.textContent = '00/00';
    } else {
      const progress = ((currentCardIndex + 1) / totalFlashcards) * 100;
      if (progressBar) progressBar.style.width = `${progress}%`;
      if (progressText) progressText.textContent = `${String(currentCardIndex + 1).padStart(2, '0')}/${String(totalFlashcards).padStart(2, '0')}`;
    }
  };

  const renderFlashcard = () => {
    if (flashcards.length === 0) {
      flashcardContainer.innerHTML = `<div class="the-flash-card">No flashcards available.</div>`;
      return;
    }

    const cardData = flashcards[currentCardIndex];

    const cardContent = `
      <div class="the-flash-card ${isFlipped ? 'flipped' : ''}">
        <div class="front">
          <h2>${cardData.Heading}</h2>
        </div>
        <div class="back">
          <p>${cardData.Content}</p>
        </div>
      </div>
    `;

    flashcardContainer.innerHTML = cardContent;
    addFlipEventListener('.the-flash-card');

    // Update progress whenever a flashcard is rendered
    updateProgress();
  };

  const addFlipEventListener = (selector) => {
    const cardElement = document.querySelector('.the-flash-card');
    if (cardElement) {
      cardElement.addEventListener('click', () => {
        isFlipped = !isFlipped;
        cardElement.classList.toggle('flipped');
      });
    } else {
      console.error('Flashcard element not found.');
    }
  };

  const handleNextCard = () => {
    const totalFlashcards = flashcards.length;
    if (totalFlashcards === 0) return;

    currentCardIndex = (currentCardIndex + 1) % totalFlashcards;
    isFlipped = false;
    renderFlashcard();
  };

  const handlePrevCard = () => {
    const totalFlashcards = flashcards.length;
    if (totalFlashcards === 0) return;

    currentCardIndex = (currentCardIndex - 1 + totalFlashcards) % totalFlashcards;
    isFlipped = false;
    renderFlashcard();
  };

  submitButton.addEventListener('click', async () => {
    const prompt = inputElement.value.trim();
    if (!prompt) {
      alert('Please enter a topic.');
      return;
    }

    // Retrieve the selected language from the settings
    const language = selectedLanguage || 'English';

    // Show loading screen
    showLoadingScreen();

    // Disable input and button
    inputElement.disabled = true;
    submitButton.disabled = true;
    submitButton.classList.add('loading');

    try {
      flashcards = await fetchFlashcards(prompt, language);
      if (flashcards.length > 0) {
        currentCardIndex = 0;
        isFlipped = false;
        renderFlashcard();

        // Show navigation controls
        if (arrowsContainer && progressContent) {
          arrowsContainer.style.display = 'flex';
          progressContent.style.display = 'flex';
        }
      } else {
        flashcardContainer.innerHTML = `<div class="the-flash-card">No flashcards generated.</div>`;
        addFlipEventListener('.the-flash-card');
      }
    } catch (error) {
      console.error('Error fetching flashcards:', error);
      alert('An error occurred while fetching flashcards.');
    } finally {
      // Hide loading screen
      hideLoadingScreen();

      // Enable input and button
      inputElement.disabled = false;
      submitButton.disabled = false;
      submitButton.classList.remove('loading');
    }
  });

  // Swiping through flashcards
  let startX = 0;
  let endX = 0;

  flashcardContainer.addEventListener(
    'touchstart',
    (e) => {
      startX = e.changedTouches[0].screenX;
    },
    false
  );

  flashcardContainer.addEventListener(
    'touchend',
    (e) => {
      endX = e.changedTouches[0].screenX;
      handleGesture();
    },
    false
  );

  const handleGesture = () => {
    if (startX - endX > 50) {
      // Swipe left - show next card
      handleNextCard();
    } else if (endX - startX > 50) {
      // Swipe right - show previous card
      handlePrevCard();
    }
  };

  // Settings panel functionality
  const settingsButton = document.getElementById('settings-button');
  const sidebar = document.getElementById('sidebar');
  const dropdownButtons = document.querySelectorAll('.dropdown-btn');

  const toggleSidebar = () => {
    sidebar.classList.toggle('close');
  };

  window.toggleSidebar = toggleSidebar;

  settingsButton.addEventListener('click', toggleSidebar);

  dropdownButtons.forEach((btn) => {
    btn.addEventListener('click', function () {
      this.classList.toggle('rotate');
      const subMenu = this.nextElementSibling;
      subMenu.classList.toggle('show');
    });
  });

  // Handle language selection
  let selectedLanguage = 'English';

  const languageOptions = document.querySelectorAll('.sub-menu li a');

  languageOptions.forEach((option) => {
    option.addEventListener('click', function (e) {
      e.preventDefault();
      const parentMenu = this.closest('.sub-menu');
      const parentButton = parentMenu.previousElementSibling;
      const selectedOption = this.textContent.trim();
      parentButton.querySelector('span').textContent = selectedOption;

      selectedLanguage = selectedOption;

      // Close the submenu after selection
      parentMenu.classList.remove('show');
      parentButton.classList.remove('rotate');
    });
  });

  // Event listeners for navigation buttons
  if (nextButton) {
    nextButton.addEventListener('click', handleNextCard);
  } else {
    console.error('Next button not found.');
  }

  if (prevButton) {
    prevButton.addEventListener('click', handlePrevCard);
  } else {
    console.error('Previous button not found.');
  }

  addFlipEventListener('.the-flash-card');

  updateProgress();
});
