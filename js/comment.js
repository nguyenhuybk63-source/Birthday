$(function () {
    var emptyListMessage = $("#private-list-comment-message").text() ??"Chưa có lời chúc nào. Hãy là người đầu tiên gửi lời chúc!";
    var privateListMessage = $("#private-list-comment-message").text() ??"Gửi lời chúc riêng tư tới cô dâu chú rể";
    var errorMessage = $("#error-comment-message").text() ?? "Có lỗi xảy ra, vui lòng thử lại!";
    const isDemo = $('body').data('demo') === true;
    const apiUrl = '';
    const weddingId = $('#weddingId').val();
    let currentPage = 0;
    const limit = 35;
    let allCommentsLoaded = false;
    let totalComments = 0;
    const commentList = $('#commentList');

    if (!weddingId) {
        return;
    }

    if (window.guestData && window.guestData.FullName) {
        $('#fullname').val(window.guestData.FullName);
    }

    if (!commentList) {
        return;
    }

    const isPrivateList = $(commentList).is('[private-list]');

    // Handle form submission
    $('#commentForm').on('submit', function (e) {
        e.preventDefault();
        if (isDemo) {
            $('#fullname').val('');
            $('#comment').val('');
            alert("Thiệp mẫu không thể bình luận");

            return;
        }
        const fullName = $('#fullname').val().trim();
        const comment = $('#comment').val().trim();

        if (!fullName || !comment) {
            alert('Vui lòng nhập đầy đủ tên và lời chúc!');
            return;
        }

        submitComment(fullName, comment);
    });

    // Function to submit new comment
    function submitComment(fullName, comment) {
        $.ajax({
            url: `${apiUrl}/api/comment`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                fullName: fullName,
                comment: comment,
                weddingId: weddingId
            }),
            success: function (response) {
                // Clear form
                $('#fullname').val('');
                $('#comment').val('');

                if (!isPrivateList) {
                    // Reload comments to show the new one
                    currentPage = 0;
                    allCommentsLoaded = false;
                    loadComments();
                }

                alert('Lời chúc của bạn đã được gửi thành công!');
            },
            error: function (xhr, status, error) {
                console.error('Error submitting comment:', error);
                alert('Có lỗi xảy ra, vui lòng thử lại!');
            }
        });
    }

    // Function to load comments
    function loadComments() {
        if (allCommentsLoaded) return;

        $.ajax({
            url: `${apiUrl}/api/comment`,
            type: 'GET',
            data: {
                weddingId: weddingId,
                start: currentPage * limit,
                limit: limit
            },
            success: function (response) {
                // Handle the response structure with items array
                const comments = response.items || [];
                totalComments = response.total || 0;

                if (comments.length === 0 && currentPage === 0) {
                    // No comments at all
                    commentList.html(`<div class="no-comments">${emptyListMessage}</div>`);
                    return;
                }

                if (comments.length === 0) {
                    allCommentsLoaded = true;
                    removeLoadMoreButton();
                    return;
                }

                displayComments(comments);

                // Check if we need to show "Load More" button
                const loadedCount = (currentPage * limit) + comments.length;
                if (loadedCount >= totalComments) {
                    allCommentsLoaded = true;
                    removeLoadMoreButton();
                } else {
                    currentPage++;
                    addLoadMoreButton();
                }
            },
            error: function (xhr, status, error) {
                console.error('Error loading comments:', error);
            }
        });
    }

    // Function to display comments
    function displayComments(comments) {
        //const commentList = $('#commentList');

        // Remove "no comments" message if it exists
        $('.no-comments').remove();

        // Clear existing comments if it's the first page
        if (currentPage === 0) {
            commentList.empty();
        }

        comments.forEach(comment => {
            const commentBox = `
                <div class="comment-box wow animate__animated animate__fadeInUp">
                    <div class="fullname">${escapeHtml(comment.fullName)}</div>
                    <div class="timestamp">${formatDate(comment.createdAt)}</div>
                    <div class="content">${escapeHtml(comment.comment)}</div>
                </div>
            `;
            commentList.append(commentBox);
        });

        // Initialize animations for new elements
        if (typeof WOW !== 'undefined') {
            new WOW().init();
        }
    }

    // Helper function to add load more button
    function addLoadMoreButton() {
        if (!$('#loadMoreBtn').length) {
            const loadMoreBtn = `
                <div class="comment-box view-more wow animate__animated animate__fadeInUp">
                    <button id="loadMoreBtn" class="btn btn-link">Xem thêm lời chúc <i class="bi bi-arrow-right-short"></i></button>
                </div>
            `;

            commentList.append(loadMoreBtn);

            $('#loadMoreBtn').on('click', function () {
                loadComments();
            });
        }
    }

    // Helper function to remove load more button
    function removeLoadMoreButton() {
        $('#loadMoreBtn').remove();
    }

    // Helper function to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Helper function to format date
    function formatDate(dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffTime / (1000 * 60));

        if (diffMinutes < 1) return 'Vừa xong';
        if (diffMinutes < 60) return `${diffMinutes} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;

        return date.toLocaleDateString('vi-VN');
    }

    if (isPrivateList) {
        commentList.html(`
        <div class="private-message">
            <i class="bi bi-chat-heart"></i> ${privateListMessage}
        </div>
        `);
        return;
    }

    // Load initial comments
    loadComments();
})