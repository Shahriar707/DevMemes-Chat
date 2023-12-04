var cropper; 
var timer;
var selectedUsers = [];

// Post

$("#postTextarea, #replyTextarea").keyup((event) =>{
    var textbox = $(event.target);
    var value = textbox.val().trim();

    var isModal = textbox.parents(".modal").length == 1;
    
    var submitButton = isModal ? $("#submitReplyButton") : $("#submitPostButton");

    if (submitButton.length == 0) {
        return alert("No post has been found!");
    }

    if (value == "") {
        submitButton.prop("disabled", true);
        return; 
    }

    submitButton.prop("disabled", false);
})

// Post Submit

$("#submitPostButton, #submitReplyButton").click((event) => {
    var button = $(event.target);

    var isModal = button.parents(".modal").length == 1;

    var textbox = isModal ? $("#replyTextarea") : $("#postTextarea");

    var data = {
        content: textbox.val()
    }

    if (isModal) {
        var id = button.data().id;
        if (id == null) return alert("id is null");
        data.replyTo = id;
    }

    $.post("/api/posts", data, (postData) => {

        if (postData.replyTo) {
            location.reload();
        }
        else {
            var html = createPostHtml(postData);
            $(".postsContainer").prepend(html);
            textbox.val("");
            button.prop("disabled", true);
        }
    })
})

$("#replyModal").on("show.bs.modal", (event) => {
    var button = $(event.relatedTarget);
    var postId = getPostIdFromElement(button);
    $("#submitReplyButton").data("id", postId);

    $.get("/api/posts/" + postId, (results) => {
        outputPosts(results.postData, $("#originalPostContainer"));
    })
})

$("#replyModal").on("hidden.bs.modal", (event) => { $("#originalPostContainer").html("") })

$("#deletePostModal").on("show.bs.modal", (event) => {
    var button = $(event.relatedTarget);
    var postId = getPostIdFromElement(button);
    $("#deletePostButton").data("id", postId);
})


$("#deletePostButton").click((event) => {
    var postId = $(event.target).data("id");

    $.ajax({
        url: `/api/posts/${postId}`,
        type: "DELETE",
        success: () => {
            location.reload();
        }
    })
})


$("#filePhoto").change(function() {
    
    if (this.files && this.files[0]) {
        var reader = new FileReader();
        reader.onload = (event) => {
            $("#imagePreview").attr("src", event.target.result)

            if (cropper !== undefined) {
                cropper.destroy();
            }

            cropper = new Cropper($("#imagePreview")[0], {
                aspectRatio: 1/1,
                background: false
            });
        }
        reader.readAsDataURL(this.files[0]);
    }
    else {
        console.log("No!")
    }
});

$("#imageUploadButton").click(() => {
    var canvas = cropper.getCroppedCanvas();

    if (canvas == null) {
        alert("Sorry you can't upload this file as an image");
        return;
    }

    canvas.toBlob((blob) => {
        var formData = new FormData();
        formData.append("croppedImage", blob);
        
        $.ajax({
            url: "/api/users/profilePicture",
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: () => { location.reload(); }
        })
    })
})

$("#coverPhoto").change(function() {
    
    if (this.files && this.files[0]) {
        var reader = new FileReader();
        reader.onload = (event) => {
            $("#coverPreview").attr("src", event.target.result)

            if (cropper !== undefined) {
                cropper.destroy();
            }

            cropper = new Cropper($("#coverPreview")[0], {
                aspectRatio: 16/9,
                background: false
            });
        }
        reader.readAsDataURL(this.files[0]);
    }
    else {
        console.log("No!")
    }
});

$("#coverPhotoButton").click(() =>{
    var canvas = cropper.getCroppedCanvas();

    if (canvas == null) {
        alert("Sorry you can't upload this file as an image");
        return;
    }

    canvas.toBlob((blob) => {
        var formData = new FormData();
        formData.append("croppedImage", blob);
        
        $.ajax({
            url: "/api/users/coverPhoto",
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: () => { location.reload(); }
        })
    })
})

$("#confirmPinModal").on("show.bs.modal", (event) => {
    var button = $(event.relatedTarget);
    var postId = getPostIdFromElement(button);
    $("#pinPostButton").data("id", postId);  
})

