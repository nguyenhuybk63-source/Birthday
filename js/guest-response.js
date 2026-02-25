// Guest data and state management
let guestData = undefined;
let hasExpanded = false;
let expandedByScroll = false;
let expandedByDuration = false;
let startDurationTimeout = false;
var rsvpSentMessage = $("#rsvp-sent-message").text() ?? "Phản hồi của bạn đã được gửi tới cô dâu chú rể. Xin cảm ơn!";
var errorMessage = $("#error-comment-message").text() ?? "Có lỗi xảy ra, vui lòng thử lại!";
// Timeout references for cleanup
let collapseTimeout;
let durationTimeout;

// DOM element cache
const elements = {
    floatingButton: null,
    inlineButton: null,
    modal: null,
    form: null,
    accompanySection: null,
    submitButton: null,
    spinner: null
};

// Configuration constants
const CONFIG = {
    COLLAPSE_DELAY: 5000,
    EXPAND_ON_SCROLL_DELAY: 10000,
    SCROLL_THRESHOLD: 100,
    API_ENDPOINT: '/api/weddingguest'
};

/**
 * Expands the floating button to show confirmation text
 */
function expandButton() {
    if (hasExpanded || !elements.floatingButton) return;

    elements.floatingButton.classList.add('expanded');
    collapseTimeout = setTimeout(collapseButton, CONFIG.COLLAPSE_DELAY);
}

/**
 * Collapses the floating button back to icon-only state
 */
function collapseButton() {
    if (!elements.floatingButton) return;

    elements.floatingButton.classList.remove('expanded');
    hasExpanded = false;
}

/**
 * Opens the confirmation modal and resets the form
 */
function openConfirmationModal() {
    if (elements.floatingButton) {
        elements.floatingButton.classList.remove('expanded');
        hasExpanded = true;
    }

    resetForm();
    elements.modal?.show();
}

/**
 * Resets the confirmation form to initial state
 */
function resetForm() {
    if (!elements.form || !elements.accompanySection) return;

    elements.form.reset();
    elements.accompanySection.style.display = 'none';

    const accompanyCount = document.getElementById('accompanyCount');
    if (accompanyCount) {
        accompanyCount.value = 0;
    }
}

/**
 * Validates the confirmation form
 * @returns {boolean} True if form is valid
 */
function validateForm() {
    const attendanceSelected = document.querySelector('input[name="attendance"]:checked');
    const attendanceError = document.getElementById('attendanceError');

    if (!attendanceSelected) {
        attendanceError.style.display = 'block';
        return false;
    }

    attendanceError.style.display = 'none';
    return true;
}

/**
 * Handles form submission and API communication
 * @param {Event} e - Submit event
 */
