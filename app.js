const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const addTextBtn = document.getElementById('addTextBtn');
const fontSelect = document.getElementById('fontSelect');
const colorPicker = document.getElementById('colorPicker');
const fontSizeInput = document.getElementById('fontSizeInput');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');

let textObjects = []; 
let history = []; 
let currentHistoryIndex = -1; 

// Add text to the canvas
addTextBtn.addEventListener('click', () => {
    const text = prompt('Enter text:'); 
    if (text) {
        const textObj = {
            text,
            x: 50, // 
            y: 50, // 
            font: fontSelect.value, 
            color: colorPicker.value, 
            fontSize: parseInt(fontSizeInput.value), 
        };
        textObjects.push(textObj); 
        drawCanvas(); 
        saveHistory(); 
    }
});

// Change font for the last added text
fontSelect.addEventListener('change', () => {
    if (textObjects.length > 0) {
        textObjects[textObjects.length - 1].font = fontSelect.value; 
        drawCanvas(); 
        saveHistory(); 
    }
});

// Change color for the last added text
colorPicker.addEventListener('change', () => {
    if (textObjects.length > 0) {
        textObjects[textObjects.length - 1].color = colorPicker.value; 
        drawCanvas();
        saveHistory(); 
    }
});

// Change font size for the last added text
fontSizeInput.addEventListener('change', () => {
    if (textObjects.length > 0) {
        textObjects[textObjects.length - 1].fontSize = parseInt(fontSizeInput.value); // Update font size
        drawCanvas(); 
        saveHistory(); 
    }
});

// Undo functionality
undoBtn.addEventListener('click', () => {
    if (currentHistoryIndex > 0) {
        currentHistoryIndex--; 
        textObjects = JSON.parse(JSON.stringify(history[currentHistoryIndex])); // Restore previous state
        drawCanvas(); 
    }
});

// Redo functionality
redoBtn.addEventListener('click', () => {
    if (currentHistoryIndex < history.length - 1) {
        currentHistoryIndex++; 
        textObjects = JSON.parse(JSON.stringify(history[currentHistoryIndex])); // Restore next state
        drawCanvas(); 
    }
});

// Draw all text objects on the canvas
function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    textObjects.forEach((textObj) => {
        ctx.font = `${textObj.fontSize}px ${textObj.font}`; 
        ctx.fillStyle = textObj.color; 
        ctx.fillText(textObj.text, textObj.x, textObj.y); 
    });
}

// Save the current state to history for undo/redo
function saveHistory() {
    history = history.slice(0, currentHistoryIndex + 1);
    history.push(JSON.parse(JSON.stringify(textObjects)));
    currentHistoryIndex++; 
}

// Allow moving text by clicking and dragging
canvas.addEventListener('mousedown', (e) => {
    const mousePos = getMousePos(canvas, e); 
    const clickedText = textObjects.find(textObj => {
        const textWidth = ctx.measureText(textObj.text).width; 
        const textHeight = textObj.fontSize; 
        return (
            mousePos.x >= textObj.x &&
            mousePos.x <= textObj.x + textWidth &&
            mousePos.y >= textObj.y - textHeight &&
            mousePos.y <= textObj.y
        );
    });

if (clickedText) {
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('mouseup', onMouseUp);

        let offsetX = mousePos.x - clickedText.x;
        let offsetY = mousePos.y - clickedText.y;

        function onMouseMove(e) {
            const newMousePos = getMousePos(canvas, e); 
            clickedText.x = newMousePos.x - offsetX;
            clickedText.y = newMousePos.y - offsetY; 
            drawCanvas(); 
        }

        function onMouseUp() {
            canvas.removeEventListener('mousemove', onMouseMove); 
            canvas.removeEventListener('mouseup', onMouseUp); 
            saveHistory(); 
        }
    }
});

// Get mouse position relative to the canvas
function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect(); 
    return {
        x: evt.clientX - rect.left, 
        y: evt.clientY - rect.top 
    };
}

document.getElementById('clearCanvasBtn').addEventListener('click', function() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clears the entire canvas
});

const boldIcon = document.getElementById('boldIcon');
const italicIcon = document.getElementById('italicIcon');
const underlineIcon = document.getElementById('underlineIcon');

// Update font style when bold, italic, or underline icons are clicked
boldIcon.addEventListener('click', () => {
    if (textObjects.length > 0) {
        textObjects[textObjects.length - 1].bold = !textObjects[textObjects.length - 1].bold;
        boldIcon.classList.toggle('active');
        drawCanvas();
        saveHistory();
    }
});

italicIcon.addEventListener('click', () => {
    if (textObjects.length > 0) {
        textObjects[textObjects.length - 1].italic = !textObjects[textObjects.length - 1].italic;
        italicIcon.classList.toggle('active');
        drawCanvas();
        saveHistory();
    }
});

underlineIcon.addEventListener('click', () => {
    if (textObjects.length > 0) {
        textObjects[textObjects.length - 1].underline = !textObjects[textObjects.length - 1].underline;
        underlineIcon.classList.toggle('active');
        drawCanvas();
        saveHistory();
    }
});

// Update the drawCanvas function to include bold, italic, and underline styles
function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    textObjects.forEach((textObj) => {
        let fontStyle = '';
        if (textObj.bold) fontStyle += 'bold ';
        if (textObj.italic) fontStyle += 'italic ';
        ctx.font = `${fontStyle}${textObj.fontSize}px ${textObj.font}`;
        ctx.fillStyle = textObj.color;
        if (textObj.underline) {
            ctx.textBaseline = 'top';
            ctx.fillText(textObj.text, textObj.x, textObj.y);
            ctx.beginPath();
            ctx.moveTo(textObj.x, textObj.y + textObj.fontSize);
            ctx.lineTo(textObj.x + ctx.measureText(textObj.text).width, textObj.y + textObj.fontSize);
            ctx.stroke();
        } else {
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(textObj.text, textObj.x, textObj.y);
        }
    });
}

// Update the text object to include bold, italic, and underline properties
const textObj = {
    text,
    x: 50,
    y: 50,
    font: fontSelect.value,
    color: colorPicker.value,
    fontSize: parseInt(fontSizeInput.value),
    bold: false,
    italic: false,
    underline: false,
};