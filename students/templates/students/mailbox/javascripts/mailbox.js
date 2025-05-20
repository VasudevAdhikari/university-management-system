// Sample data for posts and comments
const posts = [
  {
    id: 1,
    user: {
      name: "Elena Gilbert",
      avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&h=100"
    },
    time: "3h ago",
    text: "Absolutely loving this sunny weather! ☀️ Ready for a beach day later.",
    image: "https://images.pexels.com/photos/457882/pexels-photo-457882.jpeg?auto=compress&cs=tinysrgb&h=720",
    likes: 15,
    liked: false,
    comments: [
      {
        user: { name: "Stefan Salvatore", avatar: "https://images.pexels.com/photos/123456/pexels-photo-123456.jpeg?auto=compress&cs=tinysrgb&h=100" },
        text: "Sounds fun! Enjoy your day! 😊",
        reactions: { like: 2, love: 1 },
        replies: []
      },
      {
        user: { name: "Bonnie Bennett", avatar: "https://images.pexels.com/photos/654321/pexels-photo-654321.jpeg?auto=compress&cs=tinysrgb&h=100" },
        text: "Wish I could join! 🌊",
        reactions: { like: 3, care: 2 },
        replies: [
          {
            user: { name: "Caroline Forbes", avatar: "https://images.pexels.com/photos/247322/pexels-photo-247322.jpeg?auto=compress&cs=tinysrgb&h=100" },
            text: "Next time for sure! 😄",
            reactions: { like: 1 },
            replies: []
          }
        ]
      }
    ]
  },
  {
    id: 2,
    user: {
      name: "Damian Salvatore",
      avatar: "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&h=100"
    },
    time: "Yesterday",
    text: "Just finished a great workout session 💪 Feeling energized!",
    image: null,
    likes: 23,
    liked: false,
    comments: []
  },
  {
    id: 3,
    user: {
      name: "Caroline Forbes",
      avatar: "https://images.pexels.com/photos/247322/pexels-photo-247322.jpeg?auto=compress&cs=tinysrgb&h=100"
    },
    time: "2d ago",
    text: "Watched an amazing movie last night 🍿 Highly recommended.",
    image: "https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg?auto=compress&cs=tinysrgb&h=720",
    likes: 41,
    liked: true,
    comments: [
      {
        user: { name: "Elena Gilbert", avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&h=100" },
        text: "I loved that movie too! 😍",
        reactions: { like: 5, love: 3 },
        replies: []
      }
    ]
  }
];

const feedContainer = document.getElementById('feed-container');

// Generate post DOM elements from data
function createPostElement(post) {
  const article = document.createElement('article');
  article.classList.add('post');
  article.setAttribute('tabindex', '0');
  article.setAttribute('aria-label', `Post by ${post.user.name}, posted ${post.time}`);

  // Post header
  const postHeader = document.createElement('header');
  postHeader.classList.add('post-header');

  const avatarImg = document.createElement('img');
  avatarImg.src = post.user.avatar;
  avatarImg.alt = `${post.user.name} avatar`;
  avatarImg.className = 'user-avatar';

  const userInfo = document.createElement('div');
  userInfo.className = 'user-info';

  const userName = document.createElement('div');
  userName.className = 'user-name';
  userName.textContent = post.user.name;

  const postTime = document.createElement('div');
  postTime.className = 'post-time';
  postTime.textContent = post.time;

  userInfo.appendChild(userName);
  userInfo.appendChild(postTime);
  postHeader.appendChild(avatarImg);
  postHeader.appendChild(userInfo);

  // Post text
  const postText = document.createElement('div');
  postText.className = 'post-text';
  postText.textContent = post.text;

  // Post image
  let postImage = null;
  if (post.image) {
    postImage = document.createElement('img');
    postImage.src = post.image;
    postImage.alt = "Post image";
    postImage.className = 'post-image';
  }

  // Post actions footer
  const postFooter = document.createElement('footer');
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'post-actions';

  // Like button
  const likeBtn = createActionButton('like-btn', post.liked, post.likes, 'Like', '👍');
  actionsDiv.appendChild(likeBtn);

  // Comment button
  const commentBtn = createActionButton('comment-btn', false, null, 'Comment', '💬');
  actionsDiv.appendChild(commentBtn);

  // Share button
  const shareBtn = createActionButton('share-btn', false, null, 'Share', '🔗');
  actionsDiv.appendChild(shareBtn);

  // Comment box
  const commentBox = document.createElement('div');
  commentBox.className = 'comment-box';

  const commentInput = document.createElement('textarea');
  commentInput.className = 'comment-input';
  commentInput.rows = 1;
  commentInput.placeholder = 'Write a comment...';
  commentInput.setAttribute('aria-label', 'Write a comment');

  commentBox.appendChild(commentInput);

  // Comment section
  const commentSection = document.createElement('div');
  commentSection.className = 'comment-section';

  post.comments.forEach(comment => {
    const commentElement = createCommentElement(comment);
    commentSection.appendChild(commentElement);
  });

  postFooter.appendChild(actionsDiv);
  postFooter.appendChild(commentBox);
  postFooter.appendChild(commentSection);
  article.appendChild(postHeader);
  article.appendChild(postText);
  if (postImage) article.appendChild(postImage);
  article.appendChild(postFooter);

  // Event listeners for buttons
  commentBtn.addEventListener('click', () => {
    commentBox.style.display = commentBox.style.display === 'block' ? 'none' : 'block';
    commentInput.focus();
  });

  return article;
}

function createActionButton(className, isActive, count, label, icon) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `action-btn ${className}` + (isActive ? ' liked' : '');
  button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  button.setAttribute('aria-label', label);
  button.innerHTML = `<span class="action-icon" aria-hidden="true">${icon}</span> ${label}`;
  if (count > 0) {
    const spanCount = document.createElement('span');
    spanCount.className = 'like-count';
    spanCount.textContent = count;
    button.appendChild(spanCount);
  }
  return button;
}

