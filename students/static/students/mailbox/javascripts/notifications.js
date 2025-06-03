// Notifications modal logic with viewing tracking
let notificationTimers = new Map(); // Track viewing timers for each notification
let notificationObserver = null; // Intersection observer for tracking visibility

function showNotificationsModal() {
  const overlay = document.getElementById('notificationsOverlay');
  if (overlay) {
    overlay.style.display = 'flex';
    overlay.classList.add('active');

    // Start tracking notification viewing
    startNotificationTracking();
  }
}

function closeNotificationsModal() {
  const overlay = document.getElementById('notificationsOverlay');
  if (overlay) {
    overlay.style.display = 'none';
    overlay.classList.remove('active');

    // Stop tracking and clear timers
    stopNotificationTracking();
  }
}

// Attach close button
document.addEventListener('DOMContentLoaded', function() {
  const overlay = document.getElementById('notificationsOverlay');
  if (!overlay) return;

  const closeBtn = overlay.querySelector('.close-notifications-btn');
  if (closeBtn) {
    closeBtn.onclick = closeNotificationsModal;
  }
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeNotificationsModal();
  });

  // Enhanced notification click handling with seen tracking
  setupNotificationClickHandlers();
});

// Setup click handlers for notifications
function setupNotificationClickHandlers() {
  const overlay = document.getElementById('notificationsOverlay');
  if (!overlay) return;

  overlay.querySelectorAll('.notification-item').forEach(item => {
    item.onclick = function() {
      const notificationId = item.getAttribute('data-notification-id');
      const isSeen = item.getAttribute('data-seen') === 'true';

      // Mark as seen immediately when clicked
      if (!isSeen && notificationId) {
        markNotificationAsSeen(notificationId, item);
      }

      // Navigate to the content
      const type = item.getAttribute('data-type');
      const id = item.getAttribute('data-id');
      closeNotificationsModal();

      if (type === 'post') {
        // Scroll to or open the post with this id
        const postElem = document.querySelector(`[data-post-id="${id}"]`);
        if (postElem) {
          postElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          postElem.classList.add('highlight-notification');
          setTimeout(() => postElem.classList.remove('highlight-notification'), 2000);
        } else {
          // Optionally, load the post if not present
          window.location.href = `/students/manage_posts/#${id}`;
        }
      } else if (type === 'comment') {
        // Scroll to or open the comment with this id
        const commentElem = document.querySelector(`[data-comment-id="${id}"]`);
        if (commentElem) {
          commentElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          commentElem.classList.add('highlight-notification');
          setTimeout(() => commentElem.classList.remove('highlight-notification'), 2000);
        } else {
          // Optionally, load the post/comment if not present
          window.location.href = `/students/manage_posts/?highlight_comment=${id}`;
        }
      }
    };
  });
}

// Start tracking notification viewing
function startNotificationTracking() {
  // Clear any existing timers
  stopNotificationTracking();

  // Get all unseen notifications
  const unseenNotifications = document.querySelectorAll('.notification-item.unseen');

  // Set up intersection observer to track when notifications are in view
  if ('IntersectionObserver' in window) {
    notificationObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const notificationItem = entry.target;
        const notificationId = notificationItem.getAttribute('data-notification-id');

        if (entry.isIntersecting && notificationId) {
          // Notification is visible, start timer
          startViewingTimer(notificationId, notificationItem);
        } else if (notificationId) {
          // Notification is not visible, clear timer
          clearViewingTimer(notificationId, notificationItem);
        }
      });
    }, {
      threshold: 0.5, // Trigger when 50% of notification is visible
      rootMargin: '0px'
    });

    // Observe all unseen notifications
    unseenNotifications.forEach(notification => {
      notificationObserver.observe(notification);
    });
  } else {
    // Fallback for browsers without IntersectionObserver
    // Start timers for all visible notifications
    unseenNotifications.forEach(notification => {
      const notificationId = notification.getAttribute('data-notification-id');
      if (notificationId) {
        startViewingTimer(notificationId, notification);
      }
    });
  }
}