async function handleFormSubmit(e) {
    e.preventDefault();

    if (!validateForm()) return;

    setLoadingState(true);

    try {
        const formData = buildFormData();
        console.log('Submitting:', formData);

        const response = await fetch(`${CONFIG.API_ENDPOINT}/${guestData.id}/response`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        await response.json();
        handleSuccessfulSubmission();

    } catch (error) {
        console.error('Error submitting response:', error);
        alert(errorMessage);
    } finally {
        setLoadingState(false);
    }
}

/**
 * Builds form data object from form inputs
 * @returns {Object} Form data ready for API submission
 */
function buildFormData() {
    const attendanceValue = document.querySelector('input[name="attendance"]:checked').value;
    const accompanyValue = document.getElementById('accompanyCount').value;
    const messageValue = document.getElementById('guestMessage').value;

    return {
        code: guestData.code,
        weddingId: guestData.weddingId,
        status: attendanceValue === 'true',
        message: messageValue.trim(),
        accompanies: accompanyValue ? parseInt(accompanyValue, 10) : 0
    };
}

/**
 * Handles successful form submission
 */
function handleSuccessfulSubmission() {
    elements.modal?.hide();

    setTimeout(() => {
        alert(rsvpSentMessage);
    }, 500);

    removeConfirmationButtons();
}

/**
 * Removes confirmation buttons from the page
 */
function removeConfirmationButtons() {
    elements.floatingButton?.remove();
    elements.inlineButton?.remove();
}

/**
 * Sets the loading state of the submit button
 * @param {boolean} isLoading - Whether form is submitting
 */
function setLoadingState(isLoading) {
    if (!elements.submitButton || !elements.spinner) return;

    elements.submitButton.disabled = isLoading;
    elements.spinner.classList.toggle('d-none', !isLoading);
}

/**
 * Sets up attendance radio button change handlers
 */
function setupAttendanceHandlers() {
    document.querySelectorAll('input[name="attendance"]').forEach(radio => {
        radio.addEventListener('change', function () {
            const isAttending = this.value === 'true';
            elements.accompanySection.style.display = isAttending ? 'block' : 'none';
            document.getElementById('accompanyCount').value = 0;
        });
    });
}

/**
 * Sets up scroll-based button expansion
 */
function setupScrollHandler() {
    if (!elements.form) return;

    window.addEventListener('scroll', () => {
        if (expandedByScroll) return;

        // Trigger expansion after duration if not already expanded
        if (!startDurationTimeout && !expandedByDuration) {
            startDurationTimeout = true;
            durationTimeout = setTimeout(() => {
                expandButton();
                expandedByDuration = true;
            }, CONFIG.EXPAND_ON_SCROLL_DELAY);
        }

        // Expand when user scrolls near bottom
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;

        if (scrollTop + windowHeight >= docHeight - CONFIG.SCROLL_THRESHOLD) {
            expandButton();
            expandedByScroll = true;
        }
    });
}

/**
 * Sets up click handlers for confirmation buttons
 */
function setupButtonHandlers() {
    elements.floatingButton?.addEventListener('click', () => {
        if (elements.floatingButton.classList.contains('expanded')) {
            openConfirmationModal();
        } else {
            clearTimeout(collapseTimeout);
            expandButton();
        }
    });

    elements.inlineButton?.addEventListener('click', () => {
        openConfirmationModal();
        clearTimeout(collapseTimeout);
    });
}

/**
 * Caches DOM elements for efficient access
 */
function cacheElements() {
    elements.floatingButton = document.getElementById('guestConfimationBtn');
    elements.inlineButton = document.getElementById('guestInlineConfimationBtn');
    elements.form = document.getElementById('guestConfirmationForm');
    elements.accompanySection = document.getElementById('guestAccompanySection');
    const modalElement = document.getElementById('guestConfirmationModal');
    elements.modal = modalElement ? new bootstrap.Modal(modalElement) : null;

    if (elements.form) {
        elements.submitButton = elements.form.querySelector('.submit-btn');
        elements.spinner = elements.submitButton?.querySelector('.spinner-border');
    }
}

/**
 * Initializes the guest confirmation functionality
 */
function initializeGuestConfirmation() {
    if (!window.guestData) return;

    // Store guest data
    guestData = {
        id: window.guestData.Id,
        fullName: window.guestData.FullName,
        code: window.guestData.Code,
        weddingId: window.guestData.WeddingId,
        isNew: (window.guestData.IsNewlyCreated ?? false) && (window.guestData.IsSelfRegistered ?? false)
    };

    // Cache DOM elements
    cacheElements();

    // Check if guest has already responded
    if (!elements.form) {
        if (guestData.isNew) {
            setTimeout(() => {
                document.getElementById("commentForm")?.scrollIntoView({ behavior: "instant", block: "center" })
                showToast(rsvpSentMessage, "success");
            }, 500);
        }
        
        elements.floatingButton?.remove();
        elements.inlineButton?.addEventListener('click', () => {
            elements.modal?.show();
        });

        return;
    }

    // Setup event handlers
    setupButtonHandlers();
    setupAttendanceHandlers();
    setupScrollHandler();

    // Setup form submission
    elements.form.addEventListener('submit', handleFormSubmit);


}

function showToast(message, type = "primary") {
    const toastEl = document.getElementById("mainToast");
    const toastBody = document.getElementById("mainToastMessage");

    // Set message
    toastBody.textContent = message;

    // Replace background color class
    toastEl.className = `toast align-items-center text-bg-${type} border-0`;

    // Initialize and show
    try {
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    }
    catch {
        alert(message);
    }
}

// Initialize when guest data is available
initializeGuestConfirmation();