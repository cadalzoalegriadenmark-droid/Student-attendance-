
let programs = JSON.parse(localStorage.getItem("programs")) || [];
let students = JSON.parse(localStorage.getItem("students")) || [];
let attendance = JSON.parse(localStorage.getItem("attendance")) || [];

const $ = id => document.getElementById(id);

function saveData() {
    localStorage.setItem("programs", JSON.stringify(programs));
    localStorage.setItem("students", JSON.stringify(students));
    localStorage.setItem("attendance", JSON.stringify(attendance));
}

function today() {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60000)
        .toISOString().split("T")[0];
}

$("attendanceDate").value = today();

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// ADD PROGRAM
$("programForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const name = $("programName").value.trim();

    if (!name) return;

    if (programs.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        alert("Program already exists!");
        return;
    }

    programs.push({
        id: Date.now(),
        name: name
    });

    saveData();
    this.reset();
    render();
    alert("Program added successfully!");
});

// DELETE PROGRAM
function deleteProgram(id) {
    if (students.some(s => s.programId === id)) {
        alert("Cannot delete a program with registered students.");
        return;
    }

    if (!confirm("Delete this program?")) return;

    programs = programs.filter(p => p.id !== id);
    saveData();
    render();
}

// ADD STUDENT
$("studentForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const name = $("studentName").value.trim();
    const email = $("studentEmail").value.trim();
    const number = $("studentNumber").value.trim();
    const programId = Number($("studentProgram").value);

    if (!programs.some(p => p.id === programId)) {
        alert("Please select a valid program.");
        return;
    }

    if (students.some(s => s.number.toLowerCase() === number.toLowerCase())) {
        alert("Student ID already exists!");
        return;
    }

    students.push({
        id: Date.now(),
        name,
        email,
        number,
        programId
    });

    saveData();
    this.reset();
    render();
    alert("Student registered successfully!");
});

// DELETE STUDENT
function deleteStudent(id) {
    if (!confirm("Delete this student and their attendance records?")) return;

    students = students.filter(s => s.id !== id);
    attendance = attendance.filter(a => a.studentId !== id);

    saveData();
    render();
}

// MARK ATTENDANCE
$("attendanceForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const studentId = Number($("attendanceStudent").value);
    const date = $("attendanceDate").value;
    const status = $("attendanceStatus").value;

    if (!students.some(s => s.id === studentId)) {
        alert("Please select a valid student.");
        return;
    }

    const existing = attendance.find(
        a => a.studentId === studentId && a.date === date
    );

    if (existing) {
        existing.status = status;
        alert("Attendance updated successfully!");
    } else {
        attendance.push({
            id: Date.now(),
            studentId,
            date,
            status
        });

        alert("Attendance saved successfully!");
    }

    saveData();
    render();
});

// DELETE ATTENDANCE
function deleteAttendance(id) {
    if (!confirm("Delete this attendance record?")) return;

    attendance = attendance.filter(a => a.id !== id);
    saveData();
    render();
}

// DISPLAY PROGRAMS
function renderPrograms() {
    $("programList").innerHTML = programs.map(p => `
        <li>
            <span>${escapeHTML(p.name)}</span>
            <button class="delete-btn"
                onclick="deleteProgram(${p.id})">Delete</button>
        </li>
    `).join("");

    $("studentProgram").innerHTML =
        '<option value="">Select Program</option>' +
        programs.map(p => `
            <option value="${p.id}">${escapeHTML(p.name)}</option>
        `).join("");
}

// DISPLAY STUDENTS
function renderStudents() {
    const search = $("searchStudent").value.toLowerCase();

    $("attendanceStudent").innerHTML =
        '<option value="">Select Student</option>' +
        students.map(s => `
            <option value="${s.id}">${escapeHTML(s.name)}</option>
        `).join("");

    const filtered = students.filter(s =>
        [s.name, s.email, s.number].some(v =>
            v.toLowerCase().includes(search)
        )
    );

    $("studentTable").innerHTML = filtered.map(s => {
        const program = programs.find(p => p.id === s.programId);

        return `
            <tr>
                <td>${escapeHTML(s.number)}</td>
                <td>${escapeHTML(s.name)}</td>
                <td>${escapeHTML(s.email)}</td>
                <td>${escapeHTML(program?.name || "Unknown")}</td>
                <td>
                    <button class="delete-btn"
                        onclick="deleteStudent(${s.id})">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

// DISPLAY ATTENDANCE
function renderAttendance() {
    $("attendanceTable").innerHTML = attendance
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .map(a => {
            const student = students.find(s => s.id === a.studentId);

            return `
                <tr>
                    <td>${escapeHTML(student?.name || "Unknown")}</td>
                    <td>${escapeHTML(a.date)}</td>
                    <td class="${a.status === "Present" ? "status-present" : "status-absent"}">
                        ${escapeHTML(a.status)}
                    </td>
                    <td>
                        <button class="delete-btn"
                            onclick="deleteAttendance(${a.id})">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
}

// DASHBOARD
function updateDashboard() {
    const date = today();

    const todaysRecords = attendance.filter(a => a.date === date);

    $("totalPrograms").textContent = programs.length;
    $("totalStudents").textContent = students.length;

    $("totalPresent").textContent =
        todaysRecords.filter(a => a.status === "Present").length;

    $("totalAbsent").textContent =
        todaysRecords.filter(a => a.status === "Absent").length;
}

// SEARCH
$("searchStudent").addEventListener("input", renderStudents);

// RENDER ALL
function render() {
    renderPrograms();
    renderStudents();
    renderAttendance();
    updateDashboard();
}

// INITIALIZE
render();
