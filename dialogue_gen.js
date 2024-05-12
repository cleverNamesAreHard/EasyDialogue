const messages = [];

function generateColor() {
    const hue = Math.floor(Math.random() * 360);
    const saturation = Math.floor(Math.random() * 30) + 70;
    const lightness = Math.floor(Math.random() * 15) + 35;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

const speakerColors = {};

function getColorForSpeaker(speaker) {
    if (!speakerColors[speaker]) {
        speakerColors[speaker] = generateColor();
    }
    return speakerColors[speaker];
}

document.getElementById('messageForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const speaker = document.getElementById('speaker').value;
    const message = document.getElementById('message').value;
    const messageId = messages.length + 1;
    messages.push({ id: messageId, speaker, text: message });
    displayMessages();
    this.reset();
});

function displayMessages() {
    const messagesContainer = document.getElementById('messages');
    messagesContainer.innerHTML = '';
    messages.forEach(msg => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.setAttribute('data-id', msg.id);
        messageElement.style.backgroundColor = getColorForSpeaker(msg.speaker);
        messageElement.setAttribute('draggable', true);
        messageElement.innerHTML = `<span class="message-info">${msg.speaker}: &nbsp;</span>${msg.text}<span class="delete-btn" onclick="deleteMessage(${msg.id})">&nbsp;[Delete]</span>`;
        messagesContainer.appendChild(messageElement);
    });
    setupDraggableItems();
}

function setupDraggableItems() {
    const messagesContainer = document.getElementById('messages');
    const draggables = document.querySelectorAll('.message');
    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', () => {
            draggable.classList.add('dragging');
        });
        draggable.addEventListener('dragend', () => {
            draggable.classList.remove('dragging');
        });
    });

    messagesContainer.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(messagesContainer, e.clientY);
        const draggable = document.querySelector('.dragging');
        if (draggable && afterElement) {
            messagesContainer.insertBefore(draggable, afterElement);
        } else if (draggable) {
            messagesContainer.appendChild(draggable);
        }
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.message:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

document.getElementById('exportBtn').addEventListener('click', function() {
    regenerateMessagesFromDOM();
    const exportData = messages.map(msg => ({ speaker: msg.speaker, text: msg.text.substring(0, msg.text.length - 8) }));
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'messages.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

function regenerateMessagesFromDOM() {
    const messageElements = document.querySelectorAll('.message');
    const newMessages = Array.from(messageElements).map(element => {
        const id = parseInt(element.getAttribute('data-id'));
        const speaker = element.querySelector('.message-info').textContent.split(': ')[0].trim();
        const text = element.textContent.split(': ')[1].trim();
        return { id, speaker, text };
    });

    messages.length = 0;
    messages.push(...newMessages);
}

document.getElementById('importBtn').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file && file.type === "application/json") {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedMessages = JSON.parse(e.target.result);
                importedMessages.forEach(msg => {
                    getColorForSpeaker(msg.speaker); // Assign color on import
                });
                messages.splice(0, messages.length, ...importedMessages);
                displayMessages();
            } catch (error) {
                alert('Error parsing JSON file.');
            }
        };
        reader.readAsText(file);
    } else {
        alert('Please upload a valid JSON file.');
    }
});

function deleteMessage(id) {
    const index = messages.findIndex(msg => msg.id === id);
    if (index > -1) {
        messages.splice(index, 1);
        displayMessages();
    }
}