$("#pinPostButton").click((event) => {
    var postId = $(event.target).data("id");

    $.ajax({
        url: `/api/posts/${postId}`,
        type: "PUT",
        data: { pinned: true },
        success: (data, status, xhr) => {
            if (xhr.status != 204) {
                alert("Couldn't pin post!");
                return;
            }
            location.reload();
        }
    })
})

$("#unpinModal").on("show.bs.modal", (event) => {
    var button = $(event.relatedTarget);
    var postId = getPostIdFromElement(button);
    $("#unpinPostButton").data("id", postId);  
})

$("#unpinPostButton").click((event) => {
    var postId = $(event.target).data("id");

    $.ajax({
        url: `/api/posts/${postId}`,
        type: "PUT",
        data: { pinned: false },
        success: (data, status, xhr) => {
            if (xhr.status != 204) {
                alert("Couldn't pin post!");
                return;
            }
            location.reload();
        }
    })
})

$("#userSearchTextBox").keydown((event) => {
    clearTimeout(timer);
    var textbox = $(event.target);
    var value = textbox.val();

    if (value == "" && (event.which == 8 || event.keyCode == 8)) {
        selectedUsers.pop();
        updateSelectedUserHtml()
        $(".resultsContainer").html("");

        if (selectedUsers.length == 0) {
            $("#createChatButton").prop("disabled", true);
        }
    }

    timer = setTimeout(() => {
        value = textbox.val().trim();

        if (value == ""){
            $(".resultsContainer").html("");
        } else {
            searchUsers(value);
        }
    }, 1000)
})

$("#createChatButton").click(() =>{
    var data = JSON.stringify(selectedUsers);

    $.post("/api/chats", { users:data }, chat => {
        if (!chat || !chat._id) return alert("Invalid Response!");

        window.location.href = `/messages/${chat._id}`;
    })
})


// document handler

// Like button

$(document).on("click", ".likeButton", (event) => {
    var button = $(event.target);
    var postId = getPostIdFromElement(button);
    
    if (postId === undefined) return;

    $.ajax({
        url: `/api/posts/${postId}/like`,
        type: "PUT",
        success: (postData) => {
            button.find("span").text(postData.likes.length || "");

            if (postData.likes.includes(userLoggedIn._id)){
                button.addClass("active");
            }
            else{
                button.removeClass("active");
            }
        }
    })
})

// share button

$(document).on("click", ".shareButton", (event) => {
    var button = $(event.target);
    var postId = getPostIdFromElement(button);
    
    if (postId === undefined) return;

    $.ajax({
        url: `/api/posts/${postId}/share`,
        type: "POST",
        success: (postData) => {
            button.find("span").text(postData.shareUsers.length || "");

            if (postData.shareUsers.includes(userLoggedIn._id)){
                button.addClass("active");
            }
            else{
                button.removeClass("active");
            }
        }
    })
})

// post

$(document).on("click", ".post", (event) => {
    var element = $(event.target);
    var postId = getPostIdFromElement(element);

    if (postId !== undefined && !element.is("button")) {
        window.location.href = '/posts/' + postId
    }
})


$(document).on("click", ".followButton", (event) => { 
    var button = $(event.target);
    var userId = button.data().user;

    $.ajax({
        url: `/api/users/${userId}/follow`,
        type: "PUT",
        success: (data, status, xhr) => {
            
            if(xhr.status == 404){
                alert("User not found");
                return
            }

            var difference = 1;

            if (data.following && data.following.includes(userId)){
                button.addClass("following");
                button.text("Following");
            }
            else{
                button.removeClass("following");
                button.text("Follow");
                difference = -1;
            }

            var followersLabel = $("#followersValue");
            if (followersLabel !== 0) {
                var followersText = followersLabel.text();
                followersText = parseInt(followersText);
                followersLabel.text(followersText + difference);
            }
        }
    })
});


$(document).on("click", ".notification.active", (event) => {
    var container = $(event.target);
    var notificationId = container.data().id;
    var href = container.attr("href");
    event.preventDefault();

    var callback = () => {
        window.location = href; 
    }
    markNotificationAsOpened(notificationId, callback);
})


// functions 

