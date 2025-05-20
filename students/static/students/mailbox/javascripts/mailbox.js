// const element = document.getElementById('pressable');
// let pressTimer = null;
// function startPressTimer() {
//   if (pressTimer === null) {
//     pressTimer = setTimeout(() => {
//       console.log('Element pressed continuously for 1.5 seconds');
//       pressTimer = null; // clear timer so it doesn't trigger repeatedly
//     }, 1500);
//   }
// }
// function cancelPressTimer() {
//   if (pressTimer !== null) {
//     clearTimeout(pressTimer);
//     pressTimer = null;
//   }
// } 
// // Mouse events
// element.addEventListener('mousedown', startPressTimer);

function addReactionPickerEvents() {
  document.querySelectorAll('.to-react').forEach(element => {
      let pressTimer = null;
      function startPressTimer() {
          if (pressTimer === null) {
              pressTimer = setTimeout(() => {
                  // Try to find .img-parent first, fallback to .post-container
                  let parent = element.closest('.img-parent');
                  let reactionPicker = parent ? parent.querySelector('.reaction-picker') : null;
                  if (!reactionPicker) {
                      parent = element.closest('.post-container');
                      reactionPicker = parent ? parent.querySelector('.reaction-picker') : null;
                  }
                  if (!reactionPicker) return;
                  reactionPicker.style.display = 'block';

                  reactionPicker.addEventListener('mouseleave', () => {
                      reactionPicker.style.display = 'none';
                  });

                  reactionPicker.querySelectorAll('.reaction').forEach(reaction => {
                      reaction.addEventListener('click', () => {
                          reactionPicker.style.display = 'none';
                          element.textContent = reaction.textContent;
                          // For comments/replies, update .img-parent; for posts, update .img-parent or .post-container
                          if (parent.classList.contains('img-parent')) {
                              const content = `
                                  <span class=\"to-react\">${reaction.textContent}</span>
                                  ${reaction.getAttribute("value")}
                                  <div class=\"reaction-picker\" style=\"display:none;\">
                                      <span class=\"reaction\" value=\"Like\">👍</span>
                                      <span class=\"reaction\" value=\"Love\">❤️</span>
                                      <span class=\"reaction\" value=\"Care\">🤗</span>
                                      <span class=\"reaction\" value=\"Sad\">😢</span>
                                      <span class=\"reaction\" value=\"Disgusted\">🤮</span>
                                  </div>
                              `;
                              parent.innerHTML = content;
                              addReactionPickerEvents();
                          }
                      });
                  });

                  pressTimer = null;
              }, 300);
          }
      }
      function cancelPressTimer() {
          if (pressTimer !== null) {
              let parent = element.closest('.img-parent');
              let reactionPicker = parent ? parent.querySelector('.reaction-picker') : null;
              if (!reactionPicker) {
                  parent = element.closest('.post-container');
                  reactionPicker = parent ? parent.querySelector('.reaction-picker') : null;
              }
              if (reactionPicker) reactionPicker.style.display = 'none';
              clearTimeout(pressTimer);
              pressTimer = null;
          }
      }
      element.addEventListener('mousedown', startPressTimer);
      element.addEventListener('mouseup', cancelPressTimer);
      element.addEventListener('mouseleave', cancelPressTimer);
  });
}

// Initial call to attach events
addReactionPickerEvents();

window.addEventListener('load', ()=>{
  console.log("loaded");
    // Select all textareas within the .post-row.comments class
    document.querySelectorAll('.post-row.comments textarea').forEach(textarea => {
      // Function to auto-resize the textarea
      function autoResize() {
        console.log("this is it");
        this.style.height = 'auto'; // Reset height
        this.style.height = this.scrollHeight + 'px'; // Set new height based on scrollHeight
      }
      // Initialize height on page load for any prefilled content
      autoResize.call(textarea);
      // Listen to input event to resize dynamically
      textarea.addEventListener('input', autoResize);
    });

    // Handle post input textarea separately
    const postTextarea = document.getElementById('post-input-text');
    if (postTextarea) {
        function autoResizePost() {
            postTextarea.style.height = 'auto';
            postTextarea.style.height = postTextarea.scrollHeight + 'px';
        }
        autoResizePost();
        postTextarea.addEventListener('input', autoResizePost);
    }

    desiredWidth = document.querySelector('.main-content').clientWidth;
    document.querySelector('.write-post-container').style.width = desiredWidth + 'px';

    document.querySelectorAll('.post-container').forEach(postContainer => {
      postContainer.style.width = desiredWidth + 'px';
    });
    document.querySelector('.mailbox-banner').style.width = desiredWidth + 'px';
    document.querySelector('.mailbox-description').style.width = desiredWidth + 'px';
    document.querySelector('.active-members').style.width = desiredWidth + 'px';
});

