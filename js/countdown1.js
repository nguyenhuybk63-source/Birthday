document.addEventListener('DOMContentLoaded', function () {
    const countdownWrapper = document.getElementById('countdown');
    
    // 1. Lấy thông tin từ HTML của bạn
    const targetDateStr = countdownWrapper.getAttribute('data-date'); // "15-06-2026"
    const targetTimeStr = countdownWrapper.getAttribute('data-time'); // "19:00"
    const isTwoDigits = countdownWrapper.hasAttribute('twodigits');

    // 2. Chuyển đổi định dạng ngày tháng (từ DD-MM-YYYY sang YYYY-MM-DD để trình duyệt hiểu)
    const dateParts = targetDateStr.split('-');
    const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${targetTimeStr}:00+07:00`;
    const targetDate = new Date(formattedDate).getTime();

    // 3. Các element hiển thị số
    const daysVal = countdownWrapper.querySelector('[data-countdown="days"]');
    const hoursVal = countdownWrapper.querySelector('[data-countdown="hours"]');
    const minutesVal = countdownWrapper.querySelector('[data-countdown="minutes"]');
    const secondsVal = countdownWrapper.querySelector('[data-countdown="seconds"]');

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            countdownWrapper.innerHTML = "<div class='countdown-title'>Đám cưới đã diễn ra!</div>";
            clearInterval(timerInterval);
            return;
        }

        // Tính toán thời gian
        const d = Math.floor(distance / (1000 * 60 * 60 * 24));
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);

        // Hàm format 2 chữ số (nếu có thuộc tính twodigits)
        const format = (num) => isTwoDigits && num < 10 ? `0${num}` : num;

        // Đổ dữ liệu vào HTML
        if(daysVal) daysVal.innerText = format(d);
        if(hoursVal) hoursVal.innerText = format(h);
        if(minutesVal) minutesVal.innerText = format(m);
        if(secondsVal) secondsVal.innerText = format(s);
    }

    // Chạy ngay lập tức và lặp lại mỗi giây
    updateCountdown();
    const timerInterval = setInterval(updateCountdown, 1000);
});