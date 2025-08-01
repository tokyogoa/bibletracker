document.addEventListener('DOMContentLoaded', () => {
    const bibleData = {
        "창세기": 50, "출애굽기": 40, "레위기": 27, "민수기": 36, "신명기": 34, "여호수아": 24, "사사기": 21, "룻기": 4, "사무엘상": 31, "사무엘하": 24, "열왕기상": 22, "열왕기하": 25, "역대상": 29, "역대하": 36, "에스라": 10, "느헤미야": 13, "에스더": 10, "욥기": 42, "시편": 150, "잠언": 31, "전도서": 12, "아가": 8, "이사야": 66, "예레미야": 52, "예레미야애가": 5, "에스겔": 48, "다니엘": 12, "호세아": 14, "요엘": 3, "아모스": 9, "오바댜": 1, "요나": 4, "미가": 7, "나훔": 3, "하박국": 3, "스바냐": 3, "학개": 2, "스가랴": 14, "말라기": 4,
        "마태복음": 28, "마가복음": 16, "누가복음": 24, "요한복음": 21, "사도행전": 28, "로마서": 16, "고린도전서": 16, "고린도후서": 13, "갈라디아서": 6, "에베소서": 6, "빌립보서": 4, "골로새서": 4, "데살로니가전서": 5, "데살로니가후서": 3, "디모데전서": 6, "디모데후서": 4, "디도서": 3, "빌레몬서": 1, "히브리서": 13, "야고보서": 5, "베드로전서": 5, "베드로후서": 3, "요한1서": 5, "요한2서": 1, "요한3서": 1, "유다서": 1, "요한계시록": 22
    };
    const totalChapters = Object.values(bibleData).reduce((sum, chapters) => sum + chapters, 0);

    const dashboard = document.getElementById('dashboard');
    const addUserBtn = document.getElementById('add-user-btn');
    const newUserNameInput = document.getElementById('new-user-name');
    const viewFilter = document.getElementById('view-filter');

    // 모달 요소
    const modal = document.getElementById('progress-modal');
    const closeModalBtn = document.querySelector('.close-btn');
    const modalUserName = document.getElementById('modal-user-name');
    const bibleBookSelect = document.getElementById('bible-book');
    const bibleChapterSelect = document.getElementById('bible-chapter');
    const saveProgressBtn = document.getElementById('save-progress-btn');

    let users = JSON.parse(localStorage.getItem('bibleTrackerUsers')) || [];
    let currentUserId = null;

    function saveUsersToLocalStorage() {
        const serializableUsers = users.map(u => ({
            ...u,
            progress: Object.fromEntries(
                Object.entries(u.progress).map(([key, value]) => [key, Array.from(value)])
            )
        }));
        localStorage.setItem('bibleTrackerUsers', JSON.stringify(serializableUsers));
    }

    function getProgressInfo(user, bookName = null) {
        if (bookName && bookName !== 'all') {
            const bookTotalChapters = bibleData[bookName];
            const readChapters = user.progress[bookName] ? user.progress[bookName].size : 0;
            const percentage = bookTotalChapters > 0 ? (readChapters / bookTotalChapters) * 100 : 0;
            return { readChapters, totalChapters: bookTotalChapters, percentage };
        } else {
            // 전체 진행 상황
            let readChapters = 0;
            for (const book in user.progress) {
                readChapters += user.progress[book].size;
            }
            const percentage = totalChapters > 0 ? (readChapters / totalChapters) * 100 : 0;
            return { readChapters, totalChapters: totalChapters, percentage };
        }
    }

    function renderDashboard() {
        dashboard.innerHTML = '';
        const selectedView = viewFilter.value;

        if (users.length === 0) {
            dashboard.innerHTML = '<p class="empty-message">아직 등록된 멤버가 없습니다. 첫 번째 멤버를 추가해보세요!</p>';
            return;
        }

        const usersWithProgress = users.map(user => ({
            ...user,
            progressInfo: getProgressInfo(user, selectedView)
        }));

        usersWithProgress.sort((a, b) => b.progressInfo.percentage - a.progressInfo.percentage);

        usersWithProgress.forEach(user => {
            const { readChapters, totalChapters: currentTotal, percentage } = user.progressInfo;
            
            let achievementIcon = '';
            let progressText = '';

            const card = document.createElement('div');
            card.className = 'user-card';
            card.dataset.id = user.id;

            let progressDisplayHTML = '';

            if (selectedView === 'all') {
                if (percentage >= 75) {
                    achievementIcon = `<span class="achievement-icon" title="전체 75% 이상 달성!">🏆</span>`;
                }
                progressText = `총 ${currentTotal}장 중 ${readChapters}장 읽음`;
                progressDisplayHTML = `
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${percentage.toFixed(2)}%;">${percentage.toFixed(1)}%</div>
                    </div>
                `;
            } else {
                if (percentage >= 100) {
                    achievementIcon = `<span class="achievement-icon" title="${selectedView} 완독!">⭐</span>`;
                }
                progressText = `${selectedView} ${currentTotal}장 중 ${readChapters}장 읽음`;
                let gridCellsHTML = '';
                for (let i = 1; i <= currentTotal; i++) {
                    const isRead = user.progress[selectedView]?.has(i) ? 'read' : '';
                    gridCellsHTML += `<div class="chapter-cell ${isRead}">${i}</div>`;
                }
                progressDisplayHTML = `<div class="chapter-grid">${gridCellsHTML}</div>`;
            }

            card.innerHTML = `
                <h3>
                    <span class="name-container">${user.name} ${achievementIcon}</span>
                    <button class="delete-user-btn" title="멤버 삭제">&times;</button>
                </h3>
                ${progressDisplayHTML}
                <p class="progress-text">${progressText}</p>
                <button class="add-progress-btn">읽은 부분 추가</button>
            `;
            dashboard.appendChild(card);
        });
    }

    function addUser() {
        const name = newUserNameInput.value.trim();
        if (name === '') {
            alert('이름을 입력해주세요.');
            return;
        }
        if (users.some(user => user.name === name)) {
            alert('이미 등록된 이름입니다.');
            return;
        }

        const newUser = {
            id: Date.now(),
            name: name,
            progress: {} // { "창세기": Set(1, 2, 3), "출애굽기": Set(1, 5) }
        };

        users.push(newUser);
        saveUsersToLocalStorage();
        renderDashboard();
        newUserNameInput.value = '';
    }

    function openProgressModal(userId) {
        currentUserId = userId;
        const user = users.find(u => u.id === userId);
        modalUserName.textContent = user.name;
        const selectedView = viewFilter.value;

        // 성경책 선택 옵션 채우기
        bibleBookSelect.innerHTML = '';
        for (const book in bibleData) {
            const option = document.createElement('option');
            option.value = book;
            option.textContent = book;
            bibleBookSelect.appendChild(option);
        }

        // 필터에서 선택한 책을 모달의 기본값으로 설정
        if (selectedView !== 'all') {
            bibleBookSelect.value = selectedView;
        }

        renderModalGrid();
        modal.classList.add('visible');
    }

    function renderModalGrid() {
        const selectedBook = bibleBookSelect.value;
        const bookTotalChapters = bibleData[selectedBook];
        const modalGrid = document.getElementById('modal-chapter-grid');
        modalGrid.innerHTML = '';

        const user = users.find(u => u.id === currentUserId);
        if (!user) return;

        for (let i = 1; i <= bookTotalChapters; i++) {
            const cell = document.createElement('div');
            cell.className = 'chapter-cell';
            cell.textContent = i;
            cell.dataset.chapter = i;

            const isRead = user.progress[selectedBook]?.has(i);
            if (isRead) {
                cell.classList.add('read');
            }

            cell.addEventListener('click', () => {
                // 이미 읽은 챕터는 선택/해제 불가
                if (cell.classList.contains('read')) return;
                // 선택 토글
                cell.classList.toggle('selected');
            });
            modalGrid.appendChild(cell);
        }
    }

    function saveProgress() {
        if (currentUserId === null) return;

        const user = users.find(u => u.id === currentUserId);
        const book = bibleBookSelect.value;

        if (!user.progress[book]) {
            user.progress[book] = new Set();
        }

        const selectedCells = modal.querySelectorAll('.chapter-cell.selected');
        
        if (selectedCells.length > 0) {
            selectedCells.forEach(cell => {
                const chapter = parseInt(cell.dataset.chapter);
                user.progress[book].add(chapter);
            });
            saveUsersToLocalStorage();
            renderDashboard();
        }
        
        modal.classList.remove('visible');
    }

    function deleteUser(userId) {
        const userToDelete = users.find(u => u.id === userId);
        if (!userToDelete) return;

        if (confirm(`'${userToDelete.name}'님을 정말 삭제하시겠습니까? 모든 읽기 기록이 사라집니다.`)) {
            users = users.filter(user => user.id !== userId);
            saveUsersToLocalStorage();
            renderDashboard();
        }
    }

    function populateFilter() {
        for (const book in bibleData) {
            const option = document.createElement('option');
            option.value = book;
            option.textContent = book;
            viewFilter.appendChild(option);
        }
    }

    // 페이지 로드 시 사용자 데이터 불러오기 및 Set으로 변환
    function loadUsers() {
        const storedUsers = JSON.parse(localStorage.getItem('bibleTrackerUsers')) || [];
        users = storedUsers.map(user => ({
            ...user,
            progress: Object.fromEntries(
                Object.entries(user.progress).map(([key, value]) => [key, new Set(value)])
            )
        }));

        populateFilter();
        renderDashboard();
    }

    // 이벤트 리스너
    addUserBtn.addEventListener('click', addUser);
    newUserNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addUser();
    });

    dashboard.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-progress-btn')) {
            const card = e.target.closest('.user-card');
            const userId = parseInt(card.dataset.id);
            openProgressModal(userId);
        } else if (e.target.classList.contains('delete-user-btn')) {
            const card = e.target.closest('.user-card');
            const userId = parseInt(card.dataset.id);
            deleteUser(userId);
        }
    });

    viewFilter.addEventListener('change', renderDashboard);
    bibleBookSelect.addEventListener('change', renderModalGrid);
    saveProgressBtn.addEventListener('click', saveProgress);
    closeModalBtn.addEventListener('click', () => modal.classList.remove('visible'));
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('visible');
        }
    });

    // 초기 로드
    loadUsers();
});