document.addEventListener('DOMContentLoaded', function() {
  const cancelButtons = document.querySelectorAll('.cancel-btn');
  
  cancelButtons.forEach(button => {
      button.addEventListener('click', function() {
          const textarea = this.closest('.comments').querySelector('textarea');
          textarea.value = '';
      });
  });
});

function truncatePostText() {
  document.querySelectorAll('.post-text').forEach(postText => {
      const fullText = postText.innerHTML;
      if (fullText.length <= 100) return;
      function getTruncated(text) {
          // Truncate without breaking HTML tags
          let div = document.createElement('div');
          div.innerHTML = text;
          let plain = div.textContent || div.innerText || '';
          if (plain.length <= 100) return text;
          let truncated = plain.slice(0, 100);
          return truncated + '... <span class="show-more" style="color:#1876f2;cursor:pointer;"><br>Show more...</span>';
      }
      function setTruncated() {
          postText.innerHTML = getTruncated(fullText);
          postText.querySelector('.show-more').onclick = function() {
              setExpanded();
          };
      }
      function setExpanded() {
          postText.innerHTML = fullText + ' <span class="show-less" style="color:#1876f2;cursor:pointer;"><br>Show less...</span>';
          postText.querySelector('.show-less').onclick = function() {
              setTruncated();
          };
      }
      setTruncated();
  });
}

function truncateCommentText() {
  document.querySelectorAll('.comment-text').forEach(commentText => {
      const fullText = commentText.innerHTML;
      if (fullText.length <= 100) return;
      function getTruncated(text) {
          let div = document.createElement('div');
          div.innerHTML = text;
          let plain = div.textContent || div.innerText || '';
          if (plain.length <= 100) return text;
          let truncated = plain.slice(0, 100);
          return truncated + '... <span class="show-more" style="color:#1876f2;cursor:pointer;"><br>Show more...</span>';
      }
      function setTruncated() {
          commentText.innerHTML = getTruncated(fullText);
          commentText.querySelector('.show-more').onclick = function() {
              setExpanded();
          };
      }
      function setExpanded() {
          commentText.innerHTML = fullText + ' <span class="show-less" style="color:#1876f2;cursor:pointer;"><br>Show less...</span>';
          commentText.querySelector('.show-less').onclick = function() {
              setTruncated();
          };
      }
      setTruncated();
  });
}

window.addEventListener('DOMContentLoaded', function() {
  truncatePostText();
  truncateCommentText();
});

// Lightbox for gallery images
(function() {
  // Collect all gallery images for each post
  document.querySelectorAll('.multi-image-gallery').forEach(gallery => {
      const images = Array.from(gallery.querySelectorAll('img'));
      images.forEach((img, idx) => {
          img.style.cursor = 'pointer';
          img.addEventListener('click', function() {
              openLightbox(images.map(i => i.src), idx);
          });
      });
  });

  function openLightbox(imageList, startIdx) {
      const lightbox = document.getElementById('image-lightbox');
      const lightboxImg = lightbox.querySelector('.lightbox-img');
      const closeBtn = lightbox.querySelector('.lightbox-close');
      const prevBtn = lightbox.querySelector('.lightbox-prev');
      const nextBtn = lightbox.querySelector('.lightbox-next');
      const counter = lightbox.querySelector('.lightbox-counter');
      let current = startIdx;

      function show(idx) {
          lightboxImg.src = imageList[idx];
          counter.textContent = (idx + 1) + ' / ' + imageList.length;
      }

      function showPrev() {
          current = (current - 1 + imageList.length) % imageList.length;
          show(current);
      }
      function showNext() {
          current = (current + 1) % imageList.length;
          show(current);
      }
      function close() {
          lightbox.classList.remove('active');
          lightbox.style.display = 'none';
      }

      show(current);
      lightbox.classList.add('active');
      lightbox.style.display = 'flex';

      prevBtn.onclick = showPrev;
      nextBtn.onclick = showNext;
      closeBtn.onclick = close;
      lightbox.onclick = function(e) {
          if (e.target === lightbox) close();
      };
      // Keyboard navigation
      document.onkeydown = function(e) {
          if (!lightbox.classList.contains('active')) return;
          if (e.key === 'ArrowLeft') showPrev();
          if (e.key === 'ArrowRight') showNext();
          if (e.key === 'Escape') close();
      };
  }
})();

