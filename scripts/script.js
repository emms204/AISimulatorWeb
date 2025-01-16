// scripts/script.js

document.addEventListener('DOMContentLoaded', () => {
    // Hamburger menu toggle for the sidebar
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const sidebar = document.querySelector('.sidebar');
  
    hamburgerMenu.addEventListener('click', () => {
      sidebar.classList.toggle('show-sidebar');
    });
  
    // Close sidebar if user clicks outside or on a nav item (optional)
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !hamburgerMenu.contains(e.target)) {
        sidebar.classList.remove('show-sidebar');
      }
    });
  
    // Example of adding new messages to the transcript window:
    const chatContainer = document.querySelector('.chat-container');
  
    function addMessage(sender, text) {
      const messageDiv = document.createElement('div');
      messageDiv.classList.add('message', sender);
      messageDiv.innerHTML = `<p>${text}</p>`;
      chatContainer.appendChild(messageDiv);
      // Auto-scroll to bottom
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  
    // Demo: add a new customer message after 3 seconds
    setTimeout(() => {
      addMessage('customer', 'This is a new message from the customer.');
    }, 3000);
  });
  