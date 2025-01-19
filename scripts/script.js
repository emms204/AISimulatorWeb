// scripts/script.js

document.addEventListener('DOMContentLoaded', () => {

  // Elements for start/stop simulation logic
  const API_BASE_URL = 'http://127.0.0.1:8000';
  const difficultySelect = document.getElementById('difficulty');
  const serviceSelect = document.getElementById('service-topic');
  const startBtn = document.getElementById('start-button');
  const stopBtn = document.getElementById('stop-button');
  
  const errorMessage = document.getElementById('error-message');
  const successMessage = document.getElementById('success-message');

  // Customer & Consultant bubbles
  const chatBox = document.getElementById('chat-container');
  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');
  let isSimulationStarted = false;

  const microphoneButton = document.getElementById('microphone');
  microphoneButton.addEventListener('click', recordVoice);

  // Adjusting the textarea height dynamically
  function autoGrowTextArea(textArea) {
    textArea.style.height = "auto";  // Reset height to re-measure
    textArea.style.height = textArea.scrollHeight + "px";  // Set new height
  }
  
  chatInput.addEventListener("input", () => {
    autoGrowTextArea(chatInput);  // Call on input to adjust height
  });
  
  chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {  // Prevent 'Enter' from creating a new line unless 'Shift' is pressed
      event.preventDefault();  // Prevent the default action to avoid new line
      sendButton.click();  // Trigger the send button click
    }
  });

  async function speakMessage(message) {
    try {
        const response = await fetch(`${API_BASE_URL}/speak`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: message,
                voice: 'Alice' // Adjust the voice model as needed
            })
        });

        if (!response.ok) {
            throw new Error('Speech synthesis failed');
        }

        // Convert the response stream to a Blob
        const audioBlob = await response.blob();

        // Create a URL for the Blob
        const audioUrl = URL.createObjectURL(audioBlob);
        console.log('Audio URL:', audioUrl);

        // Create an audio element and play the audio
        const audio = new Audio(audioUrl);
        audio.play();
        audio.addEventListener('play', () => console.log('Audio started playing'));
        audio.addEventListener('error', (e) => console.error('Audio error:', e));

    } catch (error) {
        console.error(error.message);
        errorMessage.innerText = 'Error in speech synthesis. Please try again.';
        errorMessage.style.display = 'block';
    }
  }

  async function fetchCustomerMessage(customer_type, product, user_response) {
    console.log('Sending payload:', { customer_type, product, user_response }); // Debugging

    try {
        // Construct the payload based on the simulation state
        const payload = {};
        if (customer_type && product) {
            payload.customer_type = customer_type;
            payload.product = product;
        }
        if (user_response) {
            payload.user_response = user_response;
        }

        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Received response:', data); // Debugging

        const customerMsg = data.data.text; // Access the AI reply
        await speakMessage(customerMsg);
        
        // Display the customer's message in the chat bubble
        const customerChatBubble = document.createElement('div');
        customerChatBubble.classList.add('chat-message', 'customer-bubble');
        customerChatBubble.innerHTML = `<span>🤖 "${customerMsg}"</span>`;
        chatBox.appendChild(customerChatBubble);

        // Scroll to the bottom of the chat box
        chatBox.scrollTop = chatBox.scrollHeight;

        successMessage.style.display = 'block';

    } catch (error) {
        console.error('Error:', error); // Debugging
        errorMessage.innerText = 'Error sending message. Please try again.';
        errorMessage.style.display = 'block';
    }
  }
  
  startBtn.addEventListener('click', async () => {
    const customer_type = difficultySelect.value;
    const product = serviceSelect.value;

    // Reset messages each time start is clicked
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    if (!customer_type || !product) {
        // Show error if not selected
        errorMessage.style.display = 'block';
        return;
    }

    console.log('Starting simulation with:', { customer_type, product }); // Debugging

    try {
        // Send the initial payload
        await fetchCustomerMessage(customer_type, product, null);

        // Mark the simulation as started
        isSimulationStarted = true;

    } catch (error) {
        console.error('Error:', error); // Debugging
        errorMessage.innerText = 'Error starting simulation. Please try again.';
        errorMessage.style.display = 'block';
    }
  });

  // Placeholder: Stop button logic
  stopBtn.addEventListener('click', () => {
    // Currently no special behavior. You can add an API call if needed:
    // e.g., fetch('/api/stop-simulation', { method: 'POST' }) ...
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
    alert('Simulation stopped.');
  });

  // Send button click handler
  sendButton.addEventListener('click', async () => {
    const consultantMsg = chatInput.value.trim(); // Get the typed message

    if (!consultantMsg) {
        alert('Please type a message before sending.'); // Show error if empty
        return;
    }

    // Display the consultant's message in the chat bubble
    const consultantChatBubble = document.createElement('div');
    consultantChatBubble.classList.add("chat-message", "consultant-bubble");
    consultantChatBubble.innerHTML = `<span>👤 "${consultantMsg}"</span>`;
    chatBox.appendChild(consultantChatBubble);

    // Scroll to the bottom of the chat box
    chatBox.scrollTop = chatBox.scrollHeight;
 
    // Clear the input field
    chatInput.value = '';
    autoGrowTextArea(chatInput);  // Reset textarea height

    // Send the message to the helper function
    await fetchCustomerMessage(null, null, consultantMsg);
  });

  // Function to send audio to the /transcribe endpoint
  async function transcribeAudio(audioBlob) {
    try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');

        const response = await fetch(`${API_BASE_URL}/transcribe`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Transcription failed');
        }

        const data = await response.json();
        return data.data.text; // Return the transcribed text
    } catch (error) {
        console.error('Error transcribing audio:', error);
        errorMessage.innerText = 'Error transcribing audio. Please try again.';
        errorMessage.style.display = 'block';
        return null;
    }
  }


  let mediaRecorder;
  let audioChunks = [];

  // Record button click handler
  async function recordVoice() {
      const microphoneButton = document.getElementById('microphone');

      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
          // Start recording
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorder = new MediaRecorder(stream);
          audioChunks = [];

          mediaRecorder.ondataavailable = (event) => {
              audioChunks.push(event.data);
          };

          mediaRecorder.onstop = async () => {
              // Convert audio chunks to a Blob
              const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });

              // Send the audio to the /transcribe endpoint
              const transcript = await transcribeAudio(audioBlob);

              // Display the consultant's message in the chat bubble
              const consultantChatBubble = document.createElement('div');
              consultantChatBubble.classList.add("chat-message", "consultant-bubble");
              consultantChatBubble.innerHTML = `<span>👤 "${transcript}"</span>`;
              chatBox.appendChild(consultantChatBubble);

              // Scroll to the bottom of the chat box
              chatBox.scrollTop = chatBox.scrollHeight;

              // Send the transcript to the helper function
              await fetchCustomerMessage(null, null, transcript);
          };

          mediaRecorder.start();
          microphoneButton.innerHTML = '<i class="fas fa-stop"></i>'; // Change icon to stop
      } else {
          // Stop recording
          mediaRecorder.stop();
          microphoneButton.innerHTML = '<i class="fas fa-microphone"></i>'; // Change icon back to microphone
      }
  }
});