$(document).ready(() => {
    $.get("/api/threads", (results) => {
        outputPostsWithReplies(results, $(".postsContainer"));
    })
})