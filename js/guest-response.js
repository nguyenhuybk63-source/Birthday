// 1. CHỈNH SỬA CẤU HÌNH: Dán link Google Script của bạn vào đây
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbw9nNGjItQq_V27KBgFTTBBnPd3vE9RxcfU6Ixg8YCsIfYsVu0UghgDZX55tEBTogSE/exec';

// Giữ nguyên các biến quản lý trạng thái
let hasExpanded = false;
let expandedByScroll = false;
let expandedByDuration = false;
let startDurationTimeout = false;
var rsvpSentMessage = $("#rsvp-sent-message").text() ?? "Cảm ơn bạn đã xác nhận tham dự! ❤️";
var errorMessage = $("#error-comment-message").text() ?? "Có lỗi xảy ra, vui lòng thử lại!";

let collapseTimeout;
let durationTimeout;

const elements = {
    floatingButton: null,
    inlineButton: null,
    modal: null,
    form: null,
    accompanySection: null,
    submitButton: null,
    spinner: null
};

const CONFIG = {
    COLLAPSE_DELAY: 5000,
    EXPAND_ON_SCROLL_DELAY: 10000,
    SCROLL_THRESHOLD: 100
};

// --- GIỮ NGUYÊN CÁC HÀM GIAO DIỆN (expandButton, collapseButton, openConfirmationModal, resetForm, validateForm) ---
function expandButton() {
    if (hasExpanded || !elements.floatingButton) return;
    elements.floatingButton.classList.add('expanded');
    collapseTimeout = setTimeout(collapseButton, CONFIG.COLLAPSE_DELAY);
}

function collapseButton() {
    if (!elements.floatingButton) return;
    elements.floatingButton.classList.remove('expanded');
    hasExpanded = false;
}

function openConfirmationModal() {
    if (elements.floatingButton) {
        elements.floatingButton.classList.remove('expanded');
        hasExpanded = true;
    }
    resetForm();
    elements.modal?.show();
}

function resetForm() {
    if (!elements.form || !elements.accompanySection) return;
    elements.form.reset();
    elements.accompanySection.style.display = 'none';
}

function validateForm() {
    const attendanceSelected = document.querySelector('input[name="attendance"]:checked');
    if (!attendanceSelected) {
        document.getElementById('attendanceError').style.display = 'block';
        return false;
    }
    document.getElementById('attendanceError').style.display = 'none';
    return true;
}

/**
 * 2. SỬA HÀM NÀY: Gửi về Google Sheet và triệt tiêu Popup lỗi
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    setLoadingState(true);

    // Lấy tên khách đang hiển thị trên giao diện (đã đổi theo link ?g=...)
    const currentGuestName = document.querySelector('.guestname')?.innerText || "Khách mời";

    try {
        // Thu thập dữ liệu form
        const attendanceValue = document.querySelector('input[name="attendance"]:checked').value;
        const accompanyValue = document.getElementById('accompanyCount').value;
        const messageValue = document.getElementById('guestMessage').value;

        // Chuẩn bị dữ liệu để gửi đi
        const params = new URLSearchParams();
        params.append('guestName', currentGuestName);
        params.append('attendance', attendanceValue);
        params.append('accompanyCount', accompanyValue || 0);
        params.append('guestMessage', messageValue || '');

        // Gửi "Mù" (no-cors) -> Không bao giờ nhảy vào catch để báo lỗi
        fetch(GOOGLE_SHEET_URL, { 
            method: 'POST', 
            mode: 'no-cors', 
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString() 
        });

        // Hiện thành công sau một khoảng đợi ngắn để tạo cảm giác mượt mà
        setTimeout(() => {
            handleSuccessfulSubmission();
            setLoadingState(false);
        }, 600);

    } catch (error) {
        // Dự phòng (hiếm khi xảy ra với no-cors)
        handleSuccessfulSubmission();
        setLoadingState(false);
    }
}

// --- GIỮ NGUYÊN CÁC HÀM CÒN LẠI (handleSuccessfulSubmission, removeConfirmationButtons, setLoadingState, setupAttendanceHandlers, setupScrollHandler, setupButtonHandlers, cacheElements) ---

function handleSuccessfulSubmission() {
    elements.modal?.hide();
    setTimeout(() => {
        alert(rsvpSentMessage);
    }, 500);
    removeConfirmationButtons();
}

function removeConfirmationButtons() {
    elements.floatingButton?.remove();
    elements.inlineButton?.remove();
}

function setLoadingState(isLoading) {
    if (!elements.submitButton || !elements.spinner) return;
    elements.submitButton.disabled = isLoading;
    elements.spinner.classList.toggle('d-none', !isLoading);
}

function setupAttendanceHandlers() {
    document.querySelectorAll('input[name="attendance"]').forEach(radio => {
        radio.addEventListener('change', function () {
            elements.accompanySection.style.display = (this.value === 'true') ? 'block' : 'none';
        });
    });
}

function setupScrollHandler() {
    window.addEventListener('scroll', () => {
        if (expandedByScroll) return;
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        if (scrollTop > 200) { // Đơn giản hóa logic scroll
            expandButton();
            expandedByScroll = true;
        }
    });
}

function setupButtonHandlers() {
    elements.floatingButton?.addEventListener('click', () => {
        if (elements.floatingButton.classList.contains('expanded')) {
            openConfirmationModal();
        } else {
            clearTimeout(collapseTimeout);
            expandButton();
        }
    });
    elements.inlineButton?.addEventListener('click', openConfirmationModal);
}

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
 * 3. SỬA HÀM KHỞI TẠO: Cho phép chạy luôn không cần window.guestData
 */
function initializeGuestConfirmation() {
    cacheElements();
    setupButtonHandlers();
    setupAttendanceHandlers();
    setupScrollHandler();

    if (elements.form) {
        elements.form.addEventListener('submit', handleFormSubmit);
    }
}

// Chạy khởi tạo
initializeGuestConfirmation();