/**
 * port-redirect.js
 * Tự động chuyển hướng sang cổng 5000 (Express server) nếu người dùng
 * mở trang qua Live Server (5500) hoặc bất kỳ cổng sai nào khác.
 *
 * Lưu ý: Script này PHẢI được đặt là thẻ <script> ĐẦU TIÊN trong <head>
 * để chạy trước mọi code khác.
 */
(function () {
    var CORRECT_PORT = '5000';
    var loc = window.location;

    // Chỉ redirect khi chạy trên localhost và sai cổng
    // (không ảnh hưởng khi deploy production)
    if (
        loc.protocol === 'http:' &&
        (loc.hostname === 'localhost' || loc.hostname === '127.0.0.1') &&
        loc.port !== CORRECT_PORT
    ) {
        var targetUrl = 'http://localhost:' + CORRECT_PORT + loc.pathname + loc.search + loc.hash;
        window.location.replace(targetUrl);
    }
})();
