//////////////////////////////////// Hàm count down chính ////////////////////////////////////
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


///////////////////////////////////////////// Hàm điều khiển nhạc nền ////////////////////////////////////

document.addEventListener('DOMContentLoaded', function() {
    const audio = document.getElementById('bgAudio');
    const btn = document.getElementById('audioToggleBtn');

    // 1. Kiểm tra nếu thiếu element thì dừng lại để tránh lỗi console
    if (!audio || !btn) return;

    // 2. Trang điểm cho nút (Vì HTML của bạn đang để trống)
    btn.innerHTML = '🎵'; // Icon mặc định
    btn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        z-index: 9999;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: #fff;
        border: 2px solid #f8bbd0;
        cursor: pointer;
        font-size: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    `;

    // 3. Hiệu ứng xoay khi nhạc chạy (Thêm vào bằng JS)
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes spin { 100% { transform:rotate(360deg); } }
        .is-playing { animation: spin 4s linear infinite; }
    `;
    document.head.appendChild(style);

    // 4. Logic điều khiển chính
    btn.addEventListener('click', function() {
        if (audio.paused) {
            audio.play()
                .then(() => {
                    btn.innerHTML = '🎶'; // Đổi icon khi đang hát
                    btn.classList.add('is-playing');
                })
                .catch(err => {
                    console.error("Trình duyệt chặn nhạc tự động hoặc file lỗi:", err);
                    alert("Bạn hãy nhấn lại một lần nữa để nghe nhạc nhé!");
                });
        } else {
            audio.pause();
            btn.innerHTML = '🎵';
            btn.classList.remove('is-playing');
        }
    });
});


///////////////////////////////////// Hàm điều khiển popup khách mời ////////////////////////////////////
(function() {
    const initPopup = () => {
        const popup = document.getElementById('guest-popup');
        const openBtn = document.querySelector('.guest-open-button');
        const audio = document.getElementById('bgAudio');

        if (!popup) return;

        // 1. "Trang điểm" lại để không che sạch màn hình (trông sẽ sang hơn)
        popup.style.cssText = `
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: fixed !important;
            top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0, 0, 0, 0.7); /* Nền tối mờ để nổi bật popup */
            z-index: 999999;
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(5px); /* Làm mờ nền phía sau */
        `;

        // Đảm bảo nội dung bên trong popup nổi bật
        const inner = popup.querySelector('.guest-popup-inner');
        if (inner) {
            inner.style.backgroundColor = "white";
            inner.style.padding = "20px";
            inner.style.borderRadius = "15px";
            inner.style.textAlign = "center";
            inner.style.maxWidth = "90%";
        }

        // 2. Xử lý nút bấm "Xem thiệp ngay"
        if (openBtn) {
            // Ép nút bấm luôn có thể click được
            openBtn.style.cursor = "pointer";
            openBtn.style.pointerEvents = "auto";
            openBtn.style.zIndex = "1000000";

            openBtn.onclick = function(e) {
                e.preventDefault();
                console.log("Đã bấm nút xem thiệp!");

                // Hiệu ứng biến mất mượt mà
                popup.style.transition = 'all 0.6s ease';
                popup.style.opacity = '0';
                popup.style.transform = 'scale(0.9)';

                setTimeout(() => {
                    popup.style.display = 'none';
                    // Sau khi ẩn popup, cho phép cuộn trang web
                    document.body.style.overflow = 'auto';
                }, 600);

                // Kích hoạt nhạc đồng thời
                if (audio) {
                    audio.play().catch(err => console.log("Nhạc chờ..."));
                    const musicBtn = document.getElementById('audioToggleBtn');
                    if (musicBtn) {
                        musicBtn.innerHTML = '🎶';
                        musicBtn.classList.add('is-playing');
                    }
                }
            };
        }

        // Khóa cuộn trang khi popup đang hiện
        document.body.style.overflow = 'hidden';
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPopup);
    } else {
        initPopup();
    }
})();