let sections = [];
let currentSlideIndex = 0;
const SLIDE_BREAK = "==SLIDE BREAK==";

// Insert a slide break at the current cursor position
function insertBreak() {
    const textarea = document.getElementById('textInput');
    const cursorPos = textarea.selectionStart;

    // Get the text before and after cursor
    const textBeforeCursor = textarea.value.substring(0, cursorPos);
    const textAfterCursor = textarea.value.substring(cursorPos);

    // Insert the break marker
    textarea.value = textBeforeCursor + "\n" + SLIDE_BREAK + "\n" + textAfterCursor;

    // Move cursor after the break
    const newPosition = cursorPos + SLIDE_BREAK.length + 2; // +2 for the newlines
    textarea.focus();
    textarea.setSelectionRange(newPosition, newPosition);

    // Preview the sections
    processText();
}

// Process text into sections
function processText() {
    const text = document.getElementById('textInput').value;

    // First split by our custom slide break marker
    const initialSplit = text.split(SLIDE_BREAK);

    // Then process each chunk for empty lines
    sections = [];
    initialSplit.forEach(chunk => {
        // Split each chunk by empty lines (2 or more consecutive newlines)
        const chunkSections = chunk.split(/\n{2,}/)
            .map(section => section.trim())
            .filter(section => section.length > 0);

        sections = [...sections, ...chunkSections];
    });

    displaySections();

    // Enable/disable start button based on sections
    const startBtn = document.getElementById('startBtn');
    startBtn.disabled = sections.length === 0;
    if (sections.length === 0) {
        startBtn.style.opacity = 0.5;
    } else {
        startBtn.style.opacity = 1;
    }
}

// Display sections in the list
function displaySections() {
    const sectionsList = document.getElementById('sectionsList');
    sectionsList.innerHTML = '';

    sections.forEach((section, index) => {
        const li = document.createElement('li');
        li.textContent = section.substring(0, 100) + (section.length > 100 ? '...' : '');
        li.addEventListener('click', () => {
            startPresentation(index);
        });
        sectionsList.appendChild(li);
    });
}

// Add keyboard shortcut for inserting breaks
document.addEventListener('keydown', (e) => {
    // Ctrl+Enter or Alt+Enter to insert break
    if ((e.ctrlKey || e.altKey) && e.key === 'Enter') {
        e.preventDefault();
        insertBreak();
    }

    // Only handle navigation keys when in presentation mode
    if (document.getElementById('presentation').classList.contains('hidden')) {
        return;
    }

    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        nextSlide();
    } else if (e.key === 'ArrowLeft') {
        prevSlide();
    } else if (e.key === 'Escape') {
        exitPresentation();
    }
});

// Touch swipe support for slides
let touchStartX = 0;
let touchEndX = 0;

function setupTouchEvents() {
    const presentation = document.getElementById('presentation');

    presentation.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, false);

    presentation.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, false);
}

function handleSwipe() {
    const swipeThreshold = 50; // Minimum distance for a swipe to be registered

    if (touchEndX < touchStartX - swipeThreshold) {
        // Swiped left, go to next slide
        nextSlide();
    }

    if (touchEndX > touchStartX + swipeThreshold) {
        // Swiped right, go to previous slide
        prevSlide();
    }
}

// Initialize touch events when page loads
document.addEventListener('DOMContentLoaded', setupTouchEvents);

// Start presentation mode
function startPresentation(startIndex = 0) {
    if (sections.length === 0) return;

    currentSlideIndex = startIndex;

    document.getElementById('editor').classList.add('hidden');
    document.getElementById('presentation').classList.remove('hidden');

    showCurrentSlide();
}

// Show current slide
function showCurrentSlide() {
    const slideEl = document.getElementById('slide');
    slideEl.innerHTML = sections[currentSlideIndex].replace(/\n/g, '<br>');

    // Update counter
    document.getElementById('slideCounter').textContent =
        `${currentSlideIndex + 1}/${sections.length}`;
}

// Navigate to next slide
function nextSlide() {
    if (currentSlideIndex < sections.length - 1) {
        currentSlideIndex++;
        showCurrentSlide();
    }
}

// Navigate to previous slide
function prevSlide() {
    if (currentSlideIndex > 0) {
        currentSlideIndex--;
        showCurrentSlide();
    }
}

// Exit presentation mode
function exitPresentation() {
    document.getElementById('presentation').classList.add('hidden');
    document.getElementById('editor').classList.remove('hidden');
}

// Export slides to PowerPoint
function exportToPowerPoint() {
    if (sections.length === 0) {
        alert('Please add some text and split it into slides first.');
        return;
    }

    const pptx = new PptxGenJS();

    pptx.layout = 'LAYOUT_16x9';
    pptx.title = 'Text Presentation';

    sections.forEach((section, index) => {
        const slide = pptx.addSlide();

        slide.addText(`Slide ${index + 1}`, {
            x: 0.5,
            y: 0.1,
            fontSize: 12,
            color: '999999',
            align: 'left'
        });

        slide.addText(section, {
            x: 0.5,
            y: 0.5,
            w: '90%',
            h: '70%',
            fontSize: 24,
            align: 'center',
            valign: 'middle',
            color: '000000',
            margin: [0.5, 0.5, 0.5, 0.5]
        });
    });

    pptx.writeFile({ fileName: 'Presentation.pptx' });
}
