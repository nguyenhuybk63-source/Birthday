import PhotoSwipeLightbox from '/assets/plugins/photoswipe/dist/photoswipe-lightbox.esm.min.js';

const initAudio = () => {
    const audio = document.getElementById('bgAudio');
    const button = document.getElementById('audioToggleBtn');
    const isLocal = window.location.host.startsWith("localhost");
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (!audio || !button || isLocal) return;

    audio.volume = 0.3;
    let started = false;

    if (!document.getElementById('guest-popup')) {
        const startAudio = (e) => {
            if (started) return;

            if ((!e.isTrusted || !e.cancelable) && isAndroid) return;

            started = true;

            // Play immediately in the event handler
            audio.play()
                .then(() => {
                    // Remove all listeners immediately
                    ['click', 'touchstart', 'touchend', 'mousedown', 'keydown'].forEach(ev =>
                        document.removeEventListener(ev, startAudio)
                    );
                })
                .catch(err => {
                    started = false; // Allow retry
                });
        };

        ['click', 'touchstart', 'touchend', 'mousedown', 'keydown'].forEach(ev =>
            document.addEventListener(ev, startAudio, { passive: true })
        );
    }

    button.addEventListener('click', async (e) => {
        e.stopPropagation(); // Prevent triggering startAudio
        try {
            if (audio.paused) {
                await audio.play();
            } else {
                audio.pause();
            }
        } catch (e) {
            console.warn("Audio playback error:", e);
        }
    });

    audio.addEventListener('play', () => button.classList.add('playing'));
    audio.addEventListener('pause', () => button.classList.remove('playing'));
    audio.addEventListener('ended', () => button.classList.remove('playing'));
};

const initPhotoSwipe = () => {
    const lightbox = new PhotoSwipeLightbox({
        gallery: '#photo-gallery',
        children: 'a',
        pswpModule: () => import('/assets/plugins/photoswipe/dist/photoswipe.esm.min.js')
    });
    lightbox.init();
};

const initPhotoGalleryGrid = () => {
    const gallery = document.querySelector('#photo-gallery');
    if (!gallery) return;

    imagesLoaded(gallery, () => {
        document.querySelectorAll('#photo-gallery a').forEach(link => {
            const img = new Image();
            img.src = link.href;
            img.onload = () => {
                link.dataset.pswpWidth = img.naturalWidth;
                link.dataset.pswpHeight = img.naturalHeight;
            };
        });

        if (gallery.hasAttribute("data-masonry")) {
            new Masonry(gallery, {
                itemSelector: '.photo',
                columnWidth: '.photo',
                percentPosition: true
            });
        }
    });
};

const initCountdown = () => {
    const countdownEl = document.getElementById("countdown");
    if (!countdownEl) return;

    let endDate = new Date("2025-07-20T10:30:00");
    const dateString = countdownEl.getAttribute('data-date');
    const timeString = countdownEl.getAttribute('data-time');

    if (dateString && timeString) {
        const [day, month, year] = dateString.split('-').map(Number);
        const [hours, minutes] = timeString.split(':').map(Number);
        endDate = new Date(year, month - 1, day, hours, minutes);
    }

    const twoDigits = countdownEl.hasAttribute("twodigits");

    const updateCountdown = () => {
        const now = new Date();
        const time = countdown(now, endDate,
            countdown.DAYS | countdown.HOURS | countdown.MINUTES | countdown.SECONDS
        );

        const setText = (sel, val) => {
            const el = document.querySelector(sel);
            if (el) el.textContent = twoDigits ? String(val).padStart(2, '0') : val;
        };

        setText('[data-countdown="days"]', time.days);
        setText('[data-countdown="hours"]', time.hours);
        setText('[data-countdown="minutes"]', time.minutes);
        setText('[data-countdown="seconds"]', time.seconds);
    };

    updateCountdown();
    setInterval(updateCountdown, 1000);
};

