class HabitTracker {
    constructor() {
        this.habits = this.loadData();
        this.selectedHabitId = null;
        this.init();
    }

    init() {
        this.renderHabits();
        this.attachEventListeners();
        if (this.habits.length > 0) {
            this.selectHabit(this.habits[0].id);
        }
    }

    loadData() {
        const data = localStorage.getItem('habitTrackerData');
        return data ? JSON.parse(data) : [];
    }

    saveData() {
        localStorage.setItem('habitTrackerData', JSON.stringify(this.habits));
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    addHabit(name, color) {
        const habit = {
            id: this.generateId(),
            name,
            color,
            createdDate: this.formatDate(new Date()),
            completions: {}
        };
        this.habits.push(habit);
        this.saveData();
        this.renderHabits();
        this.selectHabit(habit.id);
    }

    deleteHabit(id) {
        this.habits = this.habits.filter(h => h.id !== id);
        this.saveData();
        this.renderHabits();
        if (this.selectedHabitId === id) {
            this.selectedHabitId = null;
            if (this.habits.length > 0) {
                this.selectHabit(this.habits[0].id);
            } else {
                this.renderCalendar();
                this.updateStats();
            }
        }
    }

    toggleCompletion(habitId, date) {
        const habit = this.habits.find(h => h.id === habitId);
        if (habit) {
            habit.completions[date] = !habit.completions[date];
            this.saveData();
            this.renderCalendar();
            this.updateStats();
        }
    }

    selectHabit(id) {
        this.selectedHabitId = id;
        this.renderHabits();
        this.renderCalendar();
        this.updateStats();
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    renderHabits() {
        const container = document.getElementById('habitsList');
        container.innerHTML = '';
        
        this.habits.forEach(habit => {
            const item = document.createElement('div');
            item.className = `habit-item ${habit.id === this.selectedHabitId ? 'active' : ''}`;
            item.innerHTML = `
                <div class="habit-color" style="background: ${habit.color}"></div>
                <span class="habit-name">${habit.name}</span>
                <button class="habit-delete" data-id="${habit.id}">×</button>
            `;
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('habit-delete')) {
                    this.selectHabit(habit.id);
                }
            });
            container.appendChild(item);
        });
    }

    renderCalendar() {
        const calendar = document.getElementById('calendar');
        const monthLabels = document.getElementById('monthLabels');
        const dayLabels = document.getElementById('dayLabels');
        const habitTitle = document.getElementById('habitTitle');

        calendar.innerHTML = '';
        monthLabels.innerHTML = '';
        dayLabels.innerHTML = '';

        const habit = this.habits.find(h => h.id === this.selectedHabitId);
        if (!habit) {
            habitTitle.textContent = 'Select a habit to view';
            return;
        }

        habitTitle.textContent = habit.name;

        const today = new Date();
        const endDate = new Date(today);
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 364);

        // Adjust to start on Sunday
        const startDay = startDate.getDay();
        startDate.setDate(startDate.getDate() - startDay);

        // Day labels
        const days = ['Mon', 'Wed', 'Fri'];
        for (let i = 0; i < 7; i++) {
            const label = document.createElement('div');
            label.className = 'day-label';
            label.textContent = i % 2 === 1 ? days[Math.floor(i / 2)] : '';
            dayLabels.appendChild(label);
        }

        // Generate calendar
        const currentDate = new Date(startDate);
        let currentMonth = -1;
        const monthsAdded = [];

        while (currentDate <= endDate) {
            const month = currentDate.getMonth();
            const weekStart = new Date(currentDate);

            // Month labels
            if (month !== currentMonth) {
                currentMonth = month;
                const monthName = currentDate.toLocaleDateString('en-US', { month: 'short' });
                if (!monthsAdded.includes(monthName + currentDate.getFullYear())) {
                    const monthLabel = document.createElement('div');
                    monthLabel.textContent = monthName;
                    monthLabels.appendChild(monthLabel);
                    monthsAdded.push(monthName + currentDate.getFullYear());
                }
            }

            // Week column
            for (let i = 0; i < 7; i++) {
                const cell = document.createElement('div');
                cell.className = 'day-cell';
                const dateStr = this.formatDate(currentDate);
                const isCompleted = habit.completions[dateStr];
                const level = isCompleted ? 4 : 0;
                
                cell.setAttribute('data-level', level);
                cell.setAttribute('data-date', dateStr);
                cell.title = `${dateStr}${isCompleted ? ' - Completed' : ''}`;
                
                cell.addEventListener('click', () => {
                    this.toggleCompletion(habit.id, dateStr);
                });

                calendar.appendChild(cell);
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
    }

    updateStats() {
        const habit = this.habits.find(h => h.id === this.selectedHabitId);
        
        if (!habit) {
            document.getElementById('currentStreak').textContent = '0';
            document.getElementById('longestStreak').textContent = '0';
            document.getElementById('completionRate').textContent = '0%';
            return;
        }

        const completions = habit.completions;
        const dates = Object.keys(completions).sort();
        
        // Current streak
        let currentStreak = 0;
        const today = this.formatDate(new Date());
        let checkDate = new Date();
        
        while (true) {
            const dateStr = this.formatDate(checkDate);
            if (completions[dateStr]) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        // Longest streak
        let longestStreak = 0;
        let tempStreak = 0;
        let prevDate = null;

        dates.forEach(dateStr => {
            if (completions[dateStr]) {
                if (prevDate) {
                    const prev = new Date(prevDate);
                    const curr = new Date(dateStr);
                    const diffDays = Math.floor((curr - prev) / (1000 * 60 * 60 * 24));
                    
                    if (diffDays === 1) {
                        tempStreak++;
                    } else {
                        longestStreak = Math.max(longestStreak, tempStreak);
                        tempStreak = 1;
                    }
                } else {
                    tempStreak = 1;
                }
                prevDate = dateStr;
            }
        });
        longestStreak = Math.max(longestStreak, tempStreak);

        // Completion rate (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        let completedDays = 0;
        let totalDays = 0;

        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = this.formatDate(date);
            totalDays++;
            if (completions[dateStr]) completedDays++;
        }

        const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

        document.getElementById('currentStreak').textContent = currentStreak;
        document.getElementById('longestStreak').textContent = longestStreak;
        document.getElementById('completionRate').textContent = `${completionRate}%`;
    }

    attachEventListeners() {
        const modal = document.getElementById('modal');
        const addHabitBtn = document.getElementById('addHabitBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const habitForm = document.getElementById('habitForm');

        addHabitBtn.addEventListener('click', () => {
            modal.classList.add('active');
        });

        cancelBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            habitForm.reset();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                habitForm.reset();
            }
        });

        habitForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('habitName').value.trim();
            const color = document.getElementById('habitColor').value;
            
            if (name) {
                this.addHabit(name, color);
                modal.classList.remove('active');
                habitForm.reset();
            }
        });

        document.getElementById('habitsList').addEventListener('click', (e) => {
            if (e.target.classList.contains('habit-delete')) {
                const id = e.target.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this habit?')) {
                    this.deleteHabit(id);
                }
            }
        });
    }
}

// Initialize app
const app = new HabitTracker();