// Report Popup Functionality
document.addEventListener('DOMContentLoaded', function() {
  const reportButtons = document.querySelectorAll('.post-row div:last-child');
  const reportPopup = document.getElementById('report-popup');
  const reportCancelBtn = document.querySelector('.report-cancel-btn');
  const reportSubmitBtn = document.querySelector('.report-submit-btn');
  const reportTextarea = document.querySelector('.report-popup-content textarea');

  // Open popup when report button is clicked
  reportButtons.forEach(button => {
      button.addEventListener('click', function() {
          if (this.querySelector('img[src*="share.png"]')) {
              reportPopup.classList.add('active');
              reportTextarea.value = ''; // Clear previous report text
          }
      });
  });

  // Close popup when cancel button is clicked
  reportCancelBtn.addEventListener('click', function() {
      reportPopup.classList.remove('active');
  });

  // Handle report submission
  reportSubmitBtn.addEventListener('click', function() {
      const reportText = reportTextarea.value.trim();
      if (reportText) {
          // Here you would typically send the report to your backend
          alert('Thank you for your report. We will review it shortly.');
          reportPopup.classList.remove('active');
      } else {
          alert('Please enter report details before submitting.');
      }
  });

  // Close popup when clicking outside
  reportPopup.addEventListener('click', function(e) {
      if (e.target === reportPopup) {
          reportPopup.classList.remove('active');
      }
  });

  // Close popup when pressing Escape key
  document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && reportPopup.classList.contains('active')) {
          reportPopup.classList.remove('active');
      }
  });
});

// Reply Popup Functionality
document.addEventListener('DOMContentLoaded', function() {
  const replyLinks = document.querySelectorAll('.comment-reply');
  const replyPopup = document.getElementById('reply-popup');
  const replyCancelBtn = document.querySelector('.reply-cancel-btn');
  const replySubmitBtn = document.querySelector('.reply-submit-btn');
  const replyTextarea = document.querySelector('.reply-popup-content textarea');
  let currentCommentBox = null;

  // Auto-resize textarea
  function autoResizeTextarea(textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = (textarea.scrollHeight) + 'px';
  }

  // Initialize textarea height
  autoResizeTextarea(replyTextarea);

  // Handle textarea input
  replyTextarea.addEventListener('input', function() {
      autoResizeTextarea(this);
  });

  // Open popup when reply link is clicked
  replyLinks.forEach(link => {
      link.addEventListener('click', function(e) {
          e.preventDefault();
          currentCommentBox = this.closest('.comment-box');
          replyPopup.classList.add('active');
          replyTextarea.value = ''; // Clear previous reply text
          autoResizeTextarea(replyTextarea);
      });
  });

  // Close popup when cancel button is clicked
  replyCancelBtn.addEventListener('click', function() {
      replyPopup.classList.remove('active');
      currentCommentBox = null;
  });

  // Handle reply submission
  replySubmitBtn.addEventListener('click', function() {
      const replyText = replyTextarea.value.trim();
      if (replyText && currentCommentBox) {
          // Create new reply element
          const replyRow = document.createElement('div');
          replyRow.className = 'comment-row reply';
          replyRow.innerHTML = `
              <div class="comment-avatar-col">
                  <div class="comment-connector-vertical"></div>
                  <div class="comment-avatar">
                      <img src="images/profile-pic.png" alt="profile" />
                  </div>
              </div>
              <div class="comment-box">
                  <div class="comment-header">
                      <span class="comment-author">Vasudev Adhikari</span>
                      <span class="comment-time">Just now</span>
                  </div>
                  <div class="comment-text">
                      ${replyText}
                  </div>
                  <div class="comment-footer">
                      <span class="img-parent">
                          <img src="images/like.png" class="to-react">React
                          <div class="reaction-picker">
                              <span class="reaction" value="Like">👍</span>
                              <span class="reaction" value="Love">❤️</span>
                              <span class="reaction" value="Care">🤗</span>
                              <span class="reaction" value="Sad">😢</span>
                              <span class="reaction" value="Disgusted">🤮</span>
                          </div>
                      </span>
                      <a href="#" class="comment-reply">Reply</a>
                  </div>
              </div>
          `;

          // Insert the new reply after the current comment
          currentCommentBox.parentElement.insertAdjacentElement('afterend', replyRow);
          
          // Reattach event listeners for the new reply
          addReactionPickerEvents();
          
          // Close popup and reset
          replyPopup.classList.remove('active');
          currentCommentBox = null;
      } else {
          alert('Please enter your reply before submitting.');
      }
  });

  // Close popup when clicking outside
  replyPopup.addEventListener('click', function(e) {
      if (e.target === replyPopup) {
          replyPopup.classList.remove('active');
          currentCommentBox = null;
      }
  });

  // Close popup when pressing Escape key
  document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && replyPopup.classList.contains('active')) {
          replyPopup.classList.remove('active');
          currentCommentBox = null;
      }
  });
});

