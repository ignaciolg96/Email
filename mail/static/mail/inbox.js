document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.
    querySelector('#inbox')
    .addEventListener('click', () => load_mailbox('inbox'));
  document
    .querySelector('#sent')
    .addEventListener('click', () => load_mailbox('sent'));
  document
    .querySelector('#archived')
    .addEventListener('click', () => load_mailbox('archive'));
  document
    .querySelector('#compose')
    .addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});


function compose_email() {

  // Display toggle
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Each time the function's called, set form fields to empty
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // Turn off default button send behaviour
  document.querySelector('#compose-form').addEventListener("submit", function(event){
    event.preventDefault();
  }, true);

  // Add event listener to send email button
  document.querySelector('#sendButton').addEventListener('click', send_email);

}

function load_mailbox(mailbox) {
  
  // Display toggle
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#read-email').style.display = 'none';

  // Shows 'view's name ()
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  // Add the email list container
  if(document.getElementById("emails-table") == null){
    const element = document.createElement('div');
    element.id = "emails-table";

  document.querySelector('div[id="emails-view"]').append(element);
  }

  let tableBody = document.querySelector('div[id="emails-table"]');

  // Clear old emails
  tableBody.innerHTML = '';

  // fetch emails, get response as JSON object, then hand 'em to processEmails function 
  fetch(`emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => processEmails(emails))

  

  let processEmails = (emails) => {
    emails.forEach(function (email){
      console.log(email)
      const emailDiv = document.createElement('div');
      
      emailDiv.setAttribute("class", "border border-secondary mt-2");
      emailDiv.style.borderRadius = '5px';
      emailDiv.style.padding = '5px';

      email.read ? emailDiv.style.backgroundColor = 'lightgrey' : emailDiv.style.backgroundColor = 'white';
      emailDiv.innerHTML += "<b>From: </b>" + email.sender + "<br />";
      emailDiv.innerHTML += "<b>Subject: </b>" + email.subject + "<br />";
      emailDiv.innerHTML += email.timestamp + "<br />";

      var viewButton = document.createElement('button');
      viewButton.setAttribute("class", "btn btn-success");
      viewButton.style.margin = '5px';
      viewButton.textContent = "View";
      viewButton.addEventListener ('click', () => display_email(email));

      if (mailbox != 'sent') { // display archive/ unarchive button
        var archiveButton = document.createElement('button');
        archiveButton.setAttribute("class", "btn btn-danger");
        archiveButton.style.margin = '5px';
        archiveButton.textContent = email.archived ? "Unarchive" : "Archive";
        archiveButton.addEventListener('click', () => {
          fetch('/emails/'+`${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: !(email.archived)
            })
          })
        });
        archiveButton.addEventListener('click', () => load_mailbox('inbox'));
      }
      emailDiv.append(viewButton);
      if (mailbox != 'sent') { 
      emailDiv.append(archiveButton);
      }
      document.querySelector('#emails-view').appendChild(emailDiv);
            
    });
  }
}


function display_email(email) {

  document.querySelector('#emails-table').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#read-email').style.display = 'block';
  document.querySelector('#emails-view').innerHTML = ``;

  fetch(`/emails/${email.id}`)
  .then(response => response.json())
  .then(email => {

    document.querySelector('#read-email').innerHTML = `<h3>${email.subject}</h3>`;
      
    const emailDiv = document.createElement('div');
    emailDiv.setAttribute("class", "border mt-2");
    emailDiv.style.borderRadius = '5px';
    emailDiv.style.padding = '5px';

    emailDiv.innerHTML += "From: " + email.sender + "<br />";
    emailDiv.innerHTML += "Recipients: ";
    for (let recipient of email.recipients) {
      emailDiv.innerHTML += recipient;
    }
    emailDiv.innerHTML += "<br />";
    emailDiv.innerHTML += "Sent on " + email.timestamp + "<br />";

    const bodyDiv = document.createElement('div');
    bodyDiv.setAttribute("class", "border mt-2 mb-2");
    bodyDiv.style.borderRadius = '5px';
    bodyDiv.style.padding = '5px';

    bodyDiv.innerHTML += email.body + "<br />";
    document.querySelector('#read-email').appendChild(emailDiv);
    document.querySelector('#read-email').appendChild(bodyDiv);
      // mark email as read
    fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true})
    })

    const repplyButton = document.createElement('button');
    repplyButton.setAttribute("class", "btn btn-primary");
    repplyButton.textContent = 'Repply';
    repplyButton.addEventListener('click', () => {
      compose_email();

      document.querySelector('#compose-recipients').value = email.sender;
      document.querySelector('#compose-subject').value = email.subject.slice(0,4) == 'Re: ' ? 'Re: ' + email.subject.slice(4,) : 'Re: ' + email.subject;
      document.querySelector('#compose-body').value = 'On ' + email.timestamp + ' ' + email.sender + ' wrote ' + email.body;
    });

    document.querySelector('#read-email').appendChild(repplyButton);


  });
}




function send_email(){

  const msg = document.querySelector("#message");

  let recipients = document.querySelector('#compose-recipients').value;
  let subject = document.querySelector('#compose-subject').value;
  let body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: `${recipients}`,
        subject: `${subject}`,
        body: `${body}`
        })
    })
    .then(r => r.json().then(data => ({status: r.status, body: data})))
    .then(obj => console.log(obj.status))
    .then(() => load_mailbox('sent'));
}



