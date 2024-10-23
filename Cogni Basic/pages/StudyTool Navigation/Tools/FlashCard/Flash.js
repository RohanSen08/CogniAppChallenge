const outPutElement = document.querySelector('#output');
const FrontCardH1 = document.querySelector('.front h1');
const BackCardP = document.querySelector('.back p');
const im5 = document.getElementById('check-5');
let inputElement = document.querySelector('#input');
let currentCardIndex = 1;
let flashcardData = {};
let totalFlashcards = 1
let im5Text = " "; 


//Store Flash Card input under event object (stored under "e")
//e.target.value represetns everything currently in the textbox until user hits enter
inputElement.addEventListener('keyup', (e) => {
    if(e.key === 'Enter'){
        console.log("input: " + e.target.value);
        getMessage(e.target.value);
    }
});

document.getElementById('submitPrompt').addEventListener('click', function() {
    console.log("input: " + inputElement.value); // Log the input value
    getMessage();
});

function showLoadingScreen() {
    document.getElementById('loadingScreen').style.visibility = 'visible';
}

function hideLoadingScreen() {
    document.getElementById("loadingScreen").style.visibility = "hidden"
}

//Take effect if toggle im5 is selected
im5.addEventListener('change', function() {
    if(this.checked) {
        im5Text = "strictly explain like I am 5 years old"; 
    }else {
        im5Text = " "
    }
})
  
//send request to chat GPT
async function getMessage() {
    showLoadingScreen()
    console.log('GPT called')
    const options = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo-1106",
            messages: [{role: "user", content: im5Text + "create me 10 flashcards in JSON format based on the following topic. Have the JSON output have 2 types, one titled 'Heading', and another titled 'Content', under a 'FlashCard' key, be case sensetive and never change. start off with 'FlashCard1' then 'FlashCard2' and keep going until you've reached all the flashcards you've generated. Each Heading for a flash card should be a question and the Content should be the short answer/explanation for that question. Keep flash cards brief and easy to remember. If the topic doesnt allow you to make 10 flashcards, settle for less but make as many as possible. make sure to strictly follow these rules and dont leave any additional comments or explanations not strictly in the JSON fields. Topic: " + inputElement.value}],
            response_format: {type: "json_object"},
            max_tokens: 1000
        })
    }    
    
    try{
        const response = await fetch('https://api.openai.com/v1/chat/completions', options);
        const data = await response.json()
        //Assign values to locations of the card
        const responseContent = JSON.parse(data.choices[0].message.content);
        console.log(data)
            //parse the Resposne Content from the API request 
            if (responseContent && typeof responseContent === 'object') {
                flashcardData = responseContent; // Store the parsed response
                updateFlashcard(); // Load the first flashcard
            } else {
                console.error('Invalid JSON structure');
                FrontCardH1.textContent = "Prompting Error"
                BackCardP.textContent = "Prompting Error"
            }
            totalFlashcards = Object.keys(flashcardData).length;
            updateFlashNumber()
    //catch if an error occured in the try
    } catch (error) {
        console.error('Fetch error', error);
    } finally{
        hideLoadingScreen()
    }
}

//Flip Card
document.addEventListener('DOMContentLoaded', () => {
    const card = document.querySelector('.card');
    let isFlipped = false;
    hideLoadingScreen()

        card.addEventListener('click', () => {
            card.classList.toggle('flipped');
            if (isFlipped) {
                card.style.transform = 'rotateY(0deg)';
                isFlipped = false;
            } else {
                card.style.transform = 'rotateY(180deg)';
                isFlipped = true;
            }
        });
});

const nextButton = document.getElementById('nextButton'); // Assuming you have an element with this ID
nextButton.addEventListener('click', () => {
    currentCardIndex++; // Increment to the next flashcard
    if (currentCardIndex > totalFlashcards) {
        currentCardIndex = 1; // Loop back to the first card
    }
    updateFlashcard(); // Update the flashcard content
});

const prevButton = document.getElementById('prevButton');
prevButton.addEventListener('click', () => {
    currentCardIndex--;
    if (currentCardIndex < 1){
        currentCardIndex = totalFlashcards;
    }
    updateFlashcard();
}) 


//Assign Data
function updateFlashcard() {
    const flashcardKey = `FlashCard${currentCardIndex}`;
    const cardData = flashcardData[flashcardKey];

    if (cardData) {
        FrontCardH1.textContent = cardData.Heading;
        BackCardP.textContent = cardData.Content;
    } else {
        currentCardIndex = 1; // Reset to the first card if the current index is out of range
    }
    updateFlashNumber(); // Update the flashcard number every time this function is called
}


function updateFlashNumber() {
    var counterElement = document.querySelector('.counter p');
    counterElement.textContent = 'Flashcard number: ' + currentCardIndex + '/' + totalFlashcards;
}

document.getElementById('toggleButton').addEventListener('click', function() {
    var settingsPanel = document.getElementById('settingsPanel');
    settingsPanel.classList.toggle('open');
    this.classList.toggle('rotated');
});


/*
document.addEventListener('DOMContentLoaded', function() {
    const section = document.querySelector('section');
    const offset = section.offsetTop; // Get the original top offset of the section
    const buttonContainerHeight = document.querySelector('.button-container').offsetHeight;

    window.addEventListener('scroll', function() {
        if (window.pageYOffset > offset - window.innerHeight + buttonContainerHeight) {
            section.classList.add('fixed-section');
        } else {
            section.classList.remove('fixed-section');
        }
    });
});
*/