function createCommentElement(comment) {
  const commentDiv = document.createElement('div');
  commentDiv.className = 'comment';

  const commentHeader = document.createElement('div');
  commentHeader.className = 'comment-header';

  const avatarImg = document.createElement('img');
  avatarImg.src = comment.user.avatar;
  avatarImg.alt = `${comment.user.name} avatar`;
  avatarImg.className = 'user-avatar';

  const userName = document.createElement('div');
  userName.className = 'user-name';
  userName.textContent = comment.user.name;

  commentHeader.appendChild(avatarImg);
  commentHeader.appendChild(userName);
  commentDiv.appendChild(commentHeader);

  const commentText = document.createElement('div');
  commentText.className = 'post-text';
  commentText.textContent = comment.text;
  commentDiv.appendChild(commentText);

  const reactionsDiv = document.createElement('div');
  reactionsDiv.className = 'comment-reactions';

  Object.entries(comment.reactions).forEach(([reaction, count]) => {
    const reactionBtn = document.createElement('span');
    reactionBtn.className = 'reaction-btn';
    reactionBtn.textContent = `${reaction.charAt(0).toUpperCase() + reaction.slice(1)} (${count})`;
    reactionsDiv.appendChild(reactionBtn);
  });

  commentDiv.appendChild(reactionsDiv);

  const replyBox = document.createElement('div');
  replyBox.className = 'reply-box';

  const replyInput = document.createElement('textarea');
  replyInput.className = 'reply-input';
  replyInput.rows = 1;
  replyInput.placeholder = 'Write a reply...';
  replyInput.setAttribute('aria-label', 'Write a reply');

  const replyBtn = document.createElement('button');
  replyBtn.textContent = 'Reply';
  replyBtn.className = 'action-btn';
  replyBtn.addEventListener('click', () => {
    const replyText = replyInput.value;
    if (replyText) {
      const replyComment = {
        user: { name: "User ", avatar: "https://images.pexels.com/photos/123456/pexels-photo-123456.jpeg?auto=compress&cs=tinysrgb&h=100" },
        text: replyText,
        reactions: {},
        replies: []
      };
      comment.replies.push(replyComment);
      renderComments(commentDiv, comment);
      replyInput.value = '';
    }
  });

  replyBox.appendChild(replyInput);
  replyBox.appendChild(replyBtn);
  commentDiv.appendChild(replyBox);

  const repliesDiv = document.createElement('div');
  repliesDiv.className = 'replies';
  comment.replies.forEach(reply => {
    const replyElement = createCommentElement(reply);
    repliesDiv.appendChild(replyElement);
  });
  commentDiv.appendChild(repliesDiv);

  return commentDiv;
}

function renderComments(commentDiv, comment) {
  const repliesDiv = commentDiv.querySelector('.replies');
  repliesDiv.innerHTML = '';
  comment.replies.forEach(reply => {
    const replyElement = createCommentElement(reply);
    repliesDiv.appendChild(replyElement);
  });
}

// Render all posts
function renderPosts() {
  feedContainer.innerHTML = '';
  posts.forEach(post => {
    const postElement = createPostElement(post);
    feedContainer.appendChild(postElement);
  });
}

// Initialize the feed when the DOM is loaded
document.addEventListener('DOMContentLoaded', renderPosts); 