// Post Creation with Media Upload
document.addEventListener('DOMContentLoaded', function() {
  const postTextarea = document.querySelector('.post-input-container textarea');
  const postButtons = document.querySelector('.post-buttons');
  const mediaPreview = document.querySelector('.selected-media-preview');
  const videoInput = document.querySelector('.video-upload input');
  const photoInput = document.querySelector('.photo-upload input');
  const postCancelBtn = document.querySelector('.post-cancel-btn');

  let selectedMedia = [];

  // Show/hide post buttons based on textarea content
  postTextarea.addEventListener('input', function() {
      if (this.value.trim() || selectedMedia.length > 0) {
          postButtons.style.display = 'flex';
      } else {
          postButtons.style.display = 'none';
      }
  });

  // Handle video upload
  videoInput.addEventListener('change', function(e) {
      const files = Array.from(e.target.files);
      files.forEach(file => {
          if (file.type.startsWith('video/')) {
              const videoUrl = URL.createObjectURL(file);
              selectedMedia.push({
                  type: 'video',
                  file: file,
                  url: videoUrl
              });
              addMediaPreview(videoUrl, 'video');
          }
      });
      if (selectedMedia.length > 0) {
          postButtons.style.display = 'flex';
      }
  });

  // Handle photo upload
  photoInput.addEventListener('change', function(e) {
      const files = Array.from(e.target.files);
      files.forEach(file => {
          if (file.type.startsWith('image/')) {
              const imageUrl = URL.createObjectURL(file);
              selectedMedia.push({
                  type: 'image',
                  file: file,
                  url: imageUrl
              });
              addMediaPreview(imageUrl, 'image');
          }
      });
      if (selectedMedia.length > 0) {
          postButtons.style.display = 'flex';
      }
  });

  // Add media preview
  function addMediaPreview(url, type) {
      const mediaItem = document.createElement('div');
      mediaItem.className = 'media-item';
      
      if (type === 'video') {
          const video = document.createElement('video');
          video.src = url;
          video.controls = true;
          mediaItem.appendChild(video);
      } else {
          const img = document.createElement('img');
          img.src = url;
          mediaItem.appendChild(img);
      }

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-media';
      removeBtn.innerHTML = '×';
      removeBtn.onclick = function() {
          const index = selectedMedia.findIndex(media => media.url === url);
          if (index > -1) {
              URL.revokeObjectURL(selectedMedia[index].url);
              selectedMedia.splice(index, 1);
          }
          mediaItem.remove();
          if (selectedMedia.length === 0 && !postTextarea.value.trim()) {
              postButtons.style.display = 'none';
          }
      };
      mediaItem.appendChild(removeBtn);
      mediaPreview.appendChild(mediaItem);
  }

  // Handle post cancellation
  postCancelBtn.addEventListener('click', function() {
      postTextarea.value = '';
      selectedMedia.forEach(media => URL.revokeObjectURL(media.url));
      selectedMedia = [];
      mediaPreview.innerHTML = '';
      postButtons.style.display = 'none';
  });
});