function timeDifference(current, previous) {

    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - previous;

    if (elapsed < msPerMinute) {
         if (elapsed/1000 < 30) return "Just now"; 
         return Math.round(elapsed/1000) + ' seconds ago';   
    }

    else if (elapsed < msPerHour) {
         return Math.round(elapsed/msPerMinute) + ' minutes ago';   
    }

    else if (elapsed < msPerDay ) {
         return Math.round(elapsed/msPerHour ) + ' hours ago';   
    }

    else if (elapsed < msPerMonth) {
        return Math.round(elapsed/msPerDay) + ' days ago';   
    }

    else if (elapsed < msPerYear) {
        return Math.round(elapsed/msPerMonth) + ' months ago';   
    }

    else {
        return Math.round(elapsed/msPerYear ) + ' years ago';   
    }
}


function getPostIdFromElement(element) {
    var isRoot = element.hasClass('post');
    var rootElement = isRoot ? element : element.closest(".post");
    var postId = rootElement.data().id;

    if (postId === undefined) return alert("Post ID Undefined");

    return postId;
}

function outputPosts(results, container){

    container.html("");

    // if (!Array.isArray(results)) {
    //     results = [results];
    // }

    results.forEach(result => {
        var html = createPostHtml(result);
        container.append(html);        
    });

    if (results.length == 0) {
        container.append("<span>Nothing to show</span>")
    }

}

function outputPinnedPost(results, container){
    if (results.length == 0) {
        container.hide();
        return; 
    }

    container.html("");

    results.forEach(result => {
        var html = createPostHtml(result);
        container.append(html);        
    });

}

function outputPostsWithReplies(results, container){

    container.html("");

    if (results.replyTo !== undefined && results.replyTo._id !== undefined) {
        var html = createPostHtml(results.replyTo);
        container.append(html);
    }

    var mainPostHtml = createPostHtml(results.postData, true);
    container.append(mainPostHtml);

    results.replies.forEach(result => {
        var html = createPostHtml(result);
        container.append(html);        
    });

}

function outputUsers(results, container) {
    container.html("");

    results.forEach( result => {
        var html = createUserHtml(result, true);
        container.append(html);
    })

    if (results.length == 0) {
        container.append("<span class='noResults'>No results found</span>")
    }
}

function createUserHtml(userData, showFollowButton) {

    var name = userData.firstName + "" + userData.lastName;

    var isFollowing = userLoggedIn.following && userLoggedIn.following.includes(userData._id);

    var text = isFollowing ? "Following" : "Follow"
    var buttonClass = isFollowing ? "followButton following" : "followButton"
    
    var followButton = "";
    if(showFollowButton && userLoggedIn._id != userData._id) {
        var followButton = `<div class='followButtonContainer'>
                            <button class='${buttonClass}' data-user='${userData._id}'>${text}</button>
                            </div>`;
    }

    return `<div class='user'>
                <div class='userImageContainer'>
                    <img src='${userData.profilePic}'>
                </div>
                <div class=userDetailsContainer>
                    <div class='header'>
                        <a href='/profile/${userData.username}'>${name}</a>
                        <span class='username'>@${userData.username}</span>
                    </div>
                </div>
                ${followButton}
            </div>`;
}

