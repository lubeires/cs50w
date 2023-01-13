document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archive")
    .addEventListener("click", () => load_mailbox("archive"));
  document
    .querySelector("#compose")
    .addEventListener("click", () => compose_email());

  // By default, load the inbox
  load_mailbox("inbox");
});

function compose_email(email) {
  // Deactivate other nav-links and activate clicked nav-link
  document.querySelectorAll(".nav-link").forEach((navLink) => {
    navLink.classList.remove("active");
  });
  document.querySelector("#compose").classList.add("active");

  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#email-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";

  const recipients = document.querySelector("#compose-recipients");
  const subject = document.querySelector("#compose-subject");
  const body = document.querySelector("#compose-body");

  // Checks if it is a reply
  if (email === undefined) {
    // Clear out composition fields if it is not a reply
    recipients.value = "";
    subject.value = "";
    body.value = "";
  } else {
    // Pre-fills the fiels if it is a reply
    recipients.value = email.sender;
    subject.value = email.subject.includes("Re: ")
      ? email.subject
      : "Re: " + email.subject;
    body.value = `On ${email.timestamp} ${
      email.sender
    } wrote:\n${email.body.replaceAll("<br/>", "\n")}`;
  }

  // Sends the email
  document.querySelector("#compose-form").onsubmit = () => {
    fetch("/emails", {
      method: "POST",
      body: JSON.stringify({
        recipients: recipients.value,
        subject: subject.value,
        body: body.value,
      }),
    })
      .then((response) => response.json())
      .then(() => load_mailbox("sent"));
    return false;
  };
}

function load_mailbox(mailbox) {
  // Deactivate other nav-links and activate clicked nav-link
  document.querySelectorAll(".nav-link").forEach((navLink) => {
    navLink.classList.remove("active");
  });
  document.getElementById(mailbox).classList.add("active");

  const emailsView = document.querySelector("#emails-view");

  // Show the mailbox and hide other views
  emailsView.style.display = "block";
  document.querySelector("#email-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";

  // Show the mailbox name
  emailsView.innerHTML = `<h4>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h4>`;

  // GET /emails/<str:mailbox>
  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      // Checks if there is any emails in the mailbox
      if (emails.length != 0) {
        emails.forEach((email) => {
          wasRead = email.read ? "border-light list-group-item-secondary" : "";

          // Creates new email element
          const emailEl = document.createElement("div");
          emailEl.className = `email-link border-bottom d-flex justify-content-between align-items-center p-3 ${wasRead}`;
          emailEl.innerHTML = `
          <p class="m-0">
            <b class="me-3">${email.sender}</b>
            ${email.subject}
          </p>
          <p class="m-0">${email.timestamp}</p>
          `;

          // Adds event handler to the email element
          emailEl.addEventListener("click", () => {
            fetch(`/emails/${email.id}`)
              .then((response) => response.json())
              .then((email) => {
                load_email(email);
              });
          });

          // Appends each email element to the emails view
          emailsView.append(emailEl);
        });
      } else {
        emailsView.insertAdjacentHTML(
          "beforeend",
          `
          <p class="text-center my-4 fst-italic">Your ${mailbox} is empty...</p>
          `
        );
      }
    });
}

function load_email(email) {
  // Reads email
  if (!email.read) {
    fetch(`/emails/${email.id}`, {
      method: "PUT",
      body: JSON.stringify({
        read: true,
      }),
    });
  }

  const emailView = document.querySelector("#email-view");

  // Shows email view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  emailView.style.display = "block";
  document.querySelector("#compose-view").style.display = "none";

  // Shows email content
  emailView.innerHTML = `
  <div class="d-flex justify-content-between align-items-center">
    <h4>${email.subject}</h4>
    ${email.timestamp}
  </div>
  <p><b>From:</b> ${email.sender}</p>
  <p><b>To:</b> ${email.recipients.join(", ")}</p>
  <div class="border rounded bg-light p-3 my-2">
    ${email.body}
  </div>
  `;

  // Creates a div element for reply and archive buttons
  const buttonsDiv = document.createElement("div");
  buttonsDiv.className = "d-flex justify-content-between";
  emailView.append(buttonsDiv);

  // Creates reply button
  const replyEl = document.createElement("button");
  replyEl.className = "btn btn-outline-primary btn-sm px-3 mb-3";
  replyEl.innerHTML = "Reply";
  // Composes reply
  replyEl.addEventListener("click", () => compose_email(email));
  buttonsDiv.append(replyEl);

  // Creates arquive/unarchive button
  const archiveEl = document.createElement("button");
  archiveEl.className = "btn btn-outline-secondary btn-sm px-3 mb-3";
  archiveEl.innerHTML = email.archived ? "Unarchive" : "Archive";
  // Archives/unarchives email
  archiveEl.addEventListener("click", () => {
    fetch(`/emails/${email.id}`, {
      method: "PUT",
      body: JSON.stringify({
        archived: !email.archived,
      }),
    }).then(() => load_mailbox("inbox"));
  });
  buttonsDiv.append(archiveEl);
}
