const DB_NAME = "DailyTimelineDB";
const DB_VERSION = 4;

let db = null;
let currentScreen = "timeline";
let selectedDate = getTodayDateString();
let selectedGap = null;

// =========================
// Utility
// =========================

function createId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function timeToMinutes(time) {
    if (!time) return 0;

    const [hour, minute] = time.split(":").map(Number);
    return hour * 60 + minute;
}

function minutesToTime(minutes) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;

    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&")
        .replace(/</g, "<")
        .replace(/>/g, ">")
        .replace(/"/g, "”")
        .replace(/'/g, "'");
}

function getWeekdayLabel(dateString) {
    const date = new Date(`${dateString}T00:00:00`);
    const labels = ["日", "月", "火", "水", "木", "金", "土"];

    return labels[date.getDay()];
}

function getWeekdayNumber(dateString) {
    const date = new Date(`${dateString}T00:00:00`);
    return date.getDay();
}

function getTodayDateString() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
    const date = new Date(`${dateString}T00:00:00`);

    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${getWeekdayLabel(dateString)}）`;
}

function changeDate(dateString, days) {
    const date = new Date(`${dateString}T00:00:00`);
    date.setDate(date.getDate() + days);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function isToday(dateString) {
    return dateString === getTodayDateString();
}

function formatDateTime(isoString) {
    if (!isoString) return "";

    const date = new Date(isoString);

    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

// =========================
// Color theme
// =========================

const COLOR_THEMES = {
    monochrome: {
        name: "モノクロ",
        color: "#222222"
    },
    blue: {
        name: "ブルー",
        color: "#2563eb"
    },
    green: {
        name: "グリーン",
        color: "#16a34a"
    },
    orange: {
        name: "オレンジ",
        color: "#ea580c"
    },
    purple: {
        name: "パープル",
        color: "#7c3aed"
    }
};

function getCurrentColorTheme() {
    return localStorage.getItem("dailyTimelineColor") || "monochrome";
}

function applyColorTheme() {
    const themeKey = getCurrentColorTheme();
    const theme =
        COLOR_THEMES[themeKey] || COLOR_THEMES.monochrome;

    document.documentElement.style.setProperty(
        "--accent-color",
        theme.color
    );
}

// =========================
// IndexedDB
// =========================

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            if (!database.objectStoreNames.contains("routines")) {
                database.createObjectStore("routines", {
                    keyPath: "id"
                });
            }

            if (!database.objectStoreNames.contains("todos")) {
                database.createObjectStore("todos", {
                    keyPath: "id"
                });
            }

            if (!database.objectStoreNames.contains("memos")) {
                database.createObjectStore("memos", {
                    keyPath: "id"
                });
            }

            if (!database.objectStoreNames.contains("settings")) {
                database.createObjectStore("settings", {
                    keyPath: "id"
                });
            }
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// =========================
// Routine DB
// =========================

function getAllRoutines() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("routines", "readonly");
        const store = transaction.objectStore("routines");
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

function saveRoutine(routine) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("routines", "readwrite");
        const store = transaction.objectStore("routines");

        const request = store.put(routine);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

function deleteRoutine(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("routines", "readwrite");
        const store = transaction.objectStore("routines");

        const request = store.delete(id);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// =========================
// Todo DB
// =========================

function getAllTodos() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("todos", "readonly");
        const store = transaction.objectStore("todos");
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

function saveTodo(todo) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("todos", "readwrite");
        const store = transaction.objectStore("todos");

        const request = store.put(todo);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

function deleteTodo(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("todos", "readwrite");
        const store = transaction.objectStore("todos");

        const request = store.delete(id);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// =========================
// Expired one-time Todo
// =========================

async function restoreExpiredOneTimeTodos() {
    const todos = await getAllTodos();
    const today = getTodayDateString();

    for (const todo of todos) {
        // 繰り返しToDoのTimeline用コピーは対象外
        if (todo.type !== "normal") {
            continue;
        }

        // Timelineに配置されていないものは対象外
        if (
            todo.date === null ||
            todo.date === undefined ||
            todo.startTime === null ||
            todo.startTime === undefined
        ) {
            continue;
        }

        // 完了済みなら通常は既に削除されているため対象外
        if (todo.completed) {
            continue;
        }

        // 今日より前の日付なら、ToDoリストへ戻す
        if (todo.date < today) {
            todo.date = null;
            todo.startTime = null;

            await saveTodo(todo);
        }
    }
}

// =========================
// Memo DB
// =========================

function getAllMemos() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("memos", "readonly");
        const store = transaction.objectStore("memos");
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

function saveMemo(memo) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("memos", "readwrite");
        const store = transaction.objectStore("memos");

        const request = store.put(memo);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

function deleteMemo(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("memos", "readwrite");
        const store = transaction.objectStore("memos");

        const request = store.delete(id);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// =========================
// Settings DB
// =========================

function getSetting(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("settings", "readonly");
        const store = transaction.objectStore("settings");
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

function saveSetting(setting) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("settings", "readwrite");
        const store = transaction.objectStore("settings");

        const request = store.put(setting);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// =========================
// Initial data
// =========================

async function initializeData() {
    const initialized = await getSetting("initialized");

    if (initialized?.value === true) {
        return;
    }

    const defaultRoutines = [
        {
            id: createId(),
            title: "起床",
            startTime: "07:00",
            endTime: "07:30",
            days: [0, 1, 2, 3, 4, 5, 6],
            createdAt: new Date().toISOString()
        },
        {
            id: createId(),
            title: "朝食",
            startTime: "08:00",
            endTime: "08:30",
            days: [0, 1, 2, 3, 4, 5, 6],
            createdAt: new Date().toISOString()
        },
        {
            id: createId(),
            title: "仕事",
            startTime: "09:00",
            endTime: "12:00",
            days: [1, 2, 3, 4, 5],
            createdAt: new Date().toISOString()
        },
        {
            id: createId(),
            title: "昼食",
            startTime: "12:00",
            endTime: "13:00",
            days: [0, 1, 2, 3, 4, 5, 6],
            createdAt: new Date().toISOString()
        },
        {
            id: createId(),
            title: "仕事",
            startTime: "13:00",
            endTime: "18:00",
            days: [1, 2, 3, 4, 5],
            createdAt: new Date().toISOString()
        },
        {
            id: createId(),
            title: "退勤",
            startTime: "18:00",
            endTime: "18:10",
            days: [1, 2, 3, 4, 5],
            createdAt: new Date().toISOString()
        },
        {
            id: createId(),
            title: "夕食",
            startTime: "19:00",
            endTime: "20:00",
            days: [0, 1, 2, 3, 4, 5, 6],
            createdAt: new Date().toISOString()
        },
        {
            id: createId(),
            title: "就寝",
            startTime: "23:30",
            endTime: "23:59",
            days: [0, 1, 2, 3, 4, 5, 6],
            createdAt: new Date().toISOString()
        }
    ];

    for (const routine of defaultRoutines) {
        await saveRoutine(routine);
    }

    await saveSetting({
        id: "initialized",
        value: true
    });
}

// =========================
// Navigation
// =========================

function setupNavigation() {
    const navItems = document.querySelectorAll(".nav-item");

    navItems.forEach((item) => {
        item.addEventListener("click", () => {
            currentScreen = item.dataset.screen;

            navItems.forEach((nav) => {
                nav.classList.remove("active");
            });

            item.classList.add("active");

            renderScreen();
        });
    });
}

// =========================
// Screen rendering
// =========================

async function renderScreen() {
    const screen = document.getElementById("screen");

    if (currentScreen === "timeline") {
        await renderTimelineScreen(screen);
        return;
    }

    if (currentScreen === "memo") {
        await renderMemoScreen(screen);
        return;
    }

    if (currentScreen === "todo") {
        await renderTodoScreen(screen);
        return;
    }

    if (currentScreen === "calendar") {
        await renderCalendarScreen(screen);
        return;
    }

    if (currentScreen === "settings") {
        renderSettingsScreen(screen);
    }
}

// =========================
// Timeline
// =========================

async function renderTimelineScreen(screen) {
    await restoreExpiredOneTimeTodos();

    const routines = await getAllRoutines();
    const todos = await getAllTodos();

    const weekday = getWeekdayNumber(selectedDate);

    const dayRoutines = routines
        .filter((routine) => routine.days.includes(weekday))
        .map((routine) => ({
            id: routine.id,
            kind: "routine",
            title: routine.title,
            startTime: routine.startTime,
            endTime: routine.endTime,
            data: routine
        }));

    const dayTodos = todos
        .filter(
            (todo) =>
                todo.date === selectedDate &&
                todo.startTime !== null &&
                todo.startTime !== undefined
        )
        .map((todo) => {
            const start = timeToMinutes(todo.startTime);
            const end = start + Number(todo.duration);

            return {
                id: todo.id,
                kind: "todo",
                title: todo.title,
                startTime: todo.startTime,
                endTime: minutesToTime(end),
                data: todo
            };
        });

    const items = [...dayRoutines, ...dayTodos].sort(
        (a, b) =>
            timeToMinutes(a.startTime) -
            timeToMinutes(b.startTime)
    );

    let html = `
        <div class="screen-header">
            <div class="timeline-date-navigation">
                <button class="icon-button" id="previous-day">‹</button>

                <div class="timeline-date">
                    <div class="screen-title">Timeline</div>
                    <div class="selected-date">${escapeHtml(formatDate(selectedDate))}</div>
                </div>

                <button class="icon-button" id="next-day">›</button>
            </div>

            <div class="timeline-header-actions">
                ${
                    !isToday(selectedDate)
                        ? `<button class="secondary-button" id="today-button">戻る</button>`
                        : ""
                }

                <button class="primary-button" id="add-routine-button">
                    ＋ ルーティンを追加
                </button>
            </div>
        </div>
    `;

    if (items.length === 0) {
        html += `
            <div class="empty-state">
                <p>この日の予定はありません。</p>
                <p>ルーティンを追加したり、ToDoを入れられます。</p>
            </div>
        `;
    } else {
        html += `<div class="timeline">`;

        let previousEnd = 0;

        for (const item of items) {
            const start = timeToMinutes(item.startTime);
            const end = timeToMinutes(item.endTime);

            if (start > previousEnd) {
                html += renderFreeTime(previousEnd, start);
            }

            html += renderTimelineItem(item);

            previousEnd = Math.max(previousEnd, end);
        }

        if (previousEnd < 24 * 60) {
            html += renderFreeTime(previousEnd, 24 * 60);
        }

        html += `</div>`;
    }

    screen.innerHTML = html;

    document
        .getElementById("previous-day")
        .addEventListener("click", async () => {
            selectedDate = changeDate(selectedDate, -1);
            await renderTimelineScreen(screen);
        });

    document
        .getElementById("next-day")
        .addEventListener("click", async () => {
            selectedDate = changeDate(selectedDate, 1);
            await renderTimelineScreen(screen);
        });

    const todayButton =
        document.getElementById("today-button");

    if (todayButton) {
        todayButton.addEventListener("click", async () => {
            selectedDate = getTodayDateString();
            await renderTimelineScreen(screen);
        });
    }

    document
        .getElementById("add-routine-button")
        .addEventListener("click", () => {
            renderRoutineForm(screen);
        });

    screen.querySelectorAll(".edit-routine-button").forEach(
        (button) => {
            button.addEventListener("click", async () => {
                const routines = await getAllRoutines();

                const routine = routines.find(
                    (item) => item.id === button.dataset.id
                );

                if (routine) {
                    renderRoutineForm(screen, routine);
                }
            });
        }
    );

    screen.querySelectorAll(".delete-routine-button").forEach(
        (button) => {
            button.addEventListener("click", async () => {
                const confirmed = confirm(
                    "このルーティンを削除しますか？"
                );

                if (!confirmed) return;

                await deleteRoutine(button.dataset.id);
                await renderTimelineScreen(screen);
            });
        }
    );

    screen.querySelectorAll(".complete-todo-button").forEach(
        (button) => {
            button.addEventListener("click", async () => {
                const todos = await getAllTodos();

                const todo = todos.find(
                    (item) => item.id === button.dataset.id
                );

                if (!todo) return;

                // 一度きりのToDoは完了した時点で削除
                if (todo.type === "normal") {
                    await deleteTodo(todo.id);
                }

                // 繰り返しToDoのTimeline上の予定は
                // 完了状態だけを保存する
                else if (todo.type === "routineOccurrence") {
                    todo.completed = !todo.completed;
                    await saveTodo(todo);
                }

                await renderTimelineScreen(screen);
            });
        }
    );

    screen.querySelectorAll(".remove-todo-button").forEach(
        (button) => {
            button.addEventListener("click", async () => {
                const todos = await getAllTodos();

                const todo = todos.find(
                    (item) => item.id === button.dataset.id
                );

                if (!todo) return;

                // 一度きりToDoは未配置状態へ戻す
                if (todo.type === "normal") {
                    todo.date = null;
                    todo.startTime = null;

                    await saveTodo(todo);
                }

                // 繰り返しToDoの予定は、その予定だけ削除する
                else if (todo.type === "routineOccurrence") {
                    await deleteTodo(todo.id);
                }

                await renderTimelineScreen(screen);
            });
        }
    );

    screen.querySelectorAll(".schedule-todo-button").forEach(
        (button) => {
            button.addEventListener("click", async () => {
                const start = Number(button.dataset.start);
                const end = Number(button.dataset.end);

                selectedGap = {
                    start,
                    end
                };

                await renderTodoSelection(screen);
            });
        }
    );
}

function renderTimelineItem(item) {
    if (item.kind === "routine") {
        return `
            <div class="timeline-item routine-item">
                <div class="timeline-time">
                    ${escapeHtml(item.startTime)}
                    <span>〜</span>
                    ${escapeHtml(item.endTime)}
                </div>

                <div class="timeline-card">
                    <div class="timeline-card-main">
                        <div class="timeline-card-title">
                            ${escapeHtml(item.title)}
                        </div>

                        <div class="timeline-card-type">
                            Routine
                        </div>
                    </div>

                    <div class="timeline-card-actions">
                        <button
                            class="small-button edit-routine-button"
                            data-id="${escapeHtml(item.id)}"
                        >
                            編集
                        </button>

                        <button
                            class="small-button danger delete-routine-button"
                            data-id="${escapeHtml(item.id)}"
                        >
                            削除
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    const completedClass =
        item.data.completed ? "completed" : "";

    const isRecurring =
        item.data.type === "routineOccurrence";

    return `
        <div class="timeline-item todo-item ${completedClass}">
            <div class="timeline-time">
                ${escapeHtml(item.startTime)}
                <span>〜</span>
                ${escapeHtml(item.endTime)}
            </div>

            <div class="timeline-card">
                <div class="timeline-card-main">
                    <div class="timeline-card-title">
                        ${escapeHtml(item.title)}
                    </div>

                    <div class="timeline-card-type">
                        ${
                            isRecurring
                                ? "繰り返しToDo"
                                : "一度きりToDo"
                        }
                        ・
                        ${escapeHtml(item.data.duration)}分
                    </div>
                </div>

                <div class="timeline-card-actions">
                    <button
                        class="small-button complete-todo-button"
                        data-id="${escapeHtml(item.id)}"
                    >
                        ${item.data.completed ? "未完了" : "完了"}
                    </button>

                    <button
                        class="small-button danger remove-todo-button"
                        data-id="${escapeHtml(item.id)}"
                    >
                        外す
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderFreeTime(start, end) {
    const duration = end - start;

    if (duration <= 0) {
        return "";
    }

    return `
        <div class="free-time">
            <div class="free-time-label">
                空き時間
                <span>
                    ${escapeHtml(minutesToTime(start))}
                    〜
                    ${escapeHtml(minutesToTime(end))}
                    ・${duration}分
                </span>
            </div>

            <button
                class="free-time-button schedule-todo-button"
                data-start="${start}"
                data-end="${end}"
            >
                ＋ ToDoを入れる
            </button>
        </div>
    `;
}

// =========================
// Routine form
// =========================

function renderRoutineForm(screen, routine = null) {
    const isEdit = Boolean(routine);

    const selectedDays = routine
        ? routine.days
        : [0, 1, 2, 3, 4, 5, 6];

    screen.innerHTML = `
        <div class="screen-header">
            <div>
                <div class="screen-title">
                    ${isEdit ? "ルーティンを編集" : "ルーティンを追加"}
                </div>
            </div>

            <button class="secondary-button" id="cancel-routine">
                キャンセル
            </button>
        </div>

        <form id="routine-form" class="form-card">

            <label>
                タイトル
                <input
                    type="text"
                    id="routine-title"
                    value="${escapeHtml(routine?.title || "")}"
                    placeholder="例：ジム"
                    required
                >
            </label>

            <div class="form-row">

                <label>
                    開始
                    <input
                        type="time"
                        id="routine-start"
                        value="${escapeHtml(routine?.startTime || "09:00")}"
                        required
                    >
                </label>

                <label>
                    終了
                    <input
                        type="time"
                        id="routine-end"
                        value="${escapeHtml(routine?.endTime || "10:00")}"
                        required
                    >
                </label>

            </div>

            <div class="form-section">
                <div class="form-section-title">曜日</div>

                <div class="weekday-selector">
                    ${
                        [
                            [0, "日"],
                            [1, "月"],
                            [2, "火"],
                            [3, "水"],
                            [4, "木"],
                            [5, "金"],
                            [6, "土"]
                        ]
                            .map(
                                ([day, label]) => `
                                    <label class="weekday-option">
                                        <input
                                            type="checkbox"
                                            name="routine-day"
                                            value="${day}"
                                            ${
                                                selectedDays.includes(day)
                                                    ? "checked"
                                                    : ""
                                            }
                                        >
                                        <span>${label}</span>
                                    </label>
                                `
                            )
                            .join("")
                    }
                </div>
            </div>

            <button class="primary-button full-width" type="submit">
                ${isEdit ? "変更を保存" : "追加する"}
            </button>

            ${
                isEdit
                    ? `
                        <button
                            class="danger-button full-width"
                            type="button"
                            id="delete-routine-form"
                        >
                            このルーティンを削除
                        </button>
                    `
                    : ""
            }

        </form>
    `;

    document
        .getElementById("cancel-routine")
        .addEventListener("click", async () => {
            await renderTimelineScreen(screen);
        });

    document
        .getElementById("routine-form")
        .addEventListener("submit", async (event) => {
            event.preventDefault();

            const title = document
                .getElementById("routine-title")
                .value.trim();

            const startTime =
                document.getElementById("routine-start").value;

            const endTime =
                document.getElementById("routine-end").value;

            const days = [
                ...document.querySelectorAll(
                    'input[name="routine-day"]:checked'
                )
            ].map((input) => Number(input.value));

            if (!title) {
                alert("タイトルを入力してください。");
                return;
            }

            if (!startTime || !endTime) {
                alert("開始・終了時刻を入力してください。");
                return;
            }

            if (
                timeToMinutes(endTime) <=
                timeToMinutes(startTime)
            ) {
                alert(
                    "終了時刻は開始時刻より後にしてください。"
                );
                return;
            }

            if (days.length === 0) {
                alert("曜日を1つ以上選択してください。");
                return;
            }

            const routines = await getAllRoutines();
            const currentId = routine?.id;

            const hasOverlap = routines.some((existing) => {
                if (existing.id === currentId) {
                    return false;
                }

                const sameDay = existing.days.some((day) =>
                    days.includes(day)
                );

                if (!sameDay) {
                    return false;
                }

                const existingStart =
                    timeToMinutes(existing.startTime);

                const existingEnd =
                    timeToMinutes(existing.endTime);

                const newStart =
                    timeToMinutes(startTime);

                const newEnd =
                    timeToMinutes(endTime);

                return (
                    newStart < existingEnd &&
                    newEnd > existingStart
                );
            });

            if (hasOverlap) {
                alert(
                    "同じ曜日・時間帯に別のルーティンがあります。"
                );
                return;
            }

            const newRoutine = {
                id: routine?.id || createId(),
                title,
                startTime,
                endTime,
                days,
                createdAt:
                    routine?.createdAt ||
                    new Date().toISOString()
            };

            await saveRoutine(newRoutine);
            await renderTimelineScreen(screen);
        });

    const deleteButton = document.getElementById(
        "delete-routine-form"
    );

    if (deleteButton) {
        deleteButton.addEventListener("click", async () => {
            const confirmed = confirm(
                "このルーティンを削除しますか？"
            );

            if (!confirmed) return;

            await deleteRoutine(routine.id);
            await renderTimelineScreen(screen);
        });
    }
}

// =========================
// Todo selection
// =========================

async function renderTodoSelection(screen) {
    const todos = await getAllTodos();

    const availableTodos = todos.filter((todo) => {
        const duration = Number(todo.duration);

        const gapDuration =
            selectedGap.end - selectedGap.start;

        // 一度きりToDo
        // 既にTimelineへ配置されているものは選択不可
        if (todo.type === "normal") {
            const isUnscheduled =
                todo.startTime === null ||
                todo.startTime === undefined;

            return (
                isUnscheduled &&
                duration <= gapDuration
            );
        }

        // 繰り返しToDo
        // 元のToDoは常に選択可能
        if (todo.type === "routine") {
            return duration <= gapDuration;
        }

        return false;
    });

    const oneTimeTodos = availableTodos.filter(
        (todo) => todo.type === "normal"
    );

    const recurringTodos = availableTodos.filter(
        (todo) => todo.type === "routine"
    );

    screen.innerHTML = `
        <div class="screen-header">
            <div>
                <div class="screen-title">ToDoを入れる</div>
                <div class="selected-date">
                    ${escapeHtml(formatDate(selectedDate))}
                </div>
            </div>

            <button class="secondary-button" id="cancel-schedule">
                キャンセル
            </button>
        </div>

        <div class="schedule-gap-info">
            <strong>空き時間</strong>
            <span>
                ${escapeHtml(minutesToTime(selectedGap.start))}
                〜
                ${escapeHtml(minutesToTime(selectedGap.end))}
            </span>
        </div>

        ${
            availableTodos.length === 0
                ? `
                    <div class="empty-state">
                        <p>この空き時間に入れられるToDoがありません。</p>
                        <p>ToDoを作成するか、別の空き時間を選んでください。</p>
                    </div>
                `
                : `
                    ${
                        oneTimeTodos.length > 0
                            ? `
                                <div class="settings-section-title">
                                    一度きりのタスク
                                </div>

                                <div class="todo-selection-list">
                                    ${oneTimeTodos
                                        .map(
                                            (todo) => `
                                                <button
                                                    class="todo-selection-card"
                                                    data-id="${escapeHtml(todo.id)}"
                                                >
                                                    <span class="todo-selection-title">
                                                        ${escapeHtml(todo.title)}
                                                    </span>

                                                    <span class="todo-selection-meta">
                                                        ${escapeHtml(todo.duration)}分
                                                        ・一度きり
                                                    </span>
                                                </button>
                                            `
                                        )
                                        .join("")}
                                </div>
                            `
                            : ""
                    }

                    ${
                        recurringTodos.length > 0
                            ? `
                                <div class="settings-section-title">
                                    繰り返しのタスク
                                </div>

                                <div class="todo-selection-list">
                                    ${recurringTodos
                                        .map(
                                            (todo) => `
                                                <button
                                                    class="todo-selection-card"
                                                    data-id="${escapeHtml(todo.id)}"
                                                >
                                                    <span class="todo-selection-title">
                                                        ${escapeHtml(todo.title)}
                                                    </span>

                                                    <span class="todo-selection-meta">
                                                        ${escapeHtml(todo.duration)}分
                                                        ・繰り返し
                                                    </span>
                                                </button>
                                            `
                                        )
                                        .join("")}
                                </div>
                            `
                            : ""
                    }
                `
        }
    `;

    document
        .getElementById("cancel-schedule")
        .addEventListener("click", async () => {
            await renderTimelineScreen(screen);
        });

    screen
        .querySelectorAll(".todo-selection-card")
        .forEach((button) => {
            button.addEventListener("click", async () => {
                const todos = await getAllTodos();

                const todo = todos.find(
                    (item) => item.id === button.dataset.id
                );

                if (!todo) return;

                // 一度きりのToDo
                // 元データそのものをTimelineへ配置
                if (todo.type === "normal") {
                    todo.date = selectedDate;
                    todo.startTime = minutesToTime(
                        selectedGap.start
                    );

                    await saveTodo(todo);
                }

                // 繰り返しToDo
                // 元データは残し、Timeline用の予定を新しく作る
                else if (todo.type === "routine") {
                    const occurrence = {
                        id: createId(),
                        title: todo.title,
                        duration: Number(todo.duration),
                        type: "routineOccurrence",
                        sourceTodoId: todo.id,
                        date: selectedDate,
                        startTime: minutesToTime(
                            selectedGap.start
                        ),
                        completed: false,
                        createdAt: new Date().toISOString()
                    };

                    await saveTodo(occurrence);
                }

                await renderTimelineScreen(screen);
            });
        });
}

// =========================
// Todo screen
// =========================

function renderTodoListItems(todos) {
    return todos
        .map(
            (todo) => `
                <div class="todo-list-item ${
                    todo.completed
                        ? "completed"
                        : ""
                }">

                    <div class="todo-list-main">
                        <div class="todo-list-title">
                            ${escapeHtml(todo.title)}
                        </div>

                        <div class="todo-list-meta">
                            ${escapeHtml(todo.duration)}分
                            ・
                            ${
                                todo.type === "routine"
                                    ? "繰り返し"
                                    : "一度きり"
                            }

                            ${
                                todo.date &&
                                todo.startTime
                                    ? `・${escapeHtml(
                                          todo.date
                                      )} ${escapeHtml(
                                          todo.startTime
                                      )}`
                                    : "・未配置"
                            }
                        </div>
                    </div>

                    <div class="todo-list-actions">
                        <button
                            class="small-button edit-todo-button"
                            data-id="${escapeHtml(
                                todo.id
                            )}"
                        >
                            編集
                        </button>

                        <button
                            class="small-button danger delete-todo-button"
                            data-id="${escapeHtml(
                                todo.id
                            )}"
                        >
                            削除
                        </button>
                    </div>

                </div>
            `
        )
        .join("");
}

async function renderTodoScreen(screen) {
    await restoreExpiredOneTimeTodos();

    const todos = await getAllTodos();

    // Timeline上の繰り返しToDo用コピーは
    // ToDoリストには表示しない
    const todoTemplates = todos.filter(
        (todo) =>
            todo.type === "normal" ||
            todo.type === "routine"
    );

    const oneTimeTodos = todoTemplates
        .filter((todo) => todo.type === "normal")
        .sort(
            (a, b) =>
                new Date(b.createdAt) -
                new Date(a.createdAt)
        );

    const recurringTodos = todoTemplates
        .filter((todo) => todo.type === "routine")
        .sort(
            (a, b) =>
                new Date(b.createdAt) -
                new Date(a.createdAt)
        );

    screen.innerHTML = `
        <div class="screen-header">
            <div>
                <div class="screen-title">ToDo</div>
                <div class="screen-subtitle">
                    一度きりと繰り返しのタスクを管理できます
                </div>
            </div>

            <button class="primary-button" id="add-todo-button">
                ＋ ToDo
            </button>
        </div>

        ${
            todoTemplates.length === 0
                ? `
                    <div class="empty-state">
                        <p>ToDoはまだありません。</p>
                        <p>一度きり、または繰り返しのタスクを作成できます。</p>
                    </div>
                `
                : `
                    <div class="settings-section-title">
                        一度きりのタスク
                    </div>

                    <div class="screen-subtitle">
                        完了するとToDoリストから消えます
                    </div>

                    ${
                        oneTimeTodos.length === 0
                            ? `
                                <div class="empty-state">
                                    <p>一度きりのタスクはありません。</p>
                                </div>
                            `
                            : `
                                <div class="todo-list">
                                    ${renderTodoListItems(
                                        oneTimeTodos
                                    )}
                                </div>
                            `
                    }

                    <div class="settings-section-title">
                        繰り返しのタスク
                    </div>

                    <div class="screen-subtitle">
                        完了しても残り、削除するまで保持されます
                    </div>

                    ${
                        recurringTodos.length === 0
                            ? `
                                <div class="empty-state">
                                    <p>繰り返しのタスクはありません。</p>
                                </div>
                            `
                            : `
                                <div class="todo-list">
                                    ${renderTodoListItems(
                                        recurringTodos
                                    )}
                                </div>
                            `
                    }
                `
        }
    `;

    document
        .getElementById("add-todo-button")
        .addEventListener("click", () => {
            renderTodoForm(screen);
        });

    screen
        .querySelectorAll(".edit-todo-button")
        .forEach((button) => {
            button.addEventListener("click", async () => {
                const todos = await getAllTodos();

                const todo = todos.find(
                    (item) => item.id === button.dataset.id
                );

                if (todo) {
                    renderTodoForm(screen, todo);
                }
            });
        });

    screen
        .querySelectorAll(".delete-todo-button")
        .forEach((button) => {
            button.addEventListener("click", async () => {
                const confirmed = confirm(
                    "このToDoを削除しますか？"
                );

                if (!confirmed) return;

                await deleteTodo(button.dataset.id);
                await renderTodoScreen(screen);
            });
        });
}

// =========================
// Todo form
// =========================

function renderTodoForm(screen, todo = null) {
    const isEdit = Boolean(todo);

    screen.innerHTML = `
        <div class="screen-header">
            <div class="screen-title">
                ${isEdit ? "ToDoを編集" : "ToDoを追加"}
            </div>

            <button class="secondary-button" id="cancel-todo">
                キャンセル
            </button>
        </div>

        <form id="todo-form" class="form-card">

            <label>
                タイトル
                <input
                    type="text"
                    id="todo-title"
                    value="${escapeHtml(todo?.title || "")}"
                    placeholder="例：市役所に行く"
                    required
                >
            </label>

            <label>
                所要時間（分）
                <input
                    type="number"
                    id="todo-duration"
                    value="${escapeHtml(todo?.duration || 30)}"
                    min="1"
                    step="1"
                    required
                >
            </label>

            <div class="form-section">
                <div class="form-section-title">種類</div>

                <div class="todo-type-selector">

                    <label class="todo-type-option">
                        <input
                            type="radio"
                            name="todo-type"
                            value="normal"
                            ${
                                !todo ||
                                todo.type === "normal"
                                    ? "checked"
                                    : ""
                            }
                        >
                        <span>
                            <strong>一度きり</strong>
                            <small>完了するとリストから消えます</small>
                        </span>
                    </label>

                    <label class="todo-type-option">
                        <input
                            type="radio"
                            name="todo-type"
                            value="routine"
                            ${
                                todo?.type === "routine"
                                    ? "checked"
                                    : ""
                            }
                        >
                        <span>
                            <strong>繰り返し</strong>
                            <small>完了しても残り、何度でもTimelineに入れられます</small>
                        </span>
                    </label>

                </div>
            </div>

            <button class="primary-button full-width" type="submit">
                ${isEdit ? "変更を保存" : "追加する"}
            </button>

            ${
                isEdit
                    ? `
                        <button
                            class="danger-button full-width"
                            type="button"
                            id="delete-todo-form"
                        >
                            このToDoを削除
                        </button>
                    `
                    : ""
            }

        </form>
    `;

    document
        .getElementById("cancel-todo")
        .addEventListener("click", async () => {
            await renderTodoScreen(screen);
        });

    document
        .getElementById("todo-form")
        .addEventListener("submit", async (event) => {
            event.preventDefault();

            const title = document
                .getElementById("todo-title")
                .value.trim();

            const duration = Number(
                document.getElementById("todo-duration").value
            );

            const type = document.querySelector(
                'input[name="todo-type"]:checked'
            ).value;

            if (!title) {
                alert("タイトルを入力してください。");
                return;
            }

            if (!duration || duration <= 0) {
                alert("所要時間を正しく入力してください。");
                return;
            }

            const now = new Date().toISOString();

            const newTodo = {
                id: todo?.id || createId(),
                title,
                duration,
                type,

                // 繰り返しToDoを編集した場合、
                // Timeline上の配置情報はテンプレートには持たせない
                date:
                    type === "routine"
                        ? null
                        : todo?.date ?? null,

                startTime:
                    type === "routine"
                        ? null
                        : todo?.startTime ?? null,

                completed:
                    type === "routine"
                        ? false
                        : todo?.completed ?? false,

                createdAt:
                    todo?.createdAt ||
                    now
            };

            await saveTodo(newTodo);
            await renderTodoScreen(screen);
        });

    const deleteButton =
        document.getElementById("delete-todo-form");

    if (deleteButton) {
        deleteButton.addEventListener("click", async () => {
            const confirmed = confirm(
                "このToDoを削除しますか？"
            );

            if (!confirmed) return;

            await deleteTodo(todo.id);
            await renderTodoScreen(screen);
        });
    }
}

// =========================
// Calendar
// =========================

async function renderCalendarScreen(screen) {
    const selected =
        new Date(`${selectedDate}T00:00:00`);

    const year = selected.getFullYear();
    const month = selected.getMonth();

    const firstDay =
        new Date(year, month, 1);

    const lastDay =
        new Date(year, month + 1, 0);

    const firstWeekday =
        firstDay.getDay();

    const daysInMonth =
        lastDay.getDate();

    let calendarDays = "";

    for (let i = 0; i < firstWeekday; i++) {
        calendarDays += `
            <div class="calendar-day empty"></div>
        `;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateString =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const selectedClass =
            dateString === selectedDate
                ? "selected"
                : "";

        const todayClass =
            dateString === getTodayDateString()
                ? "today"
                : "";

        calendarDays += `
            <button
                class="calendar-day ${selectedClass} ${todayClass}"
                data-date="${dateString}"
            >
                ${day}
            </button>
        `;
    }

    screen.innerHTML = `
        <div class="screen-header">
            <div>
                <div class="screen-title">Calendar</div>
                <div class="screen-subtitle">
                    日付を選択してTimelineを表示
                </div>
            </div>

            ${
                !isToday(selectedDate)
                    ? `
                        <button
                            class="secondary-button"
                            id="calendar-today"
                        >
                            今日
                        </button>
                    `
                    : ""
            }
        </div>

        <div class="calendar-card">

            <div class="calendar-month-navigation">
                <button
                    class="icon-button"
                    id="previous-month"
                >
                    ‹
                </button>

                <strong>
                    ${year}年${month + 1}月
                </strong>

                <button
                    class="icon-button"
                    id="next-month"
                >
                    ›
                </button>
            </div>

            <div class="calendar-weekdays">
                <span>日</span>
                <span>月</span>
                <span>火</span>
                <span>水</span>
                <span>木</span>
                <span>金</span>
                <span>土</span>
            </div>

            <div class="calendar-grid">
                ${calendarDays}
            </div>

        </div>

        <div class="calendar-selected-info">
            <div class="calendar-selected-date">
                ${escapeHtml(formatDate(selectedDate))}
            </div>

            <button
                class="primary-button"
                id="open-selected-date"
            >
                この日のTimelineを見る
            </button>
        </div>
    `;

    screen
        .querySelectorAll(".calendar-day:not(.empty)")
        .forEach((button) => {
            button.addEventListener("click", async () => {
                selectedDate = button.dataset.date;

                await renderCalendarScreen(screen);
            });
        });

    document
        .getElementById("open-selected-date")
        .addEventListener("click", async () => {
            currentScreen = "timeline";

            updateNavigationState();

            await renderTimelineScreen(
                document.getElementById("screen")
            );
        });

    const todayButton =
        document.getElementById("calendar-today");

    if (todayButton) {
        todayButton.addEventListener("click", async () => {
            selectedDate = getTodayDateString();

            await renderCalendarScreen(screen);
        });
    }

    document
        .getElementById("previous-month")
        .addEventListener("click", async () => {
            const previousMonth =
                new Date(year, month - 1, 1);

            const targetYear =
                previousMonth.getFullYear();

            const targetMonth =
                previousMonth.getMonth();

            const currentDay =
                selected.getDate();

            const maxDay =
                new Date(
                    targetYear,
                    targetMonth + 1,
                    0
                ).getDate();

            const targetDay =
                Math.min(currentDay, maxDay);

            selectedDate =
                `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;

            await renderCalendarScreen(screen);
        });

    document
        .getElementById("next-month")
        .addEventListener("click", async () => {
            const nextMonth =
                new Date(year, month + 1, 1);

            const targetYear =
                nextMonth.getFullYear();

            const targetMonth =
                nextMonth.getMonth();

            const currentDay =
                selected.getDate();

            const maxDay =
                new Date(
                    targetYear,
                    targetMonth + 1,
                    0
                ).getDate();

            const targetDay =
                Math.min(currentDay, maxDay);

            selectedDate =
                `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;

            await renderCalendarScreen(screen);
        });
}

// =========================
// Memo
// =========================

async function renderMemoScreen(screen) {
    const memos = await getAllMemos();

    memos.sort(
        (a, b) =>
            new Date(b.updatedAt) -
            new Date(a.updatedAt)
    );

    screen.innerHTML = `
        <div class="screen-header">
            <div>
                <div class="screen-title">Memo</div>
                <div class="screen-subtitle">
                    思いついたことを残しておけます
                </div>
            </div>

            <button
                class="primary-button"
                id="add-memo-button"
            >
                ＋ Memo
            </button>
        </div>

        ${
            memos.length === 0
                ? `
                    <div class="empty-state">
                        <p>Memoはまだありません。</p>
                        <p>気になったことを自由に残せます。</p>
                    </div>
                `
                : `
                    <div class="memo-list">
                        ${memos
                            .map(
                                (memo) => `
                                    <button
                                        class="memo-list-item"
                                        data-id="${escapeHtml(
                                            memo.id
                                        )}"
                                    >
                                        <span class="memo-list-title">
                                            ${escapeHtml(
                                                memo.title
                                            )}
                                        </span>

                                        <span class="memo-list-arrow">
                                            ›
                                        </span>
                                    </button>
                                `
                            )
                            .join("")}
                    </div>
                `
        }
    `;

    document
        .getElementById("add-memo-button")
        .addEventListener("click", () => {
            renderMemoForm(screen);
        });

    screen
        .querySelectorAll(".memo-list-item")
        .forEach((button) => {
            button.addEventListener("click", async () => {
                const memos = await getAllMemos();

                const memo = memos.find(
                    (item) => item.id === button.dataset.id
                );

                if (memo) {
                    renderMemoForm(screen, memo);
                }
            });
        });
}

// =========================
// Memo form
// =========================

function renderMemoForm(screen, memo = null) {
    const isEdit = Boolean(memo);

    screen.innerHTML = `
        <div class="screen-header">
            <div class="screen-title">
                ${isEdit ? "Memoを編集" : "Memoを追加"}
            </div>

            <button
                class="secondary-button"
                id="cancel-memo"
            >
                キャンセル
            </button>
        </div>

        <form id="memo-form" class="form-card">

            <label>
                タイトル
                <input
                    type="text"
                    id="memo-title"
                    value="${escapeHtml(
                        memo?.title || ""
                    )}"
                    placeholder="例：あとで調べる"
                    required
                >
            </label>

            <label>
                本文
                <textarea
                    id="memo-content"
                    placeholder="メモを入力..."
                    required
                >${escapeHtml(
                    memo?.content || ""
                )}</textarea>
            </label>

            <button
                class="primary-button full-width"
                type="submit"
            >
                ${isEdit ? "保存" : "保存する"}
            </button>

            ${
                isEdit
                    ? `
                        <button
                            class="danger-button full-width"
                            type="button"
                            id="delete-memo-form"
                        >
                            削除
                        </button>
                    `
                    : ""
            }

        </form>
    `;

    document
        .getElementById("cancel-memo")
        .addEventListener("click", async () => {
            await renderMemoScreen(screen);
        });

    document
        .getElementById("memo-form")
        .addEventListener("submit", async (event) => {
            event.preventDefault();

            const title = document
                .getElementById("memo-title")
                .value.trim();

            const content = document
                .getElementById("memo-content")
                .value.trim();

            if (!title) {
                alert("タイトルを入力してください。");
                return;
            }

            if (!content) {
                alert("本文を入力してください。");
                return;
            }

            const now = new Date().toISOString();

            const newMemo = {
                id: memo?.id || createId(),
                title,
                content,
                createdAt:
                    memo?.createdAt || now,
                updatedAt: now
            };

            await saveMemo(newMemo);
            await renderMemoScreen(screen);
        });

    const deleteButton =
        document.getElementById("delete-memo-form");

    if (deleteButton) {
        deleteButton.addEventListener("click", async () => {
            const confirmed = confirm(
                "このMemoを削除しますか？"
            );

            if (!confirmed) return;

            await deleteMemo(memo.id);
            await renderMemoScreen(screen);
        });
    }
}

// =========================
// Backup
// =========================

async function createBackupData() {
    const routines = await getAllRoutines();
    const todos = await getAllTodos();
    const memos = await getAllMemos();

    return {
        version: 1,
        exportedAt: new Date().toISOString(),
        colorTheme: getCurrentColorTheme(),
        routines,
        todos,
        memos
    };
}

async function backupData() {
    try {
        const data = await createBackupData();

        const json = JSON.stringify(data, null, 2);

        const blob = new Blob(
            [json],
            {
                type: "application/json"
            }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download =
            `daily-timeline-backup-${getTodayDateString()}.json`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);

        alert("バックアップファイルを作成しました。");
    } catch (error) {
        console.error(error);
        alert("バックアップに失敗しました。");
    }
}

function clearStore(storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            storeName,
            "readwrite"
        );

        const store =
            transaction.objectStore(storeName);

        const request = store.clear();

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

async function restoreBackupData(file) {
    try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (
            !data ||
            data.version !== 1 ||
            !Array.isArray(data.routines) ||
            !Array.isArray(data.todos) ||
            !Array.isArray(data.memos)
        ) {
            throw new Error("Invalid backup format");
        }

        const confirmed = confirm(
            "現在のルーティン・ToDo・Memoをバックアップの内容に置き換えます。よろしいですか？"
        );

        if (!confirmed) {
            return;
        }

        await clearStore("routines");
        await clearStore("todos");
        await clearStore("memos");

        for (const routine of data.routines) {
            await saveRoutine(routine);
        }

        for (const todo of data.todos) {
            await saveTodo(todo);
        }

        for (const memo of data.memos) {
            await saveMemo(memo);
        }

        const colorTheme =
            COLOR_THEMES[data.colorTheme]
                ? data.colorTheme
                : "monochrome";

        localStorage.setItem(
            "dailyTimelineColor",
            colorTheme
        );

        applyColorTheme();

        alert(
            "データを復元しました。"
        );

        await renderSettingsScreen(
            document.getElementById("screen")
        );
    } catch (error) {
        console.error(error);
        alert(
            "バックアップファイルを読み込めませんでした。"
        );
    }
}

async function deleteAllData() {
    const firstConfirmed = confirm(
        "すべてのルーティン・ToDo・Memoを削除します。よろしいですか？"
    );

    if (!firstConfirmed) return;

    const secondConfirmed = confirm(
        "本当にすべて削除しますか？この操作は元に戻せません。"
    );

    if (!secondConfirmed) return;

    await clearStore("routines");
    await clearStore("todos");
    await clearStore("memos");

    await saveSetting({
        id: "initialized",
        value: false
    });

    localStorage.setItem(
        "dailyTimelineColor",
        "monochrome"
    );

    applyColorTheme();

    await initializeData();

    selectedDate = getTodayDateString();

    alert(
        "すべてのデータを削除し、初期状態に戻しました。"
    );

    await renderSettingsScreen(
        document.getElementById("screen")
    );
}

// =========================
// Settings
// =========================

function renderSettingsScreen(screen) {
    const currentTheme = getCurrentColorTheme();

    screen.innerHTML = `
        <div class="screen-header">
            <div>
                <div class="screen-title">Settings</div>
                <div class="screen-subtitle">
                    アプリの設定
                </div>
            </div>
        </div>

        <div class="settings-section-title">
            データ
        </div>

        <div class="settings-list">

            <button
                class="settings-button"
                id="backup-button"
            >
                <div>
                    <strong>バックアップ</strong>
                    <span>データをJSONファイルに保存</span>
                </div>
                <span class="settings-arrow">›</span>
            </button>

            <button
                class="settings-button"
                id="restore-button"
            >
                <div>
                    <strong>データを復元</strong>
                    <span>バックアップファイルから復元</span>
                </div>
                <span class="settings-arrow">›</span>
            </button>

            <button
                class="settings-button danger-setting"
                id="delete-all-button"
            >
                <div>
                    <strong>すべてのデータを削除</strong>
                    <span>初期状態に戻します</span>
                </div>
                <span class="settings-arrow">›</span>
            </button>

        </div>

        <div class="settings-section-title">
            アプリ
        </div>

        <div class="settings-list">

            <div class="settings-item">
                <div>
                    <strong>通知</strong>
                    <span>今後実装予定</span>
                </div>
            </div>

            <div class="settings-item settings-color-item">
                <div>
                    <strong>カラー</strong>
                    <span>アプリのアクセントカラー</span>
                </div>

                <div class="color-selector">
                    ${Object.entries(COLOR_THEMES)
                        .map(
                            ([key, theme]) => `
                                <button
                                    class="color-option ${
                                        key === currentTheme
                                            ? "selected"
                                            : ""
                                    }"
                                    data-color="${key}"
                                    style="--color-option: ${theme.color};"
                                    aria-label="${escapeHtml(
                                        theme.name
                                    )}"
                                    title="${escapeHtml(
                                        theme.name
                                    )}"
                                >
                                    ${
                                        key === currentTheme
                                            ? "✓"
                                            : ""
                                    }
                                </button>
                            `
                        )
                        .join("")}
                </div>
            </div>

            <div class="settings-item">
                <div>
                    <strong>アプリ情報</strong>
                    <span>Daily Timeline</span>
                </div>
            </div>

        </div>

        <input
            type="file"
            id="restore-file-input"
            accept=".json,application/json"
            hidden
        >
    `;

    document
        .getElementById("backup-button")
        .addEventListener("click", async () => {
            await backupData();
        });

    document
        .getElementById("restore-button")
        .addEventListener("click", () => {
            document
                .getElementById("restore-file-input")
                .click();
        });

    document
        .getElementById("restore-file-input")
        .addEventListener("change", async (event) => {
            const file = event.target.files?.[0];

            if (!file) return;

            await restoreBackupData(file);

            event.target.value = "";
        });

    document
        .getElementById("delete-all-button")
        .addEventListener("click", async () => {
            await deleteAllData();
        });

    screen
        .querySelectorAll(".color-option")
        .forEach((button) => {
            button.addEventListener("click", () => {
                const color =
                    button.dataset.color;

                if (!COLOR_THEMES[color]) {
                    return;
                }

                localStorage.setItem(
                    "dailyTimelineColor",
                    color
                );

                applyColorTheme();

                renderSettingsScreen(screen);
            });
        });
}

// =========================
// Navigation state
// =========================

function updateNavigationState() {
    document.querySelectorAll(".nav-item").forEach((item) => {
        item.classList.toggle(
            "active",
            item.dataset.screen === currentScreen
        );
    });
}

// =========================
// Service Worker
// =========================

function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
        return;
    }

    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("./sw.js")
            .then(() => {
                console.log("Service Worker registered.");
            })
            .catch((error) => {
                console.error(
                    "Service Worker registration failed:",
                    error
                );
            });
    });
}

// =========================
// App initialization
// =========================

async function initializeApp() {
    try {
        db = await openDatabase();

        await initializeData();

        // 日付が変わっていた場合、一度きりToDoを
        // ToDoリストへ戻す
        await restoreExpiredOneTimeTodos();

        applyColorTheme();

        setupNavigation();
        updateNavigationState();

        await renderScreen();
    } catch (error) {
        console.error(error);

        document.getElementById("screen").innerHTML = `
            <div class="empty-state">
                <p>アプリの初期化に失敗しました。</p>
                <p>
                    ブラウザのIndexedDBが利用できるか確認してください。
                </p>
            </div>
        `;
    }
}

registerServiceWorker();
initializeApp();