// Stop tracking and clear all timers
function stopNotificationTracking() {
  // Clear all timers
  notificationTimers.forEach((timer, notificationId) => {
    clearTimeout(timer.timeoutId);
    const notificationItem = document.querySelector(`[data-notification-id="${notificationId}"]`);
    if (notificationItem) {
      notificationItem.classList.remove('viewing');
    }
  });
  notificationTimers.clear();

  // Disconnect observer
  if (notificationObserver) {
    notificationObserver.disconnect();
    notificationObserver = null;
  }
}

// Start viewing timer for a specific notification
function startViewingTimer(notificationId, notificationItem) {
  // Don't start timer if already exists or notification is already seen
  if (notificationTimers.has(notificationId) || notificationItem.classList.contains('seen')) {
    return;
  }

  // Add viewing indicator
  notificationItem.classList.add('viewing');

  // Start 4-second timer
  const timeoutId = setTimeout(() => {
    markNotificationAsSeen(notificationId, notificationItem);
  }, 4000);

  notificationTimers.set(notificationId, {
    timeoutId: timeoutId,
    startTime: Date.now()
  });
}

// Clear viewing timer for a specific notification
function clearViewingTimer(notificationId, notificationItem) {
  const timer = notificationTimers.get(notificationId);
  if (timer) {
    clearTimeout(timer.timeoutId);
    notificationTimers.delete(notificationId);
    notificationItem.classList.remove('viewing');
  }
}

// Mark notification as seen via AJAX
async function markNotificationAsSeen(notificationId, notificationItem) {
  try {
    // Clear any existing timer for this notification
    clearViewingTimer(notificationId, notificationItem);

    // Add marking animation
    notificationItem.classList.add('marking-seen');

    // Send AJAX request to mark as seen
    const response = await fetch('/students/mark_notification_seen/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
      },
      body: JSON.stringify({
        notification_id: notificationId
      })
    });

    const data = await response.json();

    if (data.status === 'success') {
      // Update UI to reflect seen status
      updateNotificationToSeen(notificationItem);

      // Update notification count in the bell icon
      updateNotificationCount();

      console.log(`Notification ${notificationId} marked as seen`);
    } else {
      console.error('Failed to mark notification as seen:', data.message);
      // Remove marking animation on failure
      notificationItem.classList.remove('marking-seen');
    }

  } catch (error) {
    console.error('Error marking notification as seen:', error);
    // Remove marking animation on error
    notificationItem.classList.remove('marking-seen');
  }
}

// Update notification UI to seen state
function updateNotificationToSeen(notificationItem) {
  // Remove unseen classes and add seen class
  notificationItem.classList.remove('unseen', 'viewing');
  notificationItem.classList.add('seen');

  // Update data attribute
  notificationItem.setAttribute('data-seen', 'true');

  // Remove unseen indicator
  const unseenIndicator = notificationItem.querySelector('.unseen-indicator');
  if (unseenIndicator) {
    unseenIndicator.remove();
  }

  // Remove marking animation after delay
  setTimeout(() => {
    notificationItem.classList.remove('marking-seen');
  }, 600);
}

// Update notification count in bell icon
function updateNotificationCount() {
  const notificationCountElement = document.querySelector('.manage-count-notification');
  if (notificationCountElement) {
    const currentCount = parseInt(notificationCountElement.textContent) || 0;
    const newCount = Math.max(0, currentCount - 1);
    notificationCountElement.textContent = newCount;

    // Add animation to show count change
    notificationCountElement.style.animation = 'none';
    setTimeout(() => {
      notificationCountElement.style.animation = 'pulse 0.3s ease-out';
    }, 10);
  }
}

// Utility function to mark all notifications as seen
async function markAllNotificationsAsSeen() {
  try {
    const response = await fetch('/students/mark_all_notifications_seen/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
      }
    });

    const data = await response.json();

    if (data.status === 'success') {
      // Update all unseen notifications in UI
      const unseenNotifications = document.querySelectorAll('.notification-item.unseen');
      unseenNotifications.forEach(notification => {
        updateNotificationToSeen(notification);
      });

      // Reset notification count
      const notificationCountElement = document.querySelector('.manage-count-notification');
      if (notificationCountElement) {
        notificationCountElement.textContent = '0';
      }

      console.log(`${data.updated_count} notifications marked as seen`);
      return true;
    } else {
      console.error('Failed to mark all notifications as seen:', data.message);
      return false;
    }

  } catch (error) {
    console.error('Error marking all notifications as seen:', error);
    return false;
  }
}
