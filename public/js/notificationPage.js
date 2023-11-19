$(document).ready(() => {
    $.get('/api/notifications', (data) => {
        outputNotificationList(data, $(".resultsContainer"));
    })
})

$("#markNotificationsAsRead").click(() => markNotificationAsOpened());

function outputNotificationList(notifications, container) {
    notifications.forEach((notification) => {
        var html = createNotificationHtml(notification);
        container.append(html);
    })

    if (notifications.length == 0) {
        container.append("<span class='noResults'>No Chats Available</span>")
    }
}

function createNotificationHtml(notification) {
    var userFrom = notification.userFrom;
    var text = getNotificationText(notification);
    var href = getNotificationUrl(notification);

    var className = notification.opened ? "":"active";

    return `<a href='${href}' class='resultListItem notification ${className}' data-id='${notification._id}'>
                <div class='resultsImageContainer'>
                    <img src='${userFrom.profilePic}'>
                </div>                
                <div class='resultsDetailsContainer ellipsis'>
                    <span class='ellipsis'>${text}</span>
                </div>
            </a>`;
}

function getNotificationText(notification) {
    var userFrom = notification.userFrom;

    if (!userFrom.firstName || !userFrom.lastName) {
        return alert("userFrom is not populated!")
    }

    var userFromName = `${userFrom.firstName} ${userFrom.lastName}`;
    var text;

    if (notification.notificationType == "share") {
        text = `${userFromName} shared one of your posts!`;
    }
    else if (notification.notificationType == "postLike") {
        text = `${userFromName} liked one of your posts!`;
    }
    else if (notification.notificationType == "reply") {
        text = `${userFromName} replied to one of your posts!`;
    }
    else if (notification.notificationType == "follow") {
        text = `${userFromName} started to follow you!`;
    }

    return `<span class='ellipsis'>${text}</span>`;
}


function getNotificationUrl(notification) {
    var url;

    if (notification.notificationType == "postLike" || notification.notificationType == "share" || notification.notificationType == "reply") {
        url = `/posts/${notification.entityId}`;
    }
    else if (notification.notificationType == "follow") {
        url = `/profile/${notification.entityId}`;
    }

    return url;
}