const renderMiniCalendar = (container) => {
    const WEEKDAYS = {
        en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        vi: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
        ko: ['월', '화', '수', '목', '금', '토', '일'],
        zh: ['一', '二', '三', '四', '五', '六', '日'],
        fr: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    };
    const currentLang = document.body.dataset.lang || 'en'; 
    const dateStr = container.getAttribute("data-date"); // format: DD-MM-YYYY
    if (!dateStr) return;
    const hideCaption = container.getAttribute("hideCaption") || false;
    const todayIcon = container.getAttribute("data-today-icon") || "bi-heart-fill";
    const extraIcon = container.getAttribute("data-extra-icon") || "bi-heart";
    const [day, month, year] = dateStr.split("-").map(Number);
    const highlightDates = [new Date(year, month - 1, day)];
    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();

    const extraDatesStr = container.getAttribute("data-extra-dates");

    if (extraDatesStr) {
        extraDatesStr.split(",").map(dStr => {
            const [d, m, y] = dStr.split("-").map(Number);
            highlightDates.push(new Date(y, m - 1, d));
        });
    }

    var isHightDay = (d) => {
        var result = false;
        var isFirst = false;
        for (let index = 0; index < highlightDates.length; index++) {
            isFirst = index == 0;
            const element = highlightDates[index];
            result = element.getDate() == d;
            if (result) {
                break;
            }
        }

        return [isFirst, result];
    }

    var renderCalendarHeader = (lang = 'en') => {
        const days = WEEKDAYS[lang] || WEEKDAYS.en;
        return `
            <table>
                <tbody>
                    <tr>
                        ${days.map(d => `<th>${d}</th>`).join('')}
                    </tr>
        `;
    }

    let html = "";

    if (hideCaption) {
        html += renderCalendarHeader(currentLang);
    }
    else {
        html += `<table>
     <caption class="calendar-month">Tháng ${month} / ${year}</caption>
     <tbody>
     <tr>
       <th>Thứ 2</th><th>Thứ 3</th><th>Thứ 4</th>
       <th>Thứ 5</th><th>Thứ 6</th><th>Thứ 7</th><th>CN</th>
     </tr>`;
    }

    let currentDay = 1;
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday=0

    while (currentDay <= daysInMonth) {
        html += "<tr>";
        for (let col = 0; col < 7; col++) {
            if ((currentDay === 1 && col < startOffset) || currentDay > daysInMonth) {
                html += "<td>&nbsp;</td>";
            } else {
                const [isFirstHightLight, isHighlight] = isHightDay(currentDay);
                const icon = isFirstHightLight ? todayIcon : extraIcon;
                if (isHighlight) {
                    html += `<td>
                     <div class="today${isFirstHightLight ? '' : ' extra'}${icon.includes("fill") ? ' fill' : ''}">
                         <span data-wow-iteration="1000" class="heart wow animate__animated animate__heartBeat">
                             <i class="today-heart bi ${icon} wow animate__animated animate__fadeIn"></i>
                         </span>
                         <span class="day">${currentDay}</span>
                     </div>
                 </td>`;
                } else {
                    html += `<td>${currentDay}</td>`;
                }
                currentDay++;
            }
        }
        html += "</tr>";
    }

    html += "</tbody></table>";
    container.innerHTML = html;
};


const wowObject = new WOW({
    callback: (el) => {
        if (el.classList.contains('today-heart')) {
            const t = el.closest('.heart');
            if (t && !t.classList.contains('started')) {
                setTimeout(() => {
                    t.classList.add('started');
                }, 1000);
            }
        }
    }
});

const initGuestPopup = (opening_card) => {
    const popup = document.getElementById("guest-popup");

    if (!popup) {
        return null;
    }
    const inner = document.querySelector(".guest-popup-inner");
    const button = document.querySelector(".guest-open-button");

    // Show popup after load
    if (!opening_card) {
        popup.classList.add("show");
        document.body.classList.add("no-scroll");
    }

    // Close when click outside the inner box
    popup.addEventListener("click", (e) => {
        if (!inner.contains(e.target)) closePopup();
    });

    // Close when click the button
    button.addEventListener("click", closePopup);

    function closePopup() {
        popup.classList.add("closing");
        document.body.classList.remove("no-scroll"); // ✅ restore scroll
        // Remove from DOM after animation ends
        setTimeout(() => {
            popup.style.display = "none";
            document.getElementById('audioToggleBtn').click();
        }, 500); // match fadeOut duration
    }

    return popup;
}

// Init after DOM ready
window.addEventListener('DOMContentLoaded', () => {
    initAudio();
    initCountdown();
    const miniCalendar = document.querySelector('#mini-calendar');
    if (miniCalendar) renderMiniCalendar(miniCalendar);

    initPhotoGalleryGrid();
});

// Full load
window.addEventListener('load', () => {
    const opening_card = document.getElementById("card-opening-sides");
    initPhotoSwipe();
    wowObject.init();

    var guestPopup = initGuestPopup(opening_card);

    if (opening_card) {
        opening_card.classList.add("_animating");
        setTimeout(() => {
            opening_card.remove();
            if (guestPopup) {
                guestPopup.classList.add("show");
                document.body.classList.add("no-scroll");
            }
        }, 4500);
    }
});
document.getElementById('callBtn')?.addEventListener('click', function () {
  window.location.href = 'tel:+84336081413';
});