import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";
import { getDatabase, ref, onValue, query, limitToLast } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-database.js";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBEothAGr3ZcfeA45FTB_IA6IJmTXLC-LI",
  authDomain: "feat-63kty.firebaseapp.com",
  databaseURL: "https://feat-63kty-default-rtdb.firebaseio.com",
  projectId: "feat-63kty",
  storageBucket: "feat-63kty.firebasestorage.app",
  messagingSenderId: "692622916677",
  appId: "1:692622916677:web:4b56b824ed52fc7b28f72c"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

document.addEventListener('DOMContentLoaded', () => {
    const caloriesConsumedElement = document.getElementById('calories-consumed');
    const caloriesGoalElement = document.getElementById('calories-goal');
    const progressCircle = document.querySelector('.progress-circle');
    const readingsList = document.getElementById('readings-list');
    const noReadingsMessage = document.querySelector('.no-readings');
    const greetingMessageElement = document.getElementById('greeting-message');
    const motivationTextElement = document.getElementById('motivation-text');
    const caloriesChartCanvas = document.getElementById('calories-chart');
    let caloriesChart;

    const MAX_CALORIES_GOAL = 2000;
    caloriesGoalElement.textContent = MAX_CALORIES_GOAL;

    const calorieValues = {
        "almendras": 5.76,
        "nueces": 6.54,
        "anacardos": 5.53
    };

    const motivationalMessages = [
        "Cada pequeño paso cuenta hacia un gran cambio.",
        "Tu cuerpo es tu templo, nútrelo con sabiduría.",
        "La constancia es la clave del éxito.",
        "Hoy es un buen día para alcanzar tus metas.",
        "¡Sigue así, estás progresando!"
    ];

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    function updateGreeting() {
        const now = new Date();
        const hour = now.getHours();
        const greeting = (hour >= 6 && hour < 12) ? "¡Buenos días!" : (hour >= 12 && hour < 18) ? "¡Buenas tardes!" : "¡Buenas noches!";
        greetingMessageElement.textContent = greeting;
    }

    function updateMotivationalMessage() {
        const randomIndex = Math.floor(Math.random() * motivationalMessages.length);
        motivationTextElement.textContent = motivationalMessages[randomIndex];
    }

    function createBarChart(weeklyData) {
        if (caloriesChart) {
            caloriesChart.destroy();
        }

        caloriesChart = new Chart(caloriesChartCanvas, {
            type: 'bar',
            data: {
                labels: weeklyData.map(item => item.day),
                datasets: [{
                    label: 'Calorías Consumidas',
                    data: weeklyData.map(item => item.calories),
                    backgroundColor: '#28a745',
                    borderColor: '#218838',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Calorías'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Día'
                        }
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // --- NUEVA LÓGICA PARA PROCESAR LOS DATOS DE LA SEMANA ---
    function processWeeklyReadings(readingsData) {
        const weeklyCalories = new Array(7).fill(0);
        
        if (readingsData) {
            const now = new Date();
            // Start of week (Sunday)
            const startOfWeek = new Date(now);
            startOfWeek.setHours(0, 0, 0, 0);
            startOfWeek.setDate(now.getDate() - now.getDay());

            Object.values(readingsData).forEach(reading => {
                const readingDate = new Date(reading.timestamp);
                
                // Check if reading is from current week
                if (readingDate >= startOfWeek) {
                    const dayIndex = readingDate.getDay();
                    const calories = reading.grams_dispensed * calorieValues[reading.food_type];
                    weeklyCalories[dayIndex] += calories;
                }
            });
        }

        // Create chart data
        const chartData = weeklyCalories.map((calories, index) => ({
            day: dayNames[index],
            calories: Math.round(calories)
        }));

        createBarChart(chartData);
    }

    // Add this function after the calorieValues declaration
    function updateDailyCalories(readingsData) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let dailyCalories = 0;

        if (readingsData) {
            Object.values(readingsData).forEach(reading => {
                const readingDate = new Date(reading.timestamp);
                readingDate.setHours(0, 0, 0, 0);
                
                if (readingDate.getTime() === today.getTime()) {
                    const calories = reading.grams_dispensed * calorieValues[reading.food_type];
                    dailyCalories += calories;
                }
            });
        }

        // Update the calories display and progress circle
        const roundedCalories = Math.round(dailyCalories);
        caloriesConsumedElement.textContent = roundedCalories;
        
        // Update progress circle
        const progress = (roundedCalories / MAX_CALORIES_GOAL) * 100;
        progressCircle.style.background = `conic-gradient(
            #28a745 ${progress * 3.6}deg,
            #e9ecef ${progress * 3.6}deg
        )`;
    }

    // Add these variables at the top
    let currentPage = 1;
    const ITEMS_PER_PAGE = 5;

    // Replace the existing readings fetch code
    async function fetchReadings(page = 1) {
        const readingsRef = ref(database, 'readings');
        
        onValue(readingsRef, (snapshot) => {
            const readingsData = snapshot.val();
            if (readingsData) {
                displayReadings(readingsData, page);
                processWeeklyReadings(readingsData);
                updateDailyCalories(readingsData); // Add this line
            } else {
                const readingsList = document.getElementById('readings-list');
                const noReadingsMessage = document.querySelector('.no-readings');
                readingsList.style.display = 'none';
                noReadingsMessage.style.display = 'block';
                caloriesConsumedElement.textContent = '0';
                progressCircle.style.background = 'conic-gradient(#e9ecef 360deg, #e9ecef 360deg)';
            }
        });
    }

    function displayReadings(readingsData, page) {
        const readingsList = document.getElementById('readings-list');
        const noReadingsMessage = document.querySelector('.no-readings');
        const prevPageBtn = document.getElementById('prevPage');
        const nextPageBtn = document.getElementById('nextPage');
        const pageInfo = document.getElementById('pageInfo');

        // Convertir a array y ordenar por timestamp ISO
        const readingsArray = Object.entries(readingsData)
            .map(([key, reading]) => ({
                ...reading,
                key,
                // Convertir timestamp a objeto Date
                timestampDate: new Date(reading.timestamp)
            }))
            .sort((a, b) => {
                // Ordenar de más reciente a más antiguo
                return b.timestampDate - a.timestampDate;
            });

        const totalReadings = readingsArray.length;
        const totalPages = Math.ceil(totalReadings / ITEMS_PER_PAGE);
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        
        const pageReadings = readingsArray.slice(startIndex, endIndex);

        // Actualizar controles de paginación
        prevPageBtn.disabled = page === 1;
        nextPageBtn.disabled = page === totalPages;
        pageInfo.textContent = `Página ${page} de ${totalPages}`;

        // Mostrar lecturas
        readingsList.innerHTML = '';
        pageReadings.forEach(reading => {
            const li = document.createElement('li');
            // Create date from UTC timestamp and convert to local string
            const timestamp = new Date(reading.timestamp);
            const utcDate = new Date(timestamp.getTime() + timestamp.getTimezoneOffset() * 60000);
            const formattedDate = utcDate.toLocaleString('es-EC', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            const calculatedCalories = calorieValues[reading.food_type] * reading.grams_dispensed;
            
            li.innerHTML = `
                <span><strong>Fecha/Hora:</strong> ${formattedDate}</span>
                <span><strong>Comida:</strong> ${reading.food_type}</span>
                <span><strong>Gramos:</strong> ${reading.grams_dispensed} g</span>
                <span><strong>Calorías:</strong> ${Math.round(calculatedCalories)} kcal</span>
            `;
            readingsList.appendChild(li);
        });

        readingsList.style.display = pageReadings.length ? 'block' : 'none';
        noReadingsMessage.style.display = pageReadings.length ? 'none' : 'block';
    }

    // Add event listeners for pagination
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchReadings(currentPage);
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        currentPage++;
        fetchReadings(currentPage);
    });

    // ELIMINAR todo este bloque ya que duplica funcionalidad
    /*
    const lastReadingsQuery = query(ref(database, 'readings'), limitToLast(5));
    onValue(lastReadingsQuery, (snapshot) => {
        const readingsData = snapshot.val();
        readingsList.innerHTML = '';

        if (readingsData) {
            const readingsArray = Object.values(readingsData).reverse();
            noReadingsMessage.style.display = 'none';

            readingsArray.forEach(reading => {
                const li = document.createElement('li');
                const timestamp = new Date(reading.timestamp);
                const formattedDate = `${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}`;
                const caloriesPerGram = calorieValues[reading.food_type] || 0;
                const calculatedCalories = reading.grams_dispensed * caloriesPerGram;

                li.innerHTML = `
                    <span><strong>Fecha/Hora:</strong> ${formattedDate}</span>
                    <span><strong>Comida:</strong> ${reading.food_type}</span>
                    <span><strong>Gramos:</strong> ${reading.grams_dispensed} g</span>
                    <span><strong>Calorías:</strong> ${Math.round(calculatedCalories)} kcal</span>
                `;
                readingsList.appendChild(li);
            });
        } else {
            noReadingsMessage.style.display = 'block';
        }
    });
    */

    updateGreeting();
    updateMotivationalMessage();
    setInterval(updateGreeting, 60000);
    setInterval(updateMotivationalMessage, 180000);
    
    // Agregar esta línea para cargar las lecturas iniciales
    fetchReadings(currentPage);
});