function createPostHtml(postData, largeFont = false) {

    if (postData == null) return alert('Post data can not be empty!');

    var isShare = postData.shareData != undefined;
    var sharedBy = isShare ? postData.postedBy.username : null;
    postData = isShare ? postData.shareData : postData;

    var postedBy = postData.postedBy;
    var displayName = postedBy.firstName + " " + postedBy.lastName;
    var timestamp = timeDifference(new Date(), new Date(postData.createdAt));

    var likeButtonActiveClass = postData.likes.includes(userLoggedIn._id) ? "active" : ""
    var shareButtonActiveClass = postData.shareUsers.includes(userLoggedIn._id) ? "active" : ""
    var largeFontClass = largeFont ? "largeFont" : "";

    var sharedText = "";
    if (isShare) {
        sharedText = `<span>
                        <i class="fa-solid fa-share"></i>
                        Shared by <a href='/profile/${sharedBy}'>@${sharedBy}</a>
                    </span>`
    } 
    
    var replyFlag = "";
    if (postData.replyTo && postData.replyTo._id) {
        if (!postData.replyTo._id){
            return alert("Reply is not populated");
        }
        else if (!postData.replyTo.postedBy._id){
            return alert("Posted by is not populated");
        }

        var replyToUsername = postData.replyTo.postedBy.username;
        replyFlag = `<div class='replyFlag'>
                        Replying to <a href='/profile/${replyToUsername}'>@${replyToUsername}</a>
                    </div>`;
    }

    var buttons = "";
    var pinnedPostText = "";
    if (postData.postedBy._id == userLoggedIn._id) {

        var pinnedClass = ""
        var dataTarget = "#confirmPinModal"
        if (postData.pinned === true) {
            pinnedClass = "active";
            dataTarget = "#unpinModal";
            pinnedPostText = "<i class='fas fa-thumbtack'></i> <span>Pinned post</span>";
        }

        buttons = ` <button class='pinButton ${pinnedClass}' data-id="${postData._id}" data-toggle="modal" data-target="${dataTarget}"><i class="fas fa-thumbtack"></i></button>
        
                    <button data-id="${postData._id}" data-toggle="modal" data-target="#deletePostModal"><i class="fa-solid fa-trash"></i></button>`
    }

    return `<div class='post ${largeFontClass}' data-id='${postData._id}'>
                <div class='postActionContainer'>
                    ${sharedText}
                </div>
                <div class='mainContentContainer'>
                    <div class='userImageContainer'>
                        <img src='${postedBy.profilePic}'>
                    </div>
                
                    <div class='postContentContainer'>
                        <div class='pinnedPostText'>${pinnedPostText}</div>
                        <div class='header'>
                            <a href='/profile/${postedBy.username}' class='displayName'>${displayName}</a>
                            <span class='username'>@${displayName}</span>
                            <span class='date'>${timestamp}</span>
                            ${buttons}
                        </div>
                        ${replyFlag}
                        <div class='postBody'>
                            <span>${postData.content}</span>
                        </div>
                        <div class='postFooter'>
                            <div class='postButtonContainer blue'>
                                <button class='likeButton ${likeButtonActiveClass}'>
                                    <i class="fa-solid fa-thumbs-up"></i>
                                    <span>${postData.likes.length || ""}</span>
                                </button>
                            </div>
                            <div class='postButtonContainer'>
                                <button data-toggle='modal' data-target='#replyModal'>
                                    <i class="fa-solid fa-comment-dots"></i>
                                </button>
                            </div>
                            <div class='postButtonContainer green'>
                                <button class='shareButton ${shareButtonActiveClass}'>
                                    <i class="fa-solid fa-share"></i>
                                    <span>${postData.shareUsers.length || ""}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
}

function outputSelectableUsers(results, container) {
    container.html("");

    results.forEach( result => {
        if (result._id == userLoggedIn._id || selectedUsers.some(user => user._id == result._id)) {
            return;
        }

        var html = createUserHtml(result, false);
        var element = $(html);
        element.click(() => userSelected(result));
        container.append(element);
    })

    if (results.length == 0) {
        container.append("<span class='noResults'>No results found</span>")
    }
}

function searchUsers(searchTerm) {
    $.get("/api/users", { search:searchTerm }, (results) => {
        outputSelectableUsers(results, $(".resultsContainer"));
    })
}

function userSelected(user) {
    selectedUsers.push(user);
    updateSelectedUserHtml()
    $("#userSearchTextBox").val("").focus();
    $(".resultsContainer").html("");
    $("#createChatButton").prop("disabled", false);
}

function updateSelectedUserHtml() {
    var element = [];
    selectedUsers.forEach((user) => {
        var name = user.firstName + " " + user.lastName;
        var userElement = $(`<span class='selectedUser'>${name}</span>`);
        element.push(userElement);
    })

    $(".selectedUser").remove();
    $("#selectedUsers").prepend(element);
}

function getChatName(chatData) {
    var chatName = chatData.chatName;

    if(!chatName) {
        var otherChatUsers = getOtherChatUsers(chatData.users);
        var namesArray = otherChatUsers.map(user => user.firstName + " " + user.lastName);
        chatName = namesArray.join(", ");
    }
    return chatName;
}

function getOtherChatUsers(users) {
    if (users.length == 1){
        return users;
    }

    return users.filter(user => user.id != userLoggedIn._id);
}

function messageReceived(newMessage) {
    if ($(".chatContainer").length == 0) {

    }
    else {
        addChatMessageHtml(newMessage);
    }
}

function markNotificationAsOpened(notificationId = null, callback = null) {
    if (callback == null) {
        callback = () => {
            location.reload();
        }
    }

    var url = notificationId != null ? `/api/notifications/${notificationId}/markAsOpened`:`/api/notifications/markAsOpened`;

    $.ajax({
        url: url,
        type: "PUT",
        success: () => callback()
    })
}
