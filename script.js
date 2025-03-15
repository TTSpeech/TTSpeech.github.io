try {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  var recognition = new SpeechRecognition();
} catch (e) {
  console.error(e);
  $(".no-browser-support").show();
  $(".app").hide();
}

var noteTextarea = $("#note-textarea");
var instructions = $("#recording-instructions");
var notesList = $("ul#notes");
var noteContent = "";

// Load previous notes
var notes = getAllNotes();
renderNotes(notes);

/*-----------------------------
      Voice Recognition 
------------------------------*/
recognition.continuous = true;

recognition.onresult = function (event) {
  var current = event.resultIndex;
  var transcript = event.results[current][0].transcript;

  var mobileRepeatBug = current == 1 && transcript == event.results[0][0].transcript;
  if (!mobileRepeatBug) {
    noteContent += transcript;
    noteTextarea.val(noteContent);
  }
};

recognition.onstart = function () {
  instructions.text("Voice recognition activated. Speak now...");
  $("#start-record-btn").prop("disabled", true).addClass("active");
  $("#pause-record-btn").prop("disabled", false);
};

recognition.onspeechend = function () {
  instructions.text("Speech recognition stopped.");
  $("#start-record-btn").prop("disabled", false).removeClass("active");
};

recognition.onerror = function (event) {
  if (event.error == "no-speech") {
    instructions.text("No speech detected. Try again.");
  }
};

/*-----------------------------
      App Buttons and Input 
------------------------------*/
$("#start-record-btn").on("click", function () {
  if (noteContent.length) {
    noteContent += " ";
  }
  recognition.start();
});

$("#pause-record-btn").on("click", function () {
  recognition.stop();
  instructions.text("Voice recognition paused.");
});

noteTextarea.on("input", function () {
  noteContent = $(this).val();
});

$("#save-note-btn").on("click", function () {
  recognition.stop();

  if (!noteContent.length) {
    instructions.text("Cannot save an empty note.");
  } else {
    saveNote(new Date().toLocaleString(), noteContent);
    noteContent = "";
    noteTextarea.val("");
    instructions.text("Note saved successfully.");
    renderNotes(getAllNotes()); // Refresh notes after saving
  }
});

// Export Notes
$("#export-notes-btn").on("click", function () {
  var notes = getAllNotes();
  if (!notes.length) {
    instructions.text("No notes to export.");
    return;
  }

  var textContent = notes.map((note) => `${note.date}\n${note.content}\n\n`).join("");
  var blob = new Blob([textContent], { type: "text/plain" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "voice_notes.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

// Clear all notes
$("#clear-notes-btn").on("click", function () {
  localStorage.clear();
  renderNotes([]);
  instructions.text("All notes have been deleted.");
});

/*-----------------------------
      Speech Synthesis (Read Notes)
------------------------------*/
function readOutLoud(message) {
  if ("speechSynthesis" in window) {
    speechSynthesis.cancel(); // Stop any ongoing speech

    var speech = new SpeechSynthesisUtterance();
    speech.text = message;
    speech.lang = "en-US";
    speech.rate = 1; // Normal speed
    speech.pitch = 1; // Normal pitch
    speech.volume = 1; // Full volume

    speech.onstart = function () {
      instructions.text("Reading note...");
    };

    speech.onend = function () {
      instructions.text("Finished reading.");
    };

    speech.onerror = function (e) {
      console.error("Speech Synthesis Error:", e);
      instructions.text("Error in speech synthesis.");
    };

    console.log("Speaking:", message); // Debug log
    window.speechSynthesis.speak(speech);
  } else {
    alert("Speech synthesis is not supported in this browser.");
  }
}

/*-----------------------------
      Helper Functions 
------------------------------*/
function renderNotes(notes) {
  var html = "";
  if (notes.length) {
    notes.forEach(function (note) {
      html += `<li class="note">
        <p class="header">
          <span class="date">${note.date}</span>
          <button class="listen-note icon-btn" title="Listen to Note">
            <i class="fas fa-volume-up"></i>
          </button>
          <button class="delete-note icon-btn" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </p>
        <p class="content">${note.content}</p>
      </li>`;
    });
  } else {
    html = '<li><p class="content">No notes available.</p></li>';
  }
  
  notesList.html(html); // Update the DOM

  // ✅ Rebind event listeners AFTER rendering
  $(".delete-note").off("click").on("click", function (e) {
    e.preventDefault();
    var dateTime = $(this).siblings(".date").text();
    deleteNote(dateTime);
    renderNotes(getAllNotes()); // Refresh notes
  });

  $(".listen-note").off("click").on("click", function (e) {
    e.preventDefault();
    var text = $(this).closest(".note").find(".content").text();
    console.log("Reading note:", text);
    readOutLoud(text);
  });
}

function saveNote(dateTime, content) {
  localStorage.setItem("note-" + dateTime, content);
}

function getAllNotes() {
  var notes = [];
  var key;
  for (var i = 0; i < localStorage.length; i++) {
    key = localStorage.key(i);
    if (key.startsWith("note-")) {
      notes.push({
        date: key.replace("note-", ""),
        content: localStorage.getItem(key),
      });
    }
  }
  return notes;
}

function deleteNote(dateTime) {
  localStorage.removeItem("note-" + dateTime);
}


