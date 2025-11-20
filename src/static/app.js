document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select (avoid duplicating options on refresh)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Title
        const title = document.createElement("h4");
        title.textContent = name;
        activityCard.appendChild(title);

        // Description
        const desc = document.createElement("p");
        desc.textContent = details.description;
        activityCard.appendChild(desc);

        // Schedule
        const scheduleP = document.createElement("p");
        scheduleP.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;
        activityCard.appendChild(scheduleP);

        // Availability
        const availP = document.createElement("p");
        availP.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;
        activityCard.appendChild(availP);

        // Participants section
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";

        const participantsTitle = document.createElement("h5");
        participantsTitle.textContent = "Participants";
        participantsDiv.appendChild(participantsTitle);

        const ul = document.createElement("ul");
        ul.className = "participant-list";

        if (!Array.isArray(details.participants) || details.participants.length === 0) {
          const li = document.createElement("li");
          li.className = "no-participants";
          li.textContent = "No participants yet.";
          ul.appendChild(li);
        } else {
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const badge = document.createElement("span");
            badge.className = "participant-badge";
            // Use first letter of email/name as avatar initial (safe fallback)
            badge.textContent = (typeof p === "string" && p.length) ? p.trim()[0].toUpperCase() : "?";

            const nameSpan = document.createElement("span");
            nameSpan.className = "participant-name";
            nameSpan.textContent = p;

              // Delete button
              const deleteBtn = document.createElement("button");
              deleteBtn.className = "participant-delete";
              deleteBtn.type = "button";
              deleteBtn.title = "Unregister participant";
              deleteBtn.setAttribute("aria-label", `Unregister ${p}`);
              deleteBtn.innerHTML = "&#128465;"; // trash emoji

              // Click handler to unregister participant
              deleteBtn.addEventListener("click", async (e) => {
                e.preventDefault();
                // Confirm action
                if (!confirm(`Unregister ${p} from ${name}?`)) return;

                try {
                  const resp = await fetch(`/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`, {
                    method: "DELETE",
                  });

                  const resJson = await resp.json();
                  if (!resp.ok) {
                    console.error("Failed to unregister:", resJson);
                    alert(resJson.detail || resJson.message || "Failed to unregister participant");
                    return;
                  }

                  // Remove the participant element from the DOM
                  li.remove();

                  // Update availability count displayed
                  try {
                    const m = availP.textContent.match(/(\d+)/);
                    if (m) {
                      const current = parseInt(m[1], 10);
                      const next = current + 1;
                      availP.innerHTML = `<strong>Availability:</strong> ${next} spots left`;
                    }
                  } catch (err) {
                    // ignore update errors
                  }

                  // If no participants left, show placeholder
                  const remaining = ul.querySelectorAll('li.participant-item').length;
                  if (remaining === 0) {
                    const noneLi = document.createElement('li');
                    noneLi.className = 'no-participants';
                    noneLi.textContent = 'No participants yet.';
                    ul.appendChild(noneLi);
                  }
                } catch (err) {
                  console.error('Error unregistering participant:', err);
                  alert('Failed to unregister participant. Please try again.');
                }
              });

              li.appendChild(badge);
              li.appendChild(nameSpan);
              li.appendChild(deleteBtn);
              ul.appendChild(li);
          });
        }

        participantsDiv.appendChild(ul);
        activityCard.appendChild(participantsDiv);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
            // Refresh activities list so the new participant appears without page reload
            await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
