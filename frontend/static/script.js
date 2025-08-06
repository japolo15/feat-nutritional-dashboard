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
        const weeklyCalories = new Array(7).fill(0); // [0, 0, 0, 0, 0, 0, 0] para cada día

        if (readingsData) {
            const now = new Date();
            const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()); // Obtiene el inicio de la semana (domingo)

            for (const key in readingsData) {
                const reading = readingsData[key];
                const timestamp = new Date(reading.timestamp);

                if (timestamp >= startOfWeek) { // Filtra las lecturas de la semana actual
                    const dayOfWeek = timestamp.getDay(); // 0 = Domingo, 1 = Lunes, etc.
                    const caloriesPerGram = calorieValues[reading.food_type] || 0;
                    weeklyCalories[dayOfWeek] += (reading.grams_dispensed * caloriesPerGram);
                }
            }
        }
        
        // Formatea los datos para Chart.js
        const chartData = dayNames.map((day, index) => ({
            day: day,
            calories: Math.round(weeklyCalories[index])
        }));
        
        createBarChart(chartData);
    }


    const readingsRef = ref(database, 'readings');

    onValue(readingsRef, (snapshot) => {
        const readingsData = snapshot.val();
        let todayCalories = 0;

        if (readingsData) {
            const today = new Date().toLocaleDateString();
            for (const key in readingsData) {
                const reading = readingsData[key];
                const readingDate = new Date(reading.timestamp).toLocaleDateString();

                if (readingDate === today) {
                    const caloriesPerGram = calorieValues[reading.food_type] || 0;
                    todayCalories += (reading.grams_dispensed * caloriesPerGram);
                }
            }
        }

        caloriesConsumedElement.textContent = Math.round(todayCalories);

        const percentage = Math.min((todayCalories / MAX_CALORIES_GOAL) * 100, 100);
        progressCircle.style.background = `conic-gradient(#28a745 ${percentage}%, #d4edda ${percentage}%)`;
        
        // Llama a la nueva función para procesar los datos semanales
        processWeeklyReadings(readingsData);
    });

    const lastReadingsQuery = query(readingsRef, limitToLast(5));
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

    updateGreeting();
    updateMotivationalMessage();
    setInterval(updateGreeting, 60000);
    setInterval(updateMotivationalMessage, 180000);
});