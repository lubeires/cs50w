document.addEventListener("DOMContentLoaded", () => {
  // Calls edit post function when a Bootstrap modal is shown
  document
    .querySelector("#editModal")
    .addEventListener("show.bs.modal", (event) => editPost(event));

  document.querySelectorAll(".like").forEach((likeButton) => like(likeButton));

  document.querySelector("#follow").addEventListener("click", follow);
});

function editPost(event) {
  const content = event.relatedTarget.dataset.postContent;
  const id = event.relatedTarget.dataset.postId;
  const modalTextarea = document
    .querySelector("#editModal")
    .querySelector("#newPostContent");

  modalTextarea.value = content;

  // Post content update request
  document.querySelector("#update").addEventListener("click", () => {
    fetch(`/edit/post/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        content: modalTextarea.value,
      }),
    }).then(() => location.reload());
  });
}

function like(likeButton) {
  likeButton.addEventListener("click", () => {
    // Toggle the like button classes when user likes/unlikes a post
    ["fa-regular", "fa-solid", "text-danger"].map((c) =>
      likeButton.classList.toggle(c)
    );

    const postId = likeButton.dataset.postId;

    // Increase/decrease like count display
    const likeCount = document.getElementById(`${postId}`);
    likeCount.innerHTML = likeButton.classList.contains("fa-solid")
      ? ++likeCount.dataset.value
      : --likeCount.dataset.value;

    // Like request
    fetch(`/like/${postId}`, {
      method: "PUT",
    }).then(() => {});
  });
}

function follow() {
  const followButton = document.querySelector("#follow");

  // Toggle the follow button classes when user follows/unfollows a profile
  const classes = ["btn-outline-primary", "btn-primary"];
  classes.map((c) => followButton.classList.toggle(c));

  // Toggle the follow button text when user follows/unfollows a profile
  followButton.innerHTML =
    followButton.innerHTML == "Follow" ? "Following" : "Follow";

  // Follow request
  fetch(`/follow/${followButton.dataset.username}`, {
    method: "PUT",
  }).then((response) => console.log(response